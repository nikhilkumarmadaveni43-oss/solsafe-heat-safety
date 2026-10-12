# SolSafe (CoolRoute AI) — Microclimate Heat Shield & Cool-Routing Engine

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.12%20%7C%203.13-3776ab.svg?logo=python)](https://python.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![WBGT: ISO 7243](https://img.shields.io/badge/Physics-ISO%207243%20WBGT-ff5722.svg)](#)

> **"A smart microclimate map and orchestration API for delivery apps that stops workers from getting heatstroke."**

---

## 🌟 The Problem Solved

Standard mapping systems (e.g. Google Maps, OpenStreetMap) only calculate the fastest route based on travel duration or distance. During extreme heatwaves (42°C–48°C in dense cities like New Delhi, Phoenix, or Madrid):
* Riders are routed onto **unshaded 6-lane asphalt expressways**.
* Ground thermal radiation from black tar asphalt and direct solar irradiance elevate the local **Wet-Bulb Globe Temperature (WBGT) to a lethal 49°C**.
* Gig delivery riders experience elevated cardiovascular strain, critical core body temperatures ($> 38.5^\circ\text{C}$), dehydration, and risk of fatal heatstroke.

**SolSafe** is an intelligent microclimate pathfinder and orchestration engine that:
1. Calculates hyper-local **WBGT** using satellite Land Surface Temperature (LST), tree canopy NDVI, and solar radiation physics.
2. Directs riders through **tree-shaded corridors and urban canyons** (-6.6°C WBGT cooler with ground heat reduction of over 14°C) for just ~1.8 minutes extra travel.
3. Automatically triggers **heat-break pauses** and routes riders to the nearest air-conditioned **Cool Oasis** before physiological danger occurs.

---

## 🔬 Scientific Foundations

### 1. ISO 7243 Wet-Bulb Globe Temperature (WBGT)
$$\text{WBGT}_{\text{outdoor}} = 0.7 T_{\text{w}} + 0.2 T_{\text{g}} + 0.1 T_{\text{a}}$$
* $T_{\text{w}}$: Natural Wet-Bulb temperature (derived via the Stull atmospheric formulation).
* $T_{\text{g}}$: Black Globe temperature (captures direct solar radiation flux, wind convection, and reflected asphalt radiant heat).
* $T_{\text{a}}$: Ambient dry-bulb temperature.

### 2. Multi-Objective Cool-Path Cost Function
For each street edge $e$, the traversal cost is weighted by microclimatic thermal penalty:
$$\text{Cost}(e) = \text{Time}(e) \times \left(1.0 + w_{\text{heat}} \cdot \max\left(0, \frac{\text{WBGT}(e) - 27.5}{6.0}\right)^{2.2} - w_{\text{shade}} \cdot \text{CanopyFactor}(e)\right)$$

### 3. Moran Physiological Strain Index (PSI)
$$PSI = 5 \cdot \left(\frac{T_{\text{core}} - T_{\text{core},0}}{39.5 - T_{\text{core},0}}\right) + 5 \cdot \left(\frac{\text{HR} - \text{HR}_0}{180 - \text{HR}_0}\right)$$
* Scale $0$ (No strain) to $10$ (Heatstroke threshold).

---

## 🚀 Key Features

* **Dual Route Simulation**: Real-time side-by-side comparison between the standard highway route (49°C WBGT) and SolSafe Cool Route (42°C WBGT, 82% shade).
* **Live Animated Rider (Rahul on Bike)**: Smooth interpolation along coordinates with custom SVG bike marker, rotational heading, and dynamic thermal aura (fiery red vs emerald cyan).
* **Satellite Thermal Heatmap**: Simulated Google Earth Engine / Landsat-8 Land Surface Temperature and Sentinel-2 NDVI canopy raster overlays.
* **Biometric & Thermal HUD**: Live radial WBGT gauge, core body temp ($T_{\text{core}}$), animated ECG heart rate oscilloscope waveform, hydration percentage, and 90-minute sun exposure dial.
* **Automated Partner Orchestration Modal**: Real-time simulation of Zomato/Swiggy dispatch API pausing incoming orders for 15 minutes, preserving hourly pay stipend, and rerouting to the nearest Cool Oasis.
* **Zero External Audio Dependencies**: Futuristic UI sounds, thermal warning beeps, and cooling oasis chimes generated natively via Web Audio API.

---

## 💻 Tech Stack

* **Backend**: Python 3.13, FastAPI, NetworkX (Graph Pathfinding), Pydantic, Uvicorn.
* **Frontend**: Vanilla HTML5, Modern CSS (Glassmorphism, Keyframe Animations), Leaflet JS, CartoDB DarkMatter tiles, Web Audio API synthesizer.
* **Testing**: Pytest with automated physics and pathfinding verification.

---

## ⚡ Quick Start

### 1. Requirements
Ensure Python 3.11+ is installed. Dependencies:
```bash
pip install -r requirements.txt
```

### 2. Launch the Application
Double-click `run.bat` on Windows, or run in terminal:
```bash
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8050 --reload
```
Then open your browser at:
```
http://127.0.0.1:8050
```

### 3. Run Automated Tests
```bash
python -m pytest backend/tests/test_microclimate.py -v
```

---

## 📦 Directory Structure

```
heat safety 2/
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI server & WebSocket endpoints
│   │   ├── microclimate_engine.py      # ISO 7243 WBGT & Stull physical model
│   │   ├── routing_engine.py           # NetworkX heat-penalized A* router
│   │   ├── worker_state_machine.py     # Moran PSI & biothermal strain tracker
│   │   ├── oasis_locator.py            # Nearest AC shelter & Water ATM finder
│   │   ├── telemetry_stream.py         # Kafka-style GPS packet streamer
│   │   └── data/
│   │       ├── city_network.json       # Central Delhi road network with canopy data
│   │       └── cool_oases.json         # Designated cooling shelters & partner hubs
│   └── tests/
│       └── test_microclimate.py        # Automated test suite (5/5 passing)
├── frontend/
│   ├── index.html                     # Responsive glassmorphic dashboard
│   ├── css/
│   │   └── style.css                  # Cyber-tactical theme & keyframe animations
│   └── js/
│       ├── audio_fx.js                # Web Audio API synthesizer
│       ├── api_client.js              # REST API client
│       ├── hud_controller.js          # Live gauges & biometrics HUD
│       ├── map_renderer.js            # Leaflet map, thermal raster & routes
│       ├── rider_animation.js         # Animated bike movement & thermal aura
│       └── app.js                     # Main orchestrator & UI bindings
├── requirements.txt
├── run.bat                            # 1-click Windows launcher
└── README.md
```
