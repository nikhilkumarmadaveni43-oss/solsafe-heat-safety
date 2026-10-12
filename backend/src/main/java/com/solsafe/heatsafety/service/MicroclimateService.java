package com.solsafe.heatsafety.service;

import com.solsafe.heatsafety.model.RoadEdge;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * ISO 7243 Microclimate & Solar Canyon Physics Service.
 *
 * Computes:
 * - Solar Elevation & Azimuth Geometry
 * - Effective Street-Canyon Shade Fraction (Tree Canopy + Building H/W Shadow)
 * - Natural Wet-Bulb Temperature (Stull 2011 Empirical Psychrometric Formula)
 * - Black Globe Temperature (Liljegren Convective-Radiative Balance Approximation)
 * - Outdoor WBGT = 0.7 * Tw + 0.2 * Tg + 0.1 * Ta (ISO 7243 Standard)
 * - Asphalt Surface Temperature & Satellite Land Surface Temperature (LST) Heat Islands
 */
@Service
public class MicroclimateService {

    /**
     * Compute solar altitude (deg) and azimuth (deg) for a given hour of day (6.0 - 20.0).
     */
    public double[] computeSolarPosition(double hourOfDay) {
        double clampedHour = Math.max(6.0, Math.min(20.0, hourOfDay));
        double solarAngle = ((clampedHour - 6.0) / 14.0) * Math.PI;
        double altitudeDeg = Math.max(2.0, 78.0 * Math.sin(solarAngle));
        double azimuthDeg = 90.0 + ((clampedHour - 6.0) / 14.0) * 180.0;
        return new double[]{altitudeDeg, azimuthDeg};
    }

    /**
     * Estimate peak clear-sky solar irradiance (W/m^2) from solar elevation angle.
     */
    public double computeSolarIrradiance(double altitudeDeg) {
        if (altitudeDeg <= 2.0) {
            return 25.0;
        }
        double rad = Math.toRadians(altitudeDeg);
        return Math.round(980.0 * Math.pow(Math.sin(rad), 1.15) * 10.0) / 10.0;
    }

    /**
     * Compute effective street-level shade fraction [0.0, 0.96] combining urban tree canopy
     * and building canyon shadow casting based on street orientation and solar azimuth.
     */
    public double computeEffectiveShade(double treeCanopyPct, double buildingHwRatio,
                                        double streetOrientationDeg, double hourOfDay) {
        double[] solar = computeSolarPosition(hourOfDay);
        double altRad = Math.toRadians(Math.max(5.0, solar[0]));
        double azimuthDiffRad = Math.toRadians(Math.abs(solar[1] - streetOrientationDeg));
        double crossCanyonFactor = Math.abs(Math.sin(azimuthDiffRad));

        double shadowWidthFraction = Math.min(0.85,
                (buildingHwRatio * crossCanyonFactor) / Math.tan(altRad) * 0.45);
        double combinedShade = 1.0 - (1.0 - treeCanopyPct) * (1.0 - shadowWidthFraction);
        return Math.max(0.03, Math.min(0.95, combinedShade));
    }

    /**
     * Stull (2011) empirical formula for Wet-Bulb Temperature (Tw) from dry-bulb air temp (Ta) and RH (%).
     */
    public double computeWetBulbStull(double ta, double rh) {
        double r = Math.max(5.0, Math.min(99.0, rh));
        return ta * Math.atan(0.151977 * Math.sqrt(r + 8.313659))
                + Math.atan(ta + r)
                - Math.atan(r - 1.676331)
                + 0.00391838 * Math.pow(r, 1.5) * Math.atan(0.023101 * r)
                - 4.686035;
    }

