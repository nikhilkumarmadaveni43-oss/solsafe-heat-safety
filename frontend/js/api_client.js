/**
 * SolSafe REST & Always-On Autonomous Edge API Client
 * Seamlessly connects to the FastAPI backend when available, and automatically
 * switches to the built-in Client-Side Microclimate & Routing Engine on GitHub Pages,
 * static web hosts, or offline mobile browsers so APIs are ALWAYS ON 24/7.
 */

const EMBEDDED_NETWORKS = {
  hyderabad: {
    city: "Hyderabad - Cyberabad & Hitec City Tech Corridor",
    city_key: "hyderabad",
    center: [17.4435, 78.3850],
    default_zoom: 14,
    nodes: [
      { id: "HYD_1", name: "Cyber Towers Junction (Pickup Hub)", lat: 17.4504, lon: 78.3811 },
      { id: "HYD_2", name: "Hitec City Metro Station", lat: 17.4475, lon: 78.3785 },
      { id: "HYD_3", name: "Mindspace Tech Park Main Gate", lat: 17.4410, lon: 78.3815 },
      { id: "HYD_4", name: "Inorbit Mall Junction", lat: 17.4355, lon: 78.3850 },
      { id: "HYD_5", name: "Durgam Cheruvu Bridge West Ramp", lat: 17.4370, lon: 78.3910 },
      { id: "HYD_6", name: "Durgam Cheruvu Bridge East Overpass", lat: 17.4385, lon: 78.4015 },
      { id: "HYD_7", name: "Jubilee Hills Road No. 36 (Delivery Drop)", lat: 17.4390, lon: 78.4090 },
      { id: "HYD_8", name: "Madhapur Shaded Boulevard", lat: 17.4440, lon: 78.3915 },
      { id: "HYD_9", name: "Ayyappa Society Neem Canopy Way", lat: 17.4485, lon: 78.3955 },
      { id: "HYD_10", name: "Jubilee Hills Road 45 Shaded Avenue", lat: 17.4340, lon: 78.4110 },
      { id: "HYD_11", name: "KBR National Park Eco Corridor", lat: 17.4260, lon: 78.4190 },
      { id: "HYD_12", name: "Bio-Diversity Junction (Gachibowli Link)", lat: 17.4280, lon: 78.3770 }
    ],
    edges: [
      { id: "HE1", u: "HYD_1", v: "HYD_3", name: "Hitec City 6-Lane Concrete Expressway", distance_m: 1100, speed_limit_kmh: 50, canopy_coverage: 0.05, is_asphalt_highway: true, is_elevated_flyover: false, urban_canyon_shadow: 0.05 },
      { id: "HE2", u: "HYD_3", v: "HYD_4", name: "Mindspace-Inorbit Arterial Corridor", distance_m: 750, speed_limit_kmh: 45, canopy_coverage: 0.10, is_asphalt_highway: true, is_elevated_flyover: false, urban_canyon_shadow: 0.10 },
      { id: "HE3", u: "HYD_4", v: "HYD_5", name: "Cable Bridge Approach Road", distance_m: 650, speed_limit_kmh: 45, canopy_coverage: 0.08, is_asphalt_highway: true, is_elevated_flyover: false, urban_canyon_shadow: 0.05 },
      { id: "HE4", u: "HYD_5", v: "HYD_6", name: "Durgam Cheruvu Concrete Cable Bridge (Elevated Flyover)", distance_m: 1200, speed_limit_kmh: 55, canopy_coverage: 0.00, is_asphalt_highway: true, is_elevated_flyover: true, urban_canyon_shadow: 0.00 },
      { id: "HE5", u: "HYD_6", v: "HYD_7", name: "Jubilee Hills Road 36 Flyover Ramp", distance_m: 800, speed_limit_kmh: 45, canopy_coverage: 0.12, is_asphalt_highway: true, is_elevated_flyover: false, urban_canyon_shadow: 0.10 },
      { id: "HE6", u: "HYD_1", v: "HYD_2", name: "Hitec Metro Shaded Under-Deck Corridor", distance_m: 450, speed_limit_kmh: 30, canopy_coverage: 0.70, is_asphalt_highway: false, is_elevated_flyover: false, urban_canyon_shadow: 0.65 },
      { id: "HE7", u: "HYD_2", v: "HYD_8", name: "Madhapur Tree-Lined Service Lane", distance_m: 820, speed_limit_kmh: 30, canopy_coverage: 0.78, is_asphalt_highway: false, is_elevated_flyover: false, urban_canyon_shadow: 0.45 },
      { id: "HE8", u: "HYD_8", v: "HYD_9", name: "Ayyappa Society Dense Neem Canopy Lane", distance_m: 620, speed_limit_kmh: 28, canopy_coverage: 0.88, is_asphalt_highway: false, is_elevated_flyover: false, urban_canyon_shadow: 0.50 },
      { id: "HE9", u: "HYD_9", v: "HYD_7", name: "Jubilee Hills Shaded Eco Boulevard", distance_m: 1350, speed_limit_kmh: 35, canopy_coverage: 0.85, is_asphalt_highway: false, is_elevated_flyover: false, urban_canyon_shadow: 0.55 },
      { id: "HE10", u: "HYD_7", v: "HYD_10", name: "Jubilee Hills Road 45 Shaded Tree Link", distance_m: 700, speed_limit_kmh: 35, canopy_coverage: 0.82, is_asphalt_highway: false, is_elevated_flyover: false, urban_canyon_shadow: 0.40 },
      { id: "HE11", u: "HYD_10", v: "HYD_11", name: "KBR National Park Shaded Outer Ring", distance_m: 1200, speed_limit_kmh: 35, canopy_coverage: 0.95, is_asphalt_highway: false, is_elevated_flyover: false, urban_canyon_shadow: 0.60 },
      { id: "HE12", u: "HYD_4", v: "HYD_12", name: "Inorbit to Bio-Diversity Arterial", distance_m: 1150, speed_limit_kmh: 45, canopy_coverage: 0.20, is_asphalt_highway: true, is_elevated_flyover: false, urban_canyon_shadow: 0.15 }
    ]
  },
  delhi: {
    city: "New Delhi - Central Urban Core",
    city_key: "delhi",
    center: [28.6315, 77.2195],
    default_zoom: 15,
    nodes: [
      { id: "N1", name: "CP Radial 1 (Minto Bridge)", lat: 28.6380, lon: 77.2240 },
      { id: "N2", name: "Outer Circle East (Barakhamba Rd)", lat: 28.6335, lon: 77.2255 },
      { id: "N3", name: "Tolstoy Marg Junction", lat: 28.6275, lon: 77.2260 },
      { id: "N4", name: "Janpath Central Plaza", lat: 28.6270, lon: 77.2190 },
      { id: "N5", name: "Inner Circle South (Regal)", lat: 28.6310, lon: 77.2185 },
      { id: "N6", name: "Inner Circle North (Odeon)", lat: 28.6345, lon: 77.2190 },
      { id: "N7", name: "Outer Circle West (Baba Kharak Singh)", lat: 28.6325, lon: 77.2120 },
      { id: "N8", name: "Ashoka Road Green Canopy", lat: 28.6240, lon: 77.2140 },
      { id: "N9", name: "Windsor Place Roundabout", lat: 28.6210, lon: 77.2180 },
      { id: "N10", name: "Kasturba Gandhi Marg Crossing", lat: 28.6250, lon: 77.2235 },
      { id: "N11", name: "Mandi House Cultural Hub", lat: 28.6260, lon: 77.2330 },
      { id: "N12", name: "Barakhamba Highway Overpass", lat: 28.6360, lon: 77.2310 }
    ],
    edges: [
      { id: "E1", u: "N1", v: "N12", name: "Barakhamba 6-Lane Concrete Expressway", distance_m: 850, speed_limit_kmh: 50, canopy_coverage: 0.05, is_asphalt_highway: true, is_elevated_flyover: false, urban_canyon_shadow: 0.05 },
      { id: "E2", u: "N12", v: "N11", name: "Mandi House Arterial Highway", distance_m: 1150, speed_limit_kmh: 50, canopy_coverage: 0.08, is_asphalt_highway: true, is_elevated_flyover: false, urban_canyon_shadow: 0.10 },
      { id: "E3", u: "N11", v: "N3", name: "Ferozeshah Road Open Corridor", distance_m: 800, speed_limit_kmh: 45, canopy_coverage: 0.15, is_asphalt_highway: true, is_elevated_flyover: false, urban_canyon_shadow: 0.10 },
      { id: "E4", u: "N1", v: "N6", name: "Radial Road Shaded Connector", distance_m: 550, speed_limit_kmh: 30, canopy_coverage: 0.55, is_asphalt_highway: false, is_elevated_flyover: false, urban_canyon_shadow: 0.40 },
      { id: "E5", u: "N6", v: "N5", name: "Central Park Shaded Perimeter", distance_m: 420, speed_limit_kmh: 25, canopy_coverage: 0.85, is_asphalt_highway: false, is_elevated_flyover: false, urban_canyon_shadow: 0.50 },
      { id: "E6", u: "N5", v: "N4", name: "Janpath Heritage Tree Avenue", distance_m: 460, speed_limit_kmh: 30, canopy_coverage: 0.80, is_asphalt_highway: false, is_elevated_flyover: false, urban_canyon_shadow: 0.60 },
      { id: "E7", u: "N4", v: "N10", name: "Tolstoy Marg Shaded Boulevard", distance_m: 500, speed_limit_kmh: 35, canopy_coverage: 0.75, is_asphalt_highway: false, is_elevated_flyover: false, urban_canyon_shadow: 0.45 },
      { id: "E8", u: "N10", v: "N3", name: "KG Marg Shaded Alley", distance_m: 350, speed_limit_kmh: 30, canopy_coverage: 0.70, is_asphalt_highway: false, is_elevated_flyover: false, urban_canyon_shadow: 0.50 },
      { id: "E9", u: "N4", v: "N9", name: "Janpath South Tree Canopy", distance_m: 680, speed_limit_kmh: 35, canopy_coverage: 0.85, is_asphalt_highway: false, is_elevated_flyover: false, urban_canyon_shadow: 0.40 },
      { id: "E10", u: "N9", v: "N10", name: "Ashoka-KG Tree Link", distance_m: 620, speed_limit_kmh: 35, canopy_coverage: 0.78, is_asphalt_highway: false, is_elevated_flyover: false, urban_canyon_shadow: 0.35 },
      { id: "E11", u: "N6", v: "N7", name: "Connaught Outer West Shaded Corridor", distance_m: 690, speed_limit_kmh: 30, canopy_coverage: 0.65, is_asphalt_highway: false, is_elevated_flyover: false, urban_canyon_shadow: 0.30 },
      { id: "E12", u: "N7", v: "N8", name: "Baba Kharak Singh Neem Avenue", distance_m: 980, speed_limit_kmh: 40, canopy_coverage: 0.82, is_asphalt_highway: false, is_elevated_flyover: false, urban_canyon_shadow: 0.45 },
      { id: "E13", u: "N8", v: "N9", name: "Ashoka Road Dense Canopy Corridor", distance_m: 520, speed_limit_kmh: 35, canopy_coverage: 0.90, is_asphalt_highway: false, is_elevated_flyover: false, urban_canyon_shadow: 0.50 },
      { id: "E14", u: "N6", v: "N2", name: "Outer Circle East Link", distance_m: 650, speed_limit_kmh: 40, canopy_coverage: 0.25, is_asphalt_highway: true, is_elevated_flyover: false, urban_canyon_shadow: 0.15 },
      { id: "E15", u: "N2", v: "N3", name: "Barakhamba South Commercial Arterial", distance_m: 700, speed_limit_kmh: 45, canopy_coverage: 0.12, is_asphalt_highway: true, is_elevated_flyover: false, urban_canyon_shadow: 0.10 }
    ]
  }
};

