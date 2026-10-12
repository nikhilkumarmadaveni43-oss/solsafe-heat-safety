"""
SolSafe / CoolRoute AI - FastAPI Microclimate Orchestration API
Provides microclimate modeling, cool-path routing, worker biothermal tracking,
and simulated partner dispatch orchestration for gig workers.
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from pathlib import Path
import asyncio
import json

from .microclimate_engine import engine as microclimate_engine
from .microclimate_engine import engine as microclimate_engine
from .routing_engine import router as routing_engine
from .worker_state_machine import fleet_manager, rider_rahul
from .oasis_locator import oasis_locator
from .telemetry_stream import telemetry_simulator
import random

app = FastAPI(
    title="SolSafe Microclimate & Cool-Routing API",
    description="Real-world heat safety & thermal routing engine for delivery gig workers",
    version="2.0.0"
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Request Models ---
class RouteRequest(BaseModel):
    city: Optional[str] = Field(default="hyderabad", description="City key: hyderabad or delhi")
    origin_id: Optional[str] = Field(default=None, description="Origin Node ID")
    destination_id: Optional[str] = Field(default=None, description="Destination Node ID")
    base_temp_c: float = Field(default=43.5, description="Ambient air temperature in °C")
    base_rh: float = Field(default=42.0, description="Relative humidity %")
    base_solar_w_m2: float = Field(default=960.0, description="Solar irradiance W/m²")
    wind_speed_m_s: float = Field(default=1.8, description="Wind speed m/s")

class GpsRouteRequest(BaseModel):
    lat: float = Field(..., description="Live user latitude")
    lon: float = Field(..., description="Live user longitude")
    city: Optional[str] = Field(default="hyderabad", description="Target city")

class SwitchRiderRequest(BaseModel):
    rider_id: str = Field(..., description="Target rider ID to activate")

class GenerateOrderRequest(BaseModel):
    city: Optional[str] = Field(default="hyderabad", description="Target city")
    rider_id: Optional[str] = Field(default=None, description="Specific rider ID or None to rotate")
    origin_id: Optional[str] = Field(default=None, description="Specific origin node or None for random")
    destination_id: Optional[str] = Field(default=None, description="Specific destination node or None for random")
    base_temp_c: Optional[float] = Field(default=44.0, description="Ambient air temperature in °C")
    base_rh: Optional[float] = Field(default=42.0, description="Relative humidity %")
    base_solar_w_m2: Optional[float] = Field(default=960.0, description="Solar irradiance W/m²")
    wind_speed_m_s: Optional[float] = Field(default=1.8, description="Wind speed m/s")

class WorkerTickRequest(BaseModel):
    rider_id: Optional[str] = Field(default=None, description="Worker ID")
    ambient_wbgt: float = Field(default=38.5, description="Current local WBGT °C")
    shade_fraction: float = Field(default=0.15, description="Current tree/building shade fraction 0-1")
    dt_mins: float = Field(default=1.0, description="Simulation delta minutes")
    is_resting: bool = Field(default=False, description="Whether rider is currently inside an Oasis")

class HeatBreakTriggerRequest(BaseModel):
    rider_id: Optional[str] = Field(default=None, description="Worker ID")
    rider_lat: float = Field(default=17.4435, description="Current rider latitude")
    rider_lon: float = Field(default=78.3850, description="Current rider longitude")
    reason: Optional[str] = Field(default="90-Minute Sun Exposure Threshold Reached", description="Trigger reason")

# --- REST Endpoints ---

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "SolSafe Heat Safety & Cool Routing Engine",
        "version": "2.0.0",
        "supported_cities": ["hyderabad", "delhi"],
        "active_default": "hyderabad"
    }

@app.get("/api/network")
def get_network(city: Optional[str] = "hyderabad"):
    """Returns road network nodes and edges for specified city"""
    return routing_engine.get_city_network(city)

@app.get("/api/oases")
def get_oases(city: Optional[str] = "hyderabad"):
    """Returns list of cooling oases and shelters for specified city"""
    return oasis_locator.get_all_oases(city)

@app.post("/api/routes")
def calculate_routes(req: RouteRequest):
    """
    Computes side-by-side:
    - Standard Route (Fastest, unshaded asphalt highway / flyover, high heat load)
    - SolSafe Cool Bike Route (Microclimate-optimized, shaded avenues, lower WBGT)
    """
    try:
        weather_params = {
            "base_temp_c": req.base_temp_c,
            "base_rh": req.base_rh,
            "base_solar_w_m2": req.base_solar_w_m2,
            "wind_speed_m_s": req.wind_speed_m_s
        }
        result = routing_engine.compute_dual_routes(
            city=req.city or "hyderabad",
            origin_id=req.origin_id,
            destination_id=req.destination_id,
            weather_params=weather_params
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/routes/from_gps")
def calculate_routes_from_gps(req: GpsRouteRequest):
    """
    Finds nearest node to the user's live GPS location and returns cool bike route
    to the closest Cool Oasis shelter.
    """
    try:
        nearest_oasis_info = oasis_locator.find_nearest_oasis(lat=req.lat, lon=req.lon)
        nearest_oasis = nearest_oasis_info["nearest"]

        # Find closest graph node
        city_network = routing_engine.get_city_network(req.city)
        best_node = None
        min_dist = float("inf")
        for node in city_network["nodes"]:
            d = (node["lat"] - req.lat) ** 2 + (node["lon"] - req.lon) ** 2
            if d < min_dist:
                min_dist = d
                best_node = node

        return {
            "user_gps": {"lat": req.lat, "lon": req.lon},
            "nearest_node": best_node,
            "nearest_oasis": nearest_oasis,
            "relief_route": {
                "coordinates": [
                    [req.lat, req.lon],
                    [best_node["lat"], best_node["lon"]],
                    [nearest_oasis["lat"], nearest_oasis["lon"]]
                ],
                "distance_m": nearest_oasis["distance_m"],
                "eta_mins": nearest_oasis["eta_mins"]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/fleet")
def get_fleet():
    """Returns active fleet of delivery riders with their vehicles and heat states"""
    return {
        "active_rider_id": fleet_manager.current_rider_id,
        "fleet": fleet_manager.get_fleet_summary()
    }

@app.post("/api/fleet/switch")
def switch_active_rider(req: SwitchRiderRequest):
    """Activates a specific rider from the fleet"""
    rider = fleet_manager.set_active_rider(req.rider_id)
    summary = rider.get_summary()
    return {
        "status": "switched",
        "active_rider": summary,
        "rider": summary
    }

@app.post("/api/orders/generate")
def generate_new_order(req: GenerateOrderRequest):
    """
    Generates a new delivery order:
    1. Selects or rotates to the next rider in the fleet.
    2. Selects or picks random origin (Source) and destination.
    3. Computes dual routes.
    """
    target_city = req.city.lower() if req.city else "hyderabad"
    city_net = routing_engine.get_city_network(target_city)
    nodes = city_net["nodes"]
    node_ids = [n["id"] for n in nodes]

    if req.rider_id:
        rider = fleet_manager.set_active_rider(req.rider_id)
    else:
        rider = fleet_manager.rotate_to_next_rider()

    origin_id = req.origin_id
    dest_id = req.destination_id
    if not origin_id or origin_id not in node_ids:
        origin_id = random.choice(node_ids)
    if not dest_id or dest_id not in node_ids or dest_id == origin_id:
        choices = [nid for nid in node_ids if nid != origin_id]
        dest_id = random.choice(choices) if choices else node_ids[0]

    weather_params = {
        "base_temp_c": req.base_temp_c or 44.0,
        "base_rh": req.base_rh or 42.0,
        "base_solar_w_m2": req.base_solar_w_m2 or 960.0,
        "wind_speed_m_s": req.wind_speed_m_s or 1.8
    }

    routes_result = routing_engine.compute_dual_routes(
        city=target_city,
        origin_id=origin_id,
        destination_id=dest_id,
        weather_params=weather_params
    )

    return {
        "order_id": f"ORD_{random.randint(10000, 99999)}",
        "city": target_city,
        "assigned_rider": rider.get_summary(),
        "routes": routes_result
    }

@app.post("/api/worker/tick")
def update_worker_state(req: WorkerTickRequest):
    """Updates active or specified rider's biometrics based on exposure"""
    rider = fleet_manager.get_rider(req.rider_id)
    snapshot = rider.update_tick(
        ambient_wbgt=req.ambient_wbgt,
        shade_fraction=req.shade_fraction,
        dt_mins=req.dt_mins,
        is_resting=req.is_resting
    )
    return snapshot

