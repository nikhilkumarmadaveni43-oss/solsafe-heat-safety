"""
Gig Worker Heat Accumulation State Machine & Biothermal Telemetry Engine.
Models physiological heat strain (Moran PSI), core body temperature,
cumulative solar exposure, hydration depletion, and mandatory rest pauses.
"""

from typing import Dict, Any, List
import time

class WorkerHeatState:
    def __init__(
        self,
        worker_id: str = "RIDER_104",
        name: str = "Rahul Sharma",
        vehicle: str = "TVS Apache 160",
        vehicle_type: str = "motorcycle",
        avatar_letter: str = "R",
        age: int = 28,
        consecutive_mins: float = 25.0,
        core_temp_c: float = 37.1,
        hydration_pct: float = 92.0
    ):
        self.worker_id = worker_id
        self.name = name
        self.vehicle = vehicle
        self.vehicle_type = vehicle_type
        self.avatar_letter = avatar_letter
        self.age = age
        self.partner_platform = "Zomato Partner Fleet"
        
        # Physiological Baselines
        self.baseline_core_temp = 37.0
        self.baseline_heart_rate = 72
        
        # Dynamic Biometrics
        self.core_temp_c = core_temp_c
        self.heart_rate_bpm = 78
        self.hydration_pct = hydration_pct
        self.sun_exposure_mins = consecutive_mins
        self.consecutive_exposure_mins = consecutive_mins
        self.cumulative_heat_dose = 0.0
        
        # State: "DELIVERING_ACTIVE", "WARNING_ELEVATED", "MANDATORY_HEAT_BREAK", "RESTING_AT_OASIS"
        self.status = "DELIVERING_ACTIVE"
        self.orders_paused = False
        self.pause_remaining_mins = 0.0
        self.designated_oasis_id = None
        self.assigned_route_type = "solsafe_cool"
        
        self.history: List[Dict[str, Any]] = []

    def calculate_psi(self) -> float:
        """Physiological Strain Index (Moran et al. 1998)"""
        delta_tc = max(0.0, (self.core_temp_c - self.baseline_core_temp) / (39.5 - self.baseline_core_temp))
        delta_hr = max(0.0, (self.heart_rate_bpm - self.baseline_heart_rate) / (180.0 - self.baseline_heart_rate))
        psi = 5.0 * delta_tc + 5.0 * delta_hr
        return round(min(10.0, psi), 2)

    def get_heat_strain_level(self, psi: float) -> Dict[str, str]:
        if psi < 3.0:
            return {"label": "Normal / Safe", "color": "#10B981"}
        elif psi < 5.0:
            return {"label": "Moderate Strain", "color": "#F59E0B"}
        elif psi < 7.0:
            return {"label": "High Strain Warning", "color": "#EF4444"}
        else:
            return {"label": "Critical Heat Danger", "color": "#7C3AED"}

    def update_tick(
        self,
        ambient_wbgt: float,
        shade_fraction: float,
        dt_mins: float = 1.0,
        is_resting: bool = False
    ) -> Dict[str, Any]:
        """Simulates biothermal state progression per minute of simulation time."""
        if is_resting or self.status == "RESTING_AT_OASIS":
            self.core_temp_c = max(37.0, round(self.core_temp_c - 0.04 * dt_mins, 2))
            self.heart_rate_bpm = max(72, int(self.heart_rate_bpm - 3.5 * dt_mins))
            self.hydration_pct = min(100.0, round(self.hydration_pct + 4.0 * dt_mins, 1))
            self.consecutive_exposure_mins = max(0.0, round(self.consecutive_exposure_mins - 5.0 * dt_mins, 1))
            
            if self.pause_remaining_mins > 0:
                self.pause_remaining_mins = max(0.0, round(self.pause_remaining_mins - dt_mins, 1))
                if self.pause_remaining_mins == 0:
                    self.status = "DELIVERING_ACTIVE"
                    self.orders_paused = False
                    self.designated_oasis_id = None
        else:
            self.sun_exposure_mins += dt_mins
            self.consecutive_exposure_mins += dt_mins

            sun_penalty = (1.0 - shade_fraction)
            thermal_load = max(0.0, (ambient_wbgt - 28.0) / 10.0)

            tc_rate = (0.015 * thermal_load * (1.0 + sun_penalty * 0.8)) * dt_mins
            self.core_temp_c = min(40.2, round(self.core_temp_c + tc_rate, 2))

            hr_boost = (2.2 * thermal_load * (1.0 + sun_penalty * 0.7)) * dt_mins
            self.heart_rate_bpm = min(175, int(self.heart_rate_bpm + hr_boost))

            sweat_rate = (0.35 + (thermal_load * 0.45 * (1.0 + sun_penalty * 0.5))) * dt_mins
            self.hydration_pct = max(10.0, round(self.hydration_pct - sweat_rate, 1))

            if ambient_wbgt > 28.0:
                self.cumulative_heat_dose += (ambient_wbgt - 28.0) * (dt_mins / 60.0)

            psi = self.calculate_psi()
            if (self.consecutive_exposure_mins >= 90.0 or psi >= 6.8 or self.core_temp_c >= 38.6 or self.hydration_pct < 35.0):
                self.trigger_heat_break(reason="Biothermal Heat Stress Threshold Exceeded")

        current_psi = self.calculate_psi()
        strain_info = self.get_heat_strain_level(current_psi)

        snapshot = {
            "worker_id": self.worker_id,
            "name": self.name,
            "vehicle": self.vehicle,
            "vehicle_type": self.vehicle_type,
            "avatar_letter": self.avatar_letter,
            "age": self.age,
            "status": self.status,
            "orders_paused": self.orders_paused,
            "pause_remaining_mins": self.pause_remaining_mins,
            "designated_oasis_id": self.designated_oasis_id,
            "core_temp_c": self.core_temp_c,
            "heart_rate_bpm": self.heart_rate_bpm,
            "hydration_pct": self.hydration_pct,
            "sun_exposure_mins": round(self.sun_exposure_mins, 1),
            "consecutive_exposure_mins": round(self.consecutive_exposure_mins, 1),
            "psi": current_psi,
            "strain_label": strain_info["label"],
            "strain_color": strain_info["color"],
            "cumulative_heat_dose": round(self.cumulative_heat_dose, 2)
        }

        self.history.append(snapshot)
        if len(self.history) > 60:
            self.history.pop(0)

        return snapshot

    def trigger_heat_break(self, reason: str = "Mandatory 90-min Heat Threshold"):
        self.status = "MANDATORY_HEAT_BREAK"
        self.orders_paused = True
        self.pause_remaining_mins = 15.0
        self.designated_oasis_id = "HYD_OASIS_1"

    def reset_to_fresh(self):
        self.core_temp_c = 37.1
        self.heart_rate_bpm = 78
        self.hydration_pct = 95.0
        self.sun_exposure_mins = 0.0
        self.consecutive_exposure_mins = 0.0
        self.cumulative_heat_dose = 0.0
        self.status = "DELIVERING_ACTIVE"
        self.orders_paused = False
        self.pause_remaining_mins = 0.0
        self.designated_oasis_id = None
        self.history = []

    def get_summary(self) -> Dict[str, Any]:
        current_psi = self.calculate_psi()
        strain_info = self.get_heat_strain_level(current_psi)
        return {
            "worker_id": self.worker_id,
            "name": self.name,
            "vehicle": self.vehicle,
            "vehicle_type": self.vehicle_type,
            "avatar_letter": self.avatar_letter,
            "age": self.age,
            "status": self.status,
            "core_temp_c": self.core_temp_c,
            "heart_rate_bpm": self.heart_rate_bpm,
            "hydration_pct": self.hydration_pct,
            "consecutive_exposure_mins": round(self.consecutive_exposure_mins, 1),
            "psi": current_psi,
            "strain_label": strain_info["label"],
            "strain_color": strain_info["color"]
        }


