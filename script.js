const DEFAULT_PLACE = {
  label: "Coimbra, Portugal",
  lat: 40.2033,
  lng: -8.4103,
};

const overlayPalettes = {
  classic: {
    label: "Classic",
    colors: {
      1: "#0b6e4f",
      5: "#1a936f",
      10: "#2fbf71",
      15: "#8bd346",
      20: "#d6d94f",
      30: "#f5c542",
      45: "#f28f3b",
      60: "#d94f45",
    },
  },
  warm: {
    label: "Warm",
    colors: {
      1: "#7f1d1d",
      5: "#b91c1c",
      10: "#dc2626",
      15: "#f97316",
      20: "#f59e0b",
      30: "#facc15",
      45: "#fde68a",
      60: "#fff7ed",
    },
  },
  bluegreen: {
    label: "Blue-green",
    colors: {
      1: "#083344",
      5: "#155e75",
      10: "#0e7490",
      15: "#0891b2",
      20: "#14b8a6",
      30: "#2dd4bf",
      45: "#99f6e4",
      60: "#ecfeff",
    },
  },
  grayscale: {
    label: "Grayscale",
    colors: {
      1: "#111827",
      5: "#374151",
      10: "#4b5563",
      15: "#6b7280",
      20: "#9ca3af",
      30: "#d1d5db",
      45: "#e5e7eb",
      60: "#f9fafb",
    },
  },
};

const ORS_ENDPOINT = "https://api.openrouteservice.org/v2/isochrones";
const ORS_DIRECTIONS_ENDPOINT = "https://api.openrouteservice.org/v2/directions";
const ORS_KEY_STORAGE = "time-to-x:ors-api-key";
const LAST_ORIGIN_STORAGE = "isochrones:last-origin";
const SAVED_OVERLAYS_STORAGE = "isochrones:saved-overlays";
const ORS_MAX_DRIVING_MINUTES = 60;
const ZOOM_CLOSER_DELTA = Math.log2(1.45);
const EXPORT_MAX_PAGE_WIDTH = 1056;
const EXPORT_MAX_PAGE_HEIGHT = 816;
const FETCH_REAL_DATA_LABEL = "Get real data";
const MAX_SAMPLE_ROUTES = 72;
const ROUTE_SAMPLE_COUNTS = {
  1: 2,
  5: 5,
  10: 8,
  15: 8,
  20: 10,
  30: 10,
  45: 10,
  60: 10,
};

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

const toggleSidebarButton = document.querySelector("#toggle-sidebar");
const orsApiKeyInput = document.querySelector("#ors-api-key");
const fetchRealDataButton = document.querySelector("#fetch-real-data");
const includeSampleRoutesInput = document.querySelector("#include-sample-routes");
const saveOverlayButton = document.querySelector("#save-overlay");
const clearApiKeyButton = document.querySelector("#clear-api-key");
const savedOverlaysSelect = document.querySelector("#saved-overlays");
const loadOverlayButton = document.querySelector("#load-overlay");
const renameOverlayButton = document.querySelector("#rename-overlay");
const duplicateOverlayButton = document.querySelector("#duplicate-overlay");
const deleteOverlayButton = document.querySelector("#delete-overlay");
const overlayMetadata = document.querySelector("#overlay-metadata");
const overlayTools = document.querySelector("#overlay-tools");
const mapStyleSelect = document.querySelector("#map-style");
const overlayPaletteSelect = document.querySelector("#overlay-palette");
const maxTimeSelect = document.querySelector("#max-time");
const overlayOpacityInput = document.querySelector("#overlay-opacity");
const exportQualitySelect = document.querySelector("#export-quality");
const exportTitleInput = document.querySelector("#export-title");
const exportSubtitleInput = document.querySelector("#export-subtitle");
const includeLegendInput = document.querySelector("#include-legend");
const includeMetadataInput = document.querySelector("#include-metadata");
const includeOriginLabelInput = document.querySelector("#include-origin-label");
const includeBandLabelsInput = document.querySelector("#include-band-labels");
const exportAnnotationInput = document.querySelector("#export-annotation");
const prepareExportButton = document.querySelector("#prepare-export");
const exportSelectionButton = document.querySelector("#export-selection");
const resetExportFrameButton = document.querySelector("#reset-export-frame");
const cancelExportButton = document.querySelector("#cancel-export");
const useLocationButton = document.querySelector("#use-location");
const statusEl = document.querySelector("#status");
const printPageStyle = document.querySelector("#print-page-style");
const localConfig = window.ISOCHRONES_CONFIG || {};
const initialPlace = getInitialPlace();
const initialSavedOverlay = getLatestSavedOverlay();

const map = L.map("map", {
  zoomControl: false,
  zoomSnap: 0.1,
  zoomDelta: 0.5,
}).setView([initialPlace.lat, initialPlace.lng], 10 + ZOOM_CLOSER_DELTA);

L.control.zoom({ position: "bottomright" }).addTo(map);

let baseLayer = createBaseLayer(mapStyles.voyager).addTo(map);

let overlayLayer = L.featureGroup().addTo(map);
let routeLayer = L.featureGroup().addTo(map);
let originMarker = createOriginMarker(initialPlace.lat, initialPlace.lng, initialPlace.label).addTo(map);
let exportFrame = createExportFrame();
let exportHandles = createExportHandles();
let isExportMode = false;
let useRealData = false;
let currentOverlayResult = null;
let currentOrigin = initialPlace;
let pendingPrintView = null;
let pendingPrintCrop = null;
let dragState = null;
let savedExportFrameBounds = null;

orsApiKeyInput.value = getStoredOpenRouteServiceApiKey();
updateLegendPalette();
refreshSavedOverlayList();
if (initialSavedOverlay) {
  loadOverlay(initialSavedOverlay, { announce: false });
} else {
  refreshTravelTimeOverlay(initialPlace.lat, initialPlace.lng);
}

toggleSidebarButton.addEventListener("click", () => {
  const collapsed = document.body.classList.toggle("sidebar-collapsed");
  toggleSidebarButton.textContent = collapsed ? "☰" : "×";
  toggleSidebarButton.setAttribute("aria-label", collapsed ? "Expand controls" : "Collapse controls");
  toggleSidebarButton.setAttribute("aria-expanded", String(!collapsed));

  window.setTimeout(() => {
    map.invalidateSize();
  }, 250);
});

useLocationButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    setStatus("This browser does not support geolocation.");
    return;
  }

  setStatus("Requesting your location...");
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      await setOrigin(latitude, longitude, await getReadableLocationName(latitude, longitude));
    },
    () => {
      setStatus("Could not access your location.");
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
});

document.querySelectorAll('input[name="travel-mode"]').forEach((control) => {
  control.addEventListener("change", async () => {
    invalidateRealData();
    await refreshCreationSettingsPreview();
  });
});

document.querySelectorAll('input[name="traffic-mode"]').forEach((control) => {
  control.addEventListener("change", async () => {
    invalidateRealData();
    await refreshCreationSettingsPreview();
  });
});

mapStyleSelect.addEventListener("change", () => {
  setBaseMapStyle(mapStyleSelect.value);
});

overlayPaletteSelect.addEventListener("change", () => {
  updateLegendPalette();

  if (currentOverlayResult) {
    renderTravelTimeOverlay(currentOverlayResult);
  }

  setStatus(`Overlay palette changed to ${getCurrentPalette().label}.`);
});

prepareExportButton.addEventListener("click", () => {
  enterExportMode();
});

exportSelectionButton.addEventListener("click", () => {
  exportSelectedFrameToSvg();
});

maxTimeSelect.addEventListener("change", async () => {
  invalidateRealData();
  await refreshCreationSettingsPreview();
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
  map.invalidateSize();
  pendingPrintView = null;
  pendingPrintCrop = null;
  document.body.classList.remove("no-print-legend");
  document.body.classList.remove("print-crop");
  clearPrintCropVars();
  clearPrintPageStyle();
});

window.addEventListener("beforeprint", () => {
  if (pendingPrintCrop) {
    applyPrintCropVars(pendingPrintCrop);
  }
});

document.addEventListener("mouseup", () => {
  finishExportFrameDrag();
});

map.on("contextmenu", async (event) => {
  const { lat, lng } = event.latlng;
  await setOrigin(lat, lng, await getReadableLocationName(lat, lng), { recenter: false });
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
  invalidateRealData();
  const key = orsApiKeyInput.value.trim();

  if (key) {
    sessionStorage.setItem(ORS_KEY_STORAGE, key);
    setStatus("API key saved for this browser session. Click Get real data when ready.");
  } else {
    sessionStorage.removeItem(ORS_KEY_STORAGE);
    setStatus("API key cleared from this browser session.");
  }
});

fetchRealDataButton.addEventListener("click", async () => {
  if (!getOpenRouteServiceApiKey()) {
    setStatus("Paste an OpenRouteService API key first.");
    return;
  }

  setRealDataFetchState(true);

  try {
    useRealData = true;
    const center = originMarker.getLatLng();
    await refreshTravelTimeOverlay(center.lat, center.lng);
  } finally {
    setRealDataFetchState(false);
  }
});

saveOverlayButton.addEventListener("click", () => {
  saveCurrentOverlay();
});

loadOverlayButton.addEventListener("click", () => {
  loadSelectedOverlay();
});

renameOverlayButton.addEventListener("click", () => {
  renameSelectedOverlay();
});

duplicateOverlayButton.addEventListener("click", () => {
  duplicateSelectedOverlay();
});

deleteOverlayButton.addEventListener("click", () => {
  deleteSelectedOverlay();
});

savedOverlaysSelect.addEventListener("change", () => {
  refreshOverlayMetadata();
});

clearApiKeyButton.addEventListener("click", async () => {
  invalidateRealData();
  orsApiKeyInput.value = "";
  sessionStorage.removeItem(ORS_KEY_STORAGE);
  setStatus("API key cleared from this browser session.");
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
  if (!options.preserveRealData) {
    invalidateRealData();
  }

  currentOrigin = { lat, lng, label };
  saveLastOrigin(currentOrigin);
  originMarker.setLatLng([lat, lng]).bindPopup(label).openPopup();

  if (options.recenter !== false) {
    map.setView([lat, lng], 10);
  }

  if (currentOverlayResult && currentOverlayResult.type === "geojson" && !options.preserveRealData) {
    currentOverlayResult = null;
    overlayLayer.clearLayers();
    routeLayer.clearLayers();
    updateOverlayToolsVisibility();
    exitExportMode();
    setStatus("Starting point set. Click Get real data to create a real overlay.");
    return;
  }

  await refreshTravelTimeOverlay(lat, lng);
}

async function getReadableLocationName(lat, lng) {
  try {
    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lng),
      format: "jsonv2",
      zoom: "18",
    });
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Reverse geocoding failed");
    }

    const result = await response.json();
    const address = result.address || {};

    return address.road || address.neighbourhood || address.suburb || address.village || address.town || address.city || result.name || result.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch (error) {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
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

  if (provider === "openrouteservice") {
    setStatus(includeSampleRoutesInput.checked
      ? "Requesting real isochrones, then sample routes. This can take a little while..."
      : "Requesting real isochrones...");
  } else {
    setStatus(`Loading ${provider} ${mode} bands...`);
  }

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
      includeRoutes: provider === "openrouteservice" && includeSampleRoutesInput.checked,
    });

    currentOverlayResult = result;
    renderTravelTimeOverlay(result);
    updateOverlayToolsVisibility();
    fitMapToOverlay();
    setStatus(describeOverlayResult(result, mode, traffic));
  } catch (error) {
    useRealData = false;
    currentOverlayResult = getDemoOverlay({ lat, lng, mode, traffic, minutes: requestedMinutes });
    renderTravelTimeOverlay(currentOverlayResult);
    updateOverlayToolsVisibility();
    fitMapToOverlay();
    setStatus(`${error.message} Showing demo bands instead.`);
  }
}

async function refreshCreationSettingsPreview() {
  const center = originMarker.getLatLng();

  if (currentOverlayResult && currentOverlayResult.type === "geojson") {
    setStatus("Creation settings changed. Click Get real data to replace the current overlay.");
    return;
  }

  await refreshTravelTimeOverlay(center.lat, center.lng);
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
  const styledGeojson = styleIsochroneGeoJson(geojson);
  const routes = request.includeRoutes
    ? await getOpenRouteServiceSampleRoutes({
      apiKey,
      profile,
      origin: [request.lng, request.lat],
      geojson: styledGeojson,
    })
    : [];

  return {
    provider: "openrouteservice",
    type: "geojson",
    requestedMinutes: request.requestedMinutes,
    geojson: styledGeojson,
    routes,
  };
}

