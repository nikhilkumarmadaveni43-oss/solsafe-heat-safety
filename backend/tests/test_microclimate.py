"""
SolSafe Automated Test Suite
Validates:
1. ISO 7243 WBGT microclimate calculation
2. NetworkX cool-path routing optimization
3. Gig worker biothermal state machine & emergency break triggers
4. Nearest Oasis locator calculations
"""

import pytest
from backend.app.microclimate_engine import engine as microclimate_engine
from backend.app.routing_engine import router as routing_engine
from backend.app.worker_state_machine import WorkerHeatState
from backend.app.oasis_locator import oasis_locator

def test_wbgt_calculation():
    """Verify outdoor WBGT calculation under Delhi summer conditions"""
    res = microclimate_engine.calculate_wbgt_outdoor(
        temp_c=43.0,
        relative_humidity=40.0,
        solar_radiation_w_m2=950.0,
        wind_speed_m_s=1.5,
        sun_exposure_fraction=1.0
    )
    # Stull wet bulb for 43C and 40% RH is typically ~30C
    # Globe temp under direct summer sun is typically > 50C
    # Resulting WBGT will be above 34C (Severe / Extreme danger)
    assert res["wbgt"] > 32.0
    assert "risk_level" in res
    assert res["wet_bulb"] > 25.0
    assert res["globe_temp"] > 43.0

def test_shade_reduces_wbgt():
    """Verify that tree canopy shade effectively lowers microclimate WBGT"""
    sunny_edge = microclimate_engine.compute_edge_microclimate(
        base_temp_c=44.0,
        base_rh=40.0,
        base_solar_w_m2=1000.0,
        wind_speed_m_s=1.5,
        canopy_coverage=0.05,
        is_asphalt_highway=True
    )

    shaded_edge = microclimate_engine.compute_edge_microclimate(
        base_temp_c=44.0,
        base_rh=40.0,
        base_solar_w_m2=1000.0,
        wind_speed_m_s=1.5,
        canopy_coverage=0.85,
        is_asphalt_highway=False
    )

    # Shaded avenue must have lower WBGT and significantly lower surface temperature
    assert shaded_edge["wbgt"] < sunny_edge["wbgt"]
    assert shaded_edge["surface_temp_c"] < sunny_edge["surface_temp_c"]
    assert (sunny_edge["surface_temp_c"] - shaded_edge["surface_temp_c"]) >= 5.0

def test_dual_routing_engine():
    """Verify standard fastest route vs SolSafe cool route pathfinding"""
    res = routing_engine.compute_dual_routes(
        origin_id="N1",
        destination_id="N3"
    )
    assert "routes" in res
    standard = res["routes"]["standard"]
    cool = res["routes"]["cool"]

    # Cool route must have higher average shade percentage than the asphalt standard route
    assert cool["avg_shade_pct"] > standard["avg_shade_pct"]
    # Cool route must have lower average WBGT
    assert cool["avg_wbgt_c"] <= standard["avg_wbgt_c"]
    # Heat dose index of cool route should be lower
    assert cool["heat_dose_index"] < standard["heat_dose_index"]

def test_worker_state_machine_heat_accumulation():
    """Verify rider biometrics increase with exposure and trigger mandatory heat break"""
    worker = WorkerHeatState(worker_id="TEST_001", name="Test Rider")
    assert worker.status == "DELIVERING_ACTIVE"
    assert worker.orders_paused is False

    # Simulate 95 minutes of severe heat exposure
    for _ in range(95):
        worker.update_tick(ambient_wbgt=39.5, shade_fraction=0.1, dt_mins=1.0)

    # Continuous sun exposure reached 95 >= 90 min threshold
    assert worker.status == "MANDATORY_HEAT_BREAK"
    assert worker.orders_paused is True
    assert worker.pause_remaining_mins == 15.0

def test_oasis_locator_finds_nearest():
    """Verify haversine distance calculation and shelter matching"""
    # Point near Central Park
    res = oasis_locator.find_nearest_oasis(lat=28.6325, lon=77.2195)
    assert res["nearest"] is not None
    assert "distance_m" in res["nearest"]
    assert "facilities" in res["nearest"]
    assert res["nearest"]["distance_m"] < 500

def test_hyderabad_bike_routing():
    """Verify Hyderabad Cyberabad to Jubilee Hills cool bike routing"""
    res = routing_engine.compute_dual_routes(
        city="hyderabad",
        origin_id="HYD_1",
        destination_id="HYD_7"
    )
    assert res["city"] == "hyderabad"
    standard = res["routes"]["standard"]
    cool = res["routes"]["cool"]

    # Cool bike route must achieve lower average WBGT than the scorching Cable Bridge flyover route
    assert cool["avg_wbgt_c"] < standard["avg_wbgt_c"]
    assert cool["avg_shade_pct"] > standard["avg_shade_pct"]
    assert cool["heat_dose_index"] < standard["heat_dose_index"]

def test_hyderabad_oases():
    """Verify Hyderabad oases match accurately around Inorbit & Hitec City"""
    res = oasis_locator.find_nearest_oasis(lat=17.4475, lon=78.3785)
    assert res["nearest"] is not None
    assert "Hitec City" in res["nearest"]["name"] or "Underground" in res["nearest"]["name"]
    assert res["nearest"]["distance_m"] < 200

def test_rider_fleet_manager():
    """Verify rider fleet rotation across multiple gig workers"""
    from backend.app.worker_state_machine import fleet_manager
    fleet = fleet_manager.get_fleet_summary()
    assert len(fleet) >= 5
    names = [r["name"] for r in fleet]
    assert "Rahul Sharma" in names
    assert "Priya Reddy" in names
    assert "Mohammed Imran" in names

    # Test rotation
    first = fleet_manager.active_rider.worker_id
    next_rider = fleet_manager.rotate_to_next_rider()
    assert next_rider.worker_id != first

def test_arbitrary_source_destination_routes():
    """Verify routing between arbitrary user-selected Source and Destination in Hyderabad"""
    res = routing_engine.compute_dual_routes(
        city="hyderabad",
        origin_id="HYD_2", # Hitec City Metro
        destination_id="HYD_11" # KBR National Park
    )
    assert res["origin"]["id"] == "HYD_2"
    assert res["destination"]["id"] == "HYD_11"
    assert len(res["routes"]["cool"]["coordinates"]) > 2
    assert res["routes"]["cool"]["avg_shade_pct"] >= res["routes"]["standard"]["avg_shade_pct"]
