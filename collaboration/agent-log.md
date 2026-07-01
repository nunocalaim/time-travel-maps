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

## 2026-06-25 - Larger bands and map-refined origin

Participants:
- Human: Nuno
- AI: Codex

Goal:
- Let users explore larger travel-time maps and refine the origin directly on the map.

Decisions:
- Add a maximum travel time selector up to 3 hours.
- Keep hosted OpenRouteService driving requests capped at 60 minutes because of current provider restrictions.
- Fit the map to the active overlay after each redraw.
- Let map clicks set a precise starting location.

Tried:
- Added 90, 120, and 180 minute demo bands.
- Added click-to-set-origin behavior.
- Changed the initial map behavior from a fixed zoom to overlay fitting.

Open Questions:
- Which provider supports larger real driving isochrones with acceptable terms and cost?
- Should the map click also reverse-geocode a readable address?
- Should the legend hide bands above the current maximum time?

Next:
- Test the click-to-set-origin interaction in the browser.
- Decide whether larger real driving maps should use Google, Mapbox, another provider, or self-hosted routing.

## 2026-06-25 - Right-click origin selection

Participants:
- Human: Nuno
- AI: Codex

Goal:
- Avoid changing the origin with ordinary map clicks.

Decisions:
- Use right-click/context menu on the map to select a new starting point.

Tried:
- Changed the map interaction from `click` to `contextmenu`.
- Updated the UI hint and README wording.

Open Questions:
- Should mobile use a long-press or a dedicated "set origin" mode?

Next:
- Test right-click origin selection in the browser.

## 2026-06-25 - Favicon

Participants:
- Human: Nuno
- AI: Codex

Goal:
- Remove the harmless but noisy `/favicon.ico` 404 from the local dev server.

Decisions:
- Add a small SVG favicon linked from `index.html`.

Tried:
- Created `favicon.svg` using the project travel-time band colors.

Open Questions:
- Should the favicon evolve into a proper project mark later?

Next:
- Refresh the page and confirm the server no longer reports a missing favicon.

## 2026-06-25 - Browser PDF export

Participants:
- Human: Nuno
- AI: Codex

Goal:
- Add a first export path for gift maps.

Decisions:
- Start with browser print-to-PDF rather than a PDF generation library.
- Use a print stylesheet that prioritizes the map and keeps a compact title/legend panel.

Tried:
- Added an Export PDF button.
- Added print CSS for A4 landscape output.

Open Questions:
- Should future export generate a PNG, PDF, or both?
- Should print exports include editable title/subtitle text for the recipient?
- Do provider and tile-source terms allow the intended gift-map use at scale?

Next:
- Test browser Save as PDF output.
- Add a custom map title before generating polished gift maps.

## 2026-06-25 - Attribution and banded overlays

Participants:
- Human: Nuno
- AI: Codex

Goal:
- Add required ORS attribution and make travel-time bands easier to read.

Decisions:
- Show OpenRouteService/OpenStreetMap attribution in the app and print layout.
- Use non-linear bands: 1, 5, 10, 15, 20, 30, 45, and 60 minutes.
- Render demo bands as rings instead of stacked filled circles.
- Convert nested isochrone polygons into approximate band polygons by adding the previous contour as a hole.

Tried:
- Added attribution text below the map controls.
- Updated colors, legend, max-time choices, and selected-band logic.
- Added a simple GeoJSON banding transform for nested ORS polygons.

Open Questions:
- Do all ORS responses remain nested enough for the simple hole approach to be reliable?
- Should we use Turf.js later for robust polygon difference operations?

Next:
- Test real ORS polygons visually and verify the inner bands no longer look overly opaque.

## 2026-06-26 - Export frame and overlay opacity

Participants:
- Human: Nuno
- AI: Codex

Goal:
- Make PDF export controllable and allow visual tuning of the travel-time overlay.

Decisions:
- Add a draggable A4-landscape export frame on top of the map.
- Fit the map to the export frame before opening the browser print dialog.
- Hide the export frame from the printed PDF.
- Add an overlay transparency slider that updates demo and real isochrone layers.

Tried:
- Added an export frame rectangle with drag behavior.
- Added a reset button for the export frame.
- Added an overlay transparency range input.
- Restored the previous map view after printing.

Open Questions:
- Should the export frame become resizable, not just draggable?
- Should exports eventually use canvas/image generation instead of browser print?

Next:
- Test the PDF output and adjust the print layout if browser rendering still feels off.

## 2026-06-26 - Export selection mode

