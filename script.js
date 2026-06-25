const DEFAULT_PLACE = {
  label: "Coimbra, Portugal",
  lat: 40.2033,
  lng: -8.4103,
};

const bandColors = {
  1: "#0b6e4f",
  5: "#1a936f",
  10: "#2fbf71",
  15: "#8bd346",
  20: "#d6d94f",
  30: "#f5c542",
  45: "#f28f3b",
  60: "#d94f45",
};

const ORS_ENDPOINT = "https://api.openrouteservice.org/v2/isochrones";
const ORS_KEY_STORAGE = "time-to-x:ors-api-key";
const ORS_MAX_DRIVING_MINUTES = 60;

const mapStyles = {
  voyager: {
    label: "Detailed",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  light: {
    label: "Light print",
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  dark: {
    label: "Dark",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
};

const form = document.querySelector("#location-form");
const input = document.querySelector("#location-input");
const orsApiKeyInput = document.querySelector("#ors-api-key");
const clearApiKeyButton = document.querySelector("#clear-api-key");
const mapStyleSelect = document.querySelector("#map-style");
const maxTimeSelect = document.querySelector("#max-time");
const overlayOpacityInput = document.querySelector("#overlay-opacity");
const includeLegendInput = document.querySelector("#include-legend");
const prepareExportButton = document.querySelector("#prepare-export");
const exportSelectionButton = document.querySelector("#export-selection");
const resetExportFrameButton = document.querySelector("#reset-export-frame");
const cancelExportButton = document.querySelector("#cancel-export");
const useLocationButton = document.querySelector("#use-location");
const statusEl = document.querySelector("#status");

const map = L.map("map", {
  zoomControl: false,
}).setView([DEFAULT_PLACE.lat, DEFAULT_PLACE.lng], 10);

L.control.zoom({ position: "bottomright" }).addTo(map);

let baseLayer = createBaseLayer(mapStyles.voyager).addTo(map);

let overlayLayer = L.featureGroup().addTo(map);
let originMarker = createOriginMarker(DEFAULT_PLACE.lat, DEFAULT_PLACE.lng, DEFAULT_PLACE.label).addTo(map);
let exportFrame = createExportFrame();
let exportHandles = createExportHandles();
let isExportMode = false;
let pendingPrintView = null;
let dragState = null;

input.value = DEFAULT_PLACE.label;
orsApiKeyInput.value = sessionStorage.getItem(ORS_KEY_STORAGE) || "";
refreshTravelTimeOverlay(DEFAULT_PLACE.lat, DEFAULT_PLACE.lng);

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const query = input.value.trim();

  if (!query) {
    setStatus("Enter a place to search.");
    return;
  }

  setStatus(`Searching for "${query}"...`);

  try {
    const result = await geocode(query);
    if (!result) {
      setStatus(`No location found for "${query}".`);
      return;
    }

    await setOrigin(result.lat, result.lng, result.label);
  } catch (error) {
    setStatus("Location search failed. The public geocoder may be busy.");
  }
});

useLocationButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    setStatus("This browser does not support geolocation.");
    return;
  }

  setStatus("Requesting your location...");
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      input.value = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
      setOrigin(latitude, longitude, "your current location");
    },
    () => {
      setStatus("Could not access your location.");
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
});

document.querySelectorAll('input[name="travel-mode"]').forEach((control) => {
  control.addEventListener("change", async () => {
    const center = originMarker.getLatLng();
    await refreshTravelTimeOverlay(center.lat, center.lng);
  });
});

document.querySelectorAll('input[name="traffic-mode"]').forEach((control) => {
  control.addEventListener("change", async () => {
    const center = originMarker.getLatLng();
    await refreshTravelTimeOverlay(center.lat, center.lng);
  });
});

mapStyleSelect.addEventListener("change", () => {
  setBaseMapStyle(mapStyleSelect.value);
});

prepareExportButton.addEventListener("click", () => {
  enterExportMode();
});

