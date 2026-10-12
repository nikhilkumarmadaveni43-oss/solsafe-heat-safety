"""
SolSafe Routing Engine
Multi-objective graph pathfinding comparing Fastest Route vs Heat-Resilient Cool Route.
Uses NetworkX with microclimate thermal edge penalties.
"""

import json
from pathlib import Path
from typing import Dict, Any, List, Tuple
import networkx as nx

from .microclimate_engine import engine as microclimate_engine

class RoutingEngine:
    def __init__(self, data_dir: Path = None):
        if data_dir is None:
            data_dir = Path(__file__).parent / "data"

        self.cities: Dict[str, Dict[str, Any]] = {}
        self.graphs: Dict[str, nx.Graph] = {}

        # 1. Load Delhi
        delhi_path = data_dir / "city_network.json"
        if delhi_path.exists():
            with open(delhi_path, "r", encoding="utf-8") as f:
                d_data = json.load(f)
                d_data["city_key"] = "delhi"
                self.cities["delhi"] = d_data
                self.graphs["delhi"] = self._build_graph(d_data)

        # 2. Load Hyderabad
        hyd_path = data_dir / "hyderabad_network.json"
        if hyd_path.exists():
            with open(hyd_path, "r", encoding="utf-8") as f:
                h_data = json.load(f)
                h_data["city_key"] = "hyderabad"
                self.cities["hyderabad"] = h_data
                self.graphs["hyderabad"] = self._build_graph(h_data)

        # Default active city is Hyderabad
        self.default_city = "hyderabad" if "hyderabad" in self.cities else "delhi"
        self.raw_data = self.cities[self.default_city]
        self.nodes = {n["id"]: n for n in self.raw_data["nodes"]}
        self.edges = self.raw_data["edges"]
        self.city_center = self.raw_data["center"]
        self.graph = self.graphs[self.default_city]

    def _build_graph(self, raw_data: Dict[str, Any]) -> nx.Graph:
        """Constructs an undirected multigraph for road network"""
        g = nx.Graph()
        for node in raw_data["nodes"]:
            g.add_node(
                node["id"],
                name=node["name"],
                lat=node["lat"],
                lon=node["lon"]
            )

        for edge in raw_data["edges"]:
            g.add_edge(
                edge["u"],
                edge["v"],
                id=edge["id"],
                name=edge["name"],
                distance_m=edge["distance_m"],
                speed_limit_kmh=edge["speed_limit_kmh"],
                canopy_coverage=edge["canopy_coverage"],
                is_asphalt_highway=edge["is_asphalt_highway"],
                is_elevated_flyover=edge.get("is_elevated_flyover", False),
                urban_canyon_shadow=edge["urban_canyon_shadow"]
            )
        return g

    def get_city_network(self, city: str = None) -> Dict[str, Any]:
        target = city.lower() if city and city.lower() in self.cities else self.default_city
        return self.cities[target]

    def calculate_edge_weights(
        self,
        city: str = "hyderabad",
        base_temp_c: float = 43.0,
        base_rh: float = 45.0,
        base_solar_w_m2: float = 950.0,
        wind_speed_m_s: float = 1.5,
        heat_penalty_weight: float = 3.2
    ):
        """
        Dynamically weights every edge in the graph based on microclimate conditions,
        with bike-specific penalties for elevated concrete flyovers.
        """
        g = self.graphs.get(city.lower(), self.graph)
        for u, v, data in g.edges(data=True):
            # Compute physics-based microclimate for this road segment
            micro = microclimate_engine.compute_edge_microclimate(
                base_temp_c=base_temp_c,
                base_rh=base_rh,
                base_solar_w_m2=base_solar_w_m2,
                wind_speed_m_s=wind_speed_m_s,
                canopy_coverage=data["canopy_coverage"],
                is_asphalt_highway=data["is_asphalt_highway"],
                urban_canyon_shadow=data["urban_canyon_shadow"]
            )

            # Store microclimate directly on edge
            wbgt = micro["wbgt"]
            surf_temp = micro["surface_temp_c"]

            # Two-wheeler / Bike Physics:
            # On elevated concrete flyovers (e.g. Durgam Cheruvu bridge), direct sun and rising asphalt heat
            # create extra severe radiant load for bike riders.
            is_flyover = data.get("is_elevated_flyover", False)
            if is_flyover:
                wbgt = round(wbgt + 1.8, 2)
                surf_temp = round(surf_temp + 3.0, 2)

            data["air_temp_c"] = micro["air_temp_c"]
            data["surface_temp_c"] = surf_temp
            data["wbgt"] = wbgt
            data["shade_fraction"] = micro["shade_fraction"]
            data["risk_level"] = micro["risk_level"] if not is_flyover else "Extreme Danger (Flyover Heat Trap)"
            data["flag_color"] = micro["flag_color"]

            # Travel time in seconds: distance (m) / (speed in m/s)
            speed_m_s = (data["speed_limit_kmh"] * 1000.0) / 3600.0
            travel_time_sec = data["distance_m"] / speed_m_s
            data["travel_time_sec"] = travel_time_sec

            # 1. Standard Fastest Route Cost (Pure Time)
            data["fast_weight"] = travel_time_sec

            # 2. SolSafe Bike Cool Route Cost (Thermal-Weighted)
            wbgt_excess = max(0.0, wbgt - 27.5)
            thermal_penalty = (wbgt_excess / 6.0) ** 2.2
            shade_bonus = data["shade_fraction"] * 0.75

            cool_multiplier = 1.0 + (heat_penalty_weight * thermal_penalty) - shade_bonus
            if is_flyover:
                cool_multiplier *= 2.2  # Bikes strongly avoid heat-trap flyovers

            cool_multiplier = max(0.35, cool_multiplier)
            data["cool_weight"] = travel_time_sec * cool_multiplier

    def route_to_geojson_and_stats(self, path_nodes: List[str], city: str = "hyderabad") -> Dict[str, Any]:
        """Translates path node IDs into detailed route summary & coordinates"""
        target_city = city.lower() if city.lower() in self.cities else self.default_city
        city_raw = self.cities[target_city]
        city_nodes = {n["id"]: n for n in city_raw["nodes"]}
        g = self.graphs[target_city]

        coords: List[List[float]] = []
        segments: List[Dict[str, Any]] = []
        total_dist_m = 0.0
        total_time_sec = 0.0
        wbgt_values = []
        shade_values = []
        surface_temp_values = []

        for i in range(len(path_nodes) - 1):
            u = path_nodes[i]
            v = path_nodes[i + 1]
            edge_data = g[u][v]
            node_u = city_nodes[u]
            node_v = city_nodes[v]

            if i == 0:
                coords.append([node_u["lat"], node_u["lon"]])
            coords.append([node_v["lat"], node_v["lon"]])

            total_dist_m += edge_data["distance_m"]
            total_time_sec += edge_data["travel_time_sec"]
            wbgt_values.append(edge_data["wbgt"])
            shade_values.append(edge_data["shade_fraction"])
            surface_temp_values.append(edge_data["surface_temp_c"])

            segments.append({
                "road_name": edge_data["name"],
                "distance_m": edge_data["distance_m"],
                "wbgt": edge_data["wbgt"],
                "surface_temp_c": edge_data["surface_temp_c"],
                "shade_pct": int(edge_data["shade_fraction"] * 100),
                "is_elevated_flyover": edge_data.get("is_elevated_flyover", False),
                "risk_level": edge_data["risk_level"],
                "flag_color": edge_data["flag_color"]
            })

        avg_wbgt = round(sum(wbgt_values) / len(wbgt_values), 1) if wbgt_values else 0.0
        max_wbgt = round(max(wbgt_values), 1) if wbgt_values else 0.0
        avg_shade = round((sum(shade_values) / len(shade_values)) * 100, 1) if shade_values else 0.0
        avg_surface_temp = round(sum(surface_temp_values) / len(surface_temp_values), 1) if surface_temp_values else 0.0

        # Cumulative Heat Strain Dose (Non-linear thermal strain per segment)
        total_heat_dose = 0.0
        for seg in segments:
            wbgt_delta = max(0.0, seg["wbgt"] - 27.0)
            shade_factor = max(0.15, 1.0 - 0.75 * (seg["shade_pct"] / 100.0))
            seg_time_hr = (seg["distance_m"] / 10.0) / 3600.0 # standard pacing
            total_heat_dose += (wbgt_delta ** 1.8) * shade_factor * seg_time_hr
        heat_dose = round(total_heat_dose, 2)

        return {
            "path_nodes": path_nodes,
            "coordinates": coords,
            "total_distance_m": round(total_dist_m, 1),
            "total_distance_km": round(total_dist_m / 1000.0, 2),
            "estimated_time_mins": round(total_time_sec / 60.0, 1),
            "avg_wbgt_c": avg_wbgt,
            "max_wbgt_c": max_wbgt,
            "avg_surface_temp_c": avg_surface_temp,
            "avg_shade_pct": avg_shade,
            "heat_dose_index": heat_dose,
            "segments": segments
        }

    def compute_dual_routes(
        self,
        city: str = "hyderabad",
        origin_id: str = None,
        destination_id: str = None,
        weather_params: Dict[str, float] = None
    ) -> Dict[str, Any]:
        """
        Computes both the Standard (Old Way) and SolSafe Bike Cool Route for given city.
        """
        # Auto-detect city from node prefix if provided, else use requested city
        if origin_id and origin_id.startswith("N"):
            target_city = "delhi"
        elif origin_id and origin_id.startswith("HYD"):
            target_city = "hyderabad"
        else:
            target_city = city.lower() if city and city.lower() in self.cities else self.default_city

        city_raw = self.cities[target_city]
        city_nodes = {n["id"]: n for n in city_raw["nodes"]}
        g = self.graphs[target_city]

        # Intelligent defaults based on city
        if target_city == "hyderabad":
            origin = origin_id or "HYD_1"
            dest = destination_id or "HYD_7"
        else:
            origin = origin_id or "N1"
            dest = destination_id or "N3"

        wp = weather_params or {}
        base_temp = wp.get("base_temp_c", 43.5)
        base_rh = wp.get("base_rh", 42.0)
        base_solar = wp.get("base_solar_w_m2", 960.0)
        wind_speed = wp.get("wind_speed_m_s", 1.8)

        self.calculate_edge_weights(
            city=target_city,
            base_temp_c=base_temp,
            base_rh=base_rh,
            base_solar_w_m2=base_solar,
            wind_speed_m_s=wind_speed
        )

        # 1. Old Way / Fast Route
        fast_path = nx.shortest_path(g, source=origin, target=dest, weight="fast_weight")
        fast_result = self.route_to_geojson_and_stats(fast_path, city=target_city)
        fast_result["route_type"] = "standard_fast"
        fast_result["label"] = "Standard Route (Highway / Flyover - Extreme Heat)"
        fast_result["color"] = "#EF4444"

        # 2. SolSafe Cool Bike Route
        cool_path = nx.shortest_path(g, source=origin, target=dest, weight="cool_weight")
        cool_result = self.route_to_geojson_and_stats(cool_path, city=target_city)
        cool_result["route_type"] = "solsafe_cool"
        cool_result["label"] = "SolSafe Bike Cool Route (Tree Canopy & Shaded Service Lanes)"
        cool_result["color"] = "#10B981"

        # Differential statistics
        time_diff_mins = round(cool_result["estimated_time_mins"] - fast_result["estimated_time_mins"], 1)
        temp_reduction_c = round(fast_result["avg_wbgt_c"] - cool_result["avg_wbgt_c"], 1)
        surface_temp_reduction_c = round(fast_result["avg_surface_temp_c"] - cool_result["avg_surface_temp_c"], 1)
        shade_increase_pct = round(cool_result["avg_shade_pct"] - fast_result["avg_shade_pct"], 1)
        heat_dose_savings_pct = 0.0
        if fast_result["heat_dose_index"] > 0:
            heat_dose_savings_pct = round(
                ((fast_result["heat_dose_index"] - cool_result["heat_dose_index"]) / fast_result["heat_dose_index"]) * 100.0,
                1
            )

        return {
            "city": target_city,
            "city_name": city_raw["city"],
            "center": city_raw["center"],
            "origin": city_nodes[origin],
            "destination": city_nodes[dest],
            "weather_snapshot": {
                "ambient_temp_c": base_temp,
                "humidity_pct": base_rh,
                "solar_radiation_w_m2": base_solar,
                "wind_speed_m_s": wind_speed
            },
            "routes": {
                "standard": fast_result,
                "cool": cool_result
            },
            "comparison": {
                "time_difference_mins": time_diff_mins,
                "wbgt_reduction_c": temp_reduction_c,
                "surface_temp_reduction_c": surface_temp_reduction_c,
                "shade_increase_pct": shade_increase_pct,
                "heat_dose_reduction_pct": max(0.0, heat_dose_savings_pct),
                "safety_verdict": f"SolSafe Bike Route reduces rider heat exposure by {temp_reduction_c}°C WBGT and saves {max(0.0, heat_dose_savings_pct)}% thermal dose for only +{time_diff_mins} mins extra travel."
            }
        }

# Singleton instance
router = RoutingEngine()
