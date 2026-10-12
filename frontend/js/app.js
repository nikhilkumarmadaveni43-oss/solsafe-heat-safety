/**
 * SolSafe Main Application Controller
 * Coordinates UI events, microclimate API calls, animations,
 * and Zomato Orchestration heat break protocols.
 */

class AppController {
  constructor() {
    this.currentMode = 'cool'; // 'cool' or 'standard'
    this.currentCity = 'hyderabad'; // 'hyderabad' or 'delhi'
    this.routesData = null;
    this.networkData = null;
    this.oasesList = [];
    this.satelliteData = null;
    this.ambientTemp = 44.0;
    this.timeOfDay = 14.5; // 2:30 PM
    this.isHeatBreakActive = false;
    this.activeRiderId = 'RIDER_104';
    this.fleet = [];
    this.selectedOrigin = null;
    this.selectedDest = null;
    this.orderCount = 54921;
  }

  async init() {
    try {
      hud.logKafkaEvent('Initializing SolSafe microclimate engine & Hyderabad Cyberabad bike systems...');

      // 1. Initialize Map centered on Hyderabad Hitec City
      mapRenderer.init([17.4435, 78.3850], 14);
      riderEngine.init(mapRenderer.map);

      // 2. Load Fleet & Select Initial Rider
      await this.loadFleet();

      // 3. Load Network, Oases, Satellite Heat Rasters & Area Thermal Badges for Hyderabad
      await this.loadCityData(this.currentCity);

      // 4. Compute Initial Routes
      await this.refreshRoutes();

      // 5. Setup Simulation Callbacks
      this.setupSimulationCallbacks();

      // 6. Bind User Interface Controls
      this.bindUiEvents();

      hud.logKafkaEvent(`SolSafe Ready. Live Kafka telemetry active for ${this.activeRiderId} in ${this.currentCity.toUpperCase()}.`);
    } catch (err) {
      console.error('Initialization error:', err);
      hud.logKafkaEvent(`[ERR] Failed to initialize: ${err.message}`);
    }
  }

  async loadFleet() {
    try {
      const res = await apiClient.getFleet();
      this.fleet = res.fleet || [];
      this.activeRiderId = res.active_rider_id || 'RIDER_104';

      const selectRider = document.getElementById('selectRider');
      if (selectRider) {
        selectRider.innerHTML = '';
        this.fleet.forEach(r => {
          const opt = document.createElement('option');
          opt.value = r.worker_id;
          const vIcon = r.vehicle_type === 'scooter' ? '🛵' : (r.vehicle_type === 'ev' ? '⚡' : '🏍️');
          opt.textContent = `${r.name} (${vIcon})`;
          selectRider.appendChild(opt);
        });
        selectRider.value = this.activeRiderId;
      }

      const activeRider = this.fleet.find(r => r.worker_id === this.activeRiderId) || this.fleet[0];
      if (activeRider) {
        hud.updateRiderProfile(activeRider);
      }
    } catch (err) {
      console.error('Failed to load fleet:', err);
    }
  }

  populateOriginDestDropdowns() {
    if (!this.networkData || !this.networkData.nodes) return;
    const selectOrigin = document.getElementById('selectOrigin');
    const selectDest = document.getElementById('selectDest');
    if (!selectOrigin || !selectDest) return;

    selectOrigin.innerHTML = '';
    selectDest.innerHTML = '';

    this.networkData.nodes.forEach(node => {
      const optA = document.createElement('option');
      optA.value = node.id;
      optA.textContent = node.name;
      selectOrigin.appendChild(optA);

      const optB = document.createElement('option');
      optB.value = node.id;
      optB.textContent = node.name;
      selectDest.appendChild(optB);
    });

    // Default origin and destination
    const nodes = this.networkData.nodes;
    this.selectedOrigin = nodes[0].id;
    this.selectedDest = nodes.length > 6 ? nodes[6].id : nodes[nodes.length - 1].id;

    selectOrigin.value = this.selectedOrigin;
    selectDest.value = this.selectedDest;
  }