Participants:
- Human: Nuno
- AI: Codex

Goal:
- Make export selection explicit instead of showing the export frame all the time.

Decisions:
- Hide the export frame by default.
- Use `Prepare export` to enter export mode.
- Use `Export selection` to print the selected map area.
- Add corner handles so the export frame can be resized while keeping an A4-landscape ratio.
- Add a checkbox to include or omit the legend from the export.
- Tighten print CSS to reduce duplicate/extra PDF pages.

Tried:
- Added prepare/export/cancel/reset export controls.
- Added draggable resize handles.
- Added `no-print-legend` support for print output.
- Changed print map sizing from viewport height to page height.

Open Questions:
- Should export controls move into a small floating toolbar over the map?
- Should the final PDF be generated directly instead of relying on the browser print dialog?

Next:
- Test export selection in the browser and confirm it produces one page.

## 2026-06-26 - Freeform export frame and visible attribution

Participants:
- Human: Nuno
- AI: Codex

Goal:
- Remove the fixed export aspect ratio and make attribution visible on the map.

Decisions:
- Let the export frame resize freely instead of preserving A4 landscape ratio.
- Add attribution directly over the map in addition to the side panel.

Tried:
- Changed resize-handle math to allow independent width and height.
- Added a bottom-right map attribution overlay.

Open Questions:
- Should export offer optional presets later, such as A4 landscape, A4 portrait, square, or 16:9?

Next:
- Test export composition with freeform frame resizing.

## 2026-06-26 - Print crop export

Participants:
- Human: Nuno
- AI: Codex

Goal:
- Make the exported PDF match the selected rectangle.

Decisions:
- Stop using Leaflet `fitBounds` for export because it changes the geographic framing instead of cropping the selected screen rectangle.
- Use the export frame's screen-pixel bounds to scale and shift the map during print.
- Keep attribution outside the transformed map so it remains visible in the export.

Tried:
- Added print-crop CSS variables for map size, offset, and scale.
- Added print-crop setup/cleanup around the browser print dialog.
- Moved map attribution outside the Leaflet map container.

Open Questions:
- Browser print engines may still vary; should a future export use a generated image/PDF pipeline?

Next:
- Test whether the exported PDF now matches the selected frame.

## 2026-06-26 - Explicit API fetch and export aspect ratio

Participants:
- Human: Nuno
- AI: Codex

Goal:
- Prevent surprise API calls and preserve the export selection aspect ratio.

Decisions:
- Stored ORS keys should not trigger API requests on page reload.
- Add a dedicated `Fetch real isochrones` button for ORS calls.
- Reset to demo data when origin, mode, traffic, time band, or API key changes.
- Generate a temporary print page size that matches the selected export frame.

Tried:
- Added explicit real-data fetch state.
- Removed independent X/Y print scaling.
- Added dynamic print page sizing based on selected frame dimensions.

Open Questions:
- Some browser print dialogs may ignore dynamic `@page size`; if so, direct PDF generation will be needed.

Next:
- Test reload behavior and tall/narrow export selections.

## 2026-06-26 - App naming, sidebar, and local overlay storage

Participants:
- Human: Nuno
- AI: Codex

Goal:
- Polish core UI behavior and reduce repeated API usage.

Decisions:
- Rename the visible project to Isochrones.
- Use "Travel-time maps" as the main app heading.
- Make the control sidebar collapsible.
- Remember the last starting location in local storage.
- Allow fetched ORS overlays to be saved and loaded locally.
- Keep live traffic visible but disabled.
- Zoom fitted maps about 45 percent closer.

Tried:
- Added sidebar toggle controls and collapsed layout CSS.
- Added local origin persistence.
- Added saved overlay controls backed by `localStorage`.
- Added closer zoom after overlay fitting.

Open Questions:
- Should saved overlays be exportable as files for sharing between browsers or collaborators?

Next:
- Test save/load with a real ORS response.

## 2026-06-26 - Full-screen map controls and local key file

Participants:
- Human: Nuno
- AI: Codex

Goal:
- Make the map feel like a normal full-screen map app and keep secrets out of Git.

Decisions:
- Hide the sidebar by default.
- Use a compact floating sidebar toggle instead of a text show/hide button.
- Render controls as an overlay above the map so the map is never squeezed.
- Remove the starting-location search input from the sidebar.
- Keep body scrolling disabled; if controls overflow, only the sidebar scrolls.
- Read an optional OpenRouteService key from ignored `config.local.js`.
- Save the current map center/zoom with saved overlays.

