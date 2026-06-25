# Goals

## Product Goals

- Help people understand what is reachable from a specific place.
- Make travel-time maps that are useful enough for planning and beautiful enough to give as a gift.
- Start with driving-time maps, then consider walking, cycling, public transport, and other modes.
- Support large-scale views, such as a country or region, while still making local surroundings understandable.

## Collaboration Goals

- Keep project history readable for humans and AI agents.
- Summarize decisions and experiments instead of storing full conversations.
- Make divergent experiments explicit through branches and branch notes.

## Technical Goals

- Build a small web prototype first.
- Separate the user interface, map rendering, travel-time provider, and generated overlay data.
- Avoid locking into a paid API before testing the core experience.
- Cache or persist travel-time results where licensing and API terms allow it.
- Design for export later: images, PDFs, share links, or printable maps.

## Non-Goals For The First Prototype

- Perfect traffic modeling.
- Full country-scale high-resolution isochrones.
- Support for every travel mode.
- Production accounts, billing setup, or polished deployment.

