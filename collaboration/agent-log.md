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

## 2026-06-25 - Leaflet CSS fallback

Participants:
- Human: Nuno
- AI: Codex

Goal:
- Fix map tiles appearing misaligned or out of order on `localhost`.

Decisions:
- Keep using CDN Leaflet for now, but add essential Leaflet layout rules locally in `styles.css`.
- Treat scrambled tiles as a likely stylesheet-loading problem rather than a routing or map-data issue.

Tried:
- Added local fallback positioning for Leaflet panes, tile containers, tiles, controls, attribution, and popups.

Open Questions:
- Should Leaflet be vendored locally or installed through a build system later?
- Should the first publishable version avoid CDN dependencies entirely?

Next:
- Refresh the local page and confirm tile alignment.
- If CDN JavaScript or CSS continues to be unreliable, vendor Leaflet assets locally or introduce a small package setup.

## 2026-06-25 - Overlay ordering and marker cleanup

Participants:
- Human: Nuno
- AI: Codex

Goal:
- Fix demo circles disappearing behind map tiles and remove clipped marker text.

Decisions:
- Add local fallback z-index rules for Leaflet panes.
- Replace Leaflet's default image marker with a vector `circleMarker` so the prototype does not depend on marker image assets.
- Keep the concentric circles clearly documented as placeholder data.

Tried:
- Added pane stacking rules for tile, overlay, marker, tooltip, popup, and control panes.
- Switched the origin marker from `L.marker` to `L.circleMarker`.

Open Questions:
- Should the placeholder become a more realistic fake isochrone shape before real API integration?
- Which routing provider should generate the first real isochrone polygons?

Next:
- Refresh the local page and verify the circles remain visible over the tiles.
- Choose and test a real isochrone provider.

## 2026-06-25 - Real-data experiment branch

Participants:
- Human: Nuno
- AI: Codex

Goal:
- Start moving from placeholder rings toward real travel-time data while keeping development paused enough to make deliberate provider choices.

Decisions:
- Create `experiment-real-isochrones` for real-data work.
- Prefer provider-generated isochrone polygons over destination lattice sampling for the first real implementation.
- Avoid road-type-only travel-time calculations because they would be too approximate for a product that promises real usefulness.
- Keep demo rings as a no-key fallback.
- Add simple map style presets now and leave fine-grained vector styling for a later MapLibre or Mapbox phase.

Tried:
- Added a provider-shaped travel-time boundary to `script.js`.
- Added a map style dropdown with detailed, light, and dark raster tile styles.
- Added a branch note and a proposed decision record for real travel-time data.

Open Questions:
- Which provider should be tested first: Google Isochrones, Mapbox Isochrone, OpenRouteService, GraphHopper, or another option?
- What provider terms allow gift-map export and cached results?
- Should the first real integration live entirely in the browser or behind a tiny backend to protect API keys?

Next:
- Choose the first provider to trial.
- Add `.env.example` and a no-secret configuration path if a provider key is needed.
- Replace demo rings with provider GeoJSON when credentials are available.

## 2026-06-25 - OpenRouteService trial integration

Participants:
- Human: Nuno
- AI: Codex

Goal:
- Replace the path toward demo-only rings with a real isochrone provider.

Decisions:
- Use OpenRouteService as the first trial provider.
- Keep the API key out of files by accepting it in the page and storing it only in `sessionStorage`.
- Continue falling back to demo rings when no key is present or the provider request fails.
- Treat traffic controls as future-facing for now because OpenRouteService is not being used for live traffic in this prototype.

Tried:
- Added an OpenRouteService API key field.
- Added a provider adapter that calls `/v2/isochrones/{profile}`.
- Styled returned GeoJSON features with the existing time-band colors.

Open Questions:
- Are OpenRouteService terms acceptable for cached or exported gift maps?
- Should API calls move behind a backend before this becomes public?
- Should Mapbox or Google still be trialed for traffic-aware driving isochrones?

Next:
- Paste an OpenRouteService key locally and verify real polygons render.
- If successful, decide whether to merge this experiment back to `main`.