    /**
     * Enrich a RoadEdge with real-time WBGT, asphalt surface temperature, and Heat Risk Index.
     */
    public void evaluateEdgeMicroclimate(RoadEdge edge, double ambientTempC,
                                         double relativeHumidity, double windSpeedMs,
                                         double hourOfDay) {
        double[] solar = computeSolarPosition(hourOfDay);
        double irradiance = computeSolarIrradiance(solar[0]);
        double shade = computeEffectiveShade(
                edge.getTree_canopy_pct(),
                edge.getBuilding_hw_ratio(),
                edge.getOrientation_deg(),
                hourOfDay
        );

        double directIrradiance = irradiance * (1.0 - shade * 0.85);
        double windFactor = Math.pow(Math.max(0.4, windSpeedMs), 0.45);

        // Wet-bulb temperature (Tw)
        double tw = computeWetBulbStull(ambientTempC, relativeHumidity);

        // Black Globe Temperature (Tg)
        double albedoPenalty = (1.0 - edge.getAlbedo()) * 4.2;
        double tg = ambientTempC + (0.0175 * directIrradiance + albedoPenalty) / windFactor;

        // ISO 7243 Outdoor WBGT
        double wbgt = 0.7 * tw + 0.2 * tg + 0.1 * ambientTempC;

        // Asphalt surface temperature
        double surfaceTemp = ambientTempC + (directIrradiance * (1.0 - edge.getAlbedo()) * 0.028) / Math.max(0.8, windSpeedMs * 0.5);

        // Normalized Heat Risk Index [0.0, 1.0]
        double hri = Math.max(0.0, Math.min(1.0, (wbgt - 24.0) / 11.5));

        String riskLevel;
        if (wbgt < 27.5) {
            riskLevel = "SAFE";
        } else if (wbgt < 30.5) {
            riskLevel = "CAUTION";
        } else if (wbgt < 32.5) {
            riskLevel = "DANGER";
        } else {
            riskLevel = "EXTREME";
        }

        edge.setEffective_shade_pct(round1(shade * 100.0));
        edge.setLocal_wbgt_c(round1(wbgt));
        edge.setSurface_temp_c(round1(surfaceTemp));
        edge.setHeat_risk_index(round2(hri));
        edge.setRisk_level(riskLevel);
    }

    /**
     * Generate Satellite Land Surface Temperature (LST) thermal heat island zones for map overlay.
     */
    public Map<String, Object> generateSatelliteThermalLayer(String city, double ambientTempC, double hourOfDay) {
        double[] solar = computeSolarPosition(hourOfDay);
        double solarBoost = Math.sin(Math.toRadians(solar[0])) * 14.5;

        List<Map<String, Object>> zones = new ArrayList<>();
        if ("hyderabad".equalsIgnoreCase(city)) {
            zones.add(createZone("LST_1", "Madhapur Flyover Asphalt Heat Core", 17.4486, 78.3908, 650, ambientTempC + solarBoost + 4.2, "UHI_CORE"));
            zones.add(createZone("LST_2", "JNTU-Hitech Main Road Concrete Corridor", 17.4565, 78.3740, 720, ambientTempC + solarBoost + 3.8, "UHI_CORE"));
            zones.add(createZone("LST_3", "Raidurg Metro Terminal Plaza", 17.4399, 78.3827, 540, ambientTempC + solarBoost + 2.6, "HIGH_RADIANT"));
            zones.add(createZone("LST_4", "Durgam Cheruvu Lake & Jubilee Greenery Sink", 17.4326, 78.3866, 700, ambientTempC + solarBoost * 0.35 - 3.4, "COOL_SINK"));
            zones.add(createZone("LST_5", "Shilparamam Botanical Canopy Buffer", 17.4526, 78.3788, 520, ambientTempC + solarBoost * 0.40 - 2.8, "COOL_SINK"));
        } else {
            zones.add(createZone("LST_PHX_1", "I-10 Asphalt Heat Island", 33.4484, -112.0740, 800, ambientTempC + solarBoost + 5.0, "UHI_CORE"));
            zones.add(createZone("LST_PHX_2", "Hance Park Vegetative Sink", 33.4625, -112.0715, 600, ambientTempC + solarBoost * 0.3 - 3.0, "COOL_SINK"));
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("satellite_source", "Landsat-9 TIRS / Sentinel-3 SLSTR Synthetic Downscaling (10m)");
        response.put("city", city);
        response.put("zones", zones);
        return response;
    }

    private Map<String, Object> createZone(String id, String label, double lat, double lon,
                                           int radiusM, double lstC, String classification) {
        Map<String, Object> z = new LinkedHashMap<>();
        z.put("id", id);
        z.put("label", label);
        z.put("lat", lat);
        z.put("lon", lon);
        z.put("radius_m", radiusM);
        z.put("lst_temp_c", round1(lstC));
        z.put("classification", classification);
        return z;
    }

    private double round1(double val) {
        return Math.round(val * 10.0) / 10.0;
    }

    private double round2(double val) {
        return Math.round(val * 100.0) / 100.0;
    }
}
