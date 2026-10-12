package com.solsafe.heatsafety.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.solsafe.heatsafety.model.CoolOasis;
import com.solsafe.heatsafety.model.RoadEdge;
import com.solsafe.heatsafety.model.RoadNode;
import com.solsafe.heatsafety.model.RouteRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.InputStream;
import java.util.*;

/**
 * Thermal-Aware Dijkstra Graph Routing Service.
 *
 * Computes and compares:
 * 1. Standard Fastest Route (alpha = 0.0, pure travel time minimization)
 * 2. SolSafe Cool Bike Route (alpha in [0, 1], minimizing composite travel time + thermal WBGT strain)
 */
@Service
public class RoutingService {

    private final MicroclimateService microclimateService;
    private final OasisLocatorService oasisLocatorService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    public RoutingService(MicroclimateService microclimateService, OasisLocatorService oasisLocatorService) {
        this.microclimateService = microclimateService;
        this.oasisLocatorService = oasisLocatorService;
    }

    /**
     * Load city road network and enrich all street segments with live WBGT & surface temperature.
     */
    public Map<String, Object> getEvaluatedNetwork(String city, double ambientTempC,
                                                   double relativeHumidity, double windSpeedMs,
                                                   double hourOfDay) {
        String resourcePath = "hyderabad".equalsIgnoreCase(city)
                ? "data/hyderabad_network.json"
                : "data/city_network.json";

        Map<String, Object> result = new LinkedHashMap<>();
        List<RoadNode> nodes = new ArrayList<>();
        List<RoadEdge> edges = new ArrayList<>();
        String cityTitle = "Hyderabad - Cyberabad & Hitec City Tech Corridor";
        List<Double> center = Arrays.asList(17.4435, 78.3850);
        int defaultZoom = 14;

        try {
            JsonNode root = loadJsonResource(resourcePath);
            if (root != null) {
                if (root.has("city")) cityTitle = root.get("city").asText();
                if (root.has("default_zoom")) defaultZoom = root.get("default_zoom").asInt(14);
                if (root.has("center") && root.get("center").isArray()) {
                    center = Arrays.asList(
                            root.get("center").get(0).asDouble(),
                            root.get("center").get(1).asDouble()
                    );
                }
                if (root.has("nodes")) {
                    for (JsonNode n : root.get("nodes")) {
                        nodes.add(objectMapper.treeToValue(n, RoadNode.class));
                    }
                }
                if (root.has("edges")) {
                    for (JsonNode e : root.get("edges")) {
                        RoadEdge edge = objectMapper.treeToValue(e, RoadEdge.class);
                        microclimateService.evaluateEdgeMicroclimate(
                                edge, ambientTempC, relativeHumidity, windSpeedMs, hourOfDay
                        );
                        edges.add(edge);
                    }
                }
            }
        } catch (Exception ex) {
            ex.printStackTrace();
        }

        double[] solar = microclimateService.computeSolarPosition(hourOfDay);
        double irradiance = microclimateService.computeSolarIrradiance(solar[0]);

        Map<String, Object> envSummary = new LinkedHashMap<>();
        envSummary.put("ambient_temp_c", ambientTempC);
        envSummary.put("relative_humidity", relativeHumidity);
        envSummary.put("wind_speed_ms", windSpeedMs);
        envSummary.put("hour_of_day", hourOfDay);
        envSummary.put("solar_altitude_deg", round1(solar[0]));
        envSummary.put("solar_azimuth_deg", round1(solar[1]));
        envSummary.put("solar_irradiance_wm2", irradiance);

        result.put("city", cityTitle);
        result.put("city_key", city.toLowerCase());
        result.put("center", center);
        result.put("default_zoom", defaultZoom);
        result.put("environment", envSummary);
        result.put("nodes", nodes);
        result.put("edges", edges);
        return result;
    }