async function getOpenRouteServiceSampleRoutes({ apiKey, profile, origin, geojson }) {
  const destinations = sampleRouteDestinations(geojson);
  const routes = [];

  for (let index = 0; index < destinations.length; index += 1) {
    const destination = destinations[index];

    setStatus(`Fetching sample route ${index + 1} of ${destinations.length}...`);
    routes.push(await getOpenRouteServiceRoute({
      apiKey,
      profile,
      origin,
      destination,
    }));
  }

  return routes
    .filter(Boolean)
    .sort((a, b) => getRouteDurationSeconds(b) - getRouteDurationSeconds(a));
}

async function getOpenRouteServiceRoute({ apiKey, profile, origin, destination }) {
  try {
    const response = await fetch(`${ORS_DIRECTIONS_ENDPOINT}/${profile}/geojson`, {
      method: "POST",
      headers: {
        Accept: "application/json, application/geo+json",
        Authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        coordinates: [origin, destination.coordinates],
      }),
    });

    if (!response.ok) {
      return null;
    }

    const route = await response.json();
    const feature = route.features?.[0];

    return feature ? {
      bandMinutes: destination.minutes,
      destination: destination.coordinates,
      feature,
    } : null;
  } catch (error) {
    return null;
  }
}

function sampleRouteDestinations(geojson) {
  const bandedFeatures = createBandedIsochroneFeatures(geojson.features || [])
    .sort((a, b) => getIsochroneMinutes(a) - getIsochroneMinutes(b));
  const destinations = [];

  for (const feature of bandedFeatures) {
    const minutes = getIsochroneMinutes(feature);
    const count = getRouteSampleCount(minutes);

    destinations.push(...samplePointsInFeature(feature, count).map((coordinates) => {
      return { minutes, coordinates };
    }));
  }

  return destinations.slice(0, MAX_SAMPLE_ROUTES);
}

function getRouteSampleCount(minutes) {
  return ROUTE_SAMPLE_COUNTS[minutes] || 6;
}

function samplePointsInFeature(feature, count) {
  const polygons = getGeometryPolygons(feature.geometry);
  const points = [];
  let attempts = 0;
  const maxAttempts = count * 500;

  while (points.length < count && attempts < maxAttempts) {
    attempts += 1;
    const polygon = polygons[Math.floor(Math.random() * polygons.length)];

    if (!polygon) {
      break;
    }

    const bounds = getGeoPolygonBounds(polygon);
    const point = [
      bounds.west + Math.random() * (bounds.east - bounds.west),
      bounds.south + Math.random() * (bounds.north - bounds.south),
    ];

    if (pointInGeoPolygon(point, polygon)) {
      points.push(point);
    }
  }

  return points;
}

function getGeoPolygonBounds(polygon) {
  return polygon[0].reduce((bounds, [lng, lat]) => {
    return {
      west: Math.min(bounds.west, lng),
      east: Math.max(bounds.east, lng),
      south: Math.min(bounds.south, lat),
      north: Math.max(bounds.north, lat),
    };
  }, {
    west: Infinity,
    east: -Infinity,
    south: Infinity,
    north: -Infinity,
  });
}

