package com.solsafe.heatsafety.model;

/**
 * Represents a Delivery Rider's physiological Digital Twin state and active order metadata,
 * modeled using the Moran Physiological Strain Index (PSI, 0-10 scale).
 */
public class RiderState {
    private String worker_id;
    private String name;
    private String vehicle;
    private String platform;
    private String avatar_badge;
    private String status;
    private double core_temp_c;
    private int heart_rate_bpm;
    private double psi_score;
    private double cumulative_heat_dose;
    private double hydration_deficit_ml;
    private int shift_minutes_active;
    private boolean mandatory_break_recommended;
    private int recovery_minutes_needed;
    private String active_order_id;
    private String restaurant;
    private String dropoff_name;
    private String start_node;
    private String end_node;
    private double current_lat;
    private double current_lon;
    private int payout_inr;

    public RiderState() {
    }

    public String getWorker_id() { return worker_id; }
    public void setWorker_id(String worker_id) { this.worker_id = worker_id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getVehicle() { return vehicle; }
    public void setVehicle(String vehicle) { this.vehicle = vehicle; }

    public String getPlatform() { return platform; }
    public void setPlatform(String platform) { this.platform = platform; }

    public String getAvatar_badge() { return avatar_badge; }
    public void setAvatar_badge(String avatar_badge) { this.avatar_badge = avatar_badge; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public double getCore_temp_c() { return core_temp_c; }
    public void setCore_temp_c(double core_temp_c) { this.core_temp_c = core_temp_c; }

    public int getHeart_rate_bpm() { return heart_rate_bpm; }
    public void setHeart_rate_bpm(int heart_rate_bpm) { this.heart_rate_bpm = heart_rate_bpm; }

    public double getPsi_score() { return psi_score; }
    public void setPsi_score(double psi_score) { this.psi_score = psi_score; }

    public double getCumulative_heat_dose() { return cumulative_heat_dose; }
    public void setCumulative_heat_dose(double cumulative_heat_dose) { this.cumulative_heat_dose = cumulative_heat_dose; }

    public double getHydration_deficit_ml() { return hydration_deficit_ml; }
    public void setHydration_deficit_ml(double hydration_deficit_ml) { this.hydration_deficit_ml = hydration_deficit_ml; }

    public int getShift_minutes_active() { return shift_minutes_active; }
    public void setShift_minutes_active(int shift_minutes_active) { this.shift_minutes_active = shift_minutes_active; }

    public boolean isMandatory_break_recommended() { return mandatory_break_recommended; }
    public void setMandatory_break_recommended(boolean mandatory_break_recommended) { this.mandatory_break_recommended = mandatory_break_recommended; }

    public int getRecovery_minutes_needed() { return recovery_minutes_needed; }
    public void setRecovery_minutes_needed(int recovery_minutes_needed) { this.recovery_minutes_needed = recovery_minutes_needed; }

    public String getActive_order_id() { return active_order_id; }
    public void setActive_order_id(String active_order_id) { this.active_order_id = active_order_id; }

    public String getRestaurant() { return restaurant; }
    public void setRestaurant(String restaurant) { this.restaurant = restaurant; }

    public String getDropoff_name() { return dropoff_name; }
    public void setDropoff_name(String dropoff_name) { this.dropoff_name = dropoff_name; }

    public String getStart_node() { return start_node; }
    public void setStart_node(String start_node) { this.start_node = start_node; }

    public String getEnd_node() { return end_node; }
    public void setEnd_node(String end_node) { this.end_node = end_node; }

    public double getCurrent_lat() { return current_lat; }
    public void setCurrent_lat(double current_lat) { this.current_lat = current_lat; }

    public double getCurrent_lon() { return current_lon; }
    public void setCurrent_lon(double current_lon) { this.current_lon = current_lon; }

    public int getPayout_inr() { return payout_inr; }
    public void setPayout_inr(int payout_inr) { this.payout_inr = payout_inr; }
}
