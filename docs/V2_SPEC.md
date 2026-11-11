# TSOW v2 Spec (refined)

## Pass 1 — shipped in 0.2.0
- Repo standards: MIT licence, security policy, semver changelog with shields.
- Tag-only Pages deploy (`git tag v0.2.0 && git push --tags`).
- Inspector: 340px, inline Follow toggle.
- Journey minimap above inspector while following; route never drawn on main map.
  Colour per remaining edge from mean speed / limit: >70% blue, 30–70% amber, <30% red.
- Vehicle cap 300.

## Pass 2 — next
- Re-import OSM including residential/service roads for the corridor.
- Explicit trip objects (origin, destination, departure time) and a district OD-matrix editor.
- Signal-queue awareness in minimap colouring.
