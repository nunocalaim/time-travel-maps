# 0002 - First Product Slice

Date: 2026-06-25

Status: Proposed

## Context

The full idea includes a location-based web app, map data, travel-time calculations, current traffic, normal traffic, traffic-free estimates, multiple travel modes, and giftable exports.

Building all of this at once would make the first prototype slow and provider-dependent.

## Decision

Start with a simple driving-time map prototype.

- Web page.
- Location input.
- Map centered on the selected place.
- Color-coded travel-time overlay.
- Mock or static overlay first if needed.
- Real driving-time isochrones after choosing a provider.

## Consequences

- The first version can be built quickly.
- The core user experience can be tested before API cost and traffic complexity dominate the project.
- Walking, public transport, live traffic, and gift exports remain important but later.

## Alternatives Considered

- Start with live traffic immediately.
- Start with all travel modes.
- Start with static printable maps only.

