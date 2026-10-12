package com.solsafe.heatsafety.service;

import com.solsafe.heatsafety.model.RiderState;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Rider Fleet Telemetry & Moran Physiological Strain Index (PSI) Digital Twin Service.
 *
 * Models core temperature (T_core), heart rate (HR), cumulative heat dose,
 * sweat dehydration deficit, and mandatory Cool Oasis recovery breaks for a 5-rider fleet.
 */
@Service
public class RiderFleetService {

    private final Map<String, RiderState> fleet = new LinkedHashMap<>();
    private String activeRiderId = "RIDER-HYD-101";
    private int orderSequenceIndex = 0;

    private static final String[][] ORDER_TEMPLATES = {
            {"ORD-9408", "Bawarchi Biryani (Cyber Towers)", "Mindspace IT Park Bldg 12", "HYD_1", "HYD_9", "85"},
            {"ORD-9412", "Paradise Biryani (Hitec City)", "Gachibowli DLF CyberCity", "HYD_2", "HYD_16", "110"},
            {"ORD-9419", "Shah Ghouse Cafe (Biodiversity)", "Jubilee Hills Checkpost", "HYD_12", "HYD_15", "95"},
            {"ORD-9425", "Mehfil Restaurant (JNTU Road)", "Inorbit Mall Food Court", "HYD_4", "HYD_10", "105"},
            {"ORD-9431", "Chutneys (Shilparamam Hub)", "KBR Park North Gate", "HYD_3", "HYD_14", "90"},
            {"ORD-9438", "Pista House (Raidurg Metro)", "Financial District WaveRock", "HYD_8", "HYD_16", "125"}
    };

    public RiderFleetService() {
        initializeFleet();
    }

    private void initializeFleet() {
        fleet.clear();
        fleet.put("RIDER-HYD-101", createRider(
                "RIDER-HYD-101", "Raju Kumar", "Ather 450X EV Scooter", "Swiggy", "RK",
                "EN_ROUTE", 37.38, 108, 3.1, 42.5, 310, 95,
                "ORD-9408", "Bawarchi Biryani (Cyber Towers)", "Mindspace IT Park Bldg 12",
                "HYD_1", "HYD_9", 17.4504, 78.3811, 85
        ));
        fleet.put("RIDER-HYD-102", createRider(
                "RIDER-HYD-102", "Mohammed Irfan", "Hero Lectro Cargo E-Bike", "Zomato", "MI",
                "HEAT_WARNING", 38.12, 136, 5.8, 78.0, 580, 140,
                "ORD-9412", "Paradise Biryani (Hitec City)", "Gachibowli DLF CyberCity",
                "HYD_2", "HYD_16", 17.4474, 78.3762, 110
        ));
        fleet.put("RIDER-HYD-103", createRider(
                "RIDER-HYD-103", "Sai Teja", "Ola S1 Pro EV", "Zepto", "ST",
                "EN_ROUTE", 37.15, 96, 2.2, 28.0, 190, 55,
                "ORD-9419", "Shah Ghouse Cafe (Biodiversity)", "Jubilee Hills Checkpost",
                "HYD_12", "HYD_15", 17.4291, 78.3765, 95
        ));
        fleet.put("RIDER-HYD-104", createRider(
                "RIDER-HYD-104", "Venkatesh Goud", "TVS iQube Electric", "Blinkit", "VG",
                "COOL_OASIS_BREAK", 37.65, 114, 4.1, 61.0, 220, 165,
                "ORD-9425", "Mehfil Restaurant (JNTU Road)", "Inorbit Mall Food Court",
                "HYD_4", "HYD_10", 17.4354, 78.3827, 105
        ));
        fleet.put("RIDER-HYD-105", createRider(
                "RIDER-HYD-105", "Anitha Reddy", "Yulu Wynn Delivery EV", "BigBasket", "AR",
                "EN_ROUTE", 37.24, 102, 2.6, 34.0, 250, 75,
                "ORD-9431", "Chutneys (Shilparamam Hub)", "KBR Park North Gate",
                "HYD_3", "HYD_14", 17.4526, 78.3788, 90
        ));
    }

    private RiderState createRider(String id, String name, String vehicle, String platform,
                                   String badge, String status, double coreTemp, int hr,
                                   double psi, double dose, double hydrationDeficit, int shiftMin,
                                   String orderId, String restaurant, String dropoff,
                                   String startNode, String endNode, double lat, double lon, int payout) {
        RiderState r = new RiderState();
        r.setWorker_id(id);
        r.setName(name);
        r.setVehicle(vehicle);
        r.setPlatform(platform);
        r.setAvatar_badge(badge);
        r.setStatus(status);
        r.setCore_temp_c(coreTemp);
        r.setHeart_rate_bpm(hr);
        r.setPsi_score(psi);
        r.setCumulative_heat_dose(dose);
        r.setHydration_deficit_ml(hydrationDeficit);
        r.setShift_minutes_active(shiftMin);
        r.setMandatory_break_recommended(psi >= 7.0);
        r.setRecovery_minutes_needed(psi >= 7.0 ? 15 : 0);
        r.setActive_order_id(orderId);
        r.setRestaurant(restaurant);
        r.setDropoff_name(dropoff);
        r.setStart_node(startNode);
        r.setEnd_node(endNode);
        r.setCurrent_lat(lat);
        r.setCurrent_lon(lon);
        r.setPayout_inr(payout);
        return r;
    }

