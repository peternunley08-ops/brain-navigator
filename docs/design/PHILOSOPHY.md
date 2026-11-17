# The room holds the light

Written for the craft pass on the candlelit room. This sits beside
[One Lit Thing](DIRECTION.md). It does not replace it. One Lit Thing says
what the student sees first. This says how the room is built so that one
thing can be felt.

**Direction.** The app is still a night room lit by what the student set
down. Craft gives that room weight, smooth corners, and a finger that the
surfaces answer, and then it gets out of the way.

## How it should feel

**4pm.** The Desk is a warm room with one lit card. The tab bar is glass
over the page, so the work stays visible underneath. Gold is the one
action. Everything else is paper, hairline, and quiet.

**11pm.** The room has already dimmed with the hour. Sheets follow the
finger and resist when pulled the wrong way. Type stays large enough to
read while tired. Ember, if it speaks, says one plain sentence. It is a
program. It does not miss you.

**The morning after a hard day.** The room is the same room. Nothing
broke, nothing scolds, nothing asks the student to catch up. Yesterday’s
sentence is still there if they want it. The first thing on the Desk is
still one next step.

## Twelve rules

1. **Glass is chrome.** Liquid glass belongs on the tab bar, sheets, and
   round buttons that float over a page. Reading cards stay solid paper.
   Glass on a paragraph makes the words harder, and the words are the point.
2. **Depth is a short stack.** Page, content, raised paper, floating
   chrome, sheet, toast. Nothing else gets a layer. Shadows are a soft
   pool of night, not a hard drop.
3. **Corners are continuous.** Cards, fields, chips, sheets, and the tab
   bar use a squircle on iOS (`borderCurve: 'continuous'`). Tracks, dots,
   and the candle stay round because they are round things.
4. **The top edge catches the lamp.** A hairline, slightly stronger along
   the top, is enough. A second border, a heavy stroke, or a black slab
   shadow means the surface is shouting.
5. **Contrast follows the room, not a white theme.** Dawn, day, dusk, and
   night already shift the glow. Increase Contrast strengthens muted ink.
   There is no light mode that turns the study into a blank page.
6. **Motion is a spring with a mass.** Presses sink one pixel and scale a
   little, then settle. Sheets and flicks keep the finger’s speed. Timers
   are for breaths and counts, not for things you tap.
7. **The finger is part of the layout.** A drag follows until it passes an
   edge, then it resists. Letting go projects where the flick was going.
   Reduce Motion skips the travel and leaves the result in place.
8. **A control confirms, then leaves.** Selection haptics, a chip’s small
   swell, a button’s sink. No confetti for ordinary taps. Peaks stay where
   they already are: finishing, sealing, goodnight.
9. **Content is the hero.** One lit thing per screen. Chrome recedes.
   Settings stay few. A new control has to earn its place by removing a
   decision, not by adding one.
10. **Type is already bespoke.** Fraunces for headings and Ember’s italic.
    Figtree for body and numbers, with tabular figures on readouts. Tracking
    stays tight on display sizes and loose enough on body. Dynamic Type
    grows body freely and stops before a control breaks a word.
11. **Tokens, not one-off paints.** Color, radius, elevation, material, and
    z-order come from `core/theme.ts` and `core/craft.ts`. A new screen
    uses the kit. It does not invent a second palette.
12. **The same room at every width.** Phone first. Wider layouts keep the
    same materials, the same springs, and the same one-lit-thing order.
    They do not grow a dashboard.

## What this is not

A thousand new controls would bury a tired student. That request is
refused as a product. The craft system can describe 10,240 surface states
(4 materials × 4 elevations × 5 radii × 4 states × 8 tones × 2 contrast
settings × 2 motion settings). Those states exist so every screen already
in the app can be precise. The student still sees one room.

Also refused:

- A white light theme that throws away the night room.
- Glass behind body text.
- Streaks, guilt, fake urgency, or a reason to stay in the app.
- A new settings page for corner style, shadow strength, or motion taste.
- Ember written as a person with feelings.

## Where emotion lives

Ember remembers in one place, under the lit card, one note at a time.
The room gets quieter when the day is done. The peak is a finish or a
goodnight, not a badge count. Coming back tomorrow is safe because the
plan is already there and the room did not change its mind overnight.

## Live check (not verified here)

A cloud session cannot see the phone. Look at these before calling the
pass done:

1. Desk. One lit card reads first. Cards have smooth corners and a faint top edge. No harsh shadow on the reading surface.
2. Tab bar. On iOS 26 the page shows through the bar. The gold add button glows like a lamp, not a dropped disc.
3. Plus sheet. Drag down to dismiss. Pull up a little and it resists, then springs home.
4. A chip and a secondary button. They sink a pixel under the finger and spring back. With Reduce Motion they do not travel.
5. Undo bar. It floats above the page with a soft shadow and stays readable.
6. Increase Contrast, then reopen. Muted text is stronger. The room is still night.
