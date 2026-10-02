# The Masterpiece, round 4: the AI design

Started 2026-10-01, the day Ember's AI went live (Claude Sonnet 5.5 with
deep thinking, `supabase/functions/ember`).

The user asked: "come up with a 100 ideas to improve the ai design behind
the app now that we have credit, orchestrate a master piece".

## Ground rules for this round

- **Money.** Every AI reply costs real money, about 1–3 cents on Sonnet with
  deep thinking. Live AI testing for the whole round should stay under
  about $1. Test with curl or a single tap, never in loops. Cheap jobs
  (titles, chips, summaries) go to Haiku 4.5.
- **Privacy.** Today the app sends only what you type plus a short note:
  grade, next class, what's due, Desk titles, and check-in numbers. Never
  notes, grades, or journal text. Anything that sends more must be opt-in
  each time it's used, say so in a plain line on screen, and be added to
  the AI screen's "What gets sent" list. Memory lives on the phone.
- **Safety.** No diagnosing and no therapy claims. Crisis words always
  surface real people and 988, even when the AI is offline or out of
  replies. The AI never does schoolwork the student hands in.
- **No auto-actions.** The AI proposes; the student taps to accept. Every
  accepted item can be undone.
- **No native rebuild.** Use only what's already in the app (expo/fetch,
  expo-speech-recognition). Text-to-speech would need a rebuild, so it's
  out.
- **Deploys.** Server changes are batched into as few redeploys as
  possible. A redeploy goes through the Supabase dashboard, and the user
  signs in to the browser pane themselves (recipe in CLAUDE.md).

Status marks:
- `[ ]` not started
- `[~]` built and type-checked
- `[x]` seen working live

## A. The engine: right model, right cost
1. [x] One task table in the function: each kind of job (talk, plan, quiz, title, summary, chips) picks its model, effort, and token cap
2. [x] Cheap jobs (titles, summaries, quick chips) run on Haiku 4.5, without thinking
3. [x] Prompt caching: the long, unchanging persona is cached (Sonnet 5.5 caches prompts of 512+ tokens), so turns 2+ of a chat read it at a tenth of the price
4. [x] "What the app knows" moves out of the system prompt and into the latest message, so the cached part stays identical
5. [x] The function returns token usage; the app keeps a running cost estimate per reply
6. [x] Effort follows the job: low for small talk and chips, high for planning and essay feedback
7. [~] One automatic retry when Anthropic is busy (429/529), then a plain "busy" message
8. [~] The app gives up after 45 seconds with a friendly line instead of spinning forever
9. [–] A daily server-side spend guard (a counter row in Supabase) so a bug can never run up the bill — Decided: not built. The prepaid credit and the Anthropic Console spend limit already cap the bill (the app names `spend_limit`), and the function allows 40 calls a minute; a Supabase counter would add a database trip to every reply.
10. [x] "Test Ember's brain" button on the AI screen: which model answered and how long it took

## B. Ember's voice
11. [x] Rewrite Ember's prompt in clear sections (who you are, how the app works, how you talk, safety, actions) with two short example exchanges
12. [x] Banned openers: no "That sounds really hard" on every reply, no therapy-speak, no "As an AI" — In the prompt; the test set checks it.
13. [~] Length mirrors theirs: a one-line message gets a one-line answer
14. [~] Time of day sets the tone: late night is quiet and steers toward sleep, morning is bright
15. [~] Check-in mood sets the tone: low mood means slower and softer, never hype
16. [~] "Just listen" chip: Ember reflects back and asks, with no advice
17. [~] Ember asks before advising ("Want ideas, or do you just need to say it?") when it can't tell
18. [~] Uses their first name now and then, if they've set one
19. [~] Fire imagery at most once per conversation, so it stays charming
20. [~] Prompt version number returned with every reply, so feedback can be matched to the prompt that made it

