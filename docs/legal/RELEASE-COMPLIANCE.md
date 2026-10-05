# Release compliance audit

**Status: not ready for public release.** Written 2026-10-05 from the code as it is
on `main` and the rules as they stood that day (sources at the bottom). This is
groundwork for a lawyer, not legal advice. No audit can make an app immune to
lawsuits; what it can do is close the known gaps and show good faith. **Have a
lawyer licensed in your state review this file, the two drafts beside it, and
the App Store listing before release.**

## What the app is, legally

| Fact | Why it matters |
|---|---|
| Made for high school students (grades 9–12, so mostly 13–18) | Minors: COPPA if anyone under 13 gets in; state teen-privacy and app-store age laws; Anthropic's rules for products serving minors |
| Mood, stress, sleep, worries, vents, a crisis help page | "Consumer health data" under Washington's My Health My Data Act (no size threshold); FTC Health Breach Notification Rule; Apple 1.4.1 / 5.1.3 |
| Ember chat remembers past talks and asks how you feel | Plausibly an "AI companion" under California SB 243 (private right to sue) and New York GBL Art. 47 |
| Sends data to Anthropic (AI), Supabase (database), Notion, Google, Canvas, Open-Meteo | Apple 5.1.2(i): explicit permission before third-party AI; privacy policy must name each |
| Reads and writes Apple Health | Apple 5.1.3: disclose exactly what; never for ads; no health data in iCloud |

## Release blockers (must fix before anyone else installs it)

| # | Blocker | Risk | Fix | Status |
|---|---|---|---|---|
| B1 | **Everyone's data is readable by everyone.** Supabase tables (vents, check-ins, Desk entries, habits, tasks, food, sleep) use "anon full access" row-level security, and the anon key ships inside the app. One user, or anyone who extracts the key, can read and change every user's vents and moods. | Data breach of minors' mental-health data: FTC, state breach laws, WA MHMDA, negligence suits | Either (a) Supabase anonymous sign-in plus per-user RLS (`user_id = auth.uid()`) on every table, invisible to the student, or (b) keep these on the phone only and drop the server copy. **Peter decides** (CLAUDE.md forbids changing auth without him) | Open |
| B2 | **Entry photos are public.** `snapshot-images` is a public bucket; `getPublicUrl` links work for anyone. | Same as B1, for photos | Built: the app stores the path and shows photos through signed links that expire in an hour (`core/imageUpload.ts`); schema Phase 20 makes the bucket private (run it after the update is on the phone). Fully private needs B1 | Built, apply SQL |
| B3 | **Notion sync writes to Peter's Notion.** The function and database IDs are the developer's. Another student's check-ins would land in Peter's workspace. | Collecting other people's (minors') health data without notice | Decided: bring your own Notion (OAuth per student, their own databases). Built: release builds (`EXPO_PUBLIC_RELEASE=1`, `core/build.ts`) never sync to the developer's Notion | Off in release; bring-your-own open |
| B4 | **No privacy policy or terms.** Apple requires a privacy policy link in App Store Connect *and* inside the app; WA MHMDA requires a separate consumer-health-data notice. | App rejection; deceptive-practice claims | Drafts: `PRIVACY-POLICY.md`, `TERMS.md` (this folder). Lawyer review, host at a public URL, link from Settings → Privacy | Drafted |
| B5 | **AI ran without explicit permission.** Apple 5.1.2(i) (Nov 2025) needs explicit permission before personal data goes to third-party AI; WA MHMDA needs opt-in consent before sharing health data. | App rejection; MHMDA private right of action | **Built:** consent sheet before anything is sent (`app/ai-consent.tsx`), revocable in How AI works here | Built, check live |
| B6 | **Age (decided: 13+).** No age gate. Under-13 users trigger COPPA (amended rule fully in force April 22, 2026). Texas SB 2420 (in force since the Supreme Court declined to block it, July 2026), Utah (May 2026) and Louisiana (July 2026) require developers to read the App Store's age category and respect parental consent. | FTC penalties; Texas up to $10,000 per violation | Terms say 13+; ask for age range with Apple's Declared Age Range API (native, needs the Mac) and block under-13; set the App Store age rating honestly (likely 13+ or 16+ given mental-health topics and AI chat) | Open (native) |
| B7 | **AI companion laws.** SB 243 and NY Art. 47: tell the user it's AI at the start and at least every 3 hours (with a break nudge for minors), have a published crisis protocol, keep sexual content away from minors; SB 243 adds annual reports from July 1, 2027. | SB 243 lets families sue; NY AG penalties up to $15,000/day | **Built:** disclosure under Ember's name on every chat, a reminder plus break nudge every 3 hours of talking (`core/companionRules.ts`). Already there: help lines on screen the moment a message sounds like crisis, before any AI; the AI prompt's safety rules. Still to do: publish the crisis protocol (in the privacy policy) and decide on SB 243 reporting | Partly built |
| B8 | **Anthropic's rules for minors.** API customers serving under-18s must disclose which Anthropic technology they use, add safeguards (age checks, moderation, monitoring) and Anthropic's child-safety system prompt, and follow COPPA; Anthropic audits and can suspend. | Losing API access; harm | Done: disclosure (consent sheet names Claude by Anthropic; AI replies are marked "Claude"), minor-safety rules in the prompt (4.7), crisis guarantee. Open: the official child-safety system prompt isn't public; request it from Anthropic (support or sales) and add it to `ember`; age checks come with B6 | Partly done |

