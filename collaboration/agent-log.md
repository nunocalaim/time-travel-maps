# Agent Log

## 2026-06-25 - Project direction and collaboration structure

Participants:
- Human: Nuno
- AI: Codex

Goal:
- Start a GitHub-friendly project structure for collaboration between humans and AI agents.
- Capture the first product idea: a web page that maps travel time from a chosen location.

Decisions:
- Do not store full conversation transcripts in the repo.
- Store summarized decisions, attempts, open questions, and next steps in markdown.
- Use `collaboration/` for working project memory.
- Use `docs/decisions/` for durable decision records.
- Treat live traffic and multiple travel modes as later additions unless the first API choice makes them easy.
- Start with a simple web prototype focused on driving-time overlays.

Tried:
- Considered a full chat-log file and rejected it as too noisy.
- Considered branch-specific notes for divergent human or AI experiments.
- Framed the first product around giftable maps for people evaluating a property or location.

Open Questions:
- Which mapping library should be used?
- Which travel-time API should power the first prototype?
- Should the first overlay use official isochrone polygons from a provider or an internally sampled grid?
- What region should be targeted first?

Next:
- Pick a first frontend stack and map library.
- Compare travel-time API options, especially traffic support, cost, and data retention rules.
- Build a minimal prototype with a location input, map, and placeholder travel-time overlay.

## 2026-06-25 - Static map prototype

Participants:
- Human: Nuno
- AI: Codex

Goal:
- Make the project tangible with a first browser-based map prototype.

Decisions:
- Use a static `index.html` prototype before introducing a frontend framework.
- Use Leaflet and token-free raster map tiles for the first map because they keep the prototype lightweight.
- Use Nominatim for early location search, with the understanding that production use may need a different geocoder.
- Mark the current travel-time overlay as demo data, not real routing.

Tried:
- Created a split-screen web page with controls on the left and a map on the right.
- Added location search, browser geolocation, travel mode toggles, and color-coded demo bands.

Open Questions:
- Which provider should generate real isochrones?
- How should the design represent highways and road speeds before real routing is connected?
- Should the gift output be image-first, PDF-first, or share-link-first?

Next:
- Review provider options for real driving-time isochrones.
- Replace circular demo bands with provider-generated polygons.
- Add export once real overlays exist.

## 2026-06-25 - Tile source adjustment

Participants:
- Human: Nuno
- AI: Codex

Goal:
- Fix blocked map tiles in the static prototype.

Decisions:
- Avoid using the public OpenStreetMap tile endpoint directly for the app prototype.
- Switch the base map to CARTO raster tiles while keeping OpenStreetMap attribution.

Tried:
- Opened the static `index.html` locally and saw blocked map areas.
- Identified the likely issue as tile-server blocking rather than application logic.

Open Questions:
- Which production map tile provider should be used?
- Should the app eventually use a paid tile provider, self-hosted tiles, or a provider bundled with the routing API?

Next:
- Reopen `index.html` and check whether tiles render more consistently.
- Choose a production tile and routing provider before publishing a public app.
