package com.solsafe.heatsafety.model;

/**
 * Request DTOs for Routing, GPS Snapping, Fleet Selection, and Biometric Simulation Ticks.
 */
public class RouteRequest {
    private String start_node;
    private String end_node;
    private double alpha = 0.65;
    private double ambient_temp_c = 38.0;
    private double relative_humidity = 45.0;
    private double wind_speed_ms = 2.0;
    private double hour_of_day = 14.0;
    private String city = "hyderabad";

    // GPS coordinate fields for /api/routes/from_gps
    private double start_lat;
    private double start_lon;
    private double end_lat;
    private double end_lon;

    // Worker tick fields for /api/worker/tick
    private double wbgt_c = 31.0;
    private double duration_min = 5.0;
    private String exertion = "cycling";
    private boolean resting = false;
    private String rider_id;

    public String getStart_node() { return start_node; }
    public void setStart_node(String start_node) { this.start_node = start_node; }

    public String getEnd_node() { return end_node; }
    public void setEnd_node(String end_node) { this.end_node = end_node; }

    public double getAlpha() { return alpha; }
    public void setAlpha(double alpha) { this.alpha = alpha; }

    public double getAmbient_temp_c() { return ambient_temp_c; }
    public void setAmbient_temp_c(double ambient_temp_c) { this.ambient_temp_c = ambient_temp_c; }

    public double getRelative_humidity() { return relative_humidity; }
    public void setRelative_humidity(double relative_humidity) { this.relative_humidity = relative_humidity; }

    public double getWind_speed_ms() { return wind_speed_ms; }
    public void setWind_speed_ms(double wind_speed_ms) { this.wind_speed_ms = wind_speed_ms; }

    public double getHour_of_day() { return hour_of_day; }
    public void setHour_of_day(double hour_of_day) { this.hour_of_day = hour_of_day; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public double getStart_lat() { return start_lat; }
    public void setStart_lat(double start_lat) { this.start_lat = start_lat; }

    public double getStart_lon() { return start_lon; }
    public void setStart_lon(double start_lon) { this.start_lon = start_lon; }

    public double getEnd_lat() { return end_lat; }
    public void setEnd_lat(double end_lat) { this.end_lat = end_lat; }

    public double getEnd_lon() { return end_lon; }
    public void setEnd_lon(double end_lon) { this.end_lon = end_lon; }

    public double getWbgt_c() { return wbgt_c; }
    public void setWbgt_c(double wbgt_c) { this.wbgt_c = wbgt_c; }

    public double getDuration_min() { return duration_min; }
    public void setDuration_min(double duration_min) { this.duration_min = duration_min; }

    public String getExertion() { return exertion; }
    public void setExertion(String exertion) { this.exertion = exertion; }

    public boolean isResting() { return resting; }
    public void setResting(boolean resting) { this.resting = resting; }

    public String getRider_id() { return rider_id; }
    public void setRider_id(String rider_id) { this.rider_id = rider_id; }
}