exportSelectionButton.addEventListener("click", () => {
  exportSelectedFrameToPdf();
});

maxTimeSelect.addEventListener("change", async () => {
  const center = originMarker.getLatLng();
  await refreshTravelTimeOverlay(center.lat, center.lng);
});

overlayOpacityInput.addEventListener("input", () => {
  updateOverlayOpacity();
});

resetExportFrameButton.addEventListener("click", () => {
  resetExportFrame();
});

cancelExportButton.addEventListener("click", () => {
  exitExportMode();
});

window.addEventListener("afterprint", () => {
  if (!pendingPrintView) {
    return;
  }

  map.setView(pendingPrintView.center, pendingPrintView.zoom, { animate: false });
  pendingPrintView = null;
  document.body.classList.remove("no-print-legend");
});

document.addEventListener("mouseup", () => {
  finishExportFrameDrag();
});

map.on("contextmenu", async (event) => {
  const { lat, lng } = event.latlng;
  input.value = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  await setOrigin(lat, lng, "selected map point", { recenter: false });
});

map.on("mousemove", (event) => {
  if (!dragState) {
    return;
  }

  moveExportFrame(event.latlng);
});

map.on("mouseup", () => {
  finishExportFrameDrag();
});

orsApiKeyInput.addEventListener("change", async () => {
  const key = orsApiKeyInput.value.trim();

  if (key) {
    sessionStorage.setItem(ORS_KEY_STORAGE, key);
  } else {
    sessionStorage.removeItem(ORS_KEY_STORAGE);
  }

  const center = originMarker.getLatLng();
  await refreshTravelTimeOverlay(center.lat, center.lng);
});

clearApiKeyButton.addEventListener("click", async () => {
  orsApiKeyInput.value = "";
  sessionStorage.removeItem(ORS_KEY_STORAGE);

  const center = originMarker.getLatLng();
  await refreshTravelTimeOverlay(center.lat, center.lng);
});

async function geocode(query) {
  const params = new URLSearchParams({
    q: query,
    format: "jsonv2",
    limit: "1",
  });

  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Geocoding failed");
  }

  const results = await response.json();
  const first = results[0];

  if (!first) {
    return null;
  }

  return {
    label: first.display_name,
    lat: Number(first.lat),
    lng: Number(first.lon),
  };
}

async function setOrigin(lat, lng, label, options = {}) {
  originMarker.setLatLng([lat, lng]).bindPopup(label).openPopup();

  if (options.recenter !== false) {
    map.setView([lat, lng], 10);
  }

  await refreshTravelTimeOverlay(lat, lng);
}

function createOriginMarker(lat, lng, label) {
  return L.circleMarker([lat, lng], {
    radius: 9,
    color: "#ffffff",
    fillColor: "#13505b",
    fillOpacity: 1,
    opacity: 1,
    weight: 3,
  }).bindPopup(label);
}

async function refreshTravelTimeOverlay(lat, lng) {
  const mode = document.querySelector('input[name="travel-mode"]:checked').value;
  const traffic = document.querySelector('input[name="traffic-mode"]:checked').value;
  const provider = getTravelTimeProvider();
  const requestedMinutes = getSelectedTimeBands();

  setStatus(`Loading ${provider} ${mode} bands...`);

  try {
    const minutes = getProviderTimeBands(provider, mode, requestedMinutes);
    const result = await getTravelTimeOverlay({
      lat,
      lng,
      mode,
      traffic,
      minutes,
      requestedMinutes,
      provider,
    });

    renderTravelTimeOverlay(result);
    fitMapToOverlay();
    setStatus(describeOverlayResult(result, mode, traffic));
  } catch (error) {
    renderTravelTimeOverlay(getDemoOverlay({ lat, lng, mode, traffic, minutes: requestedMinutes }));
    fitMapToOverlay();
    setStatus(`${error.message} Showing demo bands instead.`);
  }
}