const EMBEDDED_OASES = {
  hyderabad: [
    {
      id: "HYD_OASIS_1",
      city: "hyderabad",
      name: "Hitec City Metro Station (Underground AC Zone)",
      type: "Metro Subway Cooling Hub",
      lat: 17.4475,
      lon: 78.3785,
      facilities: ["Air Conditioned Concourse", "Free RO Chilled Water", "Resting Benches", "Mobile Charging", "First Aid"],
      capacity: 60,
      current_occupancy: 15,
      indoor_temp_c: 23.5
    },
    {
      id: "HYD_OASIS_2",
      city: "hyderabad",
      name: "Inorbit Mall AC Delivery Rider Lounge",
      type: "Partner Mall Heat Oasis",
      lat: 17.4358,
      lon: 78.3855,
      facilities: ["Free Water ATM", "AC Rider Rest Lounge", "Free ORS Electrolytes", "Dedicated Bike Shaded Parking"],
      capacity: 45,
      current_occupancy: 21,
      indoor_temp_c: 22.0
    },
    {
      id: "HYD_OASIS_3",
      city: "hyderabad",
      name: "Chai Point Madhapur Heat Relief Oasis",
      type: "Partner Food Hub",
      lat: 17.4442,
      lon: 78.3918,
      facilities: ["Chilled RO Water Dispenser", "Air Conditioned Seating", "Electrolyte Packets", "Washroom Access"],
      capacity: 25,
      current_occupancy: 8,
      indoor_temp_c: 24.0
    },
    {
      id: "HYD_OASIS_4",
      city: "hyderabad",
      name: "KBR National Park Neem Canopy Eco-Shelter",
      type: "Natural Microclimate Oasis",
      lat: 17.4265,
      lon: 78.4195,
      facilities: ["100% Tree Canopy Shade", "High-Pressure Water Misters", "Public Drinking Water Post", "Seated Pavilion"],
      capacity: 40,
      current_occupancy: 11,
      indoor_temp_c: 29.5
    },
    {
      id: "HYD_OASIS_5",
      city: "hyderabad",
      name: "T-Hub Phase 2 Gig Safety Hub",
      type: "Innovation Hub Worker Station",
      lat: 17.4395,
      lon: 78.3820,
      facilities: ["Evaporative Desert Coolers", "Cold Mineral Water", "Heatstroke Emergency Kit", "ORS Sachets"],
      capacity: 30,
      current_occupancy: 7,
      indoor_temp_c: 25.0
    }
  ],
  delhi: [
    {
      id: "OASIS_1",
      city: "delhi",
      name: "Central Park Metro Concourse (AC Zone)",
      type: "Subway Cooling Hub",
      lat: 28.6328,
      lon: 77.2195,
      facilities: ["Air Conditioned", "Free RO Chilled Water", "Resting Benches", "First Aid"],
      capacity: 50,
      current_occupancy: 12,
      indoor_temp_c: 24.5
    },
    {
      id: "OASIS_2",
      city: "delhi",
      name: "Chaayos Heat Relief Partner Lounge",
      type: "Partner Restaurant Hub",
      lat: 28.6295,
      lon: 77.2210,
      facilities: ["Free Water ATM", "AC Rider Lounge", "Phone Charging", "Electrolytes (ORS)"],
      capacity: 20,
      current_occupancy: 6,
      indoor_temp_c: 23.0
    },
    {
      id: "OASIS_3",
      city: "delhi",
      name: "Janpath Shaded Public Grove & Misting Station",
      type: "High-Canopy Eco Shelter",
      lat: 28.6272,
      lon: 77.2192,
      facilities: ["Tree Canopy Shade", "High-Pressure Water Misters", "Drinking Water Kiosk"],
      capacity: 35,
      current_occupancy: 14,
      indoor_temp_c: 31.0
    },
    {
      id: "OASIS_4",
      city: "delhi",
      name: "Barakhamba Zomato/Swiggy Rider Oasis",
      type: "Dedicated Delivery Hub",
      lat: 28.6320,
      lon: 77.2250,
      facilities: ["Evaporative Desert Coolers", "Cold Water Dispenser", "Electrolyte Packets", "Shaded Parking"],
      capacity: 40,
      current_occupancy: 18,
      indoor_temp_c: 26.5
    },
    {
      id: "OASIS_5",
      city: "delhi",
      name: "Windsor Place Heritage Neem Canopy Shelter",
      type: "Natural Microclimate Oasis",
      lat: 28.6215,
      lon: 77.2182,
      facilities: ["100% Tree Canopy", "Public Water Post", "Seating"],
      capacity: 25,
      current_occupancy: 4,
      indoor_temp_c: 32.2
    }
  ]
};

