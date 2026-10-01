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
2. [~] Cheap jobs (titles, summaries, quick chips) run on Haiku 4.5, without thinking
3. [x] Prompt caching: the long, unchanging persona is cached (Sonnet 5.5 caches prompts of 512+ tokens), so turns 2+ of a chat read it at a tenth of the price
4. [x] "What the app knows" moves out of the system prompt and into the latest message, so the cached part stays identical
5. [x] The function returns token usage; the app keeps a running cost estimate per reply
6. [x] Effort follows the job: low for small talk and chips, high for planning and essay feedback
7. [~] One automatic retry when Anthropic is busy (429/529), then a plain "busy" message
8. [~] The app gives up after 45 seconds with a friendly line instead of spinning forever
9. [ ] A daily server-side spend guard (a counter row in Supabase) so a bug can never run up the bill
10. [~] "Test Ember's brain" button on the AI screen: which model answered and how long it took

## B. Ember's voice
11. [x] Rewrite Ember's prompt in clear sections (who you are, how the app works, how you talk, safety, actions) with two short example exchanges
12. [ ] Banned openers: no "That sounds really hard" on every reply, no therapy-speak, no "As an AI"
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
24. [~] Memory switch on the AI screen (off means nothing from past chats is sent)
25. [ ] Follow-up card on the Desk: "How did the chem test go?" the day after it was mentioned
26. [~] Facts Ember can keep only when they say yes ("Remember that breathing exercises don't help me?")
27. [~] "Pick up where we left off" on the Ember screen
28. [ ] Past Ember conversations listed, each with a short auto title
29. [~] "Forget this conversation" removes its summary and the saved chat
30. [ ] Helpers share one study profile (hard subjects, how you like to study), only with their OK

## D. AI that does things (with a tap to confirm)
31. [x] Replies can carry up to two action buttons instead of one
32. [x] Structured replies (JSON schema output) so actions and proposals parse reliably every time
33. [~] "Add to-do" proposals: Ember suggests a task with a title; tap to add
34. [~] "Set it down" with the title and weight already filled in
35. [x] Open a specific assignment, deck, or note from a reply
36. [ ] Pip's plan comes back as time blocks: "Put this on tonight" adds them
37. [ ] Break an assignment into steps: a preview with checkboxes, then add them as subtasks
38. [ ] Test prep spread across days, added to the week with one tap
39. [~] Start a Focus session for the exact thing named, with minutes set
40. [~] Everything the AI adds can be undone from the toast

## E. Smarter helpers
41. [~] Each helper gets a full server-side prompt with an example and its own effort level
42. [~] Quizzo keeps score as data and shows a scoreboard (right, wrong, streak)
43. [ ] Quizzo quizzes from your actual deck when one is picked
44. [ ] Sage grades your explain-back: what you got, what's missing, one question
45. [ ] Quill reads a pasted paragraph and leaves up to three margin comments, and never rewrites it
46. [ ] Pip builds plans around real classes, "busy until", the homework cap, and bedtime
47. [~] Spark's "tiny first step" comes with a 5-minute Focus button
48. [x] Hand-offs: "Sage is better at this. Bring Sage in?" with the chat carried over
49. [~] Chips fit the moment (an assignment chat gets chips about that assignment)
50. [x] "Who should I ask?" Ember picks the helper for what you describe

## F. Care and safety
51. [~] On-phone crisis check before anything is sent: crisis words show the help card right away, even offline or out of replies
52. [~] When a refusal or crisis happens, the help card stays pinned in the chat
53. [~] After a heavy conversation, Ember offers a grounding tool instead of just ending
54. [ ] When the same worry keeps coming up, Ember suggests telling a person they trust
55. [~] Late-night nudge: after 20 minutes past bedtime, Ember says it'll be here tomorrow
56. [ ] Worry box: "Is this in my control?" questions from Ember (opt-in, CBT-style, not therapy)
57. [ ] After a vent entry, an optional one-line reflection and one gentle question (opt-in each time)
58. [ ] Check-in reply: one warm line about today's numbers (opt-in)
59. [ ] Weekly pattern note from check-in numbers only (opt-in)
60. [x] Safety rules live in one shared block used by Ember and every helper, so they can't drift apart

