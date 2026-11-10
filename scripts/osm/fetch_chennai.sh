#!/usr/bin/env bash
# Fetch major Chennai roads (Chennai Central -> Injambakkam) from the Overpass API.
# Usage: bash scripts/osm/fetch_chennai.sh /tmp/osm/roads.json
set -euo pipefail
OUT="${1:-/tmp/osm/roads.json}"
mkdir -p "$(dirname "$OUT")"
BBOX="12.900,80.200,13.090,80.295"
Q="[out:json][timeout:90];(way[\"highway\"~\"^(motorway|trunk|primary|secondary|tertiary|motorway_link|trunk_link|primary_link|secondary_link|tertiary_link)$\"]($BBOX);)->.w;.w out body;.w >;out skel qt;node[\"highway\"=\"traffic_signals\"]($BBOX);out qt;"
curl -sS --fail --max-time 120 -A "ChennaiTrafficSim/0.1" --data-urlencode "data=$Q" \
  https://overpass-api.de/api/interpreter -o "$OUT"
echo "saved $OUT"