class SolSafeEmbeddedEngine {
  constructor() {
    this.riderOrder = ["RIDER_104", "RIDER_219", "RIDER_308", "RIDER_412", "RIDER_505"];
    this.currentRiderId = "RIDER_104";
    this.riders = {
      RIDER_104: this._createRider("RIDER_104", "Rahul Sharma", 28, "TVS Apache RTR 160", "motorcycle", "R", 25.0, 37.1, 92.0),
      RIDER_219: this._createRider("RIDER_219", "Priya Reddy", 24, "Ather 450X EV Scooter", "scooter", "P", 68.0, 37.6, 65.0),
      RIDER_308: this._createRider("RIDER_308", "Mohammed Imran", 33, "Hero Splendor Plus", "motorcycle", "M", 82.0, 38.2, 46.0),
      RIDER_412: this._createRider("RIDER_412", "Kavitha Rao", 29, "Honda Activa 6G", "scooter", "K", 42.0, 37.3, 86.0),
      RIDER_505: this._createRider("RIDER_505", "Suresh Kumar", 35, "Bajaj Pulsar 150", "motorcycle", "S", 8.0, 37.0, 98.0)
    };
  }

  _createRider(id, name, age, vehicle, vehicleType, avatarLetter, expMins, coreTemp, hydration) {
    const psi = Math.max(0, Math.min(10, Number(((coreTemp - 36.8) * 3.2).toFixed(2))));
    return {
      worker_id: id,
      name,
      age,
      vehicle,
      vehicle_type: vehicleType,
      avatar_letter: avatarLetter,
      platform: "Zomato",
      status: "DELIVERING_ACTIVE",
      core_temp_c: coreTemp,
      heart_rate_bpm: Math.round(74 + (coreTemp - 36.8) * 38),
      hydration_pct: hydration,
      consecutive_exposure_mins: expMins,
      psi: psi,
      strain_label: psi >= 7 ? "Critical Heat Danger" : psi >= 4.5 ? "Moderate Strain" : "Normal / Safe",
      strain_color: psi >= 7 ? "#7C3AED" : psi >= 4.5 ? "#F59E0B" : "#10B981",
      orders_paused: false,
      pause_remaining_mins: 0
    };
  }