## G. School
61. [ ] Scan → AI tidy: text the phone already read from a sheet becomes assignments to preview (opt-in)
62. [ ] "What should I do first?" on School: one pick and one reason
63. [ ] "Help me start" on an assignment opens Spark or Pip with it loaded
64. [ ] Practice questions from a note for a test (opt-in, sends that note only)
65. [ ] Note to key points: a short summary saved under the note (opt-in)
66. [ ] Terms in a note become flashcards to preview
67. [ ] Quill checks an outline note's structure
68. [ ] After Focus: "What did you get done?" and a suggested next step
69. [ ] Final-grade math stays on the phone; AI only explains the strategy
70. [ ] College essay brainstorm with Quill using the college list, never writing it

## H. How it feels
71. [x] Replies stream in word by word while Ember's mouth moves
72. [~] Thinking state: Ember looks up and sparks; after 6 seconds, "thinking it through…"
73. [~] Retry button on any failed reply
74. [~] Hold an Ember reply to copy it or save it to the Notebook (helpers already save)
75. [ ] Edit and resend your last message
76. [ ] Talk instead of type: the mic already used by "Let it out" works in Ember's chat
77. [x] Suggested replies: two or three quick chips under Ember's message
78. [~] Bold and lists render properly in helper replies (Quizzo's choices)
79. [x] Sparkle mark on everything AI-written, so it's never confused with the app's own tips
80. [~] Reply time shows on the AI screen as "usually answers in about 4 seconds"

## I. Trust and transparency
81. [~] "What did Ember see?" shows the exact note sent with that reply
82. [~] Per-chat switch: "Don't send my Desk or check-in this time"
83. [x] Phone numbers, emails, and street addresses are blanked before sending
84. [~] AI screen: which model, deep thinking on, about how much a reply costs
85. [~] Clear every AI chat and memory in one place
86. [~] "Turn off AI everywhere": the app runs fully on the phone
87. [ ] Thumbs up or down on replies, kept on the phone
88. [ ] "This reply was off" saves the chat locally for review (nothing sent)
89. [~] Privacy screen and AI screen updated for every new thing that's sent
90. [x] The function never logs message text, only timing, tokens, and stop reason

## J. Quality and reliability
91. [ ] A written test set of about 20 conversations (crisis, homework-cheating, late night, quiz, plan) with what a good reply must do
92. [ ] A script that runs the test set against the live function, used only with the user's OK (about 30 cents a run)
93. [x] Reply cleanup: stray tags removed mid-text, empty replies caught, overly long replies trimmed
94. [ ] Offline: a typed message waits and sends when the connection is back
95. [x] Per-minute limit in the function so a stuck loop can't fire 100 requests
96. [ ] Retire the old `chat` fallback, which has a debug branch that returns raw upstream errors (needs the user's OK to delete it)
97. [ ] Plan math: measured cost per reply decides the Free and Plus allowances (400 deep-thinking replies cost more than $2.99, so the user decides)
98. [~] Failure reasons the app can name: busy, offline, limit, refused, too long
99. [ ] The AI conversation screens behave at large text sizes and with VoiceOver
100. [ ] CLAUDE.md: the AI architecture, costs, the redeploy recipe, and the privacy rules

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

Fix in the next redeploy: `title` (Haiku) chatted back instead of giving a
title, so make it a JSON schema `{ title }`; `reflect` opened with stock
validation ("That sounds like a lot…"), so add the banned openers to its
prompt. Then bump PROMPT_VERSION to 4.2.

## RESUME HERE (for a fresh session after compaction)

Read this file, then CLAUDE.md "Ember's AI brain". Check `git status`.
Find the first group in the build order with `[ ]` items and keep going.
Keep live AI tests rare (see the money rule). Redeploying `ember` needs the
user signed in to Supabase in the browser pane.

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