async function getTravelTimeOverlay(request) {
  if (request.provider === "demo") {
    return getDemoOverlay(request);
  }

  if (request.provider === "openrouteservice") {
    return getOpenRouteServiceOverlay(request);
  }

  throw new Error(`Unsupported travel-time provider: ${request.provider}`);
}

async function getOpenRouteServiceOverlay(request) {
  const apiKey = getOpenRouteServiceApiKey();
  const profile = getOpenRouteServiceProfile(request.mode);
  const ranges = request.minutes.map((minutes) => minutes * 60);

  const response = await fetch(`${ORS_ENDPOINT}/${profile}`, {
    method: "POST",
    headers: {
      Accept: "application/json, application/geo+json",
      Authorization: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      locations: [[request.lng, request.lat]],
      range: ranges,
      range_type: "time",
      smoothing: 0.25,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouteService returned ${response.status}.`);
  }

  const geojson = await response.json();

  return {
    provider: "openrouteservice",
    type: "geojson",
    requestedMinutes: request.requestedMinutes,
    geojson: styleIsochroneGeoJson(geojson),
  };
}

function getOpenRouteServiceProfile(mode) {
  if (mode === "walk") {
    return "foot-walking";
  }

  return "driving-car";
}

function getDemoOverlay(request) {
  return {
    provider: "demo",
    type: "concentric-rings",
    origin: { lat: request.lat, lng: request.lng },
    mode: request.mode,
    traffic: request.traffic,
    minutes: request.minutes,
    requestedMinutes: request.requestedMinutes || request.minutes,
  };
}

function renderTravelTimeOverlay(result) {
  if (result.type === "concentric-rings") {
    drawDemoBands(result.origin.lat, result.origin.lng, result.mode, result.minutes);
    return;
  }

  if (result.type === "geojson") {
    drawGeoJsonBands(result.geojson);
    return;
  }

  throw new Error(`Unsupported overlay result type: ${result.type}`);
}

function drawGeoJsonBands(geojson) {
  overlayLayer.clearLayers();

  const sortedFeatures = createBandedIsochroneFeatures(geojson.features || []);

  L.geoJSON({ ...geojson, features: sortedFeatures }, {
    style: (feature) => {
      const properties = feature.properties || {};

      return {
        color: properties.color || properties.fillColor || "#1f7a8c",
        fillColor: properties.fillColor || properties.fill || "#1f7a8c",
        fillOpacity: getOverlayOpacity(),
        opacity: properties.opacity || 0.85,
        weight: 2,
      };
    },
  }).addTo(overlayLayer);
}

function styleIsochroneGeoJson(geojson) {
  return {
    ...geojson,
    features: (geojson.features || []).map((feature) => {
      const minutes = getIsochroneMinutes(feature);
      const color = getBandColor(minutes);

      return {
        ...feature,
        properties: {
          ...(feature.properties || {}),
          minutes,
          color,
          fillColor: color,
        },
      };
    }),
  };
}

function createBandedIsochroneFeatures(features) {
  const sorted = [...features].sort((a, b) => {
    return getIsochroneMinutes(a) - getIsochroneMinutes(b);
  });

  return sorted.map((feature, index) => {
    const previous = sorted[index - 1];

    if (!previous) {
      return feature;
    }

    return {
      ...feature,
      geometry: subtractPreviousIsochrone(feature.geometry, previous.geometry),
    };
  }).sort((a, b) => {
    return getIsochroneMinutes(b) - getIsochroneMinutes(a);
  });
}

function subtractPreviousIsochrone(geometry, previousGeometry) {
  if (!geometry || !previousGeometry) {
    return geometry;
  }

  if (geometry.type === "Polygon" && previousGeometry.type === "Polygon") {
    return {
      ...geometry,
      coordinates: addHolesToPolygon(geometry.coordinates, [previousGeometry.coordinates[0]]),
    };
  }

  if (geometry.type === "MultiPolygon" && previousGeometry.type === "MultiPolygon") {
    const previousHoles = previousGeometry.coordinates.map((polygon) => polygon[0]);

    return {
      ...geometry,
      coordinates: geometry.coordinates.map((polygon) => addHolesToPolygon(polygon, previousHoles)),
    };
  }

  return geometry;
}

function addHolesToPolygon(polygonCoordinates, holes) {
  const existingHoles = polygonCoordinates.slice(1);

  return [
    polygonCoordinates[0],
    ...existingHoles,
    ...holes,
  ];
}

function getIsochroneMinutes(feature) {
  const properties = feature.properties || {};
  const seconds = properties.value || properties.contour || properties.time || 0;

  return Math.round(seconds / 60);
}

function drawDemoBands(lat, lng, mode, minutes = [1, 5, 10, 15, 20, 30, 45, 60]) {
  overlayLayer.clearLayers();

  const minutesToMeters = mode === "walk" ? 80 : 850;
  const bands = [...minutes].sort((a, b) => a - b);

  bands.forEach((minutes, index) => {
    const previousMinutes = bands[index - 1] || 0;

    L.polygon(createDemoRing(lat, lng, previousMinutes * minutesToMeters, minutes * minutesToMeters), {
      color: getBandColor(minutes),
      fillColor: getBandColor(minutes),
      fillOpacity: getOverlayOpacity(),
      fillRule: "evenodd",
      opacity: 0.85,
      weight: 2,
    }).addTo(overlayLayer);
  });
}

function createDemoRing(lat, lng, innerRadiusMeters, outerRadiusMeters) {
  const outer = createCircleCoordinates(lat, lng, outerRadiusMeters);

  if (!innerRadiusMeters) {
    return [outer];
  }

  const inner = createCircleCoordinates(lat, lng, innerRadiusMeters).reverse();

  return [outer, inner];
}

function createCircleCoordinates(lat, lng, radiusMeters) {
  const steps = 96;
  const earthRadiusMeters = 6378137;
  const latRadians = degreesToRadians(lat);
  const coordinates = [];

  for (let step = 0; step <= steps; step += 1) {
    const angle = (step / steps) * Math.PI * 2;
    const deltaLat = (radiusMeters * Math.sin(angle)) / earthRadiusMeters;
    const deltaLng = (radiusMeters * Math.cos(angle)) / (earthRadiusMeters * Math.cos(latRadians));

    coordinates.push([
      lat + radiansToDegrees(deltaLat),
      lng + radiansToDegrees(deltaLng),
    ]);
  }

  return coordinates;
}

function degreesToRadians(degrees) {
  return degrees * (Math.PI / 180);
}

function radiansToDegrees(radians) {
  return radians * (180 / Math.PI);
}

function createBaseLayer(style) {
  return L.tileLayer(style.url, {
    maxZoom: 19,
    attribution: style.attribution,
  });
}

function getBandColor(minutes) {
  if (minutes <= 1) {
    return bandColors[1];
  }

  if (minutes <= 5) {
    return bandColors[5];
  }

  if (minutes <= 10) {
    return bandColors[10];
  }

  if (minutes <= 15) {
    return bandColors[15];
  }

  if (minutes <= 20) {
    return bandColors[20];
  }

  if (minutes <= 30) {
    return bandColors[30];
  }

  if (minutes <= 45) {
    return bandColors[45];
  }

  return bandColors[60];
}

function getSelectedTimeBands() {
  const maxMinutes = Number(maxTimeSelect.value);
  const allBands = [1, 5, 10, 15, 20, 30, 45, 60];

  return allBands.filter((minutes) => minutes <= maxMinutes);
}

function getProviderTimeBands(provider, mode, requestedMinutes) {
  if (provider === "openrouteservice" && mode === "drive") {
    return requestedMinutes.filter((minutes) => minutes <= ORS_MAX_DRIVING_MINUTES);
  }

  return requestedMinutes;
}

function fitMapToOverlay() {
  const bounds = overlayLayer.getBounds();

  if (bounds.isValid()) {
    map.fitBounds(bounds, {
      padding: [36, 36],
      maxZoom: 11,
    });
  }

  window.setTimeout(() => {
    if (isExportMode) {
      resetExportFrame();
    }
  }, 0);
}

function getTravelTimeProvider() {
  return getOpenRouteServiceApiKey() ? "openrouteservice" : "demo";
}

function getOpenRouteServiceApiKey() {
  return orsApiKeyInput.value.trim() || sessionStorage.getItem(ORS_KEY_STORAGE) || "";
}

function setBaseMapStyle(styleId) {
  const style = mapStyles[styleId] || mapStyles.voyager;

  map.removeLayer(baseLayer);
  baseLayer = createBaseLayer(style).addTo(map);
  baseLayer.bringToBack();
  setStatus(`Map style changed to ${style.label}.`);
}

function describeOverlayResult(result, mode, traffic) {
  if (result.provider === "demo") {
    return `Showing demo ${mode} bands. Paste an OpenRouteService key for real isochrones.`;
  }

  const requestedMax = Math.max(...(result.requestedMinutes || []));
  if (mode === "drive" && requestedMax > ORS_MAX_DRIVING_MINUTES) {
    return `Showing OpenRouteService drive isochrones up to 60 minutes. Hosted ORS currently caps driving isochrones at 1 hour.`;
  }

  if (traffic !== "traffic-free") {
    return `Showing OpenRouteService ${mode} isochrones. Traffic mode is not applied by this provider yet.`;
  }

  return `Showing OpenRouteService ${mode} isochrones.`;
}

function setStatus(message) {
  statusEl.textContent = message;
}

function getOverlayOpacity() {
  return Number(overlayOpacityInput.value) / 100;
}

function updateOverlayOpacity() {
  overlayLayer.eachLayer((layer) => {
    if (typeof layer.setStyle === "function") {
      layer.setStyle({ fillOpacity: getOverlayOpacity() });
    }
  });
}

function createExportFrame() {
  const rectangle = L.rectangle(getDefaultExportFrameBounds(), {
    className: "export-frame",
    color: "#13505b",
    fillColor: "#ffffff",
    fillOpacity: 0.04,
    interactive: true,
    opacity: 0.95,
    weight: 3,
    dashArray: "10 7",
  });

  rectangle.on("mousedown", (event) => {
    L.DomEvent.stopPropagation(event);
    startExportFrameDrag(event.latlng);
  });

  return rectangle;
}

function createExportHandles() {
  return ["northWest", "northEast", "southEast", "southWest"].map((corner) => {
    const marker = L.marker([0, 0], {
      draggable: true,
      icon: L.divIcon({
        className: "export-handle-icon",
        html: '<div class="export-handle"></div>',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      }),
      zIndexOffset: 1000,
    });

    marker.on("drag", (event) => {
      resizeExportFrame(corner, event.target.getLatLng());
    });

    marker.on("dragend", () => {
      updateExportHandles();
    });

    return { corner, marker };
  });
}

function enterExportMode() {
  isExportMode = true;

  if (!map.hasLayer(exportFrame)) {
    exportFrame.addTo(map);
  }

  exportHandles.forEach(({ marker }) => {
    if (!map.hasLayer(marker)) {
      marker.addTo(map);
    }
  });

  resetExportFrame();
  updateExportControls();
  setStatus("Adjust the export frame, then choose Export selection.");
}

function exitExportMode() {
  isExportMode = false;
  finishExportFrameDrag();

  if (map.hasLayer(exportFrame)) {
    map.removeLayer(exportFrame);
  }

  exportHandles.forEach(({ marker }) => {
    if (map.hasLayer(marker)) {
      map.removeLayer(marker);
    }
  });

  updateExportControls();
  setStatus("Export selection cancelled.");
}

function updateExportControls() {
  prepareExportButton.classList.toggle("is-hidden", isExportMode);
  exportSelectionButton.classList.toggle("is-hidden", !isExportMode);
  resetExportFrameButton.classList.toggle("is-hidden", !isExportMode);
  cancelExportButton.classList.toggle("is-hidden", !isExportMode);
}

function getDefaultExportFrameBounds() {
  const center = map.getCenter();
  const size = map.getSize();
  const width = Math.max(260, size.x * 0.58);
  const height = width / 1.414;
  const centerPoint = map.latLngToContainerPoint(center);
  const northWest = map.containerPointToLatLng([
    centerPoint.x - width / 2,
    centerPoint.y - height / 2,
  ]);
  const southEast = map.containerPointToLatLng([
    centerPoint.x + width / 2,
    centerPoint.y + height / 2,
  ]);

  return L.latLngBounds(northWest, southEast);
}

function resetExportFrame() {
  exportFrame.setBounds(getDefaultExportFrameBounds());
  updateExportHandles();
}

function startExportFrameDrag(latlng) {
  dragState = {
    startLatLng: latlng,
    startBounds: exportFrame.getBounds(),
  };

  map.dragging.disable();
  setStatus("Drag the export frame to choose the PDF area.");
}

function moveExportFrame(latlng) {
  const latDelta = latlng.lat - dragState.startLatLng.lat;
  const lngDelta = latlng.lng - dragState.startLatLng.lng;
  const bounds = dragState.startBounds;

  exportFrame.setBounds(L.latLngBounds(
    [
      bounds.getSouth() + latDelta,
      bounds.getWest() + lngDelta,
    ],
    [
      bounds.getNorth() + latDelta,
      bounds.getEast() + lngDelta,
    ]
  ));
}

function finishExportFrameDrag() {
  if (!dragState) {
    return;
  }

  dragState = null;
  map.dragging.enable();
  updateExportHandles();
  setStatus("Export frame moved. Use Export selection to print that area.");
}

function exportSelectedFrameToPdf() {
  if (!isExportMode) {
    enterExportMode();
    return;
  }

  pendingPrintView = {
    center: map.getCenter(),
    zoom: map.getZoom(),
  };

  document.body.classList.toggle("no-print-legend", !includeLegendInput.checked);
  map.fitBounds(exportFrame.getBounds(), {
    animate: false,
    padding: [0, 0],
  });
  map.invalidateSize();
  setStatus("Preparing selected export area...");

  window.setTimeout(() => {
    window.print();
  }, 250);
}

function updateExportHandles() {
  if (!exportFrame) {
    return;
  }

  const bounds = exportFrame.getBounds();
  const corners = {
    northWest: bounds.getNorthWest(),
    northEast: bounds.getNorthEast(),
    southEast: bounds.getSouthEast(),
    southWest: bounds.getSouthWest(),
  };

  exportHandles.forEach(({ corner, marker }) => {
    marker.setLatLng(corners[corner]);
  });
}

function resizeExportFrame(corner, latlng) {
  const bounds = exportFrame.getBounds();
  const oppositeCorner = {
    northWest: bounds.getSouthEast(),
    northEast: bounds.getSouthWest(),
    southEast: bounds.getNorthWest(),
    southWest: bounds.getNorthEast(),
  }[corner];

  const oppositePoint = map.latLngToContainerPoint(oppositeCorner);
  const draggedPoint = map.latLngToContainerPoint(latlng);
  const minSize = 120;
  const xDirection = draggedPoint.x < oppositePoint.x ? -1 : 1;
  const yDirection = draggedPoint.y < oppositePoint.y ? -1 : 1;
  const width = Math.max(minSize, Math.abs(draggedPoint.x - oppositePoint.x));
  const height = Math.max(minSize, Math.abs(draggedPoint.y - oppositePoint.y));
  const adjustedPoint = L.point(oppositePoint.x + xDirection * width, oppositePoint.y + yDirection * height);

  exportFrame.setBounds(L.latLngBounds(
    oppositeCorner,
    map.containerPointToLatLng(adjustedPoint)
  ));
  updateExportHandles();
}