  async loadCityData(city) {
    const [network, oases, satellite] = await Promise.all([
      apiClient.getNetwork(city),
      apiClient.getOases(city),
      apiClient.getSatelliteLayer(city)
    ]);

    this.networkData = network;
    this.oasesList = oases;
    this.satelliteData = satellite;

    this.populateOriginDestDropdowns();

    mapRenderer.renderSatelliteThermalGrid(satellite);
    mapRenderer.renderCanopyCorridors(network);
    mapRenderer.renderOases(oases, (oasis) => this.handleOasisClicked(oasis));
    mapRenderer.renderAreaThermalMarks(network, { temp: this.ambientTemp });
  }

  async switchCity(city) {
    this.currentCity = city;
    hud.logKafkaEvent(`Switching city sector to ${city.toUpperCase()}...`);
    await this.loadCityData(city);
    mapRenderer.recenter(this.networkData.center, this.networkData.default_zoom || 14);
    await this.refreshRoutes();
    hud.logKafkaEvent(`Sector switched to ${this.networkData.city}. Satellite & area thermal layers updated.`);
  }

  async refreshRoutes(originId = null, destId = null) {
    if (originId) this.selectedOrigin = originId;
    if (destId) this.selectedDest = destId;

    // Solar irradiance varies with time of day (peaks around 13:00 - 14:00)
    const solarFactor = Math.sin(((this.timeOfDay - 8) / 10) * Math.PI);
    const solarW = Math.max(400, Math.round(1000 * Math.max(0.2, solarFactor)));

    const params = {
      origin_id: this.selectedOrigin,
      destination_id: this.selectedDest,
      temp: this.ambientTemp,
      rh: 42.0,
      solar: solarW,
      wind: 1.8
    };

    hud.logKafkaEvent(`Recalculating microclimate: ${this.ambientTemp}°C Ambient, ${solarW} W/m² Solar Irradiance (${this.currentCity.toUpperCase()})...`);
    const routesRes = await apiClient.computeRoutes(params, this.currentCity);
    this.routesData = routesRes;

    // Render routes on map
    mapRenderer.renderRoutes(routesRes);
    mapRenderer.highlightActiveRoute(this.currentMode);

    // Update Comparison Matrix Card
    hud.updateComparison(routesRes);

    // Set active route for rider animation
    const activeRoute = this.currentMode === 'cool' ? routesRes.routes.cool : routesRes.routes.standard;
    riderEngine.setRoute(activeRoute, this.currentMode);

    // Update Initial WBGT Gauge
    const initialSeg = activeRoute.segments[0] || {};
    hud.updateWBGT(
      initialSeg.wbgt || 33.4,
      initialSeg.wbgt ? initialSeg.wbgt - 6.5 : 26.5,
      initialSeg.wbgt ? initialSeg.wbgt + 8.5 : 42.0,
      initialSeg.risk_level || 'High',
      initialSeg.flag_color || '#ef4444',
      '40m Work / 20m Rest'
    );
  }

  setupSimulationCallbacks() {
    // On each movement tick
    riderEngine.onTickCallback = async (tickData) => {
      const seg = tickData.segment;
      audioFX.playBlip();

      // Update Map Overlay Badge
      hud.updateMapTelemetry(tickData.speedKmh, seg.road_name, seg.surface_temp_c);

      // Call Backend Worker Biometric Tick
      const workerState = await apiClient.tickWorker({
        rider_id: this.activeRiderId,
        ambient_wbgt: seg.wbgt,
        shade_fraction: seg.shade_pct / 100.0,
        dt_mins: 1.0,
        is_resting: this.isHeatBreakActive
      });

      // Update HUD Biometrics
      hud.updateBiometrics(workerState);

      // Update WBGT Gauge
      hud.updateWBGT(
        seg.wbgt,
        seg.wbgt - 6.5,
        seg.wbgt + (seg.shade_pct > 50 ? 5.0 : 12.0),
        seg.risk_level,
        seg.flag_color
      );

      // Push to Kafka Ticker
      hud.logKafkaEvent(
        `PARTITION-3 | Lat: ${tickData.position[0].toFixed(4)}, Lon: ${tickData.position[1].toFixed(4)} | ` +
        `Road: "${seg.road_name}" | WBGT: ${seg.wbgt}°C | CoreTemp: ${workerState.core_temp_c}°C | ` +
        `PSI: ${workerState.psi} (${workerState.strain_label})`
      );

      // Audio Warning if heat is severe
      if (seg.wbgt >= 38.0 && this.currentMode === 'standard') {
        audioFX.playWarning();
      }

      // If state machine automatically triggered Mandatory Heat Break
      if (workerState.status === 'MANDATORY_HEAT_BREAK' && !this.isHeatBreakActive) {
        this.triggerHeatBreakProtocol("Automated Biothermal Strain Threshold Exceeded");
      }
    };

    // On trip completion
    riderEngine.onTripCompleteCallback = () => {
      hud.logKafkaEvent('✅ Delivery Trip Completed successfully. Order delivered to customer.');
      audioFX.playCoolChime();
      document.getElementById('playText').textContent = 'Replay Delivery';
      document.getElementById('playIcon').textContent = '↺';
      document.getElementById('simLiveDot').classList.remove('active');
    };
  }

