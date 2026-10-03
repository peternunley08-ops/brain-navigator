# Round 7: Seen, shipped, and on the phone

Written 2026-10-03 at the end of Round 6 (`docs/rounds/round-6.md`).

Round 6 built 100 ideas in a cloud session that has no Simulator. So most
of it is `[~]`: built and passing the gate, not yet seen. Round 7 starts by
seeing it, then makes the phone easy to update, then picks up the ideas
that needed a native build.

Statuses: `[ ]` not started · `[~]` built, partly checked · `[x]` done and
checked · `[–]` decided against (with why)

## A. See Round 6 live (on the Mac)

1. [ ] Fix the phone install: Xcode said "the developer disk image could not be mounted". Unlock the phone, let Xcode prepare it (Window → Devices and Simulators), update Xcode if iOS 27.2 isn't supported
   - [~] iOS 27 launch: apps built with the iOS 27 SDK won't open without the UIScene life cycle. `plugins/withSceneLifecycle.js` wires in Expo's scene delegate at prebuild. Opens on the iOS 27 and iOS 26 simulators, deep links work warm and cold; check on the phone
2. [ ] Release build on the phone: `./scripts/build-phone.sh --main`
3. [ ] Walk every `[~]` item in Round 6 with real taps; flip it to `[x]` or file the bug here
4. [ ] Night: `?night=21:30`, `?night=00:30`, Sunday night, `?night=08:00` for First light
5. [ ] Ember: hold to breathe, drag weight, night candle, study buddy book, birthday hat
6. [ ] Every new piece at the largest text size (R6-92)
7. [ ] Every new piece with VoiceOver and Reduce Motion, on the device (R6-93, R6-94)
8. [ ] A last full pass: open every page, read every word (R6-20)

## B. Fast and measured

9. [ ] Open to the Desk in under a second on the phone; measure cold start (R6-96)
10. [ ] 120 Hz audit with the perf monitor: no JS per frame on scroll or drag (R6-90)
11. [~] Badges: render locked tiles without the late jump (from R6-85)

## C. Easy to update the phone

12. [ ] Over-the-air updates: add `expo-updates` (one native build), so JS-only rounds reach the phone without the Mac
13. [~] A one-command build script (`scripts/build-phone.sh`) wrapping the Release command, UTF-8 and the device ID

## D. Native batch (one rebuild, done together)

14. [ ] Pocket worry: shake to drop a worry in the box from anywhere, with Undo (`expo-sensors`; R6-63)
15. [ ] Home screen widget: tonight's first class and what's due
16. [~] A speaker icon in the kit for Fire crackle (drawn in code, no rebuild needed)

## E. Show it well

17. [ ] Screenshots script for the hero pages into `docs/screens/` (R6-53), in show mode only
18. [ ] Put the screenshots in `docs/WHAT-THIS-IS.md` and the README
19. [~] The show tour's lines checked against Riley's sample data

## F. From the idea bank

20. [ ] Pick the next ten from `tools/hub/data/ideas.txt` after A–C, by delight per hour

## Ground rules

Everything from Rounds 4–6 still holds: privacy, nothing new to AI by
default, calm copy, motion with manners, every delete has Undo, the gate
passes on every commit. Builders work in their own branches; nothing is
`[x]` until it's seen live.
