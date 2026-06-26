# Overview

Isochrones explores a simple question:

> From this place, what can I reach, and how long does it take?

The project aims to answer that visually with maps. A user chooses a location and sees travel-time bands over the surrounding area. Highways and faster roads should naturally stretch the reachable area farther than slow roads.

## First User Story

As a person making a gift map, I want to enter a property or location and generate a clear map of nearby travel-time zones, so that the recipient can quickly understand the surrounding area.

## Core Concepts

- Origin: the starting location.
- Travel mode: driving, walking, cycling, public transport, or similar.
- Traffic mode: current traffic, normal traffic, or traffic-free travel.
- Time bands: colored ranges such as 0-10, 10-20, 20-30, 30-45, and 45-60 minutes.
- Overlay: the map layer that visualizes reachable areas.
- Provider: the API or engine that calculates travel times.