  bindUiEvents() {
    // 1. Route Mode Selection
    const btnCool = document.getElementById('btnModeCool');
    const btnStd = document.getElementById('btnModeStandard');

    btnCool.addEventListener('click', () => {
      if (this.currentMode === 'cool') return;
      this.currentMode = 'cool';
      btnCool.classList.add('active');
      btnStd.classList.remove('active');
      mapRenderer.highlightActiveRoute('cool');
      if (this.routesData) {
        riderEngine.setRoute(this.routesData.routes.cool, 'cool');
      }
      audioFX.playCoolChime();
      hud.logKafkaEvent('Switched to SolSafe Cool Route. Shaded avenues prioritized.');
    });

    btnStd.addEventListener('click', () => {
      if (this.currentMode === 'standard') return;
      this.currentMode = 'standard';
      btnStd.classList.add('active');
      btnCool.classList.remove('active');
      mapRenderer.highlightActiveRoute('standard');
      if (this.routesData) {
        riderEngine.setRoute(this.routesData.routes.standard, 'standard');
      }
      audioFX.playWarning();
      hud.logKafkaEvent('Switched to Standard Fastest Route. Warning: Exposure to 49°C asphalt highway!');
    });

    // 2. Play / Pause
    const btnPlayPause = document.getElementById('btnPlayPause');
    const playIcon = document.getElementById('playIcon');
    const playText = document.getElementById('playText');
    const simLiveDot = document.getElementById('simLiveDot');

    btnPlayPause.addEventListener('click', () => {
      audioFX.init();
      if (riderEngine.isPlaying) {
        riderEngine.pause();
        playIcon.textContent = '▶';
        playText.textContent = 'Resume Delivery';
        simLiveDot.classList.remove('active');
      } else {
        riderEngine.start();
        playIcon.textContent = '⏸';
        playText.textContent = 'Pause Delivery';
        simLiveDot.classList.add('active');
      }
    });

    // 3. Reset Trip
    const btnReset = document.getElementById('btnResetTrip');
    btnReset.addEventListener('click', async () => {
      riderEngine.reset();
      this.isHeatBreakActive = false;
      playIcon.textContent = '▶';
      playText.textContent = 'Start Delivery';
      simLiveDot.classList.remove('active');
      await apiClient.resetWorker(this.activeRiderId);
      const freshState = {
        core_temp_c: 37.1,
        heart_rate_bpm: 78,
        hydration_pct: 95.0,
        consecutive_exposure_mins: 0,
        psi: 0.8,
        strain_label: 'Normal / Safe',
        strain_color: '#10b981',
        status: 'DELIVERING_ACTIVE',
        orders_paused: false
      };
      hud.updateBiometrics(freshState);
      hud.logKafkaEvent('Trip reset. Rider biometrics normalized to rested state.');
    });

    // 4. Sim Speed Multiplier
    const speedChips = document.querySelectorAll('.btn-chip');
    speedChips.forEach(chip => {
      chip.addEventListener('click', () => {
        speedChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const spd = Number(chip.getAttribute('data-speed'));
        riderEngine.setSpeed(spd);
        audioFX.playBlip();
      });
    });

    // 5. Environmental Sliders
    const sliderTemp = document.getElementById('sliderTemp');
    const valAmbientTemp = document.getElementById('valAmbientTemp');
    sliderTemp.addEventListener('input', async (e) => {
      this.ambientTemp = parseFloat(e.target.value);
      valAmbientTemp.textContent = `${this.ambientTemp.toFixed(1)}°C`;
      await this.refreshRoutes();
      mapRenderer.renderAreaThermalMarks(this.networkData, { temp: this.ambientTemp });
    });

    const sliderTime = document.getElementById('sliderTime');
    const valTimeOfDay = document.getElementById('valTimeOfDay');
    sliderTime.addEventListener('input', async (e) => {
      this.timeOfDay = parseFloat(e.target.value);
      const hrs = Math.floor(this.timeOfDay);
      const mins = Math.round((this.timeOfDay - hrs) * 60);
      const ampm = hrs >= 12 ? 'PM' : 'AM';
      const displayHr = hrs > 12 ? hrs - 12 : hrs;
      valTimeOfDay.textContent = `${displayHr < 10 ? '0' : ''}${displayHr}:${mins < 10 ? '0' : ''}${mins} ${ampm}`;
      await this.refreshRoutes();
    });

    // 6. Fast-Track Heat Break Button
    const btnTriggerBreak = document.getElementById('btnTriggerBreak');
    btnTriggerBreak.addEventListener('click', () => {
      this.triggerHeatBreakProtocol("Manual Fast-Track: Continuous 90-Min Sun Exposure Limit Reached");
    });

    // 7. Layer Toggles
    document.getElementById('chkHeatLayer').addEventListener('change', (e) => {
      mapRenderer.toggleThermalGrid(e.target.checked);
    });
    document.getElementById('chkCanopyLayer').addEventListener('change', (e) => {
      mapRenderer.toggleCanopy(e.target.checked);
    });
    document.getElementById('chkOasisLayer').addEventListener('change', (e) => {
      mapRenderer.toggleOases(e.target.checked);
    });
    const chkThermalMarks = document.getElementById('chkThermalMarks');
    if (chkThermalMarks) {
      chkThermalMarks.addEventListener('change', (e) => {
        mapRenderer.toggleThermalMarks(e.target.checked);
      });
    }

    // Base Map Style buttons (Satellite / Dark / Streets)
    const styleBtns = document.querySelectorAll('.style-btn');
    styleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        styleBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const style = btn.getAttribute('data-style');
        mapRenderer.setBaseMapStyle(style);
        audioFX.playBlip();
        hud.logKafkaEvent(`Map Background Style switched to: ${style.toUpperCase()}`);
      });
    });

    // 8. Audio Toggle
    const btnAudio = document.getElementById('btnAudioToggle');
    const audioIcon = document.getElementById('audioIcon');
    btnAudio.addEventListener('click', () => {
      const active = audioFX.toggleMute();
      audioIcon.textContent = active ? '🔊' : '🔇';
    });

    // 9. City Dropdown
    const selectCity = document.getElementById('selectCity');
    if (selectCity) {
      selectCity.addEventListener('change', async (e) => {
        audioFX.playBlip();
        await this.switchCity(e.target.value);
      });
    }

    // 10. Origin & Destination Selector
    const selectOrigin = document.getElementById('selectOrigin');
    if (selectOrigin) {
      selectOrigin.addEventListener('change', async (e) => {
        audioFX.playBlip();
        this.selectedOrigin = e.target.value;
        if (this.selectedOrigin === this.selectedDest) {
          const alternate = this.networkData.nodes.find(n => n.id !== this.selectedOrigin);
          if (alternate) {
            this.selectedDest = alternate.id;
            const destEl = document.getElementById('selectDest');
            if (destEl) destEl.value = this.selectedDest;
          }
        }
        await this.refreshRoutes();
        riderEngine.reset();
        document.getElementById('playText').textContent = 'Start Delivery';
        document.getElementById('playIcon').textContent = '▶';
        document.getElementById('simLiveDot').classList.remove('active');
        hud.logKafkaEvent(`Pickup Origin updated to: ${this.selectedOrigin}. New route generated.`);
      });
    }

    const selectDest = document.getElementById('selectDest');
    if (selectDest) {
      selectDest.addEventListener('change', async (e) => {
        audioFX.playBlip();
        this.selectedDest = e.target.value;
        if (this.selectedDest === this.selectedOrigin) {
          const alternate = this.networkData.nodes.find(n => n.id !== this.selectedDest);
          if (alternate) {
            this.selectedOrigin = alternate.id;
            const origEl = document.getElementById('selectOrigin');
            if (origEl) origEl.value = this.selectedOrigin;
          }
        }
        await this.refreshRoutes();
        riderEngine.reset();
        document.getElementById('playText').textContent = 'Start Delivery';
        document.getElementById('playIcon').textContent = '▶';
        document.getElementById('simLiveDot').classList.remove('active');
        hud.logKafkaEvent(`Delivery Drop updated to: ${this.selectedDest}. New route generated.`);
      });
    }

    // 11. New Order & Rotate Rider Button
    const btnNewOrder = document.getElementById('btnNewOrder');
    if (btnNewOrder) {
      btnNewOrder.addEventListener('click', async () => {
        audioFX.playBlip();
        hud.logKafkaEvent('🔀 Generating new delivery order & rotating next active fleet rider...');
        try {
          const res = await apiClient.generateNewOrder({
            city: this.currentCity,
            switch_rider: true
          });

          this.orderCount += 1;
          const orderBadge = document.getElementById('orderIdBadge');
          if (orderBadge) {
            orderBadge.textContent = `ORD #${res.order_id.replace('ORD_', '')}`;
          }

          if (res.assigned_rider) {
            this.activeRiderId = res.assigned_rider.worker_id;
            hud.updateRiderProfile(res.assigned_rider);
            hud.logKafkaEvent(`👤 Order assigned to Rider: ${res.assigned_rider.name} (${res.assigned_rider.vehicle})`);
          }

          if (res.routes && res.routes.origin && res.routes.destination) {
            this.selectedOrigin = res.routes.origin.id;
            this.selectedDest = res.routes.destination.id;
            const selO = document.getElementById('selectOrigin');
            const selD = document.getElementById('selectDest');
            if (selO) selO.value = this.selectedOrigin;
            if (selD) selD.value = this.selectedDest;

            this.routesData = res.routes;
            mapRenderer.renderRoutes(this.routesData);
            mapRenderer.highlightActiveRoute(this.currentMode);
            hud.updateComparison(this.routesData);

            const activeRoute = this.currentMode === 'cool' ? this.routesData.routes.cool : this.routesData.routes.standard;
            riderEngine.setRoute(activeRoute, this.currentMode);
            riderEngine.reset();
            const playText = document.getElementById('playText');
            const playIcon = document.getElementById('playIcon');
            const simLiveDot = document.getElementById('simLiveDot');
            if (playText) playText.textContent = 'Start Delivery';
            if (playIcon) playIcon.textContent = '▶';
            if (simLiveDot) simLiveDot.classList.remove('active');
          }
          audioFX.playCoolChime();
        } catch (err) {
          console.error('Order generation error:', err);
          hud.logKafkaEvent(`[ERR] Failed to generate order: ${err.message}`);
        }
      });
    }

    // 12. Active Rider Dropdown Selector
    const selectRider = document.getElementById('selectRider');
    if (selectRider) {
      selectRider.addEventListener('change', async (e) => {
        const targetRiderId = e.target.value;
        try {
          const res = await apiClient.switchRider(targetRiderId);
          const riderData = res.active_rider || res.rider;
          this.activeRiderId = riderData.worker_id;
          hud.updateRiderProfile(riderData);
          audioFX.playBlip();
          hud.logKafkaEvent(`👤 Switched active delivery partner to ${riderData.name} (${riderData.vehicle})`);
        } catch (err) {
          console.error('Failed to switch rider:', err);
        }
      });
    }

    // 13. Live GPS Button
    const btnLiveGps = document.getElementById('btnLiveGps');
    if (btnLiveGps) {
      btnLiveGps.addEventListener('click', () => {
        this.handleLiveGps();
      });
    }

    // 14. Modal Buttons
    document.getElementById('btnCloseModal').addEventListener('click', () => {
      document.getElementById('modalOrchestration').style.display = 'none';
    });
    document.getElementById('btnDismissModal').addEventListener('click', () => {
      document.getElementById('modalOrchestration').style.display = 'none';
    });
    document.getElementById('btnProceedToOasis').addEventListener('click', () => {
      this.routeRiderToOasis();
    });

    // 15. Mobile Bottom Navigation Tabs & Map Quickbar
    const mNavItems = document.querySelectorAll('#mobileBottomNav .m-nav-item');
    mNavItems.forEach(item => {
      item.addEventListener('click', () => {
        mNavItems.forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        const tab = item.getAttribute('data-tab') || 'map';
        document.body.setAttribute('data-mobile-tab', tab);
        audioFX.playBlip();
        if (tab === 'map' && mapRenderer.map) {
          setTimeout(() => mapRenderer.map.invalidateSize(), 60);
        }
      });
    });

    const btnMobilePlay = document.getElementById('btnMobilePlay');
    if (btnMobilePlay) {
      btnMobilePlay.addEventListener('click', () => {
        btnPlayPause.click();
        btnMobilePlay.textContent = riderEngine.isPlaying ? '⏸ Pause' : '▶ Start';
      });
    }

    const btnMobileNewOrder = document.getElementById('btnMobileNewOrder');
    if (btnMobileNewOrder && btnNewOrder) {
      btnMobileNewOrder.addEventListener('click', () => {
        btnNewOrder.click();
        if (btnMobilePlay) btnMobilePlay.textContent = '▶ Start';
      });
    }

    const btnMobileRouteToggle = document.getElementById('btnMobileRouteToggle');
    if (btnMobileRouteToggle) {
      btnMobileRouteToggle.addEventListener('click', () => {
        if (this.currentMode === 'cool') {
          btnStd.click();
          btnMobileRouteToggle.textContent = '🔥 Fast Route';
          btnMobileRouteToggle.style.borderColor = '#ef4444';
          btnMobileRouteToggle.style.color = '#f87171';
        } else {
          btnCool.click();
          btnMobileRouteToggle.textContent = '🌿 Cool Route';
          btnMobileRouteToggle.style.borderColor = '#10b981';
          btnMobileRouteToggle.style.color = '#34d399';
        }
      });
    }

    const btnMobileGps = document.getElementById('btnMobileGps');
    if (btnMobileGps) {
      btnMobileGps.addEventListener('click', () => {
        this.handleLiveGps();
      });
    }

    window.addEventListener('resize', () => {
      if (mapRenderer.map) {
        mapRenderer.map.invalidateSize();
      }
    });
  }

  async handleLiveGps() {
    audioFX.playBlip();
    const gpsHint = document.getElementById('gpsHintText');
    if (gpsHint) gpsHint.textContent = '🛰️ Acquiring live GPS satellite lock...';
    hud.logKafkaEvent('Requesting browser device GPS geolocation coordinates...');

    const processCoords = async (lat, lon, isRealGps = true) => {
      try {
        const label = isRealGps ? 'Your Live Device Location' : 'Simulated GPS: Cyber Towers Roundabout';
        mapRenderer.renderLiveGpsMarker(lat, lon, label);

        // Fetch nearest Oasis and relief path from GPS
        const res = await apiClient.computeRoutesFromGps(lat, lon, this.currentCity);
        const oasis = res.nearest_oasis;

        audioFX.playCoolChime();
        if (gpsHint) {
          gpsHint.textContent = `📍 Live Lock: ${oasis.distance_m}m to ${oasis.name} (${oasis.indoor_temp_c}°C)`;
        }

        hud.logKafkaEvent(
          `📍 LIVE GPS LOCKED: [${lat.toFixed(5)}, ${lon.toFixed(5)}] | Nearest Oasis: "${oasis.name}" | ` +
          `Distance: ${oasis.distance_m}m (ETA: ${oasis.eta_mins} mins) | AC Temp: ${oasis.indoor_temp_c}°C`
        );

        // Draw emergency relief corridor polyline from live GPS
        if (this.gpsReliefLine) {
          mapRenderer.map.removeLayer(this.gpsReliefLine);
        }
        this.gpsReliefLine = L.polyline(res.relief_route.coordinates, {
          color: '#38bdf8',
          weight: 6,
          dashArray: '4, 8',
          opacity: 0.95
        }).addTo(mapRenderer.map);

      } catch (err) {
        console.error('Error computing GPS relief route:', err);
        hud.logKafkaEvent(`[ERR] GPS route calculation failed: ${err.message}`);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          processCoords(pos.coords.latitude, pos.coords.longitude, true);
        },
        (err) => {
          // If user denies permission or desktop doesn't have GPS, default to Cyber Towers Hyderabad!
          console.warn('Geolocation error or permission denied:', err.message);
          const hydDefaultLat = 17.4504;
          const hydDefaultLon = 78.3811;
          processCoords(hydDefaultLat, hydDefaultLon, false);
        },
        { timeout: 5000, enableHighAccuracy: true }
      );
    } else {
      const hydDefaultLat = 17.4504;
      const hydDefaultLon = 78.3811;
      processCoords(hydDefaultLat, hydDefaultLon, false);
    }
  }

  async triggerHeatBreakProtocol(reason) {
    audioFX.playSiren();
    riderEngine.pause();
    this.isHeatBreakActive = true;

    const curPos = riderEngine.getCurrentPosition();
    const breakResult = await apiClient.triggerHeatBreak(curPos[0], curPos[1], reason);

    // Show Zomato Orchestration Modal
    const modal = document.getElementById('modalOrchestration');
    const oasis = breakResult.assigned_oasis;
    if (oasis) {
      document.getElementById('modalOasisName').textContent = oasis.name;
      document.getElementById('modalOasisDist').textContent = `${oasis.distance_m}m away • ${oasis.indoor_temp_c}°C AC • Free RO Water`;
    }
    modal.style.display = 'flex';

    hud.logKafkaEvent(`🚨 ORCHESTRATION EVENT: ${breakResult.orchestration_payload.message}`);
    riderEngine.updateHaloColor(true);

    // Update status in HUD
    hud.updateBiometrics({
      core_temp_c: 38.6,
      heart_rate_bpm: 138,
      hydration_pct: 32,
      consecutive_exposure_mins: 90,
      psi: 7.2,
      strain_label: 'Critical Heat Danger',
      strain_color: '#7c3aed',
      status: 'MANDATORY_HEAT_BREAK',
      orders_paused: true,
      pause_remaining_mins: 15.0
    });
  }

  routeRiderToOasis() {
    document.getElementById('modalOrchestration').style.display = 'none';
    const curPos = riderEngine.getCurrentPosition();
    const riderObj = this.fleet.find(r => r.worker_id === this.activeRiderId) || { name: 'Active Rider' };
    
    // Find closest oasis
    let bestOasis = this.oasesList[0];
    let minDist = 999999;
    this.oasesList.forEach(o => {
      const d = Math.hypot(curPos[0] - o.lat, curPos[1] - o.lon);
      if (d < minDist) {
        minDist = d;
        bestOasis = o;
      }
    });

    hud.logKafkaEvent(`📍 Rerouting ${riderObj.name} directly to ${bestOasis.name} for 15-minute hydration cooling break...`);

    // Draw emergency relief route polyline on map
    const oasisCoords = [curPos, [bestOasis.lat, bestOasis.lon]];
    const oasisPolyline = L.polyline(oasisCoords, {
      color: '#38bdf8',
      weight: 6,
      dashArray: '4, 8',
      opacity: 0.95
    }).addTo(mapRenderer.map);

    // Animate rider directly into the Oasis
    riderEngine.setRoute({
      coordinates: oasisCoords,
      segments: [{
        road_name: `Relief Corridor to ${bestOasis.name}`,
        wbgt: 28.0,
        surface_temp_c: 30.0,
        shade_pct: 100
      }]
    }, 'cool');

    riderEngine.start();

    // Rider arrives at Oasis and cools down
    setTimeout(async () => {
      audioFX.playCoolChime();
      hud.logKafkaEvent(`🎉 ${riderObj.name} arrived at ${bestOasis.name}. Indoor Temp: ${bestOasis.indoor_temp_c}°C. Drinking cold RO water & ORS. Cooling recovery active.`);
      
      // Cooled biometrics
      const cooled = await apiClient.tickWorker({
        rider_id: this.activeRiderId,
        ambient_wbgt: 24.0,
        shade_fraction: 1.0,
        dt_mins: 10.0,
        is_resting: true
      });
      hud.updateBiometrics(cooled);
    }, 3000);
  }

  handleOasisClicked(oasis) {
    audioFX.playCoolChime();
    hud.logKafkaEvent(`Cool Oasis Selected: "${oasis.name}" | Temp: ${oasis.indoor_temp_c}°C | Capacity: ${oasis.current_occupancy}/${oasis.capacity} riders`);
  }
}

// Instantiate and start on page load
window.addEventListener('DOMContentLoaded', () => {
  const app = new AppController();
  app.init();
});
