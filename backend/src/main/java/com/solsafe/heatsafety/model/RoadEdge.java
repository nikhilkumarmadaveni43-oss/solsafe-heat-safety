package com.solsafe.heatsafety.model;

/**
 * Represents a directed/undirected street segment in the urban road network,
 * enriched with tree canopy fraction, building height-to-width ratio, and
 * real-time WBGT / surface temperature telemetry.
 */
public class RoadEdge {
    private String id;
    private String source;
    private String target;
    private String name;
    private int length_m;
    private double base_speed_kmh;
    private double tree_canopy_pct;
    private double building_hw_ratio;
    private double orientation_deg;
    private double albedo;
    private double effective_shade_pct;
    private double local_wbgt_c;
    private double surface_temp_c;
    private double heat_risk_index;
    private String risk_level;

    public RoadEdge() {
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public String getTarget() { return target; }
    public void setTarget(String target) { this.target = target; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public int getLength_m() { return length_m; }
    public void setLength_m(int length_m) { this.length_m = length_m; }

    public double getBase_speed_kmh() { return base_speed_kmh; }
    public void setBase_speed_kmh(double base_speed_kmh) { this.base_speed_kmh = base_speed_kmh; }

    public double getTree_canopy_pct() { return tree_canopy_pct; }
    public void setTree_canopy_pct(double tree_canopy_pct) { this.tree_canopy_pct = tree_canopy_pct; }

    public double getBuilding_hw_ratio() { return building_hw_ratio; }
    public void setBuilding_hw_ratio(double building_hw_ratio) { this.building_hw_ratio = building_hw_ratio; }

    public double getOrientation_deg() { return orientation_deg; }
    public void setOrientation_deg(double orientation_deg) { this.orientation_deg = orientation_deg; }

    public double getAlbedo() { return albedo; }
    public void setAlbedo(double albedo) { this.albedo = albedo; }

    public double getEffective_shade_pct() { return effective_shade_pct; }
    public void setEffective_shade_pct(double effective_shade_pct) { this.effective_shade_pct = effective_shade_pct; }

    public double getLocal_wbgt_c() { return local_wbgt_c; }
    public void setLocal_wbgt_c(double local_wbgt_c) { this.local_wbgt_c = local_wbgt_c; }

    public double getSurface_temp_c() { return surface_temp_c; }
    public void setSurface_temp_c(double surface_temp_c) { this.surface_temp_c = surface_temp_c; }

    public double getHeat_risk_index() { return heat_risk_index; }
    public void setHeat_risk_index(double heat_risk_index) { this.heat_risk_index = heat_risk_index; }

    public String getRisk_level() { return risk_level; }
    public void setRisk_level(String risk_level) { this.risk_level = risk_level; }
}
