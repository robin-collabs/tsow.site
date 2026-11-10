#!/usr/bin/env python3
"""
Chennai road network import pipeline.

1. Fetch raw OSM data (run once, needs internet):
     bash scripts/osm/fetch_chennai.sh /tmp/osm/roads.json
2. Build the bundled dataset:
     python3 scripts/osm/build_roads.py /tmp/osm/roads.json src/data/chennai-roads.json

Output (local metres, y grows southwards):
  {
    origin: [lat0, lon0], bbox: [s, w, n, e], fetchedAt,
    nodes: [[x, y, signal(0|1)], ...],      # intersections / way ends / signals
    edges: [[a, b, cls, oneway, speedKmh, lanes, nameIdx, [x0,y0,x1,y1,...]], ...],
    names: [...]
  }
Road data (c) OpenStreetMap contributors, ODbL.
"""
import json, math, sys

SRC = sys.argv[1] if len(sys.argv) > 1 else "/tmp/osm/roads.json"
DST = sys.argv[2] if len(sys.argv) > 2 else "src/data/chennai-roads.json"
BBOX = (12.900, 80.200, 13.090, 80.295)
LAT0, LON0 = (BBOX[0] + BBOX[2]) / 2, (BBOX[1] + BBOX[3]) / 2
KX = math.cos(math.radians(LAT0)) * 111320.0
KY = 110540.0

CLASS = {"motorway": 0, "trunk": 0, "primary": 1, "secondary": 2, "tertiary": 3}
DEFAULT_SPEED = {0: 60, 1: 50, 2: 40, 3: 30}
DEFAULT_LANES = {0: 3, 1: 2, 2: 2, 3: 1}


def proj(lat, lon):
    return ((lon - LON0) * KX, -(lat - LAT0) * KY)


def simplify(pts, tol=1.5):
    if len(pts) < 3:
        return pts
    keep = [False] * len(pts)
    keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        i, j = stack.pop()
        (ax, ay), (bx, by) = pts[i], pts[j]
        dx, dy = bx - ax, by - ay
        L = math.hypot(dx, dy) or 1e-9
        best, bi = 0.0, -1
        for k in range(i + 1, j):
            px, py = pts[k]
            d = abs(dy * (px - ax) - dx * (py - ay)) / L
            if d > best:
                best, bi = d, k
        if best > tol and bi > 0:
            keep[bi] = True
            stack += [(i, bi), (bi, j)]
    return [p for p, k in zip(pts, keep) if k]


def parse_int(v, d):
    try:
        return int(str(v).split(";")[0].split(".")[0])
    except Exception:
        return d


data = json.load(open(SRC))
nodes = {}
signals = set()
ways = []
for el in data["elements"]:
    if el["type"] == "node":
        nodes[el["id"]] = (el["lat"], el["lon"])
        if el.get("tags", {}).get("highway") == "traffic_signals":
            signals.add(el["id"])
    elif el["type"] == "way":
        ways.append(el)

usage = {}
for w in ways:
    nds = w["nodes"]
    for i, n in enumerate(nds):
        usage[n] = usage.get(n, 0) + (2 if i in (0, len(nds) - 1) else 1)

node_index, out_nodes = {}, []


def nid(n):
    if n not in node_index:
        x, y = proj(*nodes[n])
        node_index[n] = len(out_nodes)
        out_nodes.append([round(x, 1), round(y, 1), 1 if n in signals else 0])
    return node_index[n]


names, name_index, edges = [], {}, []
for w in ways:
    t = w.get("tags", {})
    hw = t.get("highway", "")
    base = hw.replace("_link", "")
    cls = CLASS.get(base, 3)
    ow = t.get("oneway", "no")
    oneway = 1 if ow in ("yes", "1", "true") or t.get("junction") == "roundabout" or hw == "motorway" else (-1 if ow == "-1" else 0)
    speed = parse_int(t.get("maxspeed"), DEFAULT_SPEED[cls])
    lanes = parse_int(t.get("lanes"), DEFAULT_LANES[cls] * (1 if oneway else 2))
    if not oneway:
        lanes = max(1, lanes // 2)
    lanes = max(1, min(lanes, 4))
    name = t.get("name:en") or t.get("name") or t.get("ref") or ""
    if name not in name_index:
        name_index[name] = len(names)
        names.append(name)
    nds = [n for n in w["nodes"] if n in nodes]
    if oneway == -1:
        nds = nds[::-1]
        oneway = 1
    seg = [nds[0]] if nds else []
    for n in nds[1:]:
        seg.append(n)
        if usage.get(n, 0) > 1 or n in signals or n == nds[-1]:
            if len(seg) >= 2 and seg[0] != seg[-1]:
                pts = simplify([proj(*nodes[k]) for k in seg])
                flat = [round(c, 1) for p in pts for c in p]
                edges.append([nid(seg[0]), nid(seg[-1]), cls, oneway, speed, lanes, name_index[name], flat])
            seg = [n]

out = {
    "attribution": "Road data (c) OpenStreetMap contributors, ODbL",
    "origin": [LAT0, LON0],
    "kx": KX,
    "ky": KY,
    "bbox": list(BBOX),
    "fetchedAt": data.get("osm3s", {}).get("timestamp_osm_base", ""),
    "nodes": out_nodes,
    "edges": edges,
    "names": names,
}
with open(DST, "w") as f:
    json.dump(out, f, separators=(",", ":"))
print(f"nodes={len(out_nodes)} edges={len(edges)} signals={sum(n[2] for n in out_nodes)} -> {DST}")
