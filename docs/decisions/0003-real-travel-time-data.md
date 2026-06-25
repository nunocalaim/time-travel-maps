# 0003 - Real Travel-Time Data

Date: 2026-06-25

Status: Proposed

## Context

The project needs color-coded travel-time areas around a chosen origin. There are three broad approaches:

- ask an isochrone API for reachable-area polygons;
- sample many destination points in a lattice and route to each point;
- calculate travel time ourselves from road type, speed assumptions, and map data.

The product should use real data where possible. It should also support giftable outputs, so provider terms, caching, and export rights matter.

## Decision

Prefer a real isochrone provider for the first real-data prototype.

Use placeholder rings only as a local fallback. Do not build our own road-type travel-time engine unless we later self-host a real routing engine such as Valhalla, GraphHopper, OSRM, or a similar network-based system.

## Rationale

- Isochrone APIs directly return the shape we need.
- Routing providers already handle road topology, turn restrictions, one-way streets, highways, walking paths, and disconnected networks.
- Sampling a lattice is useful for heatmaps or custom visual effects, but it requires many route calls and interpolation.
- Road-type-only calculations would be fragile and likely misleading.

## Provider Candidates

- Google Isochrones API: promising for traffic-aware and traffic-unaware modes, but currently preview/pre-GA.
- Mapbox Isochrone API: mature and simple, with driving, driving-traffic, walking, cycling, and GeoJSON output; terms may require display on Mapbox maps.
- OpenRouteService or GraphHopper: good OSM-oriented candidates, especially for avoiding deeper platform lock-in.
- Self-hosted routing: attractive later if we need control, caching, or repeatable gift-map generation at scale.

## Consequences

- The next implementation should add a provider adapter instead of embedding provider calls throughout the UI.
- API keys must not be committed.
- Provider terms must be checked before caching results or exporting gift maps.
- The UI should continue to work with demo data when no provider is configured.

## Alternatives Considered

- Sample a destination lattice and interpolate travel times.
- Estimate travel time from OSM road classes and assumed speeds.
- Delay all real-data work until map appearance is polished.