function pointInGeoPolygon(point, polygon) {
  const projectedPoint = { x: point[0], y: point[1] };
  const rings = polygon.map((ring) => {
    return ring.map(([lng, lat]) => ({ x: lng, y: lat }));
  });

  return pointInPolygonRings(projectedPoint, rings);
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

function getInitialPlace() {
  try {
    const saved = JSON.parse(localStorage.getItem(LAST_ORIGIN_STORAGE));

    if (saved && Number.isFinite(saved.lat) && Number.isFinite(saved.lng)) {
      return {
        label: saved.label || `${saved.lat.toFixed(5)}, ${saved.lng.toFixed(5)}`,
        lat: saved.lat,
        lng: saved.lng,
      };
    }
  } catch (error) {
    localStorage.removeItem(LAST_ORIGIN_STORAGE);
  }

  return DEFAULT_PLACE;
}

function saveLastOrigin(origin) {
  localStorage.setItem(LAST_ORIGIN_STORAGE, JSON.stringify(origin));
}

function getSavedOverlays() {
  try {
    const overlays = JSON.parse(localStorage.getItem(SAVED_OVERLAYS_STORAGE)) || [];

    return Array.isArray(overlays) ? overlays : [];
  } catch (error) {
    localStorage.removeItem(SAVED_OVERLAYS_STORAGE);
    return [];
  }
}

function getLatestSavedOverlay() {
  return getSavedOverlays()[0] || null;
}

function setSavedOverlays(overlays) {
  localStorage.setItem(SAVED_OVERLAYS_STORAGE, JSON.stringify(overlays));
}

function refreshSavedOverlayList() {
  const overlays = getSavedOverlays();

  savedOverlaysSelect.innerHTML = "";

  if (!overlays.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No saved overlays";
    savedOverlaysSelect.append(option);
    refreshOverlayMetadata();
    return;
  }

  overlays.forEach((overlay) => {
    const option = document.createElement("option");
    option.value = overlay.id;
    option.textContent = overlay.name;
    savedOverlaysSelect.append(option);
  });

  refreshOverlayMetadata();
}

function saveCurrentOverlay() {
  if (!currentOverlayResult || currentOverlayResult.type !== "geojson") {
    setStatus("Get real data before saving an overlay.");
    return;
  }

  const overlays = getSavedOverlays();
  const mode = document.querySelector('input[name="travel-mode"]:checked').value;
  const maxMinutes = Number(maxTimeSelect.value);
  const createdAt = new Date().toISOString();
  const defaultName = currentOrigin.label || `${currentOrigin.lat.toFixed(5)}, ${currentOrigin.lng.toFixed(5)}`;
  const name = window.prompt("Name this overlay", defaultName) || defaultName;
  const overlay = {
    id: `overlay-${Date.now()}`,
    name,
    createdAt,
    origin: currentOrigin,
    view: {
      center: {
        lat: map.getCenter().lat,
        lng: map.getCenter().lng,
      },
      zoom: map.getZoom(),
    },
    mode,
    traffic: document.querySelector('input[name="traffic-mode"]:checked').value,
    maxMinutes,
    composition: getCurrentCompositionSettings(),
    result: currentOverlayResult,
  };

  overlays.unshift(overlay);
  setSavedOverlays(overlays.slice(0, 20));
  refreshSavedOverlayList();
  savedOverlaysSelect.value = overlay.id;
  refreshOverlayMetadata();
  setStatus(`Saved overlay: ${name}${currentOverlayResult.routes?.length ? ` with ${currentOverlayResult.routes.length} sample routes` : ""}.`);
}

function loadSelectedOverlay() {
  const overlay = getSavedOverlays().find((item) => item.id === savedOverlaysSelect.value);

  if (!overlay) {
    setStatus("Choose a saved overlay first.");
    return;
  }

  loadOverlay(overlay);
}

function loadOverlay(overlay, options = {}) {
  useRealData = false;
  currentOrigin = overlay.origin;
  currentOverlayResult = overlay.result;
  maxTimeSelect.value = String(overlay.maxMinutes);
  const modeControl = document.querySelector(`input[name="travel-mode"][value="${overlay.mode}"]`);
  const trafficControl = document.querySelector(`input[name="traffic-mode"][value="${overlay.traffic}"]`);

  if (modeControl) {
    modeControl.checked = true;
  }

  if (trafficControl) {
    trafficControl.checked = true;
  }
  applyCompositionSettings(overlay.composition);
  saveLastOrigin(overlay.origin);
  originMarker.setLatLng([overlay.origin.lat, overlay.origin.lng]).bindPopup(overlay.origin.label).openPopup();
  renderTravelTimeOverlay(overlay.result);
  updateOverlayToolsVisibility();
  if (overlay.view) {
    map.setView([overlay.view.center.lat, overlay.view.center.lng], overlay.view.zoom, { animate: false });
  } else {
    fitMapToOverlay();
  }
  savedOverlaysSelect.value = overlay.id;
  refreshOverlayMetadata();

  if (options.announce === false) {
    setStatus(`Loaded latest saved overlay: ${overlay.name}.`);
    return;
  }

  setStatus(`Loaded saved overlay: ${overlay.name}.`);
}

function renameSelectedOverlay() {
  const overlays = getSavedOverlays();
  const overlay = overlays.find((item) => item.id === savedOverlaysSelect.value);

  if (!overlay) {
    setStatus("Choose a saved overlay first.");
    return;
  }

  const name = window.prompt("Rename overlay", overlay.name);

  if (!name) {
    return;
  }

  overlay.name = name;
  setSavedOverlays(overlays);
  refreshSavedOverlayList();
  savedOverlaysSelect.value = overlay.id;
  refreshOverlayMetadata();
  setStatus(`Renamed overlay: ${name}.`);
}

function duplicateSelectedOverlay() {
  const overlays = getSavedOverlays();
  const overlay = overlays.find((item) => item.id === savedOverlaysSelect.value);

  if (!overlay) {
    setStatus("Choose a saved overlay first.");
    return;
  }

  const copy = {
    ...overlay,
    id: `overlay-${Date.now()}`,
    name: `${overlay.name} copy`,
    createdAt: new Date().toISOString(),
    composition: overlay.composition ? { ...overlay.composition } : null,
  };

  overlays.unshift(copy);
  setSavedOverlays(overlays.slice(0, 20));
  refreshSavedOverlayList();
  savedOverlaysSelect.value = copy.id;
  refreshOverlayMetadata();
  setStatus(`Duplicated overlay: ${copy.name}.`);
}

function deleteSelectedOverlay() {
  const selectedId = savedOverlaysSelect.value;

  if (!selectedId) {
    setStatus("Choose a saved overlay first.");
    return;
  }

  setSavedOverlays(getSavedOverlays().filter((overlay) => overlay.id !== selectedId));
  refreshSavedOverlayList();
  setStatus("Saved overlay deleted.");
}

function refreshOverlayMetadata() {
  const overlay = getSavedOverlays().find((item) => item.id === savedOverlaysSelect.value);

  overlayMetadata.textContent = overlay ? formatOverlayMetadata(overlay) : "No saved overlay selected.";
}

function formatOverlayMetadata(overlay) {
  const generated = overlay.createdAt ? new Date(overlay.createdAt).toLocaleString() : "Unknown date";
  const provider = overlay.result?.provider || "unknown";
  const bands = getOverlayTimeBands(overlay).join(", ");
  const routes = overlay.result?.routes?.length || 0;

  return `Origin: ${overlay.origin?.label || "Unknown"} | Mode: ${overlay.mode || "unknown"} | Bands: ${bands} min | Provider: ${provider} | Routes: ${routes} | Generated: ${generated}`;
}

function getOverlayTimeBands(overlay) {
  if (overlay.result?.requestedMinutes?.length) {
    return overlay.result.requestedMinutes;
  }

  if (overlay.result?.minutes?.length) {
    return overlay.result.minutes;
  }

  return getSelectedTimeBands();
}

function getCurrentCompositionSettings() {
  return {
    mapStyle: mapStyleSelect.value,
    palette: overlayPaletteSelect.value,
    opacity: overlayOpacityInput.value,
    exportQuality: exportQualitySelect.value,
    title: exportTitleInput.value,
    subtitle: exportSubtitleInput.value,
    annotation: exportAnnotationInput.value,
    includeLegend: includeLegendInput.checked,
    includeMetadata: includeMetadataInput.checked,
    includeOriginLabel: includeOriginLabelInput.checked,
    includeBandLabels: includeBandLabelsInput.checked,
    exportFrame: isExportMode ? serializeBounds(exportFrame.getBounds()) : null,
  };
}

function applyCompositionSettings(composition = {}) {
  if (!composition) {
    return;
  }

  if (composition.mapStyle && mapStyles[composition.mapStyle]) {
    mapStyleSelect.value = composition.mapStyle;
    setBaseMapStyle(composition.mapStyle, { silent: true });
  }

  if (composition.palette && overlayPalettes[composition.palette]) {
    overlayPaletteSelect.value = composition.palette;
    updateLegendPalette();
  }

  if (composition.opacity) {
    overlayOpacityInput.value = composition.opacity;
  }

  exportQualitySelect.value = composition.exportQuality || "1";
  exportTitleInput.value = composition.title || "";
  exportSubtitleInput.value = composition.subtitle || "";
  exportAnnotationInput.value = composition.annotation || "";
  includeLegendInput.checked = Boolean(composition.includeLegend);
  includeMetadataInput.checked = Boolean(composition.includeMetadata);
  includeOriginLabelInput.checked = Boolean(composition.includeOriginLabel);
  includeBandLabelsInput.checked = Boolean(composition.includeBandLabels);

  if (composition.exportFrame) {
    savedExportFrameBounds = deserializeBounds(composition.exportFrame);
    exportFrame.setBounds(savedExportFrameBounds);
  }
}

function serializeBounds(bounds) {
  return {
    north: bounds.getNorth(),
    east: bounds.getEast(),
    south: bounds.getSouth(),
    west: bounds.getWest(),
  };
}

function deserializeBounds(bounds) {
  return L.latLngBounds(
    [bounds.south, bounds.west],
    [bounds.north, bounds.east]
  );
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

function updateOverlayToolsVisibility() {
  overlayTools.classList.toggle("is-hidden", !currentOverlayResult || currentOverlayResult.type !== "geojson");
}

function drawGeoJsonBands(geojson) {
  overlayLayer.clearLayers();
  routeLayer.clearLayers();

  const sortedFeatures = createBandedIsochroneFeatures(geojson.features || []);

  L.geoJSON({ ...geojson, features: sortedFeatures }, {
    style: (feature) => {
      const properties = feature.properties || {};
      const minutes = properties.minutes || getIsochroneMinutes(feature);
      const color = getBandColor(minutes);

      return {
        color,
        fillColor: color,
        fillOpacity: getOverlayOpacity(),
        opacity: properties.opacity || 0.85,
        weight: 2,
      };
    },
  }).addTo(overlayLayer);

  if (currentOverlayResult?.routes?.length) {
    drawSampleRoutes(currentOverlayResult.routes);
  }
}

function drawSampleRoutes(routes) {
  routeLayer.clearLayers();
  const bandFeatures = currentOverlayResult?.geojson
    ? createBandedIsochroneFeatures(currentOverlayResult.geojson.features || [])
    : [];

  routes
    .slice()
    .sort((a, b) => getRouteDurationSeconds(b) - getRouteDurationSeconds(a))
    .forEach((route) => {
      getColorCodedRouteSegments(route, bandFeatures).forEach((segment) => {
        L.geoJSON(segment.feature, {
          style: {
            color: getBandColor(segment.minutes),
            opacity: 0.88,
            weight: 10,
            lineCap: "round",
            lineJoin: "round",
          },
        }).addTo(routeLayer);
      });

      if (route.destination) {
        const color = getBandColor(route.bandMinutes);

        L.circleMarker([route.destination[1], route.destination[0]], {
          radius: 9,
          color: "#ffffff",
          fillColor: color,
          fillOpacity: 1,
          opacity: 1,
          weight: 4,
        }).addTo(routeLayer);
      }
    });
}

function getColorCodedRouteSegments(route, bandFeatures) {
  if (!window.turf || !bandFeatures.length) {
    return [{
      minutes: route.bandMinutes,
      feature: route.feature,
    }];
  }

  const segments = [];

  getRouteCoordinateLines(route.feature.geometry).forEach((line) => {
    let activeMinutes = null;
    let activeCoordinates = [];

    for (let index = 0; index < line.length - 1; index += 1) {
      const start = line[index];
      const end = line[index + 1];
      const minutes = getSegmentBandMinutes(start, end, bandFeatures) || route.bandMinutes;

      if (activeMinutes === minutes) {
        activeCoordinates.push(end);
        continue;
      }

      if (activeCoordinates.length > 1) {
        segments.push(createRouteSegmentFeature(activeCoordinates, activeMinutes));
      }

      activeMinutes = minutes;
      activeCoordinates = [start, end];
    }

    if (activeCoordinates.length > 1) {
      segments.push(createRouteSegmentFeature(activeCoordinates, activeMinutes));
    }
  });

  return segments.length ? segments : [{
    minutes: route.bandMinutes,
    feature: route.feature,
  }];
}

function getRouteCoordinateLines(geometry) {
  if (!geometry) {
    return [];
  }

  if (geometry.type === "LineString") {
    return [geometry.coordinates];
  }

  if (geometry.type === "MultiLineString") {
    return geometry.coordinates;
  }

  return [];
}

function getSegmentBandMinutes(start, end, bandFeatures) {
  const midpoint = [
    (start[0] + end[0]) / 2,
    (start[1] + end[1]) / 2,
  ];
  const point = turf.point(midpoint);
  const band = bandFeatures.find((feature) => {
    return turf.booleanPointInPolygon(point, feature);
  });

  return band ? getIsochroneMinutes(band) : null;
}

function createRouteSegmentFeature(coordinates, minutes) {
  return {
    minutes,
    feature: {
      type: "Feature",
      properties: { minutes },
      geometry: {
        type: "LineString",
        coordinates,
      },
    },
  };
}

function getRouteDurationSeconds(route) {
  return route?.feature?.properties?.summary?.duration || 0;
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
  routeLayer.clearLayers();

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
    crossOrigin: "anonymous",
  });
}