@app.post("/api/worker/trigger_break")
def trigger_mandatory_heat_break(req: HeatBreakTriggerRequest):
    """
    Simulates Zomato Orchestration Action:
    - Automatically pauses orders for 15 minutes.
    - Locates the nearest cooling oasis.
    - Dispatches reroute coordinates to the rider app.
    """
    rider = fleet_manager.get_rider(req.rider_id)
    rider.trigger_heat_break(reason=req.reason)
    nearest_oasis = oasis_locator.find_nearest_oasis(req.rider_lat, req.rider_lon)
    
    return {
        "event": "DISPATCH_SAFETY_INTERVENTION",
        "action": "PAUSE_INCOMING_ORDERS",
        "duration_minutes": 15,
        "reason": req.reason,
        "rider_id": rider.worker_id,
        "rider_name": rider.name,
        "assigned_oasis": nearest_oasis["nearest"],
        "orchestration_payload": {
            "partner_app": "Zomato Partner Pro",
            "screen_override": "MANDATORY_COOLING_BREAK",
            "message": f"🚨 Temperature and direct sun exposure exceed safe operating thresholds for {rider.name}. Dispatch queue paused for 15 minutes. Proceed to nearest Cool Zone to hydrate.",
            "compensation": "Protected Safe-Break Guaranteed Hourly Stipend Active"
        }
    }

