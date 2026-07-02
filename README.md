# Isochrones

Isochrones is an exploratory project for making travel-time maps.

The first use case is simple: choose a location, show the surrounding area on a map, and overlay color-coded travel-time regions. For example, someone who bought a property could receive a map showing what places are reachable in 10, 20, 30, 45, or 60 minutes.

## Product Idea

- A user enters a starting location, usually where they are now or a property they care about.
- The app shows a map at a large scale, such as a town, region, or country.
- The map shows travel-time zones around that location.
- Travel modes may include driving first, then walking, cycling, or public transport later.
- Travel time modes may include current traffic, normal traffic, and traffic-free estimates.
- The final output should feel giftable: useful, clear, and pleasant to share.

## Initial Scope

Start small:

- Web page with a location input.
- Map centered on the chosen location.
- Driving-time overlay for a few time bands.
- Static or cached demo data if live travel-time APIs are too slow or expensive during prototyping.

## Current Prototype

Open `index.html` in a browser to try the first static prototype, or serve the folder locally for more reliable browser behavior:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

It currently uses:

- Leaflet for map rendering.
- CARTO raster map tiles using OpenStreetMap data.
- Nominatim reverse geocoding for readable saved-overlay names.
- Demo travel-time rings only before a real or saved overlay is available.
- A provider-shaped travel-time boundary in `script.js`, currently set to `demo`.
- A map-style selector for CARTO basemaps and optional MapTiler presets.
- Optional OpenRouteService isochrones when an API key is pasted into the local page.
- Optional sample-route fetching from random points inside isochrone bands as a proof of concept.
- Turf.js-powered route segment coloring on the `polygon-library` experiment branch.
- Route coloring modes for smoothed band color, raw band color, outbound monotone, and destination color.
- Adjustable route/path thickness and transparency for route overlays.
- Right-click-to-set origin refinement on the map.
- SVG export through a selectable map area.
- Grouped SVG export layers for map tiles, isochrone bands, and route paths.
- SVG export quality options for screen, 2x, and 4x output dimensions.
- Optional SVG title, subtitle, annotation, legend, metadata, origin label, and time-band labels.
- Explicit OpenRouteService/OpenStreetMap attribution in the UI and print layout.
- Draggable export frame for choosing the export area.
- Freely resizable export frame handles.
- Overlay transparency control.
- Overlay palette presets for classic, warm, blue-green, and grayscale maps.
- Last starting location persistence.
- Local save/load, rename, and duplicate for fetched OpenRouteService overlays.

If tiles appear scrambled or misaligned, the Leaflet stylesheet is probably blocked by the browser or CDN. The app includes local fallback layout rules in `styles.css`, so refresh the page after pulling the latest files.

The colored circles are placeholders. They are not real travel-time data yet; the next technical step is to replace them with isochrone polygons from a routing provider.

To try real isochrones, create an OpenRouteService API key, paste it into the page, and click **Get real data**. The key is stored only in `sessionStorage` for the current browser session, not committed to the repo.

Turn on **Also fetch sample routes** before fetching real isochrones to sample random destinations inside the bands and draw OpenRouteService routes to them. The sampler keeps a small minimum per band, then gives larger bands more samples by approximate area. This is intentionally API-call-heavy and capped for the prototype.

After a real overlay is visible, turn on **Click map to add routes** to manually request and append a route from the current starting point to any clicked map location.

For persistent local keys, copy `config.local.example.js` to `config.local.js` and add your OpenRouteService and optional MapTiler keys there. `config.local.js` is ignored by Git.

MapTiler presets use MapTiler Cloud raster tiles. MapTiler currently offers a free plan for testing, personal, and non-commercial use; add `mapTilerApiKey` in `config.local.js` to enable those styles.

Because this is currently a static browser app, pasting a key into the page stores it only in the browser session. The app cannot write that key back into `config.local.js` by itself.

Fetched overlays can be saved to local browser storage and loaded later without calling the API again.

Hosted OpenRouteService currently limits driving isochrones to 1 hour. Larger demo bands can be previewed locally, and larger real driving maps will need another provider or a self-hosted routing setup.

Use **Prepare export** to show the blue export frame, adjust it, then use **Export SVG** to download the selected rectangle. The export embeds visible map tiles when the tile provider allows browser embedding, which makes the SVG easier to open in design tools such as Illustrator.

The default bands are now 1, 5, 10, 15, 20, 30, 45, and 60 minutes.

Later:

- Current traffic versus normal traffic.
- Multiple transport modes.
- Printable or exportable maps.
- Saved gift maps for specific people and places.

## Collaboration

This repo is designed for humans and AI agents to collaborate without storing full chat transcripts.

- Working notes live in `collaboration/`.
- Durable decisions live in `docs/decisions/`.
- Branch-specific experiments can be documented in `collaboration/branches/`.

Start with:

- [Collaboration Guide](collaboration/README.md)
- [Project Goals](collaboration/goals.md)
- [Agent Log](collaboration/agent-log.md)
- [Roadmap](docs/roadmap.md)