    public Map<String, Object> getFleetResponse() {
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("active_rider_id", activeRiderId);
        res.put("active_rider", fleet.get(activeRiderId));
        res.put("riders", new ArrayList<>(fleet.values()));
        return res;
    }

    public RiderState getActiveRider() {
        return fleet.get(activeRiderId);
    }

    public Map<String, Object> switchActiveRider(String riderId) {
        if (riderId != null && fleet.containsKey(riderId)) {
            activeRiderId = riderId;
        }
        return getFleetResponse();
    }

    /**
     * Dispatch the next delivery order in sequence so every click assigns a fresh restaurant & dropoff.
     */
    public Map<String, Object> generateNextOrder() {
        orderSequenceIndex = (orderSequenceIndex + 1) % ORDER_TEMPLATES.length;
        String[] tpl = ORDER_TEMPLATES[orderSequenceIndex];

        RiderState active = fleet.get(activeRiderId);
        active.setActive_order_id(tpl[0]);
        active.setRestaurant(tpl[1]);
        active.setDropoff_name(tpl[2]);
        active.setStart_node(tpl[3]);
        active.setEnd_node(tpl[4]);
        active.setPayout_inr(Integer.parseInt(tpl[5]));

        Map<String, Object> order = new LinkedHashMap<>();
        order.put("order_id", tpl[0]);
        order.put("restaurant", tpl[1]);
        order.put("dropoff_name", tpl[2]);
        order.put("start_node", tpl[3]);
        order.put("end_node", tpl[4]);
        order.put("payout_inr", Integer.parseInt(tpl[5]));

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("order", order);
        res.put("rider", active);
        return res;
    }

    /**
     * Advance the active rider's physiological state by durationMin under a given WBGT and exertion mode.
     * Implements Moran (1998) Physiological Strain Index:
     *   PSI = 5 * (T_core - 36.8) / (39.5 - 36.8) + 5 * (HR - 68) / (185 - 68)
     */
    public RiderState simulateTick(double wbgtC, double durationMin, String exertion, boolean resting) {
        RiderState r = fleet.get(activeRiderId);
        double metabolicFactor = "heavy_cargo".equalsIgnoreCase(exertion) ? 1.35
                : "ebike_assist".equalsIgnoreCase(exertion) ? 0.72 : 1.0;

        if (resting) {
            double coolDelta = 0.045 * durationMin;
            r.setCore_temp_c(round2(Math.max(36.85, r.getCore_temp_c() - coolDelta)));
            r.setHeart_rate_bpm(Math.max(72, (int) Math.round(r.getHeart_rate_bpm() - 3.2 * durationMin)));
            r.setHydration_deficit_ml(round1(Math.max(0.0, r.getHydration_deficit_ml() - 45.0 * durationMin)));
            r.setStatus("COOL_OASIS_BREAK");
        } else {
            double heatStress = Math.max(-0.2, (wbgtC - 26.5) * 0.018 * metabolicFactor);
            r.setCore_temp_c(round2(Math.min(39.45, Math.max(36.9, r.getCore_temp_c() + heatStress * (durationMin / 5.0)))));
            int hrGain = (int) Math.round((wbgtC - 25.0) * 1.15 * metabolicFactor);
            r.setHeart_rate_bpm(Math.min(182, Math.max(78, r.getHeart_rate_bpm() + hrGain)));
            r.setHydration_deficit_ml(round1(r.getHydration_deficit_ml() + (8.5 * metabolicFactor * durationMin)));
            r.setCumulative_heat_dose(round1(r.getCumulative_heat_dose() + Math.max(0.5, wbgtC - 25.0) * (durationMin / 5.0)));
            r.setShift_minutes_active(r.getShift_minutes_active() + (int) Math.round(durationMin));
        }

        double psi = computeMoranPsi(r.getCore_temp_c(), r.getHeart_rate_bpm());
        r.setPsi_score(psi);
        r.setMandatory_break_recommended(psi >= 7.0);
        r.setRecovery_minutes_needed(psi >= 7.0 ? (int) Math.round((psi - 5.0) * 6.0) : 0);

        if (!resting) {
            r.setStatus(psi >= 6.5 ? "HEAT_WARNING" : "EN_ROUTE");
        }
        return r;
    }

    public RiderState triggerCoolOasisBreak() {
        return simulateTick(24.0, 15.0, "resting", true);
    }

    public RiderState resetActiveRider() {
        initializeFleet();
        return fleet.get(activeRiderId);
    }

    public double computeMoranPsi(double coreTempC, int heartRateBpm) {
        double tempTerm = 5.0 * (coreTempC - 36.8) / (39.5 - 36.8);
        double hrTerm = 5.0 * (heartRateBpm - 68.0) / (185.0 - 68.0);
        double psi = Math.max(0.0, Math.min(10.0, tempTerm + hrTerm));
        return Math.round(psi * 10.0) / 10.0;
    }

    private double round1(double val) {
        return Math.round(val * 10.0) / 10.0;
    }

    private double round2(double val) {
        return Math.round(val * 100.0) / 100.0;
    }
}