@app.post("/api/worker/reset")
def reset_worker_state(rider_id: Optional[str] = None):
    """Resets active or specified rider back to rested baseline"""
    rider = fleet_manager.get_rider(rider_id)
    rider.reset_to_fresh()
    return {"status": "reset_success", "rider": rider.worker_id}

@app.get("/api/satellite_layer")
def get_synthetic_satellite_thermal_grid(city: Optional[str] = "hyderabad"):
    """
    Simulates Google Earth Engine Landsat 8 / Sentinel-2 thermal raster layer
    for Hyderabad (Cyberabad) or Delhi (Connaught Sector).
    """
    target = city.lower() if city else "hyderabad"
    grid_points = []
    
    if target == "hyderabad":
        center_lat, center_lon = 17.4435, 78.3850
        lat_step = 0.0035
        lon_step = 0.0040
        bbox = [17.4200, 78.3650, 17.4600, 78.4250]
        
        for i in range(-3, 4):
            for j in range(-3, 4):
                pt_lat = round(center_lat + i * lat_step, 5)
                pt_lon = round(center_lon + j * lon_step, 5)
                
                # West & Flyover area: concrete / asphalt heat island
                if j < -1 or (i >= 0 and j <= 0):
                    ndvi = 0.06
                    lst_c = 53.8
                    zone = "Cyber Towers & Concrete Flyover Heat Island"
                elif i <= -1 and j >= 1:
                    ndvi = 0.88
                    lst_c = 35.6
                    zone = "Jubilee Hills & KBR Park Shaded Eco-Corridor"
                elif i >= 1 and j >= 1:
                    ndvi = 0.72
                    lst_c = 37.8
                    zone = "Ayyappa Society Neem Canopy Belt"
                else:
                    ndvi = 0.28
                    lst_c = 44.2
                    zone = "Madhapur Mixed Urban Tech Corridor"
                    
                grid_points.append({
                    "lat": pt_lat,
                    "lon": pt_lon,
                    "land_surface_temp_c": lst_c,
                    "ndvi_canopy_index": ndvi,
                    "zone_type": zone,
                    "intensity": round((lst_c - 35.0) / 20.0, 2)
                })
    else:
        center_lat, center_lon = 28.6315, 77.2195
        lat_step = 0.003
        lon_step = 0.003
        bbox = [28.6200, 77.2080, 28.6420, 77.2320]
        for i in range(-3, 4):
            for j in range(-3, 4):
                pt_lat = round(center_lat + i * lat_step, 5)
                pt_lon = round(center_lon + j * lon_step, 5)
                dist_from_core = (i**2 + j**2) ** 0.5
                if dist_from_core <= 1.2:
                    ndvi = 0.72
                    lst_c = 36.5
                    zone = "Urban Canopy / Shaded Core"
                elif j > 1:
                    ndvi = 0.08
                    lst_c = 52.8
                    zone = "Severe Asphalt Heat Island"
                elif i < -1:
                    ndvi = 0.65
                    lst_c = 38.2
                    zone = "Protected Shaded Boulevard"
                else:
                    ndvi = 0.25
                    lst_c = 46.0
                    zone = "Medium Urban Density"
                    
                grid_points.append({
                    "lat": pt_lat,
                    "lon": pt_lon,
                    "land_surface_temp_c": lst_c,
                    "ndvi_canopy_index": ndvi,
                    "zone_type": zone,
                    "intensity": round((lst_c - 35.0) / 20.0, 2)
                })

    return {
        "city": target,
        "source": "Simulated Google Earth Engine (Landsat-8 LST & Sentinel-2 NDVI)",
        "resolution_m": 30,
        "bbox": bbox,
        "grid": grid_points
    }

# --- WebSocket Telemetry Stream ---
@app.websocket("/ws/telemetry")
async def websocket_telemetry_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # Receive ping or client instructions
            data = await websocket.receive_text()
            payload = json.loads(data)
            action = payload.get("action")

            if action == "TICK":
                wbgt = payload.get("wbgt", 39.0)
                shade = payload.get("shade", 0.1)
                dt = payload.get("dt", 1.0)
                resting = payload.get("resting", False)
                rider_snap = rider_rahul.update_tick(wbgt, shade, dt, resting)
                
                # Format full telemetry
                packet = telemetry_simulator.build_telemetry_packet(
                    rider_state=rider_snap,
                    lat=payload.get("lat", 28.6315),
                    lon=payload.get("lon", 77.2195),
                    speed_kmh=payload.get("speed_kmh", 24.0),
                    segment_info=payload.get("segment_info", {})
                )
                await websocket.send_json(packet)

            elif action == "RESET":
                rider_rahul.reset_to_fresh()
                await websocket.send_json({"event": "RIDER_RESET", "status": "ok"})

    except WebSocketDisconnect:
        pass
    except Exception as e:
        await websocket.close()

# Mount frontend static directory if exists
frontend_dir = Path(__file__).parent.parent.parent / "frontend"
if frontend_dir.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dir), html=True), name="frontend")
