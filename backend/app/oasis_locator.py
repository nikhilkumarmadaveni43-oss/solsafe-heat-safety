"""
Cool Oasis Locator Service
Matches overheated delivery riders with nearby verified cooling hubs:
AC partner lounges, shaded tree parks, Water ATMs, and metro cooling zones.
"""

import json
import math
from pathlib import Path
from typing import Dict, Any, List

class OasisLocator:
    def __init__(self, data_dir: Path = None):
        if data_dir is None:
            data_dir = Path(__file__).parent / "data"

        self.oases_by_city: Dict[str, List[Dict[str, Any]]] = {}
        self.all_oases: List[Dict[str, Any]] = []

        delhi_file = data_dir / "cool_oases.json"
        if delhi_file.exists():
            with open(delhi_file, "r", encoding="utf-8") as f:
                delhi_list = json.load(f)
                for o in delhi_list:
                    o["city"] = "delhi"
                self.oases_by_city["delhi"] = delhi_list
                self.all_oases.extend(delhi_list)

        hyd_file = data_dir / "hyderabad_oases.json"
        if hyd_file.exists():
            with open(hyd_file, "r", encoding="utf-8") as f:
                hyd_list = json.load(f)
                for o in hyd_list:
                    o["city"] = "hyderabad"
                self.oases_by_city["hyderabad"] = hyd_list
                self.all_oases.extend(hyd_list)

        self.oases = self.all_oases

    def haversine_distance_m(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Great-circle distance in meters between two GPS coordinates"""
        R = 6371000.0  # Earth radius in meters
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        delta_phi = math.radians(lat2 - lat1)
        delta_lambda = math.radians(lon2 - lon1)

        a = math.sin(delta_phi / 2.0) ** 2 + \
            math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        return R * c

    def find_nearest_oasis(self, current_lat: float = None, current_lon: float = None, lat: float = None, lon: float = None) -> Dict[str, Any]:
        """Finds the closest cooling shelter to the rider's current location"""
        p_lat = current_lat if current_lat is not None else lat
        p_lon = current_lon if current_lon is not None else lon
        if p_lat is None or p_lon is None:
            raise ValueError("Coordinates required")
        scored_oases = []
        for oasis in self.oases:
            dist_m = self.haversine_distance_m(p_lat, p_lon, oasis["lat"], oasis["lon"])
            walk_or_ride_mins = round(dist_m / 250.0, 1) # ~15 km/h slow ride
            scored_oases.append({
                **oasis,
                "distance_m": round(dist_m),
                "eta_mins": walk_or_ride_mins
            })

        scored_oases.sort(key=lambda x: x["distance_m"])
        nearest = scored_oases[0] if scored_oases else None
        return {
            "nearest": nearest,
            "all_nearby": scored_oases
        }

    def get_all_oases(self, city: str = None) -> List[Dict[str, Any]]:
        if city and city.lower() in self.oases_by_city:
            return self.oases_by_city[city.lower()]
        return self.oases

oasis_locator = OasisLocator()
