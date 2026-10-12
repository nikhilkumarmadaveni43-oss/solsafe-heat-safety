/**
 * SolSafe Leaflet Map Renderer
 * Handles tactical map tiles, satellite thermal heatmap overlays,
 * tree canopy corridors, cool oases shelters, and route polylines.
 */

class MapRenderer {
  constructor(containerId = 'map') {
    this.containerId = containerId;
    this.map = null;
    this.layers = {
      thermalGrid: null,
      canopyCorridors: null,
      oases: null,
      standardRoute: null,
      coolRoute: null,
      markers: null,
      thermalMarks: null
    };
  }

  init(center = [17.4435, 78.3850], zoom = 14) {
    this.map = L.map(this.containerId, {
      center: center,
      zoom: zoom,
      zoomControl: false,
      attributionControl: false
    });

    // Custom tactical zoom control on top-right
    L.control.zoom({ position: 'topright' }).addTo(this.map);

    // Multi-style Base Map Providers
    this.baseTiles = {
      satellite: L.layerGroup([
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          maxZoom: 19
        }),
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
          subdomains: 'abcd',
          opacity: 0.9
        })
      ]),
      dark: L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd'
      }),
      osm: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      })
    };

    // Default to Real Satellite Imagery for Hyderabad
    this.currentBaseStyle = 'satellite';
    this.baseTiles.satellite.addTo(this.map);

    // Initialize layer groups
    this.layers.thermalGrid = L.layerGroup().addTo(this.map);
    this.layers.canopyCorridors = L.layerGroup().addTo(this.map);
    this.layers.oases = L.layerGroup().addTo(this.map);
    this.layers.standardRoute = L.layerGroup().addTo(this.map);
    this.layers.coolRoute = L.layerGroup().addTo(this.map);
    this.layers.markers = L.layerGroup().addTo(this.map);
    this.layers.thermalMarks = L.layerGroup().addTo(this.map);
  }

  setBaseMapStyle(style = 'satellite') {
    if (!this.baseTiles[style]) return;
    // Remove active
    if (this.baseTiles[this.currentBaseStyle]) {
      this.map.removeLayer(this.baseTiles[this.currentBaseStyle]);
    }
    this.currentBaseStyle = style;
    this.baseTiles[style].addTo(this.map);
  }

  renderSatelliteThermalGrid(gridData) {
    this.layers.thermalGrid.clearLayers();
    if (!gridData || !gridData.grid) return;

    gridData.grid.forEach(pt => {
      // Color interpolation based on Land Surface Temp (LST)
      const lst = pt.land_surface_temp_c;
      let color = '#10b981';
      let opacity = 0.35;

      if (lst > 48.0) {
        color = '#ef4444'; // Red heat island
        opacity = 0.55;
      } else if (lst > 42.0) {
        color = '#f59e0b'; // Amber warm
        opacity = 0.40;
      } else {
        color = '#10b981'; // Green cool canopy
        opacity = 0.45;
      }

      const circle = L.circle([pt.lat, pt.lon], {
        radius: 140,
        fillColor: color,
        fillOpacity: opacity,
        stroke: false
      });

      circle.bindTooltip(`
        <div style="font-family: sans-serif; font-size: 11px;">
          <strong>${pt.zone_type}</strong><br/>
          Surface Temp: <b style="color: ${color};">${lst}°C</b><br/>
          NDVI Canopy: <b>${pt.ndvi_canopy_index}</b>
        </div>
      `, { sticky: true });

      this.layers.thermalGrid.addLayer(circle);
    });
  }

  renderCanopyCorridors(networkData) {
    this.layers.canopyCorridors.clearLayers();
    if (!networkData || !networkData.edges) return;

    const nodes = {};
    networkData.nodes.forEach(n => nodes[n.id] = [n.lat, n.lon]);

    networkData.edges.forEach(edge => {
      if (edge.canopy_coverage >= 0.5) {
        const p1 = nodes[edge.u];
        const p2 = nodes[edge.v];
        if (!p1 || !p2) return;

        // Emerald canopy halo
        const canopyLine = L.polyline([p1, p2], {
          color: '#10b981',
          weight: 12,
          opacity: 0.28,
          lineCap: 'round'
        });
        this.layers.canopyCorridors.addLayer(canopyLine);
      }
    });
  }

  renderOases(oasesList, onOasisClick) {
    this.layers.oases.clearLayers();
    if (!oasesList) return;

    oasesList.forEach(oasis => {
      const icon = L.divIcon({
        className: 'custom-oasis-icon',
        html: `
          <div class="oasis-marker-wrap" title="${oasis.name}">
            <span>❄️</span>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });

      const marker = L.marker([oasis.lat, oasis.lon], { icon: icon });

      const popupHtml = `
        <div style="color: #0f172a; font-family: sans-serif; padding: 4px; min-width: 200px;">
          <h4 style="margin: 0 0 4px 0; font-size: 13px; color: #0284c7;">${oasis.name}</h4>
          <p style="margin: 0 0 6px 0; font-size: 11px; color: #64748b;">${oasis.type}</p>
          <div style="font-size: 11px; margin-bottom: 6px;">
            Indoor Temp: <b style="color: #059669;">${oasis.indoor_temp_c}°C (Chilled)</b>
          </div>
          <ul style="font-size: 10px; margin: 0; padding-left: 14px; color: #334155;">
            ${oasis.facilities.map(f => `<li>${f}</li>`).join('')}
          </ul>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on('click', () => {
        if (onOasisClick) onOasisClick(oasis);
      });

      this.layers.oases.addLayer(marker);
    });
  }

  renderRoutes(routesData) {
    this.layers.standardRoute.clearLayers();
    this.layers.coolRoute.clearLayers();
    this.layers.markers.clearLayers();

    if (!routesData || !routesData.routes) return;

    const stdRoute = routesData.routes.standard;
    const coolRoute = routesData.routes.cool;

    // 1. Render Standard Route (Crimson dashed line)
    const stdPolyline = L.polyline(stdRoute.coordinates, {
      color: '#ef4444',
      weight: 5,
      opacity: 0.85,
      dashArray: '8, 8',
      lineCap: 'round'
    });
    stdPolyline.bindTooltip(`
      <b style="color: #ef4444;">Standard Route</b><br/>
      49°C Max WBGT • 0% Trees • High Heat Risk
    `, { sticky: true });
    this.layers.standardRoute.addLayer(stdPolyline);

    // 2. Render Cool Route (Solid Emerald line with cyan glow)
    const coolGlow = L.polyline(coolRoute.coordinates, {
      color: '#38bdf8',
      weight: 9,
      opacity: 0.35,
      lineCap: 'round'
    });
    const coolPolyline = L.polyline(coolRoute.coordinates, {
      color: '#10b981',
      weight: 5,
      opacity: 0.95,
      lineCap: 'round'
    });
    coolPolyline.bindTooltip(`
      <b style="color: #10b981;">SolSafe Cool Route</b><br/>
      -6.6°C WBGT • 82% Canopy Shade • Protected
    `, { sticky: true });
    this.layers.coolRoute.addLayer(coolGlow);
    this.layers.coolRoute.addLayer(coolPolyline);

    // 3. Origin & Destination Markers
    const startCoord = coolRoute.coordinates[0];
    const endCoord = coolRoute.coordinates[coolRoute.coordinates.length - 1];
    const originName = routesData.origin ? routesData.origin.name : 'Order Pickup Hub';
    const destName = routesData.destination ? routesData.destination.name : 'Customer Delivery Drop';

    const startIcon = L.divIcon({
      html: `<div style="background:#0284c7;color:#fff;border-radius:50%;width:26px;height:26px;display:flex;align-items:center;justify-content:center;border:2px solid #fff;font-weight:bold;font-size:12px;box-shadow:0 0 10px #0284c7;">A</div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13]
    });

    const endIcon = L.divIcon({
      html: `<div style="background:#e11d48;color:#fff;border-radius:50%;width:26px;height:26px;display:flex;align-items:center;justify-content:center;border:2px solid #fff;font-weight:bold;font-size:12px;box-shadow:0 0 10px #e11d48;">B</div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13]
    });

    this.layers.markers.addLayer(L.marker(startCoord, { icon: startIcon }).bindTooltip(`<b>Pickup:</b> ${originName}`));
    this.layers.markers.addLayer(L.marker(endCoord, { icon: endIcon }).bindTooltip(`<b>Drop:</b> ${destName}`));

    // Auto-fit bounds on the route
    if (coolPolyline && coolPolyline.getBounds().isValid()) {
      this.map.fitBounds(coolPolyline.getBounds(), { padding: [45, 45], maxZoom: 15 });
    }
  }

  highlightActiveRoute(mode = 'cool') {
    if (mode === 'cool') {
      this.layers.coolRoute.eachLayer(l => {
        if (l.setStyle) l.setStyle({ opacity: 0.95, weight: 6 });
      });
      this.layers.standardRoute.eachLayer(l => {
        if (l.setStyle) l.setStyle({ opacity: 0.35, weight: 3 });
      });
    } else {
      this.layers.coolRoute.eachLayer(l => {
        if (l.setStyle) l.setStyle({ opacity: 0.35, weight: 3 });
      });
      this.layers.standardRoute.eachLayer(l => {
        if (l.setStyle) l.setStyle({ opacity: 0.95, weight: 6 });
      });
    }
  }

  recenter(center, zoom = 14) {
    if (this.map && center) {
      this.map.flyTo(center, zoom, { duration: 1.2 });
    }
  }

  renderLiveGpsMarker(lat, lon, label = 'Your Live Location (Hyderabad)') {
    if (!this.layers.gpsMarker) {
      this.layers.gpsMarker = L.layerGroup().addTo(this.map);
    }
    this.layers.gpsMarker.clearLayers();

    const gpsIcon = L.divIcon({
      className: 'live-gps-marker',
      html: `
        <div style="position:relative; width:30px; height:30px; display:flex; align-items:center; justify-content:center;">
          <div style="position:absolute; width:100%; height:100%; border-radius:50%; background:rgba(56,189,248,0.4); animation:radarPulse 1.5s infinite;"></div>
          <div style="width:14px; height:14px; border-radius:50%; background:#38bdf8; border:2px solid #fff; box-shadow:0 0 12px #38bdf8; z-index:2;"></div>
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });

    const marker = L.marker([lat, lon], { icon: gpsIcon, zIndexOffset: 2000 })
      .bindTooltip(`<b>📍 ${label}</b><br/>Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`, { permanent: true, direction: 'top' });

    this.layers.gpsMarker.addLayer(marker);
    this.recenter([lat, lon], 15);
  }

  toggleThermalGrid(show) {
    if (show) this.map.addLayer(this.layers.thermalGrid);
    else this.map.removeLayer(this.layers.thermalGrid);
  }

  toggleCanopy(show) {
    if (show) this.map.addLayer(this.layers.canopyCorridors);
    else this.map.removeLayer(this.layers.canopyCorridors);
  }

  toggleOases(show) {
    if (show) this.map.addLayer(this.layers.oases);
    else this.map.removeLayer(this.layers.oases);
  }

  renderAreaThermalMarks(networkData, weatherParams = {}) {
    if (!this.layers.thermalMarks) return;
    this.layers.thermalMarks.clearLayers();
    if (!networkData || !networkData.nodes) return;

    const baseTemp = (weatherParams && weatherParams.temp) ? Number(weatherParams.temp) : 44.0;
    const edges = networkData.edges || [];

    networkData.nodes.forEach(node => {
      // Find connected edges
      const connectedEdges = edges.filter(e => e.u === node.id || e.v === node.id);
      let avgCanopy = 0.1;
      let hasFlyover = false;
      let hasHighway = false;

      if (connectedEdges.length > 0) {
        const totalCanopy = connectedEdges.reduce((acc, e) => acc + (e.canopy_coverage || 0), 0);
        avgCanopy = totalCanopy / connectedEdges.length;
        hasFlyover = connectedEdges.some(e => e.is_elevated_flyover);
        hasHighway = connectedEdges.some(e => e.is_asphalt_highway);
      }

      // Microclimate surface and WBGT calculations
      let surfaceTemp = baseTemp + 5.0;
      let wbgt = 36.5;
      let category = 'warm';
      let icon = '☀️';
      let label = 'Moderate Urban Corridor';
      let color = '#f59e0b';

      if (hasFlyover) {
        surfaceTemp = baseTemp + 15.4;
        wbgt = 41.5;
        category = 'hot';
        icon = '🔥';
        label = 'Extreme Flyover Heat Trap';
        color = '#ef4444';
      } else if (avgCanopy >= 0.45) {
        surfaceTemp = baseTemp - 5.2;
        wbgt = 33.4;
        category = 'cool';
        icon = '🌿';
        label = 'Cool Tree Canopy Oasis';
        color = '#10b981';
      } else if (hasHighway) {
        surfaceTemp = baseTemp + 10.6;
        wbgt = 39.2;
        category = 'hot';
        icon = '🔥';
        label = 'High Asphalt Radiation Highway';
        color = '#ef4444';
      }

      // Concise label for map badge
      let shortName = node.name.split('(')[0].trim();
      if (shortName.length > 16) {
        shortName = shortName.substring(0, 15) + '…';
      }

      const badgeHtml = `
        <div class="thermal-badge ${category}">
          <span class="thermal-badge-icon">${icon}</span>
          <span class="thermal-badge-temp">${surfaceTemp.toFixed(1)}°C</span>
          <span class="thermal-badge-name">${shortName}</span>
        </div>
      `;

      const badgeIcon = L.divIcon({
        className: 'thermal-badge-container',
        html: badgeHtml,
        iconSize: [110, 26],
        iconAnchor: [55, 13]
      });

      const marker = L.marker([node.lat, node.lon], { icon: badgeIcon, zIndexOffset: 500 });
      marker.bindTooltip(`
        <div style="font-family: sans-serif; font-size: 11px; padding: 4px; min-width: 175px;">
          <strong style="color: #0284c7; font-size: 12px;">${node.name}</strong>
          <div style="margin-top: 5px; line-height: 1.5; color: #1e293b;">
            Road Asphalt Heat: <b style="color: ${color};">${surfaceTemp.toFixed(1)}°C</b><br/>
            Microclimate WBGT: <b style="color: ${color};">${wbgt.toFixed(1)}°C</b><br/>
            Tree Shade Factor: <b>${Math.round(avgCanopy * 100)}%</b><br/>
            Thermal Classification: <b style="color: ${color};">${label}</b>
          </div>
        </div>
      `, { sticky: true });

      this.layers.thermalMarks.addLayer(marker);
    });
  }

  toggleThermalMarks(show) {
    if (!this.layers.thermalMarks) return;
    if (show) this.map.addLayer(this.layers.thermalMarks);
    else this.map.removeLayer(this.layers.thermalMarks);
  }
}

const mapRenderer = new MapRenderer('map');