  getNetwork(city = "hyderabad") {
    const key = (city || "hyderabad").toLowerCase();
    return EMBEDDED_NETWORKS[key] || EMBEDDED_NETWORKS.hyderabad;
  }

  getOases(city = "hyderabad") {
    const key = (city || "hyderabad").toLowerCase();
    return EMBEDDED_OASES[key] || EMBEDDED_OASES.hyderabad;
  }

  getSatelliteLayer(city = "hyderabad") {
    const target = (city || "hyderabad").toLowerCase();
    const grid = [];

    if (target === "hyderabad") {
      const centerLat = 17.4435, centerLon = 78.3850;
      const latStep = 0.0035, lonStep = 0.0040;
      for (let i = -3; i <= 3; i++) {
        for (let j = -3; j <= 3; j++) {
          const ptLat = Number((centerLat + i * latStep).toFixed(5));
          const ptLon = Number((centerLon + j * lonStep).toFixed(5));
          let ndvi = 0.28, lst = 44.2, zone = "Madhapur Mixed Urban Tech Corridor";
          if (j < -1 || (i >= 0 && j <= 0)) {
            ndvi = 0.06; lst = 53.8; zone = "Cyber Towers & Concrete Flyover Heat Island";
          } else if (i <= -1 && j >= 1) {
            ndvi = 0.88; lst = 35.6; zone = "Jubilee Hills & KBR Park Shaded Eco-Corridor";
          } else if (i >= 1 && j >= 1) {
            ndvi = 0.72; lst = 37.8; zone = "Ayyappa Society Neem Canopy Belt";
          }
          grid.push({
            lat: ptLat,
            lon: ptLon,
            land_surface_temp_c: lst,
            ndvi_canopy_index: ndvi,
            zone_type: zone,
            intensity: Number(((lst - 35.0) / 20.0).toFixed(2))
          });
        }
      }
      return { city: "hyderabad", bbox: [17.4200, 78.3650, 17.4600, 78.4250], grid };
    } else {
      const centerLat = 28.6315, centerLon = 77.2195;
      const step = 0.003;
      for (let i = -3; i <= 3; i++) {
        for (let j = -3; j <= 3; j++) {
          const ptLat = Number((centerLat + i * step).toFixed(5));
          const ptLon = Number((centerLon + j * step).toFixed(5));
          let ndvi = 0.35, lst = 43.4, zone = "Commercial Urban Street";
          if (j >= 1) {
            ndvi = 0.08; lst = 51.5; zone = "Concrete Highway Heat Island";
          } else if (Math.abs(i) <= 1 && Math.abs(j) <= 1) {
            ndvi = 0.82; lst = 36.2; zone = "Central Park & Janpath Canopy";
          }
          grid.push({
            lat: ptLat,
            lon: ptLon,
            land_surface_temp_c: lst,
            ndvi_canopy_index: ndvi,
            zone_type: zone,
            intensity: Number(((lst - 35.0) / 18.0).toFixed(2))
          });
        }
      }
      return { city: "delhi", bbox: [28.6200, 77.2080, 28.6420, 77.2320], grid };
    }
  }

