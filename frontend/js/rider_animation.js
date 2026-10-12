/**
 * SolSafe Animated Rider Simulation Engine
 * Interpolates delivery rider "Rahul" on the map, updates real-time speed,
 * biothermal telemetry ticks, and dynamic thermal aura.
 */

class RiderAnimationEngine {
  constructor() {
    this.marker = null;
    this.routeCoords = [];
    this.routeSegments = [];
    this.currentIndex = 0;
    this.isPlaying = false;
    this.animationTimer = null;
    this.speedMultiplier = 1;
    this.activeMode = 'cool'; // 'cool' or 'standard'
    this.onTickCallback = null;
    this.onTripCompleteCallback = null;
    this.onBreakTriggerCallback = null;
  }

  init(map) {
    this.map = map;
    // Create rider marker with custom animated icon
    const riderIcon = L.divIcon({
      className: 'custom-rider-marker',
      html: `
        <div class="rider-marker-wrap" id="riderMarkerWrap">
          <div class="rider-halo halo-cool" id="riderHalo"></div>
          <div class="rider-bike-icon" id="riderBikeIcon" style="transform: rotate(0deg);">
            🛵
          </div>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22]
    });

    this.marker = L.marker([28.6380, 77.2240], { icon: riderIcon, zIndexOffset: 1000 }).addTo(this.map);
  }

  setRoute(routeData, mode = 'cool') {
    this.pause();
    this.activeMode = mode;
    this.routeSegments = routeData.segments || [];

    // Interpolate coordinates for smooth animation (12 steps per waypoint)
    this.routeCoords = this.interpolatePoints(routeData.coordinates, 12);
    this.currentIndex = 0;

    if (this.routeCoords.length > 0 && this.marker) {
      this.marker.setLatLng(this.routeCoords[0]);
    }
    this.updateHaloColor();
  }

  interpolatePoints(coords, steps = 12) {
    if (!coords || coords.length < 2) return coords || [];
    const result = [];
    for (let i = 0; i < coords.length - 1; i++) {
      const p1 = coords[i];
      const p2 = coords[i + 1];
      for (let s = 0; s < steps; s++) {
        const t = s / steps;
        result.push([
          p1[0] + (p2[0] - p1[0]) * t,
          p1[1] + (p2[1] - p1[1]) * t
        ]);
      }
    }
    result.push(coords[coords.length - 1]);
    return result;
  }

  calculateBearing(lat1, lon1, lat2, lon2) {
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const y = Math.sin(dLon) * Math.cos(lat2 * Math.PI / 180);
    const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
              Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLon);
    let brng = Math.atan2(y, x) * 180 / Math.PI;
    return (brng + 360) % 360;
  }

  start() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.step();
  }

  pause() {
    this.isPlaying = false;
    if (this.animationTimer) {
      clearTimeout(this.animationTimer);
      this.animationTimer = null;
    }
  }

  reset() {
    this.pause();
    this.currentIndex = 0;
    if (this.routeCoords.length > 0 && this.marker) {
      this.marker.setLatLng(this.routeCoords[0]);
    }
    this.updateHaloColor();
  }

  setSpeed(multiplier) {
    this.speedMultiplier = multiplier;
  }

  updateHaloColor(isBreak = false) {
    const halo = document.getElementById('riderHalo');
    if (!halo) return;

    if (isBreak) {
      halo.className = 'rider-halo';
      halo.style.background = 'rgba(56, 189, 248, 0.4)';
      halo.style.boxShadow = '0 0 20px #38bdf8';
    } else if (this.activeMode === 'standard') {
      halo.className = 'rider-halo halo-hot';
    } else {
      halo.className = 'rider-halo halo-cool';
    }
  }

  step() {
    if (!this.isPlaying) return;

    if (this.currentIndex >= this.routeCoords.length - 1) {
      this.pause();
      if (this.onTripCompleteCallback) this.onTripCompleteCallback();
      return;
    }

    const currentPos = this.routeCoords[this.currentIndex];
    const nextPos = this.routeCoords[this.currentIndex + 1];

    // Smooth movement
    this.marker.setLatLng(currentPos);

    // Calculate heading angle
    const bearing = this.calculateBearing(currentPos[0], currentPos[1], nextPos[0], nextPos[1]);
    const bikeIcon = document.getElementById('riderBikeIcon');
    if (bikeIcon) {
      bikeIcon.style.transform = `rotate(${Math.round(bearing)}deg)`;
    }

    // Determine current segment telemetry
    const segFraction = this.currentIndex / Math.max(1, this.routeCoords.length);
    const segIndex = Math.min(
      this.routeSegments.length - 1,
      Math.floor(segFraction * this.routeSegments.length)
    );
    const seg = this.routeSegments[segIndex] || {
      road_name: 'Urban Street',
      wbgt: 34.0,
      surface_temp_c: 40.0,
      shade_pct: 60
    };

    // Simulated velocity
    const speed = this.activeMode === 'standard' ? 38.0 : 26.0;

    // Trigger tick callback
    if (this.onTickCallback) {
      this.onTickCallback({
        position: currentPos,
        segment: seg,
        speedKmh: speed,
        mode: this.activeMode,
        progressPct: Math.round(segFraction * 100)
      });
    }

    this.currentIndex++;
    const stepDelay = Math.max(80, Math.floor(450 / this.speedMultiplier));
    this.animationTimer = setTimeout(() => this.step(), stepDelay);
  }

  getCurrentPosition() {
    if (this.routeCoords && this.routeCoords.length > 0) {
      return this.routeCoords[Math.min(this.currentIndex, this.routeCoords.length - 1)];
    }
    return [28.6380, 77.2240];
  }

  setVehicleIcon(icon = '🛵') {
    const el = document.getElementById('riderBikeIcon');
    if (el) el.textContent = icon;
  }
}

const riderEngine = new RiderAnimationEngine();