function getBandColor(minutes) {
  const bandColors = getCurrentPalette().colors;

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

function getCurrentPalette() {
  return overlayPalettes[overlayPaletteSelect.value] || overlayPalettes.classic;
}

function updateLegendPalette() {
  Object.entries(getCurrentPalette().colors).forEach(([minutes, color]) => {
    document.querySelectorAll(`.band-${minutes}`).forEach((swatch) => {
      swatch.style.background = color;
    });
  });
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
    map.setZoom(Math.min(map.getZoom() + ZOOM_CLOSER_DELTA, 18), { animate: false });
  }

  window.setTimeout(() => {
    if (isExportMode) {
      resetExportFrame();
    }
  }, 0);
}

function getTravelTimeProvider() {
  return useRealData && getOpenRouteServiceApiKey() ? "openrouteservice" : "demo";
}

function getOpenRouteServiceApiKey() {
  return orsApiKeyInput.value.trim() || getStoredOpenRouteServiceApiKey();
}

function getStoredOpenRouteServiceApiKey() {
  return localConfig.openRouteServiceApiKey || sessionStorage.getItem(ORS_KEY_STORAGE) || "";
}

function setBaseMapStyle(styleId, options = {}) {
  const style = mapStyles[styleId] || mapStyles.voyager;

  map.removeLayer(baseLayer);
  baseLayer = createBaseLayer(style).addTo(map);
  baseLayer.bringToBack();

  if (!options.silent) {
    setStatus(`Map style changed to ${style.label}.`);
  }
}

