package com.solsafe.heatsafety.controller;

import com.solsafe.heatsafety.model.CoolOasis;
import com.solsafe.heatsafety.model.RiderState;
import com.solsafe.heatsafety.model.RouteRequest;
import com.solsafe.heatsafety.service.MicroclimateService;
import com.solsafe.heatsafety.service.OasisLocatorService;
import com.solsafe.heatsafety.service.RiderFleetService;
import com.solsafe.heatsafety.service.RoutingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Spring Boot REST Controller exposing all SolSafe Microclimate, Thermal-Aware Dijkstra
 * Routing, Cool Oasis Triage, and Rider Biometric Digital Twin endpoints.
 */
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class HeatSafetyController {

    private final MicroclimateService microclimateService;
    private final RoutingService routingService;
    private final OasisLocatorService oasisLocatorService;
    private final RiderFleetService riderFleetService;

    @Autowired
    public HeatSafetyController(MicroclimateService microclimateService,
                                RoutingService routingService,
                                OasisLocatorService oasisLocatorService,
                                RiderFleetService riderFleetService) {
        this.microclimateService = microclimateService;
        this.routingService = routingService;
        this.oasisLocatorService = oasisLocatorService;
        this.riderFleetService = riderFleetService;
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> status = new LinkedHashMap<>();
        status.put("status", "UP");
        status.put("service", "SolSafe Java Spring Boot Microclimate & Routing Engine");
        status.put("runtime", "Java " + System.getProperty("java.version") + " / Spring Boot 3.3.4");
        status.put("timestamp", Instant.now().toString());
        return ResponseEntity.ok(status);
    }

    @GetMapping("/network")
    public ResponseEntity<Map<String, Object>> getNetwork(
            @RequestParam(defaultValue = "hyderabad") String city,
            @RequestParam(defaultValue = "38.0") double ambient_temp_c,
            @RequestParam(defaultValue = "45.0") double relative_humidity,
            @RequestParam(defaultValue = "2.0") double wind_speed_ms,
            @RequestParam(defaultValue = "14.0") double hour_of_day) {
        return ResponseEntity.ok(routingService.getEvaluatedNetwork(
                city, ambient_temp_c, relative_humidity, wind_speed_ms, hour_of_day
        ));
    }

    @GetMapping("/oases")
    public ResponseEntity<Map<String, Object>> getOases(
            @RequestParam(defaultValue = "hyderabad") String city,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lon) {
        List<CoolOasis> oases = oasisLocatorService.getOases(city, lat, lon);
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("city", city);
        res.put("count", oases.size());
        res.put("oases", oases);
        return ResponseEntity.ok(res);
    }

    @GetMapping("/satellite_layer")
    public ResponseEntity<Map<String, Object>> getSatelliteThermalLayer(
            @RequestParam(defaultValue = "hyderabad") String city,
            @RequestParam(defaultValue = "38.0") double ambient_temp_c,
            @RequestParam(defaultValue = "14.0") double hour_of_day) {
        return ResponseEntity.ok(microclimateService.generateSatelliteThermalLayer(
                city, ambient_temp_c, hour_of_day
        ));
    }

    @PostMapping("/routes")
    public ResponseEntity<Map<String, Object>> computeRoutes(@RequestBody RouteRequest request) {
        return ResponseEntity.ok(routingService.computeDualRoutes(request));
    }

    @PostMapping("/routes/from_gps")
    public ResponseEntity<Map<String, Object>> computeRoutesFromGps(@RequestBody RouteRequest request) {
        return ResponseEntity.ok(routingService.computeRoutesFromGps(request));
    }

    @GetMapping("/fleet")
    public ResponseEntity<Map<String, Object>> getFleet() {
        return ResponseEntity.ok(riderFleetService.getFleetResponse());
    }

    @PostMapping("/fleet/switch")
    public ResponseEntity<Map<String, Object>> switchRider(@RequestBody RouteRequest request) {
        return ResponseEntity.ok(riderFleetService.switchActiveRider(request.getRider_id()));
    }

    @PostMapping("/orders/generate")
    public ResponseEntity<Map<String, Object>> generateOrder() {
        return ResponseEntity.ok(riderFleetService.generateNextOrder());
    }

    @GetMapping("/worker/status")
    public ResponseEntity<RiderState> getWorkerStatus() {
        return ResponseEntity.ok(riderFleetService.getActiveRider());
    }

    @PostMapping("/worker/tick")
    public ResponseEntity<RiderState> tickWorker(@RequestBody RouteRequest request) {
        return ResponseEntity.ok(riderFleetService.simulateTick(
                request.getWbgt_c(),
                request.getDuration_min(),
                request.getExertion(),
                request.isResting()
        ));
    }

    @PostMapping("/worker/trigger_break")
    public ResponseEntity<RiderState> triggerBreak() {
        return ResponseEntity.ok(riderFleetService.triggerCoolOasisBreak());
    }

    @PostMapping("/worker/reset")
    public ResponseEntity<RiderState> resetWorker() {
        return ResponseEntity.ok(riderFleetService.resetActiveRider());
    }
}