class RiderFleetManager:
    """Manages pool of gig delivery riders for rotation across orders."""
    def __init__(self):
        self.riders: Dict[str, WorkerHeatState] = {
            "RIDER_104": WorkerHeatState(
                worker_id="RIDER_104", name="Rahul Sharma",
                vehicle="TVS Apache RTR 160", vehicle_type="motorcycle",
                avatar_letter="R", age=28, consecutive_mins=25.0,
                core_temp_c=37.1, hydration_pct=92.0
            ),
            "RIDER_219": WorkerHeatState(
                worker_id="RIDER_219", name="Priya Reddy",
                vehicle="Ather 450X EV Scooter", vehicle_type="scooter",
                avatar_letter="P", age=24, consecutive_mins=68.0,
                core_temp_c=37.6, hydration_pct=65.0
            ),
            "RIDER_308": WorkerHeatState(
                worker_id="RIDER_308", name="Mohammed Imran",
                vehicle="Hero Splendor Plus", vehicle_type="motorcycle",
                avatar_letter="M", age=33, consecutive_mins=82.0,
                core_temp_c=38.2, hydration_pct=46.0
            ),
            "RIDER_412": WorkerHeatState(
                worker_id="RIDER_412", name="Kavitha Rao",
                vehicle="Honda Activa 6G", vehicle_type="scooter",
                avatar_letter="K", age=29, consecutive_mins=42.0,
                core_temp_c=37.3, hydration_pct=36.0
            ),
            "RIDER_505": WorkerHeatState(
                worker_id="RIDER_505", name="Suresh Kumar",
                vehicle="Bajaj Pulsar 150", vehicle_type="motorcycle",
                avatar_letter="S", age=35, consecutive_mins=8.0,
                core_temp_c=37.0, hydration_pct=98.0
            ),
        }
        self.current_rider_id = "RIDER_104"
        self._rider_keys = list(self.riders.keys())
        self._rotation_index = 0

    @property
    def active_rider(self) -> WorkerHeatState:
        return self.riders.get(self.current_rider_id, self.riders["RIDER_104"])

    def set_active_rider(self, rider_id: str) -> WorkerHeatState:
        if rider_id in self.riders:
            self.current_rider_id = rider_id
            self._rotation_index = self._rider_keys.index(rider_id)
        return self.active_rider

    def get_rider(self, rider_id: str = None) -> WorkerHeatState:
        if rider_id and rider_id in self.riders:
            return self.riders[rider_id]
        return self.active_rider

    def get_fleet_summary(self) -> List[Dict[str, Any]]:
        return [r.get_summary() for r in self.riders.values()]

    def rotate_to_next_rider(self) -> WorkerHeatState:
        self._rotation_index = (self._rotation_index + 1) % len(self._rider_keys)
        self.current_rider_id = self._rider_keys[self._rotation_index]
        return self.active_rider


fleet_manager = RiderFleetManager()
rider_rahul = fleet_manager.riders["RIDER_104"]
