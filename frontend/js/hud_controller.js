/**
 * SolSafe HUD Controller
 * Manages live biometric telemetry gauges, WBGT meters,
 * comparison tables, and Kafka ticker stream.
 */

class HudController {
  constructor() {
    // WBGT elements
    this.elHudWBGT = document.getElementById('hudWBGT');
    this.elWbgtCircle = document.getElementById('wbgtCircle');
    this.elOshaFlagTag = document.getElementById('oshaFlagTag');
    this.elHudWetBulb = document.getElementById('hudWetBulb');
    this.elHudGlobeTemp = document.getElementById('hudGlobeTemp');
    this.elHudWorkRest = document.getElementById('hudWorkRest');

    // Biometric elements
    this.elValCoreTemp = document.getElementById('valCoreTemp');
    this.elBarCoreTemp = document.getElementById('barCoreTemp');
    this.elValHeartRate = document.getElementById('valHeartRate');
    this.elValPSI = document.getElementById('valPSI');
    this.elPsiLabel = document.getElementById('psiLabel');
    this.elBarPSI = document.getElementById('barPSI');
    this.elValHydration = document.getElementById('valHydration');
    this.elBarHydration = document.getElementById('barHydration');

    // Sun Exposure Dial
    this.elDialMins = document.getElementById('dialMins');
    this.elDialMeter = document.getElementById('dialMeter');
    this.elBreakWarningText = document.getElementById('breakWarningText');

    // Status Badges
    this.elRiderStatusDot = document.getElementById('riderStatusDot');
    this.elBadgePlatformStatus = document.getElementById('badgePlatformStatus');
    this.elBadgeRestCountdown = document.getElementById('badgeRestCountdown');

    // Telemetry Map Overlay
    this.elRiderSpeed = document.getElementById('riderSpeed');
    this.elCurrentStreet = document.getElementById('currentStreet');
    this.elCurrentSurfaceHeat = document.getElementById('currentSurfaceHeat');

    // Kafka Ticker
    this.elKafkaTicker = document.getElementById('kafkaTicker');

    // Comparison Card
    this.elCoolTime = document.getElementById('coolTime');
    this.elFastTime = document.getElementById('fastTime');
    this.elCoolWBGT = document.getElementById('coolWBGT');
    this.elFastWBGT = document.getElementById('fastWBGT');
    this.elCoolShade = document.getElementById('coolShade');
    this.elFastShade = document.getElementById('fastShade');
    this.elCoolSurface = document.getElementById('coolSurface');
    this.elFastSurface = document.getElementById('fastSurface');
    this.elCoolDose = document.getElementById('coolDose');
    this.elFastDose = document.getElementById('fastDose');
    this.elComparisonSummary = document.getElementById('comparisonSummary');
  }

  updateComparison(comparisonData) {
    if (!comparisonData || !comparisonData.routes) return;
    const std = comparisonData.routes.standard;
    const cool = comparisonData.routes.cool;

    this.elCoolTime.textContent = `${cool.estimated_time_mins} min`;
    this.elFastTime.textContent = `${std.estimated_time_mins} min`;

    this.elCoolWBGT.textContent = `${cool.avg_wbgt_c}°C`;
    this.elFastWBGT.textContent = `${std.avg_wbgt_c}°C`;

    this.elCoolShade.textContent = `${cool.avg_shade_pct}%`;
    this.elFastShade.textContent = `${std.avg_shade_pct}%`;

    this.elCoolSurface.textContent = `${cool.avg_surface_temp_c}°C`;
    this.elFastSurface.textContent = `${std.avg_surface_temp_c}°C`;

    this.elCoolDose.textContent = cool.heat_dose_index;
    this.elFastDose.textContent = std.heat_dose_index;

    if (comparisonData.comparison && comparisonData.comparison.safety_verdict) {
      this.elComparisonSummary.textContent = comparisonData.comparison.safety_verdict;
    }
  }

  updateWBGT(wbgt, wetBulb, globeTemp, riskLevel, flagColor, workRest) {
    if (this.elHudWBGT) this.elHudWBGT.textContent = Number(wbgt).toFixed(1);
    if (this.elHudWetBulb) this.elHudWetBulb.textContent = `${Number(wetBulb).toFixed(1)}°C`;
    if (this.elHudGlobeTemp) this.elHudGlobeTemp.textContent = `${Number(globeTemp).toFixed(1)}°C`;
    if (this.elHudWorkRest) this.elHudWorkRest.textContent = workRest || '45m Work / 15m Rest';

    if (this.elOshaFlagTag) {
      this.elOshaFlagTag.textContent = riskLevel || 'High (Red Flag)';
      this.elOshaFlagTag.style.backgroundColor = flagColor ? `${flagColor}33` : 'rgba(239, 68, 68, 0.2)';
      this.elOshaFlagTag.style.color = flagColor || '#ef4444';
    }

    if (this.elWbgtCircle && flagColor) {
      this.elWbgtCircle.style.borderColor = flagColor;
      this.elWbgtCircle.style.boxShadow = `0 0 20px ${flagColor}66`;
    }
  }

