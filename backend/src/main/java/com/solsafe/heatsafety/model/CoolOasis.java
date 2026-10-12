package com.solsafe.heatsafety.model;

/**
 * Represents a verified Cool Oasis hydration / shade station for delivery riders.
 */
public class CoolOasis {
    private String id;
    private String name;
    private String type;
    private double lat;
    private double lon;
    private boolean has_ac;
    private boolean has_water;
    private boolean has_shade;
    private int capacity;
    private double avg_temp_reduction_c;
    private int distance_m;
    private double est_walk_min;

    public CoolOasis() {
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public double getLat() { return lat; }
    public void setLat(double lat) { this.lat = lat; }

    public double getLon() { return lon; }
    public void setLon(double lon) { this.lon = lon; }

    public boolean isHas_ac() { return has_ac; }
    public void setHas_ac(boolean has_ac) { this.has_ac = has_ac; }

    public boolean isHas_water() { return has_water; }
    public void setHas_water(boolean has_water) { this.has_water = has_water; }

    public boolean isHas_shade() { return has_shade; }
    public void setHas_shade(boolean has_shade) { this.has_shade = has_shade; }

    public int getCapacity() { return capacity; }
    public void setCapacity(int capacity) { this.capacity = capacity; }

    public double getAvg_temp_reduction_c() { return avg_temp_reduction_c; }
    public void setAvg_temp_reduction_c(double avg_temp_reduction_c) { this.avg_temp_reduction_c = avg_temp_reduction_c; }

    public int getDistance_m() { return distance_m; }
    public void setDistance_m(int distance_m) { this.distance_m = distance_m; }

    public double getEst_walk_min() { return est_walk_min; }
    public void setEst_walk_min(double est_walk_min) { this.est_walk_min = est_walk_min; }
}
