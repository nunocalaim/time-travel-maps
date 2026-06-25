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

const form = document.querySelector("#location-form");
const input = document.querySelector("#location-input");
const useLocationButton = document.querySelector("#use-location");
const statusEl = document.querySelector("#status");

const map = L.map("map", {
  zoomControl: false,
}).setView([DEFAULT_PLACE.lat, DEFAULT_PLACE.lng], 9);

L.control.zoom({ position: "bottomright" }).addTo(map);

L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
  maxZoom: 19,
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
}).addTo(map);

let overlayLayer = L.layerGroup().addTo(map);
let originMarker = createOriginMarker(DEFAULT_PLACE.lat, DEFAULT_PLACE.lng, DEFAULT_PLACE.label).addTo(map);

input.value = DEFAULT_PLACE.label;
drawDemoBands(DEFAULT_PLACE.lat, DEFAULT_PLACE.lng, "drive");

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

    setOrigin(result.lat, result.lng, result.label);
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
  control.addEventListener("change", () => {
    const center = originMarker.getLatLng();
    drawDemoBands(center.lat, center.lng, control.value);
    setStatus(`Showing demo ${control.value} bands. Real travel times need a routing provider.`);
  });
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

function setOrigin(lat, lng, label) {
  originMarker.setLatLng([lat, lng]).bindPopup(label).openPopup();
  map.setView([lat, lng], 9);

  const mode = document.querySelector('input[name="travel-mode"]:checked').value;
  drawDemoBands(lat, lng, mode);
  setStatus(`Showing demo ${mode} bands around ${label}.`);
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

function drawDemoBands(lat, lng, mode) {
  overlayLayer.clearLayers();

  const minutesToMeters = mode === "walk" ? 80 : 850;
  const bands = [60, 45, 30, 20, 10];

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

function setStatus(message) {
  statusEl.textContent = message;
}
