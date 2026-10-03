#!/bin/bash
# Atlas's proof: photograph the Simulator and log it to the hub.
#   tools/hub/shot.sh <ideas> "what this shows"      (ideas: R6-21,R6-25 or -)
set -e
ideas="$1"; shift
out="/tmp/hub-shot-$(date +%s).png"
xcrun simctl io booted screenshot --type=png "$out" >/dev/null 2>&1
sips -Z 1000 "$out" >/dev/null 2>&1 || true
args=(atlas shot --shot "$out")
[ "$ideas" != "-" ] && args+=(--idea "$ideas")
node "$(dirname "$0")/hub.mjs" "${args[@]}" "$*"
echo "$out"
