const DEFAULT_PLACE = {
  label: "Coimbra, Portugal",
  lat: 40.2033,
  lng: -8.4103,
};

const bandColors = {
  10: "#2fbf71",
  20: "#8bd346",
  30: "#f5c542",
  45: "#f28f3b",
  60: "#d94f45",
};

const TRAVEL_TIME_PROVIDER = "demo";

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
const mapStyleSelect = document.querySelector("#map-style");
const useLocationButton = document.querySelector("#use-location");
const statusEl = document.querySelector("#status");

const map = L.map("map", {
  zoomControl: false,
}).setView([DEFAULT_PLACE.lat, DEFAULT_PLACE.lng], 9);

L.control.zoom({ position: "bottomright" }).addTo(map);

let baseLayer = createBaseLayer(mapStyles.voyager).addTo(map);

let overlayLayer = L.layerGroup().addTo(map);
let originMarker = createOriginMarker(DEFAULT_PLACE.lat, DEFAULT_PLACE.lng, DEFAULT_PLACE.label).addTo(map);

input.value = DEFAULT_PLACE.label;
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

async function setOrigin(lat, lng, label) {
  originMarker.setLatLng([lat, lng]).bindPopup(label).openPopup();
  map.setView([lat, lng], 9);

  await refreshTravelTimeOverlay(lat, lng);
  setStatus(`Showing ${TRAVEL_TIME_PROVIDER} travel-time bands around ${label}.`);
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

  setStatus(`Loading ${TRAVEL_TIME_PROVIDER} ${mode} bands...`);

  const result = await getTravelTimeOverlay({
    lat,
    lng,
    mode,
    traffic,
    minutes: [10, 20, 30, 45, 60],
  });

  renderTravelTimeOverlay(result);
  setStatus(describeOverlayResult(result, mode, traffic));
}

async function getTravelTimeOverlay(request) {
  if (TRAVEL_TIME_PROVIDER === "demo") {
    return getDemoOverlay(request);
  }

  throw new Error(`Unsupported travel-time provider: ${TRAVEL_TIME_PROVIDER}`);
}

function getDemoOverlay(request) {
  return {
    provider: "demo",
    type: "concentric-rings",
    origin: { lat: request.lat, lng: request.lng },
    mode: request.mode,
    traffic: request.traffic,
    minutes: request.minutes,
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

  L.geoJSON(geojson, {
    style: (feature) => {
      const properties = feature.properties || {};

      return {
        color: properties.color || properties.fillColor || "#1f7a8c",
        fillColor: properties.fillColor || properties.fill || "#1f7a8c",
        fillOpacity: properties.fillOpacity || properties["fill-opacity"] || 0.25,
        opacity: properties.opacity || 0.85,
        weight: 2,
      };
    },
  }).addTo(overlayLayer);
}

function drawDemoBands(lat, lng, mode, minutes = [10, 20, 30, 45, 60]) {
  overlayLayer.clearLayers();

  const minutesToMeters = mode === "walk" ? 80 : 850;
  const bands = [...minutes].sort((a, b) => b - a);

  bands.forEach((minutes) => {
    L.circle([lat, lng], {
      radius: minutes * minutesToMeters,
      color: bandColors[minutes],
      fillColor: bandColors[minutes],
      fillOpacity: 0.18,
      opacity: 0.8,
      weight: 2,
    }).addTo(overlayLayer);
  });
}

function createBaseLayer(style) {
  return L.tileLayer(style.url, {
    maxZoom: 19,
    attribution: style.attribution,
  });
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
    return `Showing demo ${mode} bands with ${traffic} selected. Real isochrones need an API provider.`;
  }

  return `Showing ${result.provider} ${mode} bands with ${traffic} selected.`;
}

function setStatus(message) {
  statusEl.textContent = message;
}
