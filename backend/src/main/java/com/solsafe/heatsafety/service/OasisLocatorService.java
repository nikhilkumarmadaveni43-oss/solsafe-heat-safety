package com.solsafe.heatsafety.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.solsafe.heatsafety.model.CoolOasis;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Haversine Spatial Locator for Verified Cool Oases (Hydration, Shade & AC Refuges).
 */
@Service
public class OasisLocatorService {

    private static final double EARTH_RADIUS_M = 6371000.0;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Compute great-circle Haversine distance in meters between two GPS coordinates.
     */
    public double haversineMeters(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2.0) * Math.sin(dLat / 2.0)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2.0) * Math.sin(dLon / 2.0);
        return 2.0 * EARTH_RADIUS_M * Math.atan2(Math.sqrt(a), Math.sqrt(1.0 - a));
    }

    /**
     * Load Cool Oases for a given city ("hyderabad" or "phoenix") and optionally rank by distance.
     */
    public List<CoolOasis> getOases(String city, Double riderLat, Double riderLon) {
        String filename = "hyderabad".equalsIgnoreCase(city)
                ? "data/hyderabad_oases.json"
                : "data/cool_oases.json";

        List<CoolOasis> oases = loadOasesFromResource(filename);
        if (riderLat != null && riderLon != null) {
            for (CoolOasis oasis : oases) {
                int distM = (int) Math.round(haversineMeters(riderLat, riderLon, oasis.getLat(), oasis.getLon()));
                oasis.setDistance_m(distM);
                oasis.setEst_walk_min(Math.round((distM / 250.0) * 10.0) / 10.0);
            }
            oases.sort(Comparator.comparingInt(CoolOasis::getDistance_m));
        }
        return oases;
    }

    private List<CoolOasis> loadOasesFromResource(String resourcePath) {
        try {
            InputStream is = getClass().getClassLoader().getResourceAsStream(resourcePath);
            if (is != null) {
                return objectMapper.readValue(is, new TypeReference<List<CoolOasis>>() {});
            }
            File fallbackFile = new File("backend/src/main/resources/" + resourcePath);
            if (fallbackFile.exists()) {
                return objectMapper.readValue(fallbackFile, new TypeReference<List<CoolOasis>>() {});
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return new ArrayList<>();
    }
}
