package com.solsafe.heatsafety;

import com.solsafe.heatsafety.model.CoolOasis;
import com.solsafe.heatsafety.model.RiderState;
import com.solsafe.heatsafety.model.RoadEdge;
import com.solsafe.heatsafety.model.RouteRequest;
import com.solsafe.heatsafety.service.MicroclimateService;
import com.solsafe.heatsafety.service.OasisLocatorService;
import com.solsafe.heatsafety.service.RiderFleetService;
import com.solsafe.heatsafety.service.RoutingService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * JUnit 5 Integration & Unit Tests for SolSafe Java Spring Boot Backend.
 */
@SpringBootTest
class SolSafeApplicationTests {

    @Autowired
    private MicroclimateService microclimateService;

    @Autowired
    private OasisLocatorService oasisLocatorService;

    @Autowired
    private RoutingService routingService;

    @Autowired
    private RiderFleetService riderFleetService;

    @Test
    void testIso7243WbgtAndShadeReduction() {
        RoadEdge exposedHighway = new RoadEdge();
        exposedHighway.setTree_canopy_pct(0.05);
        exposedHighway.setBuilding_hw_ratio(0.3);
        exposedHighway.setOrientation_deg(90.0);
        exposedHighway.setAlbedo(0.10);

        RoadEdge shadedAvenue = new RoadEdge();
        shadedAvenue.setTree_canopy_pct(0.75);
        shadedAvenue.setBuilding_hw_ratio(1.8);
        shadedAvenue.setOrientation_deg(45.0);
        shadedAvenue.setAlbedo(0.28);

        microclimateService.evaluateEdgeMicroclimate(exposedHighway, 40.0, 45.0, 1.5, 14.0);
        microclimateService.evaluateEdgeMicroclimate(shadedAvenue, 40.0, 45.0, 1.5, 14.0);

        assertTrue(shadedAvenue.getEffective_shade_pct() > exposedHighway.getEffective_shade_pct(),
                "Shaded avenue must have higher effective shade percentage than exposed highway");
        assertTrue(shadedAvenue.getLocal_wbgt_c() < exposedHighway.getLocal_wbgt_c(),
                "Shaded avenue must yield lower WBGT (°C) than exposed asphalt highway");
    }

    @Test
    void testDijkstraThermalAwareRoutingReducesHeatDose() {
        RouteRequest req = new RouteRequest();
        req.setCity("hyderabad");
        req.setStart_node("HYD_1");
        req.setEnd_node("HYD_9");
        req.setAlpha(0.75);
        req.setAmbient_temp_c(41.0);
        req.setRelative_humidity(45.0);
        req.setWind_speed_ms(1.5);
        req.setHour_of_day(14.0);

        Map<String, Object> result = routingService.computeDualRoutes(req);
        assertNotNull(result.get("fastest_route"));
        assertNotNull(result.get("solsafe_route"));

        @SuppressWarnings("unchecked")
        Map<String, Object> comparison = (Map<String, Object>) result.get("comparison");
        assertTrue((double) comparison.get("wbgt_delta_c") >= 0.0,
                "SolSafe Cool Bike Route must have equal or lower average WBGT than fastest route");
    }

    @Test
    void testCoolOasisHaversineSorting() {
        List<CoolOasis> oases = oasisLocatorService.getOases("hyderabad", 17.4504, 78.3811);
        assertFalse(oases.isEmpty(), "Hyderabad Cool Oases dataset should not be empty");
        if (oases.size() >= 2) {
            assertTrue(oases.get(0).getDistance_m() <= oases.get(1).getDistance_m(),
                    "Cool Oases must be sorted ascending by Haversine distance in meters");
        }
    }

    @Test
    void testRiderDigitalTwinPsiProgressionAndOrderRotation() {
        RiderState before = riderFleetService.getActiveRider();
        String initialOrder = before.getActive_order_id();

        Map<String, Object> nextOrder = riderFleetService.generateNextOrder();
        assertNotNull(nextOrder.get("order"));
        assertNotEquals(initialOrder, riderFleetService.getActiveRider().getActive_order_id(),
                "New order dispatch must rotate to a distinct order ID");

        RiderState cooled = riderFleetService.triggerCoolOasisBreak();
        assertEquals("COOL_OASIS_BREAK", cooled.getStatus());
    }
}
