# Architecture

This is an early architecture sketch, not a final design.

## Proposed Components

- Frontend UI: location input, map controls, travel mode controls, export controls later.
- Map renderer: shows base map tiles and travel-time overlays.
- Geocoder: turns a typed location into coordinates.
- Travel-time provider: calculates travel times or isochrone polygons.
- Overlay generator: converts provider results into color-coded map layers.
- Cache or storage layer: stores generated results where terms allow.
- Map style provider: supplies base map styles such as detailed, light print, dark, terrain, or future custom vector styles.

## Data Flow

1. User enters a location.
2. Geocoder returns coordinates.
3. User selects travel mode and time settings.
4. Travel-time provider returns isochrones or travel-time samples.
5. Overlay generator styles the result.
6. Map renderer displays the overlay.
7. Later, the user exports or saves the map.

## Provider Options To Investigate

- Mapbox Isochrone API.
- Google Maps Platform Routes API or Distance Matrix style workflows.
- HERE Isoline Routing.
- OpenRouteService Isochrones.
- GraphHopper Isochrone API.
- Self-hosted routing with OpenStreetMap data, such as OSRM, Valhalla, or GraphHopper.

## Important Tradeoffs

- Current traffic is usually a paid or restricted feature.
- True isochrone polygons are easier for overlays than calculating many point-to-point routes.
- Country-scale maps may need lower-resolution overlays for performance and API cost.
- API terms may restrict caching, storing, or publishing generated data.
- Raster tile styles are easy to switch, but fine-grained styling eventually points toward vector tiles and MapLibre GL JS or Mapbox GL JS.
