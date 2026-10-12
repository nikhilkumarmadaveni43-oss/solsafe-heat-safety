package com.solsafe.heatsafety;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * SolSafe HeatSafety Backend — Full Stack Java Spring Boot Application.
 *
 * Provides RESTful APIs for:
 * 1. ISO 7243 Outdoor WBGT & Asphalt Surface Microclimate Physics Engine
 * 2. Thermal-Aware Dijkstra Graph Routing (Fastest Route vs. SolSafe Cool Bike Route)
 * 3. Moran Physiological Strain Index (PSI) Rider Biometric Digital Twin
 * 4. Haversine Nearest Cool Oasis Emergency Triage Locator
 * 5. Multi-Rider Fleet Telemetry & Live Delivery Order Dispatch
 */
@SpringBootApplication
public class SolSafeApplication {

    public static void main(String[] args) {
        SpringApplication.run(SolSafeApplication.class, args);
    }
}
