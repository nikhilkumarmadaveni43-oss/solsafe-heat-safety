# SolSafe (HeatSafe Route) — Full Stack Java Development Project
### Thermal-Aware Delivery Navigation & Rider Biometric Digital Twin Platform

[![Live Deployment](https://img.shields.io/badge/Live_Deployment-GitHub_Pages-10b981?style=for-the-badge)](https://nikhilkumarmadaveni43-oss.github.io/solsafe-heat-safety/)
[![Java 21](https://img.shields.io/badge/Java-21_LTS-ed8b00?style=for-the-badge&logo=openjdk&logoColor=white)](https://github.com/nikhilkumarmadaveni43-oss/solsafe-heat-safety/tree/main/backend)
[![Spring Boot 3.3](https://img.shields.io/badge/Spring_Boot-3.3.4-6db33f?style=for-the-badge&logo=springboot&logoColor=white)](https://github.com/nikhilkumarmadaveni43-oss/solsafe-heat-safety/tree/main/backend)
[![Frontend](https://img.shields.io/badge/Frontend-HTML5_%7C_CSS3_%7C_JS_%7C_Leaflet-38bdf8?style=for-the-badge)](https://github.com/nikhilkumarmadaveni43-oss/solsafe-heat-safety/tree/main/frontend)

---

## 🔗 Quick Project Links
- **🌐 Final Project Deployment Link (Live Web & Mobile App):** [https://nikhilkumarmadaveni43-oss.github.io/solsafe-heat-safety/](https://nikhilkumarmadaveni43-oss.github.io/solsafe-heat-safety/)
- **🎨 Frontend Source Code (GitHub):** [https://github.com/nikhilkumarmadaveni43-oss/solsafe-heat-safety/tree/main/frontend](https://github.com/nikhilkumarmadaveni43-oss/solsafe-heat-safety/tree/main/frontend)
- **⚙️ Backend Source Code — Java Spring Boot (GitHub):** [https://github.com/nikhilkumarmadaveni43-oss/solsafe-heat-safety/tree/main/backend](https://github.com/nikhilkumarmadaveni43-oss/solsafe-heat-safety/tree/main/backend)

---

## 📌 Project Overview
**SolSafe (HeatSafe Route)** is a **Full Stack Java Web Application** designed to protect last-mile gig delivery riders (Swiggy, Zomato, Zepto, Blinkit) from severe urban heat stress and heatstroke during peak Indian summer heatwaves.

Standard GPS navigation apps optimize strictly for the shortest travel time, frequently routing two-wheeler riders across unshaded asphalt flyovers and Urban Heat Islands (UHI) where road surface temperatures exceed **60°C**. **SolSafe** solves this by combining a **Java 21 / Spring Boot Microclimate & Graph Routing Backend** with an interactive **Leaflet.js Geospatial Telemetry Frontend**.

---

## 🏗️ Full Stack Java Architecture

### 1. Backend Tier (`backend/` — Java 21 LTS & Spring Boot 3.3)
- **[`SolSafeApplication.java`](backend/src/main/java/com/solsafe/heatsafety/SolSafeApplication.java)**: Spring Boot 3.3 application entry point.
- **[`HeatSafetyController.java`](backend/src/main/java/com/solsafe/heatsafety/controller/HeatSafetyController.java)**: RESTful Controller (`@RestController`) exposing `/api/network`, `/api/routes`, `/api/routes/from_gps`, `/api/oases`, `/api/satellite_layer`, `/api/fleet`, `/api/orders/generate`, and `/api/worker/tick`.
- **[`MicroclimateService.java`](backend/src/main/java/com/solsafe/heatsafety/service/MicroclimateService.java)**: Implements **ISO 7243 Outdoor WBGT** ($0.7 T_w + 0.2 T_g + 0.1 T_a$), **Stull (2011) Wet-Bulb Temperature**, **Liljegren Black Globe Temperature**, and solar canyon shadow geometry.
- **[`RoutingService.java`](backend/src/main/java/com/solsafe/heatsafety/service/RoutingService.java)**: Custom **Thermal-Aware Dijkstra Graph Algorithm** comparing the *Fastest Route* ($\alpha = 0$) against the *SolSafe Cool Bike Route* ($\alpha \in [0, 1]$).
- **[`RiderFleetService.java`](backend/src/main/java/com/solsafe/heatsafety/service/RiderFleetService.java)**: Implements the **Moran Physiological Strain Index (PSI, 0–10)** Rider Digital Twin tracking Core Body Temperature ($T_{core}$), Heart Rate (BPM), Sweat Dehydration Deficit, and 5-Rider Fleet order dispatch.
- **[`OasisLocatorService.java`](backend/src/main/java/com/solsafe/heatsafety/service/OasisLocatorService.java)**: **Haversine Great-Circle Spatial Locator** ranking nearby AC/Water/Shade Cool Oases for emergency heat triage.
- **[`StandaloneJavaServer.java`](backend/src/main/java/com/solsafe/heatsafety/server/StandaloneJavaServer.java)**: Zero-dependency JDK 21 Virtual-Thread HTTP Server allowing instant execution via `javac`/`java` even without Maven installed.

### 2. Frontend Tier (`frontend/` — HTML5, CSS3, ES6 JavaScript, Leaflet.js)
- **Interactive Thermal Map (`js/map_renderer.js`)**: Real-time street-level WBGT color-coded segments, Satellite LST Heat Island overlays, and dual route polylines.
- **Live Rider Animation & Voice Dispatch (`js/rider_animation.js`, `js/audio_fx.js`)**: Animated bike marker with live WBGT badge, Web Speech API turn-by-turn thermal voice alerts, and Web Audio synthesized telemetry cues.
- **Biometric HUD & Mobile App UI (`js/hud_controller.js`, `css/style.css`)**: Responsive glassmorphic dashboard with a dedicated 4-tab mobile bottom navigation bar (`Map`, `Route`, `Vitals`, `Fleet`) and quick-action dock.
- **Always-On Edge Failover (`js/api_client.js`)**: Connects to the Java Spring Boot REST API when running locally or on cloud hosts, and seamlessly falls back to the embedded client-side engine on GitHub Pages so the live link runs 24/7 with zero downtime.

---

## 🚀 How to Run Locally (Java 21)

### Option A: Quick Start (`run.bat` or Pure JDK 21)
```bash
# Compile and launch the JDK 21 Virtual-Thread HTTP Server on port 8050
javac -d backend/target/classes backend/src/main/java/com/solsafe/heatsafety/server/StandaloneJavaServer.java
java -cp backend/target/classes com.solsafe.heatsafety.server.StandaloneJavaServer
```

### Option B: Run with Apache Maven & Spring Boot
```bash
cd backend
mvn spring-boot:run
```

Then open **`http://localhost:8050`** in Google Chrome or any mobile browser.