  _computeEdgeMicroclimate(baseTemp, baseRh, baseSolar, windSpeed, edge) {
    const canopy = edge.canopy_coverage || 0;
    const canyon = edge.urban_canyon_shadow || 0;
    const isHighway = !!edge.is_asphalt_highway;
    const isFlyover = !!edge.is_elevated_flyover;

    const totalShade = Math.min(1.0, canopy * 0.85 + canyon * 0.75);
    const sunExposure = Math.max(0.08, 1.0 - totalShade);

    const asphaltBoost = isHighway ? 14.0 : 8.0;
    let surfaceTemp = baseTemp + (asphaltBoost * sunExposure) - (canopy * 4.5);
    const localAir = baseTemp - (canopy * 2.2) + (isHighway ? 1.2 : 0.0);
    const localRh = Math.min(95.0, baseRh + (canopy * 6.0));

    // Stull wet-bulb approximation
    const T = localAir, RH = localRh;
    const tw = T * Math.atan(0.151977 * Math.pow(RH + 8.313659, 0.5))
      + Math.atan(T + RH)
      - Math.atan(RH - 1.676331)
      + 0.00391838 * Math.pow(RH, 1.5) * Math.atan(0.023101 * RH)
      - 4.686035;

    const effSolar = baseSolar * sunExposure;
    const hc = 1.4 * Math.pow(Math.max(0.3, windSpeed), 0.6);
    const dTSolar = (effSolar * 0.95) / (hc * 40.0);
    const dTGround = Math.max(0.0, (surfaceTemp - localAir) * 0.18 * sunExposure);
    const tg = localAir + dTSolar + dTGround;

    let wbgt = (0.7 * tw) + (0.2 * tg) + (0.1 * localAir);
    if (isFlyover) {
      wbgt += 1.8;
      surfaceTemp += 3.0;
    }

    wbgt = Number(wbgt.toFixed(2));
    surfaceTemp = Number(surfaceTemp.toFixed(2));

    let riskLevel = "Extreme Danger (Hazardous)";
    let flagColor = "#991B1B";
    if (isFlyover) {
      riskLevel = "Extreme Danger (Flyover Heat Trap)";
      flagColor = "#991B1B";
    } else if (wbgt < 27.8) {
      riskLevel = "Low (Green Flag)"; flagColor = "#10B981";
    } else if (wbgt < 29.4) {
      riskLevel = "Moderate (Yellow Flag)"; flagColor = "#F59E0B";
    } else if (wbgt < 31.1) {
      riskLevel = "High (Red Flag)"; flagColor = "#EF4444";
    } else if (wbgt < 32.2) {
      riskLevel = "Severe (Black Flag)"; flagColor = "#7C3AED";
    }

    const speedMs = ((edge.speed_limit_kmh || 35) * 1000.0) / 3600.0;
    const travelTimeSec = edge.distance_m / speedMs;

    const wbgtExcess = Math.max(0.0, wbgt - 27.5);
    const thermalPenalty = Math.pow(wbgtExcess / 6.0, 2.2);
    const shadeBonus = totalShade * 0.75;
    let coolMult = 1.0 + (3.2 * thermalPenalty) - shadeBonus;
    if (isFlyover) coolMult *= 2.2;
    coolMult = Math.max(0.35, coolMult);

    return {
      wbgt,
      surface_temp_c: surfaceTemp,
      shade_fraction: Number(totalShade.toFixed(2)),
      risk_level: riskLevel,
      flag_color: flagColor,
      travel_time_sec: travelTimeSec,
      fast_weight: travelTimeSec,
      cool_weight: travelTimeSec * coolMult
    };
  }

  _shortestPath(nodes, weightedEdges, sourceId, targetId, weightKey) {
    const dist = {};
    const prev = {};
    const unvisited = new Set();

    nodes.forEach(n => {
      dist[n.id] = Infinity;
      prev[n.id] = null;
      unvisited.add(n.id);
    });
    dist[sourceId] = 0;

    while (unvisited.size > 0) {
      let u = null;
      let bestD = Infinity;
      unvisited.forEach(id => {
        if (dist[id] < bestD) {
          bestD = dist[id];
          u = id;
        }
      });

      if (u === null || u === targetId || bestD === Infinity) break;
      unvisited.delete(u);

      weightedEdges.forEach(e => {
        if (e.u === u || e.v === u) {
          const nbr = e.u === u ? e.v : e.u;
          if (unvisited.has(nbr)) {
            const alt = dist[u] + e[weightKey];
            if (alt < dist[nbr]) {
              dist[nbr] = alt;
              prev[nbr] = { node: u, edge: e };
            }
          }
        }
      });
    }

    const pathNodes = [];
    const pathEdges = [];
    let curr = targetId;
    while (curr && prev[curr]) {
      pathNodes.unshift(curr);
      pathEdges.unshift(prev[curr].edge);
      curr = prev[curr].node;
    }
    pathNodes.unshift(sourceId);
    return { pathNodes, pathEdges };
  }