function describeOverlayResult(result, mode, traffic) {
  if (result.provider === "demo") {
    return `Showing demo ${mode} bands. Use Get real data to call OpenRouteService.`;
  }

  const routeText = result.routes?.length ? ` and ${result.routes.length} sample routes` : "";

  const requestedMax = Math.max(...(result.requestedMinutes || []));
  if (mode === "drive" && requestedMax > ORS_MAX_DRIVING_MINUTES) {
    return `Showing OpenRouteService drive isochrones${routeText} up to 60 minutes. Hosted ORS currently caps driving isochrones at 1 hour.`;
  }

  if (traffic !== "traffic-free") {
    return `Showing OpenRouteService ${mode} isochrones${routeText}. Traffic mode is not applied by this provider yet.`;
  }

  return `Showing OpenRouteService ${mode} isochrones${routeText}.`;
}

function invalidateRealData() {
  useRealData = false;
}

function setStatus(message) {
  statusEl.textContent = message;
}

function setRealDataFetchState(isFetching) {
  fetchRealDataButton.disabled = isFetching;
  fetchRealDataButton.textContent = isFetching
    ? includeSampleRoutesInput.checked
      ? "Getting isochrones and routes..."
      : "Getting real data..."
    : FETCH_REAL_DATA_LABEL;
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

  if (savedExportFrameBounds) {
    exportFrame.setBounds(savedExportFrameBounds);
    savedExportFrameBounds = null;
  } else {
    resetExportFrame();
  }

  updateExportHandles();
  updateExportControls();
  setStatus("Adjust the export frame, then choose Export SVG.");
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
  setStatus("Export frame moved. Use Export SVG to download that area.");
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
  setPrintCropFromExportFrame();
  map.invalidateSize();
  setStatus("Preparing selected export area. In the print dialog, use custom page size or 100% scale if the preview adds margins.");

  window.setTimeout(() => {
    window.print();
  }, 250);
}

async function exportSelectedFrameToSvg() {
  if (!isExportMode) {
    enterExportMode();
    return;
  }

  const crop = getExportFramePixelBounds();
  const defaultName = currentOrigin.label || "isochrones-map";
  const fileName = `${slugifyFileName(defaultName)}-isochrones.svg`;

  setStatus("Preparing Illustrator-friendly SVG export...");
  const svg = await createSelectedAreaSvg(crop);

  downloadTextFile(fileName, svg, "image/svg+xml");
  setStatus(`Downloaded SVG export: ${fileName}.`);
}

async function createSelectedAreaSvg(crop) {
  const quality = Number(exportQualitySelect.value) || 1;
  const width = Math.round(crop.width);
  const height = Math.round(crop.height);
  const outputWidth = Math.round(width * quality);
  const outputHeight = Math.round(height * quality);
  const content = [
    `<rect width="${width}" height="${height}" fill="#ffffff"></rect>`,
    await createSvgTileLayer(crop),
    createSvgOverlayLayer(crop),
    createSvgExportLabels(crop, width, height),
    includeLegendInput.checked ? createSvgLegend(width, height) : "",
    includeMetadataInput.checked ? createSvgMetadata(width, height) : "",
    createSvgAttribution(width, height),
  ].filter(Boolean).join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${outputWidth}" height="${outputHeight}" viewBox="0 0 ${width} ${height}">`,
    content,
    "</svg>",
  ].join("\n");
}

async function createSvgTileLayer(crop) {
  const mapRect = map.getContainer().getBoundingClientRect();
  const tiles = [...map.getContainer().querySelectorAll(".leaflet-tile-pane img.leaflet-tile")];
  const images = await Promise.all(tiles.map(async (tile) => {
    const tileRect = tile.getBoundingClientRect();
    const x = tileRect.left - mapRect.left - crop.left;
    const y = tileRect.top - mapRect.top - crop.top;
    const width = tileRect.width;
    const height = tileRect.height;

    if (!rectsIntersect({ x, y, width, height }, { x: 0, y: 0, width: crop.width, height: crop.height })) {
      return "";
    }

    const opacity = tile.style.opacity && tile.style.opacity !== "1" ? ` opacity="${escapeXml(tile.style.opacity)}"` : "";
    const imageSource = await getEmbeddedImageSource(tile.currentSrc || tile.src);

    return `<image href="${escapeXml(imageSource)}" xlink:href="${escapeXml(imageSource)}" x="${roundSvgNumber(x)}" y="${roundSvgNumber(y)}" width="${roundSvgNumber(width)}" height="${roundSvgNumber(height)}"${opacity}></image>`;
  }));

  const visibleImages = images.filter(Boolean);

  return visibleImages.length ? `<g id="map-tiles">\n${visibleImages.join("\n")}\n</g>` : "";
}

function createSvgOverlayLayer(crop) {
  const overlaySvg = map.getContainer().querySelector(".leaflet-overlay-pane svg");

  if (!overlaySvg) {
    return "";
  }

  const mapRect = map.getContainer().getBoundingClientRect();
  const overlayRect = overlaySvg.getBoundingClientRect();
  const clone = overlaySvg.cloneNode(true);

  clone.querySelectorAll(".export-frame").forEach((element) => element.remove());
  clone.removeAttribute("class");
  clone.removeAttribute("style");
  clone.setAttribute("x", roundSvgNumber(overlayRect.left - mapRect.left - crop.left));
  clone.setAttribute("y", roundSvgNumber(overlayRect.top - mapRect.top - crop.top));
  clone.setAttribute("width", roundSvgNumber(overlayRect.width));
  clone.setAttribute("height", roundSvgNumber(overlayRect.height));
  clone.setAttribute("overflow", "visible");

  return new XMLSerializer().serializeToString(clone);
}