## C. Memory, on the phone, under their control
21. [~] After Done, Haiku writes a one-line summary of the conversation, kept on the phone
22. [~] Ember reads the last three summaries next time (only if memory is on)
23. [~] "What Ember remembers" screen: read, edit, or delete each memory
24. [x] Memory switch on the AI screen (off means nothing from past chats is sent)
25. [x] Follow-up card on the Desk: "How did the chem test go?" the day after it was mentioned — Desk card "How did the chem quiz go?" (verified with test data); hiding it counts as answered.
26. [x] Facts Ember can keep only when they say yes ("Remember that breathing exercises don't help me?")
27. [~] "Pick up where we left off" on the Ember screen
28. [x] Past Ember conversations listed, each with a short auto title
29. [~] "Forget this conversation" removes its summary and the saved chat
30. [–] Helpers share one study profile (hard subjects, how you like to study), only with their OK — Moved to Round 5 ("About you", on the phone).

## D. AI that does things (with a tap to confirm)
31. [x] Replies can carry up to two action buttons instead of one
32. [x] Structured replies (JSON schema output) so actions and proposals parse reliably every time
33. [~] "Add to-do" proposals: Ember suggests a task with a title; tap to add
34. [~] "Set it down" with the title and weight already filled in
35. [x] Open a specific assignment, deck, or note from a reply
36. [x] Pip's plan comes back as time blocks: "Put this on tonight" adds them
37. [x] Break an assignment into steps: a preview with checkboxes, then add them as subtasks
38. [x] Test prep spread across days, added to the week with one tap
39. [~] Start a Focus session for the exact thing named, with minutes set
40. [~] Everything the AI adds can be undone from the toast

## E. Smarter helpers
41. [~] Each helper gets a full server-side prompt with an example and its own effort level
42. [x] Quizzo keeps score as data and shows a scoreboard (right, wrong, streak)
43. [~] Quizzo quizzes from your actual deck when one is picked
44. [~] Sage grades your explain-back: what you got, what's missing, one question — In Sage's prompt since v4.1; not checked live.
45. [x] Quill reads a pasted paragraph and leaves up to three margin comments, and never rewrites it — In Quill's prompt; the test set checks it never hands back a rewrite.
46. [x] Pip builds plans around real classes, "busy until", the homework cap, and bedtime
47. [~] Spark's "tiny first step" comes with a 5-minute Focus button
48. [x] Hand-offs: "Sage is better at this. Bring Sage in?" with the chat carried over
49. [x] Chips fit the moment (an assignment chat gets chips about that assignment)
50. [x] "Who should I ask?" Ember picks the helper for what you describe

## F. Care and safety
51. [x] On-phone crisis check before anything is sent: crisis words show the help card right away, even offline or out of replies
52. [x] When a refusal or crisis happens, the help card stays pinned in the chat
53. [~] After a heavy conversation, Ember offers a grounding tool instead of just ending
54. [x] When the same worry keeps coming up, Ember suggests telling a person they trust — Worry box card "This one keeps coming back" after 3 similar worries in a month, with "Your people" (verified with test data).
55. [~] Late-night nudge: after 20 minutes past bedtime, Ember says it'll be here tomorrow
56. [~] Worry box: "Is this in my control?" questions from Ember (opt-in, CBT-style, not therapy)
57. [~] After a vent entry, an optional one-line reflection and one gentle question (opt-in each time)
58. [~] Check-in reply: one warm line about today's numbers (opt-in)
59. [–] Weekly pattern note from check-in numbers only (opt-in) — Decided: the Mood map already shows what the check-in numbers say, on the phone, for free.
60. [x] Safety rules live in one shared block used by Ember and every helper, so they can't drift apart

## G. School
61. [~] Scan → AI tidy: text the phone already read from a sheet becomes assignments to preview (opt-in)
62. [x] "What should I do first?" on School: one pick and one reason
63. [x] "Help me start" on an assignment opens Spark or Pip with it loaded — Already there: "Get a helper" on every assignment opens it loaded.
64. [~] Practice questions from a note for a test (opt-in, sends that note only)
65. [x] Note to key points: a short summary saved under the note (opt-in)
66. [~] Terms in a note become flashcards to preview
67. [x] Quill checks an outline note's structure — "Ask Quill about the structure" on essay and outline pages; the page waits in the box until sent.
68. [x] After Focus: "What did you get done?" and a suggested next step — Already there: Focus asks "What got done?" and offers the next step.
69. [x] Final-grade math stays on the phone; AI only explains the strategy — "Plan for it with Sage" under the final-grade math; the math stays on the phone.
70. [x] College essay brainstorm with Quill using the college list, never writing it — "Find an essay topic with Quill" on the college list (names the colleges only).

