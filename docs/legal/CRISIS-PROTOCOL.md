# Crisis protocol (DRAFT)

> Draft for lawyer review. California SB 243 asks operators of companion
> chatbots to publish how they handle suicidal ideation and self-harm; New
> York GBL Art. 47 asks for the same protocol. This describes what the app
> does today, in the code named beside each step. Publish it on the same page
> as the privacy policy once reviewed.

## What happens

1. **Detection on the phone, before any AI.** Every message typed or spoken to
   Ember or a helper, and what's written in Let it out, the check-in, the worry
   box and Put the day down, is checked on the phone
   against a list of phrases about suicide, self-harm, wanting to die, overdose,
   abuse or not being safe at home (`soundsLikeCrisis`, `core/emberAI.ts`). The
   list is tested against everyday school stress ("this test is killing me")
   so it doesn't cry wolf (`tests/safety.test.ts`).
2. **Help on screen at once.** A match shows the help card right away, with or
   without a connection, with AI on or off, and whether or not the student has
   any AI replies left (`HelpCard`, `components/ember/HelpCard.tsx`): call or
   text **988** (Suicide & Crisis Lifeline), text **HOME to 741741** (Crisis
   Text Line), call **911** in an emergency, and the Need help now page
   (`app/help.tsx`).
3. **The AI is told what to do.** Ember's instructions (`SAFETY` in
   `supabase/functions/ember/index.ts`) say: respond with warmth first, then
   clearly urge reaching a real person now (a trusted adult, 988, 741741); take
   it seriously every time, even as a joke; never give instructions or
   encouragement for self-harm, suicide, disordered eating or anything
   dangerous; never claim to be a therapist; never act as a romantic partner;
   say honestly that it's an AI.
4. **The server makes sure.** If the student's newest message matches the list,
   the server adds the Need help now button to the reply even if the model
   didn't, and drops the suggested follow-up chips (same file, "Crisis
   protocol" comment). The phone and server lists are checked to be identical
   by the tests.
5. **If the AI declines or fails,** Ember answers with a gentle line and the help
   button rather than an error (`refusal` handling in the function; offline
   fallback in the app).
6. **Reminders that it's an AI.** Ember's chat says it's a computer program at
   the start, and again with a nudge to take a break every three hours of
   talking (`core/companionRules.ts`).

## What the app doesn't do

- It doesn't contact anyone on the student's behalf, alert parents, or call
  emergency services; it puts the numbers and people in front of the student.
- It doesn't store which messages matched. [Lawyer: SB 243's annual report from
  July 1, 2027 asks for the number of crisis referrals; decide whether to keep an
  anonymous count, with no message text, to report it.]
- It isn't monitored by people in real time.

## Limits

The phrase list can miss things said indirectly, and can't judge tone. The help
lines are US numbers. Ember is not a counselor; the app says so on the help
page, in the consent sheet, in the terms, and in every AI chat.