  _buildRouteStats(pathNodes, pathEdges, nodeMap) {
    const coords = [];
    const segments = [];
    let totalDistM = 0, totalTimeSec = 0;
    const wbgts = [], shades = [], surfs = [];

    for (let i = 0; i < pathEdges.length; i++) {
      const e = pathEdges[i];
      const nU = nodeMap[pathNodes[i]];
      const nV = nodeMap[pathNodes[i + 1]];
      if (i === 0 && nU) coords.push([nU.lat, nU.lon]);
      if (nV) coords.push([nV.lat, nV.lon]);

      totalDistM += e.distance_m;
      totalTimeSec += e.travel_time_sec;
      wbgts.push(e.wbgt);
      shades.push(e.shade_fraction);
      surfs.push(e.surface_temp_c);

      segments.push({
        road_name: e.name,
        distance_m: e.distance_m,
        wbgt: e.wbgt,
        surface_temp_c: e.surface_temp_c,
        shade_pct: Math.round(e.shade_fraction * 100),
        is_elevated_flyover: !!e.is_elevated_flyover,
        risk_level: e.risk_level,
        flag_color: e.flag_color
      });
    }

    const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    const avgWbgt = Number(avg(wbgts).toFixed(1));
    const maxWbgt = Number((wbgts.length ? Math.max(...wbgts) : 0).toFixed(1));
    const avgShade = Number((avg(shades) * 100).toFixed(1));
    const avgSurf = Number(avg(surfs).toFixed(1));

    let totalDose = 0;
    segments.forEach(seg => {
      const wDelta = Math.max(0.0, seg.wbgt - 27.0);
      const sFactor = Math.max(0.15, 1.0 - 0.75 * (seg.shade_pct / 100.0));
      const segHr = (seg.distance_m / 10.0) / 3600.0;
      totalDose += Math.pow(wDelta, 1.8) * sFactor * segHr;
    });

    return {
      path_nodes: pathNodes,
      coordinates: coords,
      total_distance_m: Number(totalDistM.toFixed(1)),
      total_distance_km: Number((totalDistM / 1000.0).toFixed(2)),
      estimated_time_mins: Number((totalTimeSec / 60.0).toFixed(1)),
      avg_wbgt_c: avgWbgt,
      max_wbgt_c: maxWbgt,
      avg_surface_temp_c: avgSurf,
      avg_shade_pct: avgShade,
      heat_dose_index: Number(totalDose.toFixed(2)),
      segments
    };
  }

  computeRoutes(weatherParams = {}, city = "hyderabad") {
    let targetCity = (city || "hyderabad").toLowerCase();
    if (weatherParams.origin_id && weatherParams.origin_id.startsWith("N")) targetCity = "delhi";
    if (weatherParams.origin_id && weatherParams.origin_id.startsWith("HYD")) targetCity = "hyderabad";

    const net = this.getNetwork(targetCity);
    const nodeMap = {};
    net.nodes.forEach(n => nodeMap[n.id] = n);

    const origin = (weatherParams.origin_id && nodeMap[weatherParams.origin_id])
      ? weatherParams.origin_id
      : (targetCity === "hyderabad" ? "HYD_1" : "N1");
    const dest = (weatherParams.destination_id && nodeMap[weatherParams.destination_id] && weatherParams.destination_id !== origin)
      ? weatherParams.destination_id
      : (targetCity === "hyderabad" ? "HYD_7" : "N3");

    const baseTemp = Number(weatherParams.temp || weatherParams.base_temp_c || 44.0);
    const baseRh = Number(weatherParams.rh || weatherParams.base_rh || 42.0);
    const baseSolar = Number(weatherParams.solar || weatherParams.base_solar_w_m2 || 960.0);
    const windSpeed = Number(weatherParams.wind || weatherParams.wind_speed_m_s || 1.8);

    const weightedEdges = net.edges.map(e => ({
      ...e,
      ...this._computeEdgeMicroclimate(baseTemp, baseRh, baseSolar, windSpeed, e)
    }));

    const fastPath = this._shortestPath(net.nodes, weightedEdges, origin, dest, "fast_weight");
    const fastResult = {
      ...this._buildRouteStats(fastPath.pathNodes, fastPath.pathEdges, nodeMap),
      route_type: "standard_fast",
      label: "Standard Route (Highway / Flyover - Extreme Heat)",
      color: "#EF4444"
    };

    const coolPath = this._shortestPath(net.nodes, weightedEdges, origin, dest, "cool_weight");
    const coolResult = {
      ...this._buildRouteStats(coolPath.pathNodes, coolPath.pathEdges, nodeMap),
      route_type: "solsafe_cool",
      label: "SolSafe Bike Cool Route (Tree Canopy & Shaded Service Lanes)",
      color: "#10B981"
    };

    const timeDiff = Number((coolResult.estimated_time_mins - fastResult.estimated_time_mins).toFixed(1));
    const wbgtRed = Number((fastResult.avg_wbgt_c - coolResult.avg_wbgt_c).toFixed(1));
    const surfRed = Number((fastResult.avg_surface_temp_c - coolResult.avg_surface_temp_c).toFixed(1));
    const shadeInc = Number((coolResult.avg_shade_pct - fastResult.avg_shade_pct).toFixed(1));
    const doseRed = fastResult.heat_dose_index > 0
      ? Math.max(0, Number((((fastResult.heat_dose_index - coolResult.heat_dose_index) / fastResult.heat_dose_index) * 100).toFixed(1)))
      : 0;

    return {
      city: targetCity,
      city_name: net.city,
      center: net.center,
      origin: nodeMap[origin],
      destination: nodeMap[dest],
      weather_snapshot: {
        ambient_temp_c: baseTemp,
        humidity_pct: baseRh,
        solar_radiation_w_m2: baseSolar,
        wind_speed_m_s: windSpeed
      },
      routes: {
        standard: fastResult,
        cool: coolResult
      },
      comparison: {
        time_difference_mins: timeDiff,
        wbgt_reduction_c: wbgtRed,
        surface_temp_reduction_c: surfRed,
        shade_increase_pct: shadeInc,
        heat_dose_reduction_pct: doseRed,
        safety_verdict: `SolSafe Bike Route reduces rider heat exposure by ${wbgtRed}°C WBGT and saves ${doseRed}% thermal dose for only +${timeDiff} mins extra travel.`
      }
    };
  }

