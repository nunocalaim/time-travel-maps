# Time to X

Time to X is an exploratory project for making travel-time maps as gifts.

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
- Nominatim for public location search.
- Demo travel-time rings, not real routing or traffic data yet.
- A provider-shaped travel-time boundary in `script.js`, currently set to `demo`.
- A small map-style selector for detailed, light, and dark base maps.

If tiles appear scrambled or misaligned, the Leaflet stylesheet is probably blocked by the browser or CDN. The app includes local fallback layout rules in `styles.css`, so refresh the page after pulling the latest files.

The colored circles are placeholders. They are not real travel-time data yet; the next technical step is to replace them with isochrone polygons from a routing provider.

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
