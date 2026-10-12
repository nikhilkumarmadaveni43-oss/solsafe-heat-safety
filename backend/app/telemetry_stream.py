"""
High-throughput Telemetry Stream Simulator (Kafka-style ingestion pipeline)
Interpolates real-time GPS movement, vehicle velocity, ambient road thermal load,
and biometric telemetry packets for delivery riders.
"""

from typing import Dict, Any, List, Generator
import math
import asyncio
from .worker_state_machine import rider_rahul
from .oasis_locator import oasis_locator

class TelemetryStreamSimulator:
    def __init__(self):
        self.active_subscribers = set()

    def interpolate_polyline(self, coords: List[List[float]], num_steps_per_segment: int = 15) -> List[List[float]]:
        """
        Generates finely interpolated GPS points between route coordinates
        for smooth vehicle animation.
        """
        if len(coords) < 2:
            return coords

        interpolated = []
        for i in range(len(coords) - 1):
            p1 = coords[i]
            p2 = coords[i + 1]

            for s in range(num_steps_per_segment):
                t = s / float(num_steps_per_segment)
                lat = p1[0] + (p2[0] - p1[0]) * t
                lon = p1[1] + (p2[1] - p1[1]) * t
                interpolated.append([round(lat, 6), round(lon, 6)])

        interpolated.append(coords[-1])
        return interpolated

    def build_telemetry_packet(
        self,
        rider_state: Dict[str, Any],
        lat: float,
        lon: float,
        speed_kmh: float,
        segment_info: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Formats a standard Kafka-compatible JSON telemetry payload"""
        # Find nearest cooling oasis to rider's current position
        nearest_oasis = oasis_locator.find_nearest_oasis(lat, lon)["nearest"]

        return {
            "timestamp_ms": int(math.floor(asyncio.get_event_loop().time() * 1000)),
            "kafka_partition": 3,
            "topic": "rider-telemetry-v1",
            "rider": {
                "id": rider_state["worker_id"],
                "name": rider_state["name"],
                "status": rider_state["status"],
                "orders_paused": rider_state["orders_paused"],
                "pause_remaining_mins": rider_state["pause_remaining_mins"]
            },
            "location": {
                "lat": lat,
                "lon": lon,
                "speed_kmh": round(speed_kmh, 1)
            },
            "microclimate": {
                "road_name": segment_info.get("road_name", "Urban Corridor"),
                "air_temp_c": segment_info.get("air_temp_c", 42.0),
                "surface_temp_c": segment_info.get("surface_temp_c", 51.5),
                "wbgt": segment_info.get("wbgt", 39.2),
                "shade_pct": segment_info.get("shade_pct", 10),
                "risk_level": segment_info.get("risk_level", "High")
            },
            "biometrics": {
                "core_temp_c": rider_state["core_temp_c"],
                "heart_rate_bpm": rider_state["heart_rate_bpm"],
                "hydration_pct": rider_state["hydration_pct"],
                "consecutive_sun_mins": rider_state["consecutive_exposure_mins"],
                "psi": rider_state["psi"],
                "strain_label": rider_state["strain_label"],
                "strain_color": rider_state["strain_color"]
            },
            "nearest_oasis": {
                "id": nearest_oasis["id"],
                "name": nearest_oasis["name"],
                "distance_m": nearest_oasis["distance_m"],
                "eta_mins": nearest_oasis["eta_mins"],
                "indoor_temp_c": nearest_oasis["indoor_temp_c"]
            }
        }

telemetry_simulator = TelemetryStreamSimulator()