  _haversineMeters(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }

  computeRoutesFromGps(lat, lon, city = "hyderabad") {
    const oases = this.getOases(city);
    let nearest = oases[0];
    let minD = Infinity;
    oases.forEach(o => {
      const d = this._haversineMeters(lat, lon, o.lat, o.lon);
      if (d < minD) {
        minD = d;
        nearest = { ...o, distance_m: d, eta_mins: Math.max(1, Number((d / 420).toFixed(1))) };
      }
    });

    const net = this.getNetwork(city);
    let closestNode = net.nodes[0];
    let minNodeD = Infinity;
    net.nodes.forEach(n => {
      const d = this._haversineMeters(lat, lon, n.lat, n.lon);
      if (d < minNodeD) {
        minNodeD = d;
        closestNode = n;
      }
    });

    return {
      gps_location: { lat, lon },
      closest_network_node: closestNode,
      nearest_oasis: nearest,
      relief_route: {
        coordinates: [
          [lat, lon],
          [closestNode.lat, closestNode.lon],
          [nearest.lat, nearest.lon]
        ],
        distance_m: nearest.distance_m,
        eta_mins: nearest.eta_mins
      }
    };
  }

  getFleet() {
    return {
      active_rider_id: this.currentRiderId,
      fleet: this.riderOrder.map(id => ({ ...this.riders[id] }))
    };
  }

  switchRider(riderId) {
    if (this.riders[riderId]) {
      this.currentRiderId = riderId;
    }
    const r = { ...this.riders[this.currentRiderId] };
    return {
      status: "switched",
      active_rider: r,
      rider: r
    };
  }

  generateNewOrder(params = {}) {
    const targetCity = (params.city || "hyderabad").toLowerCase();
    const net = this.getNetwork(targetCity);
    const nodeIds = net.nodes.map(n => n.id);

    if (params.rider_id && this.riders[params.rider_id]) {
      this.currentRiderId = params.rider_id;
    } else if (params.switch_rider !== false) {
      const idx = this.riderOrder.indexOf(this.currentRiderId);
      this.currentRiderId = this.riderOrder[(idx + 1) % this.riderOrder.length];
    }

    let originId = params.origin_id;
    if (!originId || !nodeIds.includes(originId)) {
      originId = nodeIds[Math.floor(Math.random() * nodeIds.length)];
    }
    let destId = params.destination_id;
    if (!destId || !nodeIds.includes(destId) || destId === originId) {
      const others = nodeIds.filter(id => id !== originId);
      destId = others[Math.floor(Math.random() * others.length)];
    }

    const routes = this.computeRoutes({ origin_id: originId, destination_id: destId }, targetCity);
    const orderNum = Math.floor(10000 + Math.random() * 89999);

    return {
      order_id: `ORD_${orderNum}`,
      city: targetCity,
      assigned_rider: { ...this.riders[this.currentRiderId] },
      routes
    };
  }

  tickWorker(params = {}) {
    const rId = params.rider_id || this.currentRiderId;
    const rider = this.riders[rId] || this.riders[this.currentRiderId];
    const wbgt = Number(params.ambient_wbgt || 34.0);
    const shade = Number(params.shade_fraction ?? 0.5);
    const dt = Number(params.dt_mins || 1.0);
    const resting = !!params.is_resting;

    if (resting) {
      rider.core_temp_c = Number(Math.max(36.8, rider.core_temp_c - 0.08 * dt).toFixed(2));
      rider.hydration_pct = Number(Math.min(100, rider.hydration_pct + 4.0 * dt).toFixed(1));
      rider.consecutive_exposure_mins = Math.max(0, rider.consecutive_exposure_mins - 3.0 * dt);
    } else {
      const heatFactor = Math.max(0, (wbgt - 28.0) * (1.15 - 0.65 * shade));
      rider.core_temp_c = Number(Math.min(39.4, rider.core_temp_c + 0.012 * heatFactor * dt).toFixed(2));
      rider.hydration_pct = Number(Math.max(20, rider.hydration_pct - 0.35 * (1.2 - 0.5 * shade) * dt).toFixed(1));
      rider.consecutive_exposure_mins = Number((rider.consecutive_exposure_mins + dt * (1.1 - 0.4 * shade)).toFixed(1));
    }

    rider.heart_rate_bpm = Math.round(74 + (rider.core_temp_c - 36.8) * 38);
    rider.psi = Number(Math.max(0, Math.min(10, (rider.core_temp_c - 36.8) * 3.4)).toFixed(2));

    if (rider.consecutive_exposure_mins >= 90 || rider.core_temp_c >= 38.5 || rider.psi >= 7.0) {
      rider.status = "MANDATORY_HEAT_BREAK";
      rider.orders_paused = true;
      rider.pause_remaining_mins = 15.0;
      rider.strain_label = "Critical Heat Danger";
      rider.strain_color = "#7C3AED";
    } else if (rider.psi >= 4.2) {
      rider.strain_label = "Moderate Strain";
      rider.strain_color = "#F59E0B";
    } else {
      rider.strain_label = "Normal / Safe";
      rider.strain_color = "#10B981";
    }

    return { ...rider };
  }