    /**
     * Compare Standard Fastest Route vs. SolSafe Cool Bike Route using Dijkstra's Algorithm.
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> computeDualRoutes(RouteRequest req) {
        Map<String, Object> net = getEvaluatedNetwork(
                req.getCity(), req.getAmbient_temp_c(), req.getRelative_humidity(),
                req.getWind_speed_ms(), req.getHour_of_day()
        );
        List<RoadNode> nodes = (List<RoadNode>) net.get("nodes");
        List<RoadEdge> edges = (List<RoadEdge>) net.get("edges");

        Map<String, RoadNode> nodeMap = new LinkedHashMap<>();
        for (RoadNode n : nodes) {
            nodeMap.put(n.getId(), n);
        }

        String startId = req.getStart_node();
        String endId = req.getEnd_node();
        if (startId == null || !nodeMap.containsKey(startId)) {
            startId = nodes.get(0).getId();
        }
        if (endId == null || !nodeMap.containsKey(endId)) {
            endId = nodes.get(nodes.size() - 1).getId();
        }

        Map<String, Object> fastest = runDijkstra(startId, endId, 0.0, nodeMap, edges);
        Map<String, Object> solsafe = runDijkstra(startId, endId, req.getAlpha(), nodeMap, edges);

        double fastWbgt = (double) fastest.get("avg_wbgt_c");
        double coolWbgt = (double) solsafe.get("avg_wbgt_c");
        double fastSurf = (double) fastest.get("avg_surface_temp_c");
        double coolSurf = (double) solsafe.get("avg_surface_temp_c");
        double fastTime = (double) fastest.get("travel_time_min");
        double coolTime = (double) solsafe.get("travel_time_min");
        double fastDose = (double) fastest.get("cumulative_heat_dose");
        double coolDose = (double) solsafe.get("cumulative_heat_dose");

        double heatReductionPct = fastDose > 0
                ? round1(Math.max(0.0, ((fastDose - coolDose) / fastDose) * 100.0))
                : 0.0;

        Map<String, Object> comparison = new LinkedHashMap<>();
        comparison.put("wbgt_delta_c", round1(fastWbgt - coolWbgt));
        comparison.put("surface_temp_delta_c", round1(fastSurf - coolSurf));
        comparison.put("time_tradeoff_min", round1(coolTime - fastTime));
        comparison.put("heat_dose_reduction_pct", heatReductionPct);
        comparison.put("shade_gain_pct", round1((double) solsafe.get("avg_shade_pct") - (double) fastest.get("avg_shade_pct")));

        RoadNode destNode = nodeMap.get(endId);
        List<CoolOasis> nearbyOases = oasisLocatorService.getOases(
                req.getCity(), destNode.getLat(), destNode.getLon()
        );

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("fastest_route", fastest);
        response.put("solsafe_route", solsafe);
        response.put("comparison", comparison);
        response.put("recommended_oases", nearbyOases.subList(0, Math.min(3, nearbyOases.size())));
        return response;
    }

    /**
     * Snap arbitrary GPS coordinates (lat/lon) to the nearest road network nodes and compute routes.
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> computeRoutesFromGps(RouteRequest req) {
        Map<String, Object> net = getEvaluatedNetwork(
                req.getCity(), req.getAmbient_temp_c(), req.getRelative_humidity(),
                req.getWind_speed_ms(), req.getHour_of_day()
        );
        List<RoadNode> nodes = (List<RoadNode>) net.get("nodes");

        RoadNode nearestStart = findNearestNode(nodes, req.getStart_lat(), req.getStart_lon());
        RoadNode nearestEnd = findNearestNode(nodes, req.getEnd_lat(), req.getEnd_lon());
        if (nearestStart.getId().equals(nearestEnd.getId()) && nodes.size() > 1) {
            nearestEnd = nodes.get(nodes.size() - 1);
        }

        req.setStart_node(nearestStart.getId());
        req.setEnd_node(nearestEnd.getId());

        Map<String, Object> routeResult = computeDualRoutes(req);
        Map<String, Object> snapped = new LinkedHashMap<>();
        snapped.put("start_node", nearestStart);
        snapped.put("end_node", nearestEnd);
        routeResult.put("snapped_nodes", snapped);
        return routeResult;
    }

    private RoadNode findNearestNode(List<RoadNode> nodes, double lat, double lon) {
        RoadNode best = nodes.get(0);
        double bestDist = Double.MAX_VALUE;
        for (RoadNode n : nodes) {
            double d = oasisLocatorService.haversineMeters(lat, lon, n.getLat(), n.getLon());
            if (d < bestDist) {
                bestDist = d;
                best = n;
            }
        }
        return best;
    }

    private Map<String, Object> runDijkstra(String startId, String endId, double alpha,
                                            Map<String, RoadNode> nodeMap, List<RoadEdge> edges) {
        Map<String, List<RoadEdge>> adj = new HashMap<>();
        for (String id : nodeMap.keySet()) {
            adj.put(id, new ArrayList<>());
        }
        for (RoadEdge e : edges) {
            adj.get(e.getSource()).add(e);
            RoadEdge rev = copyReversed(e);
            adj.get(rev.getSource()).add(rev);
        }

        Map<String, Double> dist = new HashMap<>();
        Map<String, String> prevNode = new HashMap<>();
        Map<String, RoadEdge> prevEdge = new HashMap<>();
        for (String id : nodeMap.keySet()) {
            dist.put(id, Double.MAX_VALUE);
        }
        dist.put(startId, 0.0);

        PriorityQueue<String> pq = new PriorityQueue<>(Comparator.comparingDouble(dist::get));
        pq.add(startId);

        while (!pq.isEmpty()) {
            String u = pq.poll();
            if (u.equals(endId)) break;

            for (RoadEdge edge : adj.getOrDefault(u, Collections.emptyList())) {
                double travelMin = (edge.getLength_m() / 1000.0) / Math.max(10.0, edge.getBase_speed_kmh()) * 60.0;
                double thermalPenalty = Math.pow(Math.max(0.05, edge.getHeat_risk_index()), 1.85) * 6.5;
                double weight = (1.0 - alpha) * travelMin + alpha * (travelMin * (1.0 + thermalPenalty));

                double alt = dist.get(u) + weight;
                if (alt < dist.getOrDefault(edge.getTarget(), Double.MAX_VALUE)) {
                    dist.put(edge.getTarget(), alt);
                    prevNode.put(edge.getTarget(), u);
                    prevEdge.put(edge.getTarget(), edge);
                    pq.remove(edge.getTarget());
                    pq.add(edge.getTarget());
                }
            }
        }

        List<String> nodePath = new ArrayList<>();
        List<RoadEdge> edgePath = new ArrayList<>();
        String curr = endId;
        while (curr != null && prevNode.containsKey(curr)) {
            nodePath.add(0, curr);
            edgePath.add(0, prevEdge.get(curr));
            curr = prevNode.get(curr);
        }
        nodePath.add(0, startId);

        List<double[]> coordinates = new ArrayList<>();
        for (String nid : nodePath) {
            RoadNode n = nodeMap.get(nid);
            if (n != null) {
                coordinates.add(new double[]{n.getLat(), n.getLon()});
            }
        }

        int totalDistM = 0;
        double totalTimeMin = 0.0;
        double weightedWbgt = 0.0;
        double weightedShade = 0.0;
        double weightedSurface = 0.0;
        double heatDose = 0.0;
        List<Map<String, Object>> segments = new ArrayList<>();

        for (RoadEdge e : edgePath) {
            int len = e.getLength_m();
            double tMin = (len / 1000.0) / Math.max(10.0, e.getBase_speed_kmh()) * 60.0;
            totalDistM += len;
            totalTimeMin += tMin;
            weightedWbgt += e.getLocal_wbgt_c() * len;
            weightedShade += e.getEffective_shade_pct() * len;
            weightedSurface += e.getSurface_temp_c() * len;
            heatDose += Math.max(0.2, e.getLocal_wbgt_c() - 25.0) * tMin;

            Map<String, Object> seg = new LinkedHashMap<>();
            seg.put("edge_id", e.getId());
            seg.put("name", e.getName());
            seg.put("length_m", len);
            seg.put("wbgt_c", e.getLocal_wbgt_c());
            seg.put("surface_temp_c", e.getSurface_temp_c());
            seg.put("shade_pct", e.getEffective_shade_pct());
            seg.put("risk_level", e.getRisk_level());
            segments.add(seg);
        }

        double denom = Math.max(1, totalDistM);
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("node_path", nodePath);
        summary.put("coordinates", coordinates);
        summary.put("segments", segments);
        summary.put("distance_m", totalDistM);
        summary.put("travel_time_min", round1(totalTimeMin));
        summary.put("avg_wbgt_c", round1(weightedWbgt / denom));
        summary.put("avg_surface_temp_c", round1(weightedSurface / denom));
        summary.put("avg_shade_pct", round1(weightedShade / denom));
        summary.put("cumulative_heat_dose", round1(heatDose));
        return summary;
    }

    private RoadEdge copyReversed(RoadEdge src) {
        RoadEdge r = new RoadEdge();
        r.setId(src.getId());
        r.setSource(src.getTarget());
        r.setTarget(src.getSource());
        r.setName(src.getName());
        r.setLength_m(src.getLength_m());
        r.setBase_speed_kmh(src.getBase_speed_kmh());
        r.setTree_canopy_pct(src.getTree_canopy_pct());
        r.setBuilding_hw_ratio(src.getBuilding_hw_ratio());
        r.setOrientation_deg(src.getOrientation_deg());
        r.setAlbedo(src.getAlbedo());
        r.setEffective_shade_pct(src.getEffective_shade_pct());
        r.setLocal_wbgt_c(src.getLocal_wbgt_c());
        r.setSurface_temp_c(src.getSurface_temp_c());
        r.setHeat_risk_index(src.getHeat_risk_index());
        r.setRisk_level(src.getRisk_level());
        return r;
    }

    private JsonNode loadJsonResource(String resourcePath) throws Exception {
        InputStream is = getClass().getClassLoader().getResourceAsStream(resourcePath);
        if (is != null) {
            return objectMapper.readTree(is);
        }
        File fallback = new File("backend/src/main/resources/" + resourcePath);
        if (fallback.exists()) {
            return objectMapper.readTree(fallback);
        }
        return null;
    }

    private double round1(double val) {
        return Math.round(val * 10.0) / 10.0;
    }
}
