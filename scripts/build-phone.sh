#!/usr/bin/env bash
# Build Brain Navigator in Release and install it on the plugged-in iPhone.
#
#   ./scripts/build-phone.sh            # build from the current branch
#   ./scripts/build-phone.sh --main     # switch to main and pull first
#   BN_DEVICE=<udid> ./scripts/build-phone.sh   # pick a specific phone
#
# Run on the Mac, with the phone plugged in and unlocked. Free signing lasts
# 7 days, so run it again when the app stops opening.
set -euo pipefail

# CocoaPods crashes on a non-UTF-8 shell ("Unicode Normalization not
# appropriate for ASCII-8BIT"), so force it for everything below.
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

log() { printf '\n› %s\n' "$*"; }
fail() { printf '\n✗ %s\n' "$*" >&2; exit 1; }

[[ "$(uname)" == "Darwin" ]] || fail "This needs a Mac with Xcode."
command -v xcrun >/dev/null || fail "Xcode command line tools are missing. Install Xcode, then run: xcode-select --install"

if [[ "${1:-}" == "--main" ]]; then
  [[ -z "$(git status --porcelain)" ]] || fail "You have uncommitted changes. Commit or stash them first, then run again."
  log "Switching to main and pulling the latest"
  git checkout main
  git pull --ff-only
fi

log "Building $(git rev-parse --abbrev-ref HEAD) @ $(git rev-parse --short HEAD)"

# Find the phone: BN_DEVICE wins; otherwise the first connected iPhone.
DEVICE="${BN_DEVICE:-}"
if [[ -z "$DEVICE" ]]; then
  log "Looking for a connected iPhone"
  # xctrace lists real devices as: Name (iOS version) (UDID)
  DEVICE="$(xcrun xctrace list devices 2>/dev/null \
    | sed -n '/== Devices ==/,/== Simulators ==/p' \
    | grep -iE 'iphone' \
    | grep -oE '\(([0-9A-F]{8}-[0-9A-F]{16}|[0-9a-f]{40})\)$' \
    | tr -d '()' | head -1 || true)"
fi
[[ -n "$DEVICE" ]] || fail "No iPhone found. Plug it in, unlock it, tap Trust if asked, then run again."
log "Using device $DEVICE"

# The usual blocker: Xcode can't prepare the phone ("developer disk image
# could not be mounted"). Catch it before a long build.
if xcrun devicectl list devices 2>/dev/null | grep -qiE 'unavailable'; then
  printf '\n! Xcode lists a device as unavailable. If the build fails with "developer disk image":\n'
  printf '  1. Unlock the phone and keep it unlocked\n'
  printf '  2. Xcode → Window → Devices and Simulators → click the phone, wait for "Preparing" to finish\n'
  printf '  3. Settings → Privacy & Security → Developer Mode is on\n'
  printf '  4. If it says this iOS version is not supported, update Xcode\n'
fi

if [[ ! -d node_modules ]] || [[ package-lock.json -nt node_modules ]]; then
  log "Installing packages"
  npm install
fi

log "Building and installing (a few minutes; keep the phone unlocked)"
BUILD_LOG="$(mktemp "${TMPDIR:-/tmp}/bn-build.XXXXXX")"
trap 'rm -f "$BUILD_LOG"' EXIT
if ! npx expo run:ios --configuration Release --device "$DEVICE" 2>&1 | tee "$BUILD_LOG"; then
  # The usual failures are signing, not code. Say what to do in plain steps.
  if grep -q "No Accounts" "$BUILD_LOG"; then
    printf '\n✗ Xcode isn'"'"'t signed in to your Apple ID.\n'
    printf '  Xcode → Settings → Accounts → + → Apple ID. Use the same Apple ID as last time,\n'
    printf '  or the phone will refuse the update. Then run this again.\n'
  elif grep -qE "No profiles for|requires a development team|provisioning profile" "$BUILD_LOG"; then
    printf '\n✗ Xcode needs to make a signing profile once, from its own window:\n'
    printf '  1. open ios/brainnavigator.xcworkspace\n'
    printf '  2. brainnavigator target → Signing & Capabilities → Automatically manage signing on\n'
    printf '  3. Team: your Personal Team (pick it again if it is already set), phone plugged in\n'
    printf '  4. Wait for "Xcode Managed Profile", close Xcode, run this again\n'
  elif grep -qiE "developer disk image|could not be mounted" "$BUILD_LOG"; then
    printf '\n✗ Xcode can'"'"'t prepare the phone. Unlock it, then Xcode → Window → Devices and Simulators,\n'
    printf '  click the phone and wait for "Preparing" to finish. Update Xcode if this iOS is too new.\n'
  fi
  printf '\n  Never delete the app from the phone to get past a signing error: its data goes with it.\n'
  exit 1
fi

log "Done. If the phone says Untrusted Developer: Settings → General → VPN & Device Management → your Apple ID → Trust."