function createSvgAttribution(width, height) {
  return `<text x="${Math.max(8, width - 8)}" y="${Math.max(14, height - 8)}" text-anchor="end" font-family="Arial, sans-serif" font-size="11" fill="#5b6875">© openrouteservice.org by HeiGIT | Map data © OpenStreetMap contributors</text>`;
}

function createSvgExportLabels(crop, width, height) {
  const labels = [
    createSvgTitleBlock(),
    exportAnnotationInput.value ? createSvgText(exportAnnotationInput.value, 18, getTitleBlockHeight() + 22, { size: 13, weight: 600 }) : "",
    includeOriginLabelInput.checked ? createSvgOriginLabel(crop) : "",
    includeBandLabelsInput.checked ? createSvgBandLabels(crop) : "",
  ].filter(Boolean);

  if (!labels.length) {
    return "";
  }

  return `<g id="map-labels" font-family="Arial, sans-serif">${labels.join("\n")}</g>`;
}

function createSvgTitleBlock() {
  const title = exportTitleInput.value.trim();
  const subtitle = exportSubtitleInput.value.trim();

  if (!title && !subtitle) {
    return "";
  }

  return [
    title ? createSvgText(title, 18, 30, { size: 21, weight: 700 }) : "",
    subtitle ? createSvgText(subtitle, 18, title ? 52 : 30, { size: 14, weight: 600, fill: "#374151" }) : "",
  ].filter(Boolean).join("\n");
}

function getTitleBlockHeight() {
  if (exportTitleInput.value.trim() && exportSubtitleInput.value.trim()) {
    return 52;
  }

  return exportTitleInput.value.trim() || exportSubtitleInput.value.trim() ? 30 : 0;
}

function createSvgOriginLabel(crop) {
  const point = map.latLngToContainerPoint([currentOrigin.lat, currentOrigin.lng]);
  const x = point.x - crop.left + 12;
  const y = point.y - crop.top - 12;

  if (!pointInsideCrop(x, y, crop)) {
    return "";
  }

  return createSvgText(currentOrigin.label || "Origin", x, y, { size: 13, weight: 700, fill: "#111827" });
}

function createSvgBandLabels(crop) {
  if (!currentOverlayResult || currentOverlayResult.type !== "geojson") {
    return "";
  }

  return createBandedIsochroneFeatures(currentOverlayResult.geojson.features || []).map((feature) => {
    const point = getFeatureLabelPoint(feature, crop);

    if (!point) {
      return "";
    }

    return createSvgText(`${getIsochroneMinutes(feature)} min`, point.x, point.y, { size: 12, weight: 700, anchor: "middle" });
  }).filter(Boolean).join("\n");
}

function getFeatureLabelPoint(feature, crop) {
  const polygons = getGeometryPolygons(feature.geometry)
    .map((polygon) => projectPolygonRings(polygon, crop))
    .filter((rings) => rings.length && rings[0].length);
  const candidates = polygons
    .map((rings) => getPolygonLabelCandidate(rings, crop))
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);

  return candidates[0] || null;
}

function getGeometryPolygons(geometry) {
  if (!geometry) {
    return [];
  }

  if (geometry.type === "Polygon") {
    return [geometry.coordinates];
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates;
  }

  return [];
}

function projectPolygonRings(polygon, crop) {
  return polygon.map((ring) => {
    return ring.map(([lng, lat]) => {
      const point = map.latLngToContainerPoint([lat, lng]);

      return {
        x: point.x - crop.left,
        y: point.y - crop.top,
      };
    });
  });
}

function getPolygonLabelCandidate(rings, crop) {
  const bounds = getRingBounds(rings[0]);
  const left = Math.max(0, bounds.left);
  const right = Math.min(crop.width, bounds.right);
  const top = Math.max(0, bounds.top);
  const bottom = Math.min(crop.height, bounds.bottom);

  if (left >= right || top >= bottom) {
    return null;
  }

  const candidates = [];
  const steps = 18;

  for (let row = 1; row < steps; row += 1) {
    for (let column = 1; column < steps; column += 1) {
      const point = {
        x: left + ((right - left) * column) / steps,
        y: top + ((bottom - top) * row) / steps,
      };

      if (!pointInPolygonRings(point, rings)) {
        continue;
      }

      candidates.push({
        ...point,
        score: getLabelPointScore(point, rings, crop),
      });
    }
  }

  if (!candidates.length) {
    return getFallbackPolygonLabelCandidate(rings, crop);
  }

  return candidates.sort((a, b) => b.score - a.score)[0];
}

function getRingBounds(ring) {
  return ring.reduce((bounds, point) => {
    return {
      left: Math.min(bounds.left, point.x),
      right: Math.max(bounds.right, point.x),
      top: Math.min(bounds.top, point.y),
      bottom: Math.max(bounds.bottom, point.y),
    };
  }, {
    left: Infinity,
    right: -Infinity,
    top: Infinity,
    bottom: -Infinity,
  });
}

function pointInPolygonRings(point, rings) {
  if (!pointInRing(point, rings[0])) {
    return false;
  }

  return !rings.slice(1).some((ring) => pointInRing(point, ring));
}

function pointInRing(point, ring) {
  let inside = false;

  for (let index = 0, previousIndex = ring.length - 1; index < ring.length; previousIndex = index, index += 1) {
    const current = ring[index];
    const previous = ring[previousIndex];
    const intersects = ((current.y > point.y) !== (previous.y > point.y))
      && point.x < ((previous.x - current.x) * (point.y - current.y)) / (previous.y - current.y) + current.x;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

function getLabelPointScore(point, rings, crop) {
  const boundaryDistance = Math.min(...rings.flatMap((ring) => {
    return ring.slice(1).map((end, index) => {
      return distanceToSegment(point, ring[index], end);
    });
  }));
  const cropDistance = Math.min(point.x, point.y, crop.width - point.x, crop.height - point.y);

  return Math.min(boundaryDistance, cropDistance);
}

function distanceToSegment(point, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;

  if (!lengthSquared) {
    return Math.hypot(point.x - start.x, point.y - start.y);
  }

  const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared));
  const projection = {
    x: start.x + t * dx,
    y: start.y + t * dy,
  };

  return Math.hypot(point.x - projection.x, point.y - projection.y);
}

