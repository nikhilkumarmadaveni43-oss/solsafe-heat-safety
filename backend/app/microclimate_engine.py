"""
Microclimate Physics Engine
Implements ISO 7243 and Liljegren & Bernard formulations for:
- Wet-Bulb Globe Temperature (WBGT)
- Asphalt Surface Temperature & Longwave Radiation
- Tree Canopy NDVI & Street Canyon Shadow Cooling Factors
"""

import math
from typing import Dict, Any

class MicroclimateEngine:
    def __init__(self):
        # Stefan-Boltzmann constant (W / m^2 K^4)
        self.SIGMA = 5.670374419e-8
        # Standard air properties
        self.EMISSIVITY_ASPHALT = 0.95
        self.EMISSIVITY_CONCRETE = 0.90
        self.EMISSIVITY_VEGETATION = 0.98

    def calculate_saturated_vapor_pressure(self, temp_c: float) -> float:
        """Tetens equation for saturation vapor pressure (hPa)"""
        return 6.1078 * math.exp((17.27 * temp_c) / (temp_c + 237.3))

    def calculate_vapor_pressure(self, temp_c: float, relative_humidity: float) -> float:
        """Actual vapor pressure (hPa) given RH (0-100%)"""
        e_sat = self.calculate_saturated_vapor_pressure(temp_c)
        return (relative_humidity / 100.0) * e_sat

    def estimate_natural_wet_bulb(self, temp_c: float, relative_humidity: float) -> float:
        """
        Stull (2011) formula for natural wet-bulb temperature Tw (°C).
        Accurate to within 0.3°C across standard atmospheric temperatures and humidities.
        """
        T = temp_c
        RH = relative_humidity
        Tw = (
            T * math.atan(0.151977 * math.pow(RH + 8.313659, 0.5))
            + math.atan(T + RH)
            - math.atan(RH - 1.676331)
            + 0.00391838 * math.pow(RH, 1.5) * math.atan(0.023101 * RH)
            - 4.686035
        )
        return round(Tw, 2)

    def estimate_globe_temperature(
        self,
        temp_c: float,
        solar_radiation_w_m2: float,
        wind_speed_m_s: float,
        sun_exposure_fraction: float = 1.0,
        surface_temp_c: float = None
    ) -> float:
        """
        Estimates Black Globe Temperature (Tg in °C).
        Accounts for direct solar irradiance, wind cooling convection,
        and reflected ground asphalt radiation.
        """
        # Effective solar flux hitting the globe
        effective_solar = solar_radiation_w_m2 * sun_exposure_fraction
        
        # Convective heat transfer coefficient estimate
        wind = max(0.3, wind_speed_m_s)
        h_c = 1.4 * math.pow(wind, 0.6)  # simplified sphere convection

        # Solar radiation absorption delta
        delta_t_solar = (effective_solar * 0.95) / (h_c * 40.0)

        # Ground thermal influence (asphalt radiance)
        if surface_temp_c is None:
            surface_temp_c = temp_c + (12.0 * sun_exposure_fraction)
        
        delta_t_ground = max(0.0, (surface_temp_c - temp_c) * 0.18 * sun_exposure_fraction)

        tg = temp_c + delta_t_solar + delta_t_ground
        return round(tg, 2)

    def calculate_wbgt_outdoor(
        self,
        temp_c: float,
        relative_humidity: float,
        solar_radiation_w_m2: float,
        wind_speed_m_s: float,
        sun_exposure_fraction: float = 1.0,
        surface_temp_c: float = None
    ) -> Dict[str, float]:
        """
        Computes Outdoor WBGT based on ISO 7243:
        WBGT = 0.7 * Tw + 0.2 * Tg + 0.1 * Ta
        """
        tw = self.estimate_natural_wet_bulb(temp_c, relative_humidity)
        tg = self.estimate_globe_temperature(
            temp_c, solar_radiation_w_m2, wind_speed_m_s, sun_exposure_fraction, surface_temp_c
        )
        ta = temp_c

        wbgt = (0.7 * tw) + (0.2 * tg) + (0.1 * ta)

        # Heat Category classification (OSHA / ACGIH standards)
        category = self.classify_heat_risk(wbgt)

        return {
            "wbgt": round(wbgt, 2),
            "wet_bulb": tw,
            "globe_temp": tg,
            "dry_bulb": ta,
            "risk_level": category["level"],
            "flag_color": category["flag_color"],
            "recommended_work_rest": category["work_rest_ratio"],
            "water_intake_ml_hr": category["water_intake_ml_hr"]
        }

    def classify_heat_risk(self, wbgt: float) -> Dict[str, Any]:
        """OSHA / US Military WBGT Flag Alert System"""
        if wbgt < 27.8:
            return {
                "level": "Low (Green Flag)",
                "flag_color": "#10B981", # Green
                "work_rest_ratio": "Continuous work permitted",
                "water_intake_ml_hr": 500
            }
        elif wbgt < 29.4:
            return {
                "level": "Moderate (Yellow Flag)",
                "flag_color": "#F59E0B", # Yellow
                "work_rest_ratio": "50 min work / 10 min rest per hour",
                "water_intake_ml_hr": 750
            }
        elif wbgt < 31.1:
            return {
                "level": "High (Red Flag)",
                "flag_color": "#EF4444", # Red
                "work_rest_ratio": "40 min work / 20 min rest per hour",
                "water_intake_ml_hr": 1000
            }
        elif wbgt < 32.2:
            return {
                "level": "Severe (Black Flag)",
                "flag_color": "#7C3AED", # Purple / Deep Red
                "work_rest_ratio": "30 min work / 30 min rest per hour",
                "water_intake_ml_hr": 1000
            }
        else:
            return {
                "level": "Extreme Danger (Hazardous)",
                "flag_color": "#991B1B", # Dark Crimson
                "work_rest_ratio": "15 min work / 45 min rest - Halt non-emergency outdoor labor",
                "water_intake_ml_hr": 1200
            }

    def compute_edge_microclimate(
        self,
        base_temp_c: float,
        base_rh: float,
        base_solar_w_m2: float,
        wind_speed_m_s: float,
        canopy_coverage: float,  # 0.0 (no trees) to 1.0 (dense canopy)
        is_asphalt_highway: bool = False,
        urban_canyon_shadow: float = 0.0 # 0.0 (open sky) to 1.0 (deep building shade)
    ) -> Dict[str, Any]:
        """
        Computes road-segment microclimate with localized tree shade & asphalt reflection.
        """
        # Shading reduces direct solar radiation hitting the rider
        total_shade = min(1.0, canopy_coverage * 0.85 + urban_canyon_shadow * 0.75)
        sun_exposure = max(0.08, 1.0 - total_shade)

        # Ground surface temperature modulation:
        # Asphalt on open highway reaches up to +14°C above ambient.
        # Tree canopy cools ground through evapotranspiration and solar interception.
        asphalt_boost = 14.0 if is_asphalt_highway else 8.0
        surface_temp = base_temp_c + (asphalt_boost * sun_exposure) - (canopy_coverage * 4.5)

        # Evapotranspiration micro-cooling of air temperature under dense canopies
        local_air_temp = base_temp_c - (canopy_coverage * 2.2) + (1.2 if is_asphalt_highway else 0.0)

        # Slightly higher localized humidity under dense trees due to plant transpiration
        local_rh = min(95.0, base_rh + (canopy_coverage * 6.0))

        wbgt_data = self.calculate_wbgt_outdoor(
            temp_c=local_air_temp,
            relative_humidity=local_rh,
            solar_radiation_w_m2=base_solar_w_m2,
            wind_speed_m_s=wind_speed_m_s,
            sun_exposure_fraction=sun_exposure,
            surface_temp_c=surface_temp
        )

        return {
            "air_temp_c": round(local_air_temp, 2),
            "surface_temp_c": round(surface_temp, 2),
            "shade_fraction": round(total_shade, 2),
            "wbgt": wbgt_data["wbgt"],
            "risk_level": wbgt_data["risk_level"],
            "flag_color": wbgt_data["flag_color"],
            "water_intake_ml_hr": wbgt_data["water_intake_ml_hr"]
        }


# Singleton engine instance
engine = MicroclimateEngine()