Tried:
- Added `config.local.example.js` and ignored `config.local.js`.
- Added local config loading before the main app script.
- Reworked sidebar layout to fixed overlay mode.
- Added saved view state to saved overlays.

Open Questions:
- Browser JavaScript cannot write a pasted key directly to a local file without a backend or file picker; should a future local dev server handle this?

Next:
- Test sidebar behavior on desktop and mobile.
- Copy the ORS key into `config.local.js` locally.

## 2026-06-26 - Overlay workflow refinement

Participants:
- Human: Nuno
- AI: Codex

Goal:
- Separate overlay creation from overlay styling/export and make saved overlays more useful.

Decisions:
- Prompt for a name when saving overlays, defaulting to the readable location label.
- Use reverse geocoding for right-click/current-location names when possible.
- Load the newest saved overlay automatically on startup.
- Hide style/export controls until a real or saved overlay exists.
- Rename Time assumption to Traffic consideration.
- Hide the entire side panel in print when legend export is disabled.

Tried:
- Added reverse geocoding via Nominatim.
- Added `overlayTools` visibility state.
- Changed saved-overlay loading to restore view center and zoom.

Open Questions:
- Should saved overlays be shown as cards rather than a select/dropdown?

Next:
- Test with existing saved overlays and a newly saved named overlay.

## 2026-07-01 - SVG composition tools

Participants:
- Human: Nuno
- AI: Codex

Goal:
- Turn SVG export into the main gift-map composition workflow.

Decisions:
- Keep SVG export as the primary export path.
- Add export quality choices for screen, 2x, and 4x output dimensions.
- Add optional export title, subtitle, annotation, legend, metadata, origin label, and time-band labels.
- Add overlay palette presets: classic, warm, blue-green, and grayscale.
- Treat saved overlays more like saved map compositions by storing style/export settings with them.

Tried:
- Added overlay rename and duplicate actions.
- Added a saved-overlay metadata panel.
- Saved and restored composition settings such as map style, palette, opacity, labels, metadata, and export frame.
- Updated SVG export to include optional title/metadata/labels/legend.

Open Questions:
- Should export quality eventually refetch higher-zoom or retina tiles instead of only scaling SVG output dimensions?
- Should custom annotations become draggable map labels rather than a single export note?

Next:
- Test SVG exports in Illustrator with titles, metadata, labels, and each palette.

## 2026-07-01 - Sample route proof of concept

Participants:
- Human: Nuno
- AI: Codex

Goal:
- Explore showing example routes instead of only filled isochrone bands.

Decisions:
- Keep route fetching opt-in because it can require many more OpenRouteService calls.
- Use the existing real-isochrone fetch flow as the entry point: fetch isochrones, sample points in the band polygons, then request directions to those destinations.
- Draw longer routes first and color each route by the destination band.
- Cap route sampling for the prototype to avoid accidentally making a very large number of API calls.

Tried:
- Added an "Also fetch sample routes" checkbox under Real data.
- Sampled random points inside the visible band geometries.
- Requested OpenRouteService directions for sampled destinations.
- Rendered route GeoJSON in a separate route layer so SVG export includes it.

Open Questions:
- Should route sampling be deterministic from a saved seed so reloading a saved map reproduces the same routes?
- Should users control per-band sample counts directly?

Next:
- Test route sampling with a real ORS key and watch rate-limit behavior.

## 2026-07-01 - Route fetch progress and saved route clarity

Participants:
- Human: Nuno
- AI: Codex

Goal:
- Make long route-enhanced data requests feel active and clarify that saved overlays keep route data.

Decisions:
- Rename the real-data action from "Fetch real isochrones" to "Get real data" because it may now fetch routes too.
- Disable the real-data button while requests are running and show progress text.
- Include saved sample-route counts in overlay metadata and save status.

Tried:
- Added fetch button loading labels for isochrone-only and isochrone-plus-route requests.
- Updated status copy around API keys, changed origins, demo fallback, and saved overlays.

Next:
- Consider adding a cancellable route-fetch workflow if route sampling becomes slow enough to need interruption.

## 2026-07-01 - Route sampling distribution tweak

Participants:
- Human: Nuno
- AI: Codex

Goal:
- Make sample routes more visible and ensure far travel-time bands are represented.

Decisions:
- Use explicit per-band route sample counts instead of allowing near bands to consume the entire route budget.
- Increase route stroke weight and endpoint marker size for the proof-of-concept view.

Tried:
- Raised the overall sample-route cap while assigning each band its own sample count.
- Made route lines and destination markers thicker.