  triggerHeatBreak(riderLat, riderLon, reason) {
    const rider = this.riders[this.currentRiderId];
    rider.status = "MANDATORY_HEAT_BREAK";
    rider.orders_paused = true;
    rider.pause_remaining_mins = 15.0;
    const gpsRes = this.computeRoutesFromGps(riderLat || 17.4435, riderLon || 78.3850, "hyderabad");

    return {
      event: "DISPATCH_SAFETY_INTERVENTION",
      action: "PAUSE_INCOMING_ORDERS",
      duration_minutes: 15,
      reason: reason || "90-Min Direct Sun Threshold Exceeded",
      rider_id: rider.worker_id,
      rider_name: rider.name,
      assigned_oasis: gpsRes.nearest_oasis,
      orchestration_payload: {
        partner_app: "Zomato Partner Pro",
        screen_override: "MANDATORY_COOLING_BREAK",
        message: `🚨 Temperature and direct sun exposure exceed safe operating thresholds for ${rider.name}. Dispatch queue paused for 15 minutes. Proceed to nearest Cool Zone to hydrate.`,
        compensation: "Protected Safe-Break Guaranteed Hourly Stipend Active"
      }
    };
  }

  resetWorker(riderId = null) {
    const rId = riderId || this.currentRiderId;
    const rider = this.riders[rId] || this.riders[this.currentRiderId];
    rider.core_temp_c = 37.0;
    rider.heart_rate_bpm = 76;
    rider.hydration_pct = 96.0;
    rider.consecutive_exposure_mins = 0.0;
    rider.psi = 0.5;
    rider.strain_label = "Normal / Safe";
    rider.strain_color = "#10B981";
    rider.status = "DELIVERING_ACTIVE";
    rider.orders_paused = false;
    rider.pause_remaining_mins = 0;
    return { status: "reset_success", rider: rider.worker_id };
  }
}

class ApiClient {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
    this.embedded = new SolSafeEmbeddedEngine();
    // Automatically detect static hosts (GitHub Pages, Netlify Drop, Cloudflare Pages, file://, etc.)
    const host = window.location.hostname || '';
    this.isStaticHost =
      host.endsWith('github.io') ||
      host.endsWith('netlify.app') ||
      host.endsWith('pages.dev') ||
      host.endsWith('surge.sh') ||
      window.location.protocol === 'file:';
  }

  async _fetchOrFallback(path, options = {}, fallbackFn) {
    if (this.isStaticHost) {
      return fallbackFn();
    }
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 1500);
      const res = await fetch(`${this.baseUrl}${path}`, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      // Seamlessly lock into Always-On Autonomous Edge API Engine
      this.isStaticHost = true;
      return fallbackFn();
    }
  }

  async getNetwork(city = 'hyderabad') {
    return this._fetchOrFallback(
      `/api/network?city=${encodeURIComponent(city)}`,
      {},
      () => this.embedded.getNetwork(city)
    );
  }

  async getOases(city = 'hyderabad') {
    return this._fetchOrFallback(
      `/api/oases?city=${encodeURIComponent(city)}`,
      {},
      () => this.embedded.getOases(city)
    );
  }

  async getSatelliteLayer(city = 'hyderabad') {
    return this._fetchOrFallback(
      `/api/satellite_layer?city=${encodeURIComponent(city)}`,
      {},
      () => this.embedded.getSatelliteLayer(city)
    );
  }

  async computeRoutes(weatherParams = {}, city = 'hyderabad') {
    const payload = {
      city: city,
      origin_id: weatherParams.origin_id || null,
      destination_id: weatherParams.destination_id || null,
      base_temp_c: weatherParams.temp || 44.0,
      base_rh: weatherParams.rh || 42.0,
      base_solar_w_m2: weatherParams.solar || 960.0,
      wind_speed_m_s: weatherParams.wind || 1.8
    };

    return this._fetchOrFallback(
      `/api/routes`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      },
      () => this.embedded.computeRoutes(weatherParams, city)
    );
  }

  async computeRoutesFromGps(lat, lon, city = 'hyderabad') {
    return this._fetchOrFallback(
      `/api/routes/from_gps`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lon, city })
      },
      () => this.embedded.computeRoutesFromGps(lat, lon, city)
    );
  }

  async tickWorker(params) {
    return this._fetchOrFallback(
      `/api/worker/tick`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      },
      () => this.embedded.tickWorker(params)
    );
  }

  async triggerHeatBreak(riderLat, riderLon, reason) {
    return this._fetchOrFallback(
      `/api/worker/trigger_break`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rider_lat: riderLat,
          rider_lon: riderLon,
          reason: reason || "90-Min Direct Sun Threshold Exceeded"
        })
      },
      () => this.embedded.triggerHeatBreak(riderLat, riderLon, reason)
    );
  }

  async resetWorker(riderId = null) {
    return this._fetchOrFallback(
      `/api/worker/reset`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rider_id: riderId })
      },
      () => this.embedded.resetWorker(riderId)
    );
  }

  async getFleet() {
    return this._fetchOrFallback(
      `/api/fleet`,
      {},
      () => this.embedded.getFleet()
    );
  }

  async switchRider(riderId) {
    return this._fetchOrFallback(
      `/api/fleet/switch`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rider_id: riderId })
      },
      () => this.embedded.switchRider(riderId)
    );
  }

  async generateNewOrder(params = {}) {
    return this._fetchOrFallback(
      `/api/orders/generate`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      },
      () => this.embedded.generateNewOrder(params)
    );
  }
}

const apiClient = new ApiClient();