function getFallbackPolygonLabelCandidate(rings, crop) {
  const point = rings[0].find((candidate) => {
    return pointInsideCrop(candidate.x, candidate.y, crop);
  });

  return point ? { ...point, score: 0 } : null;
}

function createSvgLegend(width, height) {
  const entries = getCurrentTimeBands();
  const x = Math.max(16, width - 112);
  const y = 18;
  const rows = entries.map((minutes, index) => {
    const rowY = y + index * 17;
    const color = getBandColor(minutes);

    return `<rect x="${x}" y="${rowY}" width="11" height="11" rx="2" fill="${color}" stroke="#ffffff" stroke-width="0.5"></rect><text x="${x + 17}" y="${rowY + 10}" font-family="Arial, sans-serif" font-size="11" font-weight="700" fill="#374151">${minutes} min</text>`;
  }).join("\n");

  return `<g id="legend">${rows}</g>`;
}

function createSvgMetadata(width, height) {
  const lines = getCurrentMetadataLines();
  const x = 18;
  const startY = Math.max(24, height - 78);

  return `<g id="metadata" font-family="Arial, sans-serif">${lines.map((line, index) => {
    return createSvgText(line, x, startY + index * 15, { size: 11, weight: 600, fill: "#4b5563" });
  }).join("\n")}</g>`;
}

function getCurrentMetadataLines() {
  const mode = document.querySelector('input[name="travel-mode"]:checked').value;
  const traffic = document.querySelector('input[name="traffic-mode"]:checked').value;
  const provider = currentOverlayResult?.provider || "unknown";
  const bands = getCurrentTimeBands();

  return [
    `Origin: ${currentOrigin.label || "Unknown"}`,
    `Mode: ${mode}; traffic: ${traffic}; provider: ${provider}`,
    `Bands: ${bands.join(", ")} min; generated: ${new Date().toLocaleString()}`,
  ];
}

function getCurrentTimeBands() {
  return currentOverlayResult?.requestedMinutes || currentOverlayResult?.minutes || getSelectedTimeBands();
}

function createSvgText(text, x, y, options = {}) {
  const anchor = options.anchor || "start";
  const fill = options.fill || "#111827";
  const size = options.size || 12;
  const weight = options.weight || 500;

  return `<text x="${roundSvgNumber(x)}" y="${roundSvgNumber(y)}" text-anchor="${anchor}" font-size="${size}" font-weight="${weight}" fill="${fill}">${escapeXml(text)}</text>`;
}

function pointInsideCrop(x, y, crop) {
  return x >= 0 && x <= crop.width && y >= 0 && y <= crop.height;
}

async function getEmbeddedImageSource(source) {
  try {
    const response = await fetch(source, { mode: "cors" });

    if (!response.ok) {
      throw new Error("Tile image request failed");
    }

    return await blobToDataUrl(await response.blob());
  } catch (error) {
    return source;
  }
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(blob);
  });
}

function rectsIntersect(first, second) {
  return first.x < second.x + second.width
    && first.x + first.width > second.x
    && first.y < second.y + second.height
    && first.y + first.height > second.y;
}

function roundSvgNumber(value) {
  return String(Math.round(value * 100) / 100);
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function slugifyFileName(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    || "isochrones-map";
}

function downloadTextFile(fileName, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function setPrintCropFromExportFrame() {
  const mapSize = map.getSize();
  const crop = getExportFramePixelBounds();
  const scale = getExportScale(crop);

  pendingPrintCrop = {
    ...crop,
    mapWidth: mapSize.x,
    mapHeight: mapSize.y,
    pageWidth: crop.width * scale,
    pageHeight: crop.height * scale,
    scale,
  };
  applyPrintCropVars(pendingPrintCrop);
  document.body.classList.add("print-crop");
}

function applyPrintCropVars(crop) {
  const root = document.documentElement;

  setPrintPageStyle(crop.pageWidth, crop.pageHeight);
  root.style.setProperty("--export-map-width", `${crop.mapWidth}px`);
  root.style.setProperty("--export-map-height", `${crop.mapHeight}px`);
  root.style.setProperty("--export-map-left", `${-crop.left * crop.scale}px`);
  root.style.setProperty("--export-map-top", `${-crop.top * crop.scale}px`);
  root.style.setProperty("--export-page-width", `${crop.pageWidth}px`);
  root.style.setProperty("--export-page-height", `${crop.pageHeight}px`);
  root.style.setProperty("--export-map-scale", String(crop.scale));
}

function getExportScale(crop) {
  return Math.min(
    1,
    EXPORT_MAX_PAGE_WIDTH / crop.width,
    EXPORT_MAX_PAGE_HEIGHT / crop.height
  );
}

function getExportFramePixelBounds() {
  const bounds = exportFrame.getBounds();
  const northWest = map.latLngToContainerPoint(bounds.getNorthWest());
  const southEast = map.latLngToContainerPoint(bounds.getSouthEast());
  const left = Math.min(northWest.x, southEast.x);
  const right = Math.max(northWest.x, southEast.x);
  const top = Math.min(northWest.y, southEast.y);
  const bottom = Math.max(northWest.y, southEast.y);

  return {
    left,
    top,
    width: Math.max(1, right - left),
    height: Math.max(1, bottom - top),
  };
}

function clearPrintCropVars() {
  [
    "--export-map-width",
    "--export-map-height",
    "--export-map-left",
    "--export-map-top",
    "--export-map-scale",
    "--export-page-width",
    "--export-page-height",
  ].forEach((property) => {
    document.documentElement.style.removeProperty(property);
  });
}

function setPrintPageStyle(width, height) {
  const roundedWidth = Math.round(width);
  const roundedHeight = Math.round(height);
  const pageWidthInches = (roundedWidth / 96).toFixed(4);
  const pageHeightInches = (roundedHeight / 96).toFixed(4);

  printPageStyle.textContent = `
    @media print {
      @page {
        size: ${pageWidthInches}in ${pageHeightInches}in;
        margin: 0;
      }

      html,
      body,
      .app-shell,
      .map-panel {
        width: ${roundedWidth}px;
        height: ${roundedHeight}px;
        min-height: 0;
        max-height: ${roundedHeight}px;
        overflow: hidden;
      }
    }
  `;
}

function clearPrintPageStyle() {
  printPageStyle.textContent = "";
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