Next:
- Test whether the new per-band allocation produces routes in the 30, 45, and 60 minute bands.

## 2026-07-01 - Polygon-library route coloring experiment

Participants:
- Human: Nuno
- AI: Codex

Goal:
- Test whether a polygon library can color route segments by the isochrone band each road segment passes through.

Decisions:
- Branch the experiment to `polygon-library`.
- Use Turf.js in the browser for point-in-polygon checks.
- Keep the previous destination-band route color as a fallback if Turf is unavailable.
- Start with midpoint-based segment classification before attempting exact line/polygon splitting.

Tried:
- Added Turf.js from a CDN.
- Split route geometries into consecutive line segments.
- Classified each segment by checking its midpoint against the non-overlapping isochrone band polygons.
- Merged adjacent route segments that share the same band color.

Open Questions:
- Is midpoint classification good enough visually, or do we need exact boundary splitting?
- Should Turf be vendored or installed through a build step before publishing?

Next:
- Compare route coloring on shared highways against the destination-band coloring on the previous branch.

## 2026-07-01 - Route color smoothing modes

Participants:
- Human: Nuno
- AI: Codex

Goal:
- Reduce noisy route color flickers near isochrone boundaries while keeping fast-corridor behavior plausible.

Decisions:
- Add route coloring modes instead of baking in one interpretation.
- Make "Smoothed band color" the default.
- Keep raw Turf band coloring, outbound monotone coloring, and destination coloring available for comparison.
- Smooth short isolated color runs rather than enforcing strict monotonic color progression.

Tried:
- Added a Route coloring selector to overlay tools.
- Saved route coloring mode with map composition settings.
- Implemented short-run smoothing for one-off flickers.
- Added an outbound monotone mode as a stylized alternative.

Open Questions:
- What minimum distance should define a "short" flicker at different map scales?
- Should smoothing eventually consider turn angle/road continuity in addition to segment length?

Next:
- Compare smoothed versus raw coloring on highways near band boundaries.

## 2026-07-01 - Far-band route sampling diagnostics

Participants:
- Human: Nuno
- AI: Codex

Goal:
- Investigate why sample routes in farther bands were disappearing again.

Decisions:
- Treat API failures or rate limits as plausible because route calls were still being made near-to-far.
- Interleave route requests by band from farthest to nearest so farther bands are attempted early.
- Store route request summaries with overlays so failures are visible.

Tried:
- Added attempted/succeeded/failed route counts.
- Added per-band attempt/failure summaries internally.
- Changed route destination ordering to round-robin across bands from farthest to nearest.

Next:
- Test whether far-band routes appear even when some route requests fail.

## 2026-07-01 - Area-weighted route sampling

Participants:
- Human: Nuno
- AI: Codex

Goal:
- Make sample-route destinations reflect that farther/red bands usually cover more area than near/green bands.

Decisions:
- Replace fixed per-band route counts with an area-weighted allocation.
- Keep a small minimum number of routes per band so narrow inner bands still appear.
- Spend the remaining route budget proportionally to approximate band area.
- Preserve far-to-near interleaving so outer bands are still requested early.

Tried:
- Added approximate polygon area calculation for isochrone bands.
- Weighted MultiPolygon sampling by polygon area, so larger pieces get proportionally more candidate destinations.

Open Questions:
- Tune the route cap and minimum-per-band count after testing real API usage.
- Consider using Turf area calculations if this approximate local projection becomes visibly inaccurate.

## 2026-07-01 - Hide sample route endpoints

Participants:
- Human: Nuno
- AI: Codex

Goal:
- Keep sample-route maps focused on actual returned road paths instead of sampled destination points.

Decision:
- Stop drawing destination endpoint markers for sample routes.
- Keep destination coordinates in the route data for saved overlays and diagnostics.

Tried:
- Removed the Leaflet circle marker drawn at each sampled route destination.

## 2026-07-01 - Manual route picking mode

Participants:
- Human: Nuno
- AI: Codex

Goal:
- Let the user add specific example routes by clicking destinations on the map.

Decisions:
- Add a mode toggle under overlay tools so ordinary map clicks still behave normally.
- Use the current origin marker as the route start.
- Append picked routes to the current overlay so saving the overlay also saves the manually added routes.
- Color clicked routes by the clicked isochrone band when possible, otherwise by returned route duration.

Tried:
- Added a "Click map to add routes" checkbox.
- Added a map click handler that calls OpenRouteService directions and redraws the route layer.
- Added cursor feedback while route picking is active or fetching.