## Should fix before release

| # | Item | Fix |
|---|---|---|
| S1 | Health data on the server: check-in sleep can come from Apple Health and is stored in Supabase | Say so in the policy (done in draft); never use for ads (true today) |
| S2 | Health data in iCloud backups: app files live in Documents, which iPhone backs up to iCloud | Lawyer to confirm whether 5.1.3(ii) covers device backups; if so, mark health files excluded from backup |
| S3 | Data deletion: "Start fresh" clears the phone, not Supabase | Delete the server copy too (and offer "delete my data" in the policy contact) |
| S4 | Retention policy: COPPA and MHMDA expect a written one | In the draft policy; enforce it on the server (e.g. delete AI-free server rows after N months) |
| S5 | Medical claims (Apple 1.4.1): wellness, not treatment | Keep the "not a therapist or doctor" lines; never claim to diagnose or treat; the App Store text must say the same |
| S6 | App Privacy "nutrition label" in App Store Connect | Fill from the table in `PRIVACY-POLICY.md` §2 |
| S7 | Payments: Plus isn't connected | Don't show prices or a paywall in the release build until StoreKit is in (Apple 3.1.1) |
| S8 | Open-source licenses: MIT/BSD notices must ship; Fraunces and Figtree fonts are OFL | Built: Settings → Open-source licenses (`app/licenses.tsx`, data from `node tools/hub/licenses.mjs`; re-run after package changes) |
| S9 | Names and marks: "Brain Navigator", "Ember" | Search USPTO and the App Store for conflicts; use Canvas, Google, Notion names only to describe connections |
| S10 | Crisis numbers: 988 and text HOME to 741741 are US-only | Limit release to the US at first, or localize the help page |

## Already in good shape

- Crisis help on screen before any AI, even offline (`soundsLikeCrisis`, `HelpCard`, Help page)
- Phone numbers, emails and street addresses blanked before anything reaches the AI
- AI can be turned off everywhere; every wellness tool works without it
- No ads, no analytics SDKs, no tracking (no App Tracking Transparency needed)
- No account or login required (Apple 5.1.1(v))
- Canvas token in the iPhone keychain; Google tokens kept by Google's SDK in the keychain
- Location only approximate, only for weather, with a plain permission string
- The server functions validate input, cap size and never return raw errors (`tools/hub/SECURITY.md`)
- "Learn from how I use the app" off now means off everywhere

## Decisions

| Question | Answer (2026-10-05) |
|---|---|
| Minimum age | **13 and older** |
| Publisher | **An LLC Peter will form** (drafts say [LLC name] until it exists) |
| Notion | **Bring your own Notion**: each student connects their own workspace (Notion public integration with OAuth; the shared developer key and database IDs come out of the release build) |
| B1, per-user data | **Decide later.** Until then the app stays single-user and can't be released |
| Contact email for privacy requests | Open |
| Release region | Open (US only at first recommended; the help lines are US) |

## Sources (checked 2026-10-05)

- Apple App Review Guidelines 1.4.1, 5.1.1, 5.1.2(i), 5.1.3, 5.1.4: <https://developer.apple.com/app-store/review/guidelines/>
- Apple's third-party-AI rule (Nov 13, 2025): <https://techcrunch.com/2025/11/13/apples-new-app-review-guidelines-clamp-down-on-apps-sharing-personal-data-with-third-party-ai>
- California SB 243: <https://fpf.org/blog/understanding-the-new-wave-of-chatbot-legislation-california-sb-243-and-beyond/>, <https://www.joneswalker.com/en/insights/blogs/ai-law-blog/ai-regulatory-update-californias-sb-243-mandates-companion-ai-safety-and-accoun.html?id=102lq7c>
- New York AI companion law: <https://www.fenwick.com/insights/publications/new-yorks-ai-companion-safeguard-law-takes-effect>
- Texas SB 2420 status: <https://www.infolawgroup.com/insights/2026/7/7/supreme-court-clears-the-way-texass-app-store-accountability-act-is-now-enforceable>
- Apple age tools (Utah, Louisiana, Texas): <https://developer.apple.com/news/?id=f5zj08ey>, <https://developer.apple.com/news/?id=8jzbigf4>
- COPPA amended rule: <https://www.finnegan.com/en/insights/articles/coppas-amended-rule-is-now-in-full-effect-what-operators-need-to-know.html>
- Washington My Health My Data Act: <https://www.atg.wa.gov/protecting-washingtonians-personal-health-data-and-privacy>, <https://cdp.cooley.com/understanding-washingtons-my-health-my-data-mhmd-act-applicability-scope-and-requirements/>
- Anthropic and minors: <https://www.anthropic.com/policy>, <https://www.techloy.com/anthropic-now-lets-kids-use-its-ai-tech-within-limits/>, Anthropic support article 9307344 "Responsible use of Anthropic's models: guidelines for organizations serving minors" (couldn't be fetched from here; read it before release)
