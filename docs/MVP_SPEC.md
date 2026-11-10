# Chennai Autonomous Traffic Simulator — MVP spec (v1, refined)

Inspired by [gniziemazity/virtual-world](https://github.com/gniziemazity/virtual-world). This is the
cut-down version of the full v1 brief, sized so a working MVP fits in about 5 build credits.

## MVP scope (built)

| Area | MVP decision |
| --- | --- |
| Map data | Real OSM roads (trunk → tertiary + links) from Chennai Central to Injambakkam, fetched once and bundled as `public/data/chennai-roads.json` (~420 KB). No runtime API calls. Pipeline: `scripts/osm/fetch_chennai.sh` + `scripts/osm/build_roads.py`. |
| Rendering | One HTML canvas, Virtual-World look: green ground, grey roads with white edges, lane dashes, medians, fake-3D vehicles with shadows. **No MapLibre / tiles** (saves effort, no tile provider). |
| Zones | City overview + Central Chennai, Southern Chennai, Injambakkam & ECR. Each zone runs on the largest connected part of its road graph. |
| Road graph | Intersection nodes, directed edges, road class, one-way, lanes, OSM speed limits, OSM traffic signals. A* routing. |
| Vehicles | Car, bike/scooter, auto rickshaw, truck — one engine, behaviour from a parameter table. |
| Driving AI | IDM car-following, kerb-side (left-hand) driving, signal stops, right-of-way at unsignalled junctions, lane changes/overtaking, bike & auto lane filtering, auto roadside stops, slower/wider truck turns. |
| Recovery | Stuck 30 s → re-route; stuck 75 s → respawn. |
| Controls | Start/pause, reset, speed 0.5–4×, vehicle count 30–100, density presets, vehicle mix, spawn per type, type filters, click to inspect, follow cam, pan/zoom. Settings saved in localStorage. |
| Backend | None. |

## Deferred (next prompts, in priority order)

1. **GitHub repo** — connect GitHub in Lovable (Settings → GitHub → Connect project); Lovable creates the repo.
2. **GitHub Pages deploy** — static build with configurable base path + a Pages workflow.
3. Residential streets (denser network, more congestion).
4. MapLibre base map under the canvas (optional).
5. Opposite-lane overtaking on two-lane roads, roundabout logic, signal timing per junction.
6. Trains, pedestrians, public transport (explicitly out of v1).

## Known limitations

- Only major roads are included; small streets are omitted to keep the dataset light.
- Vehicles may briefly scrape sideways when merging; there is no full 2D collision solver.
- With 100 vehicles over a whole zone, traffic is light; queues form mainly at signals.
