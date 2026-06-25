# Branch: experiment-real-isochrones

Purpose:
- Test the path from placeholder travel-time rings to real provider-generated isochrone polygons.
- Keep the real-data experiment separate from `main` until provider cost, terms, and implementation shape are clearer.

Status:
- Active experiment.

Diverges From:
- `main`

Assumptions:
- Real provider data is preferred over calculating travel time from road type ourselves.
- The first integration should request isochrone polygons directly instead of sampling a lattice of destination points.
- The UI should keep working with demo data when no API key is configured.

Different Direction:
- Introduces a provider-shaped boundary in `script.js`.
- Adds a first map style selector so appearance can evolve alongside the data layer.

Merge Criteria:
- The app still works without secrets or paid credentials.
- A real isochrone provider can be added behind the provider boundary.
- The branch improves clarity about provider choice, licensing, or user experience.

Abandon Criteria:
- The provider path becomes too locked to one vendor before terms are understood.
- The branch mixes data-provider experimentation with unrelated product work.