  updateBiometrics(state) {
    if (!state) return;

    // Core body temp
    const tc = state.core_temp_c;
    this.elValCoreTemp.textContent = `${tc.toFixed(1)}°C`;
    const tcPct = Math.min(100, Math.max(0, ((tc - 36.5) / (39.5 - 36.5)) * 100));
    this.elBarCoreTemp.style.width = `${tcPct}%`;
    this.elBarCoreTemp.style.backgroundColor = tc >= 38.5 ? '#ef4444' : tc >= 37.8 ? '#f59e0b' : '#10b981';

    // Heart rate
    const hr = state.heart_rate_bpm;
    this.elValHeartRate.textContent = `${hr} BPM`;

    // Moran PSI
    const psi = state.psi;
    this.elValPSI.textContent = `${psi.toFixed(1)} / 10`;
    this.elPsiLabel.textContent = state.strain_label || 'Normal / Safe';
    this.elBarPSI.style.width = `${Math.min(100, psi * 10)}%`;
    this.elBarPSI.style.backgroundColor = state.strain_color || '#10b981';

    // Hydration
    const hyd = state.hydration_pct;
    this.elValHydration.textContent = `${Math.round(hyd)}%`;
    this.elBarHydration.style.width = `${hyd}%`;
    this.elBarHydration.style.backgroundColor = hyd < 40 ? '#ef4444' : hyd < 65 ? '#f59e0b' : '#38bdf8';

    // Sun exposure dial (out of 90 mins)
    const mins = Math.round(state.consecutive_exposure_mins);
    this.elDialMins.textContent = mins;
    const maxMins = 90.0;
    const perimeter = 264.0; // 2 * PI * 42
    const progressFraction = Math.min(1.0, mins / maxMins);
    const offset = perimeter - (progressFraction * perimeter);
    this.elDialMeter.style.strokeDashoffset = offset;

    if (mins >= 80) {
      this.elDialMeter.style.stroke = '#ef4444';
      this.elBreakWarningText.textContent = `🚨 CRITICAL: ${Math.max(0, 90 - mins)} mins until mandatory break!`;
      this.elBreakWarningText.style.color = '#ef4444';
    } else {
      this.elDialMeter.style.stroke = '#10b981';
      this.elBreakWarningText.textContent = `Safe margin: ${Math.max(0, 90 - mins)} mins remaining before rest pause.`;
      this.elBreakWarningText.style.color = '#38bdf8';
    }

    // Status badges
    if (state.status === 'MANDATORY_HEAT_BREAK' || state.orders_paused) {
      this.elRiderStatusDot.className = 'rider-status-dot paused';
      this.elBadgePlatformStatus.textContent = 'ORDERS PAUSED (HEAT BREAK)';
      this.elBadgePlatformStatus.style.background = 'rgba(239, 68, 68, 0.2)';
      this.elBadgePlatformStatus.style.color = '#ef4444';
      this.elBadgeRestCountdown.style.display = 'inline-block';
      this.elBadgeRestCountdown.textContent = `Rest: ${Math.round(state.pause_remaining_mins || 15)}m remaining`;
    } else {
      this.elRiderStatusDot.className = 'rider-status-dot active';
      this.elBadgePlatformStatus.textContent = 'ACTIVE DELIVERING';
      this.elBadgePlatformStatus.style.background = 'rgba(225, 29, 72, 0.15)';
      this.elBadgePlatformStatus.style.color = '#fb7185';
      this.elBadgeRestCountdown.style.display = 'none';
    }
  }

  updateMapTelemetry(speedKmh, streetName, surfaceTemp) {
    if (this.elRiderSpeed) this.elRiderSpeed.textContent = `${Math.round(speedKmh)} km/h`;
    if (this.elCurrentStreet) this.elCurrentStreet.textContent = streetName || 'Urban Corridor';
    if (this.elCurrentSurfaceHeat) this.elCurrentSurfaceHeat.textContent = `${Number(surfaceTemp).toFixed(1)}°C`;
  }

  logKafkaEvent(message) {
    if (!this.elKafkaTicker) return;
    const now = new Date().toLocaleTimeString();
    this.elKafkaTicker.textContent = `[${now}] ${message}`;
  }

  updateRiderProfile(rider) {
    if (!rider) return;
    const nameEl = document.getElementById('riderName');
    const descEl = document.getElementById('riderIdDesc');
    const avatarLetter = document.getElementById('riderAvatarLetter');
    const vehicleBadge = document.getElementById('badgeVehicleType');
    const selectRider = document.getElementById('selectRider');

    if (nameEl) nameEl.textContent = rider.name || 'Rider';
    const riderNum = (rider.worker_id || rider.rider_id || '104').replace('RIDER_', '');
    if (descEl) descEl.textContent = `Zomato Partner ID #${riderNum} • Age ${rider.age || 28}`;
    if (avatarLetter) avatarLetter.textContent = rider.avatar_letter || (rider.name ? rider.name.charAt(0) : 'R');

    if (vehicleBadge) {
      let vEmoji = '🏍️';
      if (rider.vehicle_type === 'scooter') vEmoji = '🛵';
      else if (rider.vehicle_type === 'ev' || (rider.vehicle && rider.vehicle.includes('EV'))) vEmoji = '⚡';
      else if (rider.vehicle_type === 'cycle') vEmoji = '🚲';
      vehicleBadge.textContent = `${vEmoji} ${rider.vehicle || 'Motorcycle'}`;
      if (typeof riderEngine !== 'undefined' && riderEngine && riderEngine.setVehicleIcon) {
        riderEngine.setVehicleIcon(vEmoji);
      }
    }

    if (selectRider && (rider.worker_id || rider.rider_id)) {
      selectRider.value = rider.worker_id || rider.rider_id;
    }

    if (rider.core_temp_c !== undefined) {
      this.updateBiometrics(rider);
    }
  }
}

const hud = new HudController();