## H. How it feels
71. [x] Replies stream in word by word while Ember's mouth moves
72. [x] Thinking state: Ember looks up and sparks; after 6 seconds, "thinking it through…"
73. [~] Retry button on any failed reply
74. [~] Hold an Ember reply to copy it or save it to the Notebook (helpers already save)
75. [x] Edit and resend your last message
76. [~] Talk instead of type: the mic already used by "Let it out" works in Ember's chat
77. [x] Suggested replies: two or three quick chips under Ember's message
78. [~] Bold and lists render properly in helper replies (Quizzo's choices)
79. [x] Sparkle mark on everything AI-written, so it's never confused with the app's own tips
80. [~] Reply time shows on the AI screen as "usually answers in about 4 seconds"

## I. Trust and transparency
81. [~] "What did Ember see?" shows the exact note sent with that reply
82. [~] Per-chat switch: "Don't send my Desk or check-in this time"
83. [x] Phone numbers, emails, and street addresses are blanked before sending
84. [x] AI screen: which model, deep thinking on, about how much a reply costs
85. [~] Clear every AI chat and memory in one place
86. [~] "Turn off AI everywhere": the app runs fully on the phone
87. [x] Thumbs up or down on replies, kept on the phone
88. [x] "This reply was off" saves the chat locally for review (nothing sent)
89. [~] Privacy screen and AI screen updated for every new thing that's sent
90. [x] The function never logs message text, only timing, tokens, and stop reason

## J. Quality and reliability
91. [x] A written test set of about 20 conversations (crisis, homework-cheating, late night, quiz, plan) with what a good reply must do — scripts/ember-eval.mjs: 15 cases (crisis ×5, meds, cheating, late night, one-liner, stock openers, prompt injection, planning, Pip, Quizzo, Quill).
92. [x] A script that runs the test set against the live function, used only with the user's OK (about 30 cents a run) — Run 2026-10-01: all 15 passed on v4.4, about 8¢.
93. [x] Reply cleanup: stray tags removed mid-text, empty replies caught, overly long replies trimmed
94. [~] Offline: a typed message waits and sends when the connection is back
95. [x] Per-minute limit in the function so a stuck loop can't fire 100 requests
96. [–] Retire the old `chat` fallback, which has a debug branch that returns raw upstream errors (needs the user's OK to delete it) — Decided: left alone. The app no longer calls `chat`; deleting a live function is the owner's call.
97. [x] Plan math: measured cost per reply decides the Free and Plus allowances (400 deep-thinking replies cost more than $2.99, so the user decides) — Decided: Plus is 250 replies a month (not 400); the math is in core/aiQuota.ts. Free stays 20 a week.
98. [~] Failure reasons the app can name: busy, offline, limit, refused, too long
99. [–] The AI conversation screens behave at large text sizes and with VoiceOver — Moved to Round 5.
100. [x] CLAUDE.md: the AI architecture, costs, the redeploy recipe, and the privacy rules

## Build order

1. **Engine and voice:** A, B, plus #32, #60, #83, #90, #93, #95 (one redeploy)
2. **Feel:** H, plus #73, #79 (app only)
3. **Care:** F (mostly the app; prompts were already in step 1)
4. **Trust:** I (app only)
5. **Memory:** C (Haiku summaries need a second redeploy if not already in the task table)
6. **Actions and helpers:** D and E
7. **School:** G
8. **Quality:** J (the test-set run waits on the user's OK)

## Server jobs ready, app buttons not built yet

The live function already answers these (each tested once with curl on
2026-10-01): `steps` (#37), `plan` (#36), `scan` (#61), `cards` (#66),
`points` (#65), `practice` (#64), `pick` (#62), `reflect` (#56–58),
`summary` (#21). Build the buttons with `askJob(kind, input, { screen })`
from core/emberAI.ts.

Done in prompt v4.2 (deployed 2026-10-01): `title` is a JSON schema
`{ title }`, and `reflect` has the banned openers.

Done in prompt v4.3 (deployed 2026-10-01): `pick`'s reason is one sentence
under 25 words (live: 24 words), and `steps` turns a test or quiz into study
sessions. Ember once wrote "With until Monday" (a slip, watch for it).

Fix in the next redeploy: `steps` sometimes starts titles with a day
("Thu: …"). The app strips those (DAY_PREFIX in app/assignment/[id].tsx),
but the prompt should say "no days in titles; the app picks the days".

## RESUME HERE (for a fresh session after compaction)

Read this file, then CLAUDE.md "Ember's AI brain". Check `git status`.
Last pushed work: 3a959d0 (prompt v4.3, #38). Since then, NOT committed
yet: v4.4 (deployed), #28, #75, #76, #87, #88, #94, scan class fix,
autocorrect fix, Plus breakdown labels (see the log).

Next, in order:
1. On a real iPhone (needs the user): the mic in Ember's chat (#76) and
   "Let it out" (the Simulator can't do on-device speech), and the offline
   wait (#94: airplane mode, send, turn it back on; it retries every 15 s
   for 10 minutes and when the app comes back). "Try again" too.
2. After Monday's reset (or with the developer Plus switch): re-run scan
   "Read it again with AI" to see "AP Bio" replace the garbled class, and
   "Remember this chat?" to see the title land in "What you've let out".
3. Then the `[ ]` ideas left: #9 spend guard (needs a Supabase table: ask
   first), #25, #30, #54, #59, #63, #67–70, #91/#92 test set (costs money,
   ask first), #96 (needs the user's OK), #97 plan math (the user decides
   prices), #99 large text and VoiceOver.
Keep live AI tests rare (see the money rule): 8 of 20 free replies were
left this week after testing; now 0 (resets Monday). Redeploying `ember` needs
the user signed in to Supabase in the browser pane (session was still
signed in on 2026-10-01). Simulator tips: deep links
`brainnavigator://assignment/<id>`, `/note/<id>`, `/school`, `/ai`,
`/companion`, `/helper/<id>`; wait for scrolling to stop before tapping;
the hardware-keyboard accent menu can stick on "a" (type the next letter);
never tap Done in Ember's chat for tests (it saves to the journal).

## Progress log

- 2026-10-01: plan written. Ember live on Sonnet 5.5 with deep thinking
  (deployed this day, verified in the app).
- 2026-10-01: Step 1 (engine and voice) built and deployed as prompt v4.1:
  one function, 13 jobs, Haiku for summaries, caching (second turn read
  1,845 cached tokens), JSON-schema jobs, all tags parsed server-side, rate
  limit, no message text in logs. Every job tested once with curl, 5.3¢
  total. Ember's reply is about 0.5–0.9¢, so the 1–3¢ estimate was high.
  App: core/emberAI.ts rewritten (buildNote with a1/d1 refs, redact,
  soundsLikeCrisis, askJob, centsFor, memoriesForNote, dueFollowUp; the old
  `chat` fallback removed). New components/ember/RichText, ReplyExtras,
  HelpCard. Ember's chat now has chips, offers, Just listen, Keep my Desk
  private, retry, hold-to-save/share/"What did Ember see?", memory offer
  after Done, follow-up opening, and "Pick up where we left off". Helper
  chats have the same extras plus Quizzo's scoreboard. AI screen: AI-off
  switch, memory list, costs, Test Ember's brain, Clear every AI chat.
  Verified live in the Simulator (run from Xcode at the user's request):
  a reply used real planner data, offered "Ask Spark", chips sent a
  follow-up, and "Open: Unit 2 Test" opened that assignment. Not yet seen
  live: crisis card, retry, memory, AI screen changes.
- 2026-10-01 (later): every server job got an app button. AIPicker (preview
  with checkboxes before anything changes) powers "Break it into steps" on
  assignments, Flashcards / Practice test / Key points on notes, and Pip's
  "Put this on tonight" (time blocks → plate to-dos). EmberPick on School,
  "Read it again with AI" on Scan (sends only the text the phone read),
  EmberReflect ("Hear from Ember") after a vent, a check-in, and on each
  worry. Prompt v4.2 deployed by editing the three changed spots in the
  dashboard editor (SHA-256 matched). Verified live in the Simulator (run
  from Xcode): steps preview → untick → 6 steps saved; key points preview;
  Ember's pick with reasons; crisis words show the help card before the AI
  answers, and the AI's reply is right; Ember's remember offer saved a fact
  on the phone; AI screen costs, switches, and Test Ember's brain (Sonnet,
  1.4 s); Quizzo used the real next test and kept score; Pip asked a
  clarifying question, gave a plan, offered "Put this on tonight", and the
  preview showed the blocks. Fixed while testing: the help card now sits
  right above the input (it scrolled out of view at the top); Ember's face
  no longer turns happy on a reply about getting help; note AI chips and
  buttons had the same words; the memory count showed a bare "0"; Pip's
  plan preview was squeezed inside the chat box. In-app testing cost about
  6¢ (the app's own log). Test steps were left on the Gatsby assignment.
- 2026-10-01: Prompt v4.3 deployed (pick reason capped; test-aware steps),
  checked with two curl calls (about 0.75¢). #38: AI steps for a test or
  quiz two or more days away get a day each (spreadSteps in schoolStore,
  shared with "Plan it backward"); the button says "Add 6 steps over 4
  days". Verified live on a "Cell biology quiz" due Monday: 6 sessions
  over Thu to Sun, Ember said "Spread across 4 days", Undo offered. Fixed
  "1.5.5 h" chips on Add homework and Today (now "1.5 h"). Note AI cards:
  cards already in the deck are skipped ("Added 1 card, 3 already there",
  verified live) and adding now has Undo. NOT yet verified: tapping that
  Undo (two tries missed the 6.5 s window; the store logic is synchronous,
  so it should work). Flashcards and Practice test verified live; both
  stay inside the note and say when the note doesn't cover something.
  Test data: "Cell biology quiz" (muqa3calgnkk4o) and extra cards in the
  "Chem unit 2 notes" deck (being cleaned up). AI replies used this week
  on the Simulator: 17 of 20.
- 2026-10-01 (later): Prompt v4.4 deployed (summary also returns a title;
  steps never carry day labels), checked with curl (about 0.5¢). Verified
  in the Simulator: the note-card Undo (a real tap removed the added card);
  "Is this in my control?" on a worry (specific, ends with the control
  question); scan "Read it again with AI" (the phone's reader found no
  assignments in a messy paste, Claude found all 3 with the right kinds and
  dates and skipped the nav words). Fixed: after Claude reads a scan, its
  class names replace the phone's garbled guess (logic tested on 4 cases;
  the live re-run waits for the allowance, it was used up). #28: Ember chats
  in "What you've let out" get a title (from the summary when the student
  says yes to "Remember this chat?", otherwise from their first words, on
  the phone; old-format chats handled), and any entry taps open. #87/#88:
  hold an Ember reply for "Good reply" / "This reply was off" (kept on the
  phone with the prompt version; "off" keeps the chat up to it); reviewed,
  shared, or cleared under Settings → AI → "Replies you rated". #75: hold
  your last message → "Edit and resend" (it goes back in the box and
  Ember's answer to it is taken back). All three verified live with the
  developer-only "pretend I bought Plus" switch (turned off after; 3
  replies, about 3¢). Fixed: iOS autocorrect put a sent message back in the
  box (core/hooks/useClearOnSend, used by Ember's chat and helper chats;
  verified live). Fixed: Plus "Where they went" listed every AI job as
  "Ember" (now Study steps, Flashcards, Reading scans, and so on). "Try
  again" still unverified (needs a dropped connection).
- 2026-10-01 (later still): #76 mic in Ember's chat (speech becomes text
  on the phone, added to the box, sent only with Tell Ember; ignores
  events it didn't start; stops on send, Done, or leaving). In the
  Simulator the button and its error line work, but recognition itself
  fails there exactly as it does on "Let it out" (no on-device speech in
  the Simulator), so real speech needs a phone. #94: a message that
  fails for no connection stays in the chat with "will send by itself",
  retried every 15 s for 10 minutes and when the app comes back; not
  verified (the Simulator can't go offline). CLAUDE.md updated (#100).
- 2026-10-01 (Round 4 wrap-up): prompt v4.5 deployed (follow-ups name the
  event, "the chem test"; crisis replies name who to tell: a parent,
  relative, teacher, or counselor). Test set written and run: 15/15 on
  v4.4 (8.1¢), the abuse case re-run on v4.5 (0.9¢). Desk follow-up card,
  repeating-worry card, Quill/Sage hand-offs (structure, final grade,
  college topics), Plus at 250 replies a month. Round 4 is closed; the
  rest moved to docs/masterpiece-5.md.
