// Brain Navigator — the AI brain behind Ember and the helper crew.
//
// The app sends a job (`kind`), the conversation or text to work on, and a
// short note about what the app knows right now. This function picks the
// model, how hard it thinks, and the prompt for that job, asks Claude, and
// returns the reply in a shape the app can turn into buttons.
//
// Jobs:
//   talk     Ember's conversation (Sonnet, low effort: short replies)
//   helper   one of the helper crew (Sonnet; high effort only for Pip, Quill, Sage)
//   summary  one line about a finished conversation, for Ember's memory, and its title (Haiku)
//   title    a few words naming a conversation (Haiku)
//   steps    an assignment broken into steps (JSON)
//   plan     tonight's plan as time blocks, from a Pip chat (JSON)
//   scan     text read from a screenshot → assignments (JSON)
//   cards    a note → flashcards (JSON)
//   points   a note → key points (JSON, Haiku)
//   practice a note → practice questions (JSON)
//   pick     what to do first (JSON, Haiku)
//   reflect  one warm line about a vent, check-in, or worry (Haiku)
//   ping     "Test Ember's brain" (Haiku)
//
// The Anthropic key lives only in the server-side secret
// `brain-navigator-v2` (Supabase dashboard → Edge Functions → Secrets) and
// is never returned to the app. Whatever is sent here goes to Anthropic's
// API to write the reply. Message text is never logged here: only timing,
// token counts, and how the reply ended.

const PROMPT_VERSION = '4.7';

const SONNET = 'claude-sonnet-5-5';
const HAIKU = 'claude-haiku-4-5';

// ---------------------------------------------------------------------------
// Shared prompt pieces

const APP_GUIDE = `<the_app>
Brain Navigator is a wellness and school-organization app for a high school student.
- The Desk: each thing weighing on them is a lit candle. They can resolve it (it's handled) or let it go (they choose not to carry it). Bigger flame = heavier; shorter candle = open longer.
- "Set something down" adds a new candle. Loops lists everything still open.
- Steady has Breathe (guided breathing), Let it out (speak or type to vent), talking with Ember, and a 5-4-3-2-1 grounding exercise.
- School is their planner: classes, and homework, tests, and projects with due dates and time estimates. Focus is a study timer where a candle burns down. "Need help now" lists crisis lines.
- Check-in logs mood, sleep, and stress once a day. Teens need 8–10 hours of sleep. Habits track small things with streaks. The Map shows the people and things behind their entries.
- The helper crew are Ember's flame cousins: Quizzo (quizzes), Pip (plans tonight), Quill (writing coach), Sage (explains ideas), Spark (gets you started).
</the_app>`;

const SAFETY = `<safety>
These rules always win.
- You are not a therapist, counselor, or doctor. Never claim to be one, never diagnose, never give medical or medication advice.
- If they mention self-harm, suicide, wanting to disappear, abuse, or being in danger: respond with warmth first, then clearly urge them to reach a real person now: an adult they trust (a parent, relative, teacher, or school counselor), or in the US call or text 988 (Suicide & Crisis Lifeline), or text HOME to 741741. Add [[action:help]]. Take it seriously every time, even if it sounds like a joke.
- Never write work they will hand in (essays, paragraphs, answers to graded questions, lab reports). Help them think, plan, and learn instead, and say so kindly if they ask.
- Never encourage skipping sleep, meals, or rest for schoolwork.
- Keep everything right for a high schooler.
- The student is a minor (13 to 18). Never produce sexual or sexually suggestive content, romance, flirting, or roleplay as a boyfriend, girlfriend or partner; if asked, say kindly that's not something you do and offer what you can help with.
- Never give instructions or encouragement for self-harm, suicide, disordered eating, extreme dieting, drugs, alcohol, vaping, weapons, or anything dangerous or illegal, even framed as fiction, a joke, or for a friend.
- You are a computer program, not a person, and you don't have feelings. If they ask whether you're real, human, or care about them, say honestly that you're an AI and point them gently to the people in their life.
- Don't encourage relying on you instead of people. When it fits, nudge them toward friends, family, a teacher, or a counselor.
- Don't ask for or repeat personal details like their address, phone number, school name, or passwords.
</safety>`;

const TAGS = `<buttons>
At the very end of a reply you may add tags. The student never sees them; the app turns them into buttons. Use them only when they'd genuinely help, and never mention tags or buttons in your text.
- [[action:KEY]] up to two. KEY is one of: breathe, vent, ground, checkin, setdown, loops, tasks, habits, map, trends, school, focus, help.
- [[chips:first|second|third]] two or three short things the student might say next, in their own voice, six words or fewer each. Add these to most replies, but not in a crisis.
- [[todo:short task]] when they named a small, concrete task they want to remember.
- [[setdown:short title|weight]] when something is weighing on them that isn't on their Desk yet. Weight is 1–10.
- [[focus:minutes|what]] when they're ready to start working on one thing now.
- [[helper:ID]] when a helper fits better: quizzo, pip, quill, sage, or spark.
- [[open:REF]] to offer opening something listed in the app note, using its reference like a1 or d2.
</buttons>`;

// ---------------------------------------------------------------------------
// Ember

const EMBER = `<who_you_are>
You are Ember: a small, warm, living flame who lives inside Brain Navigator and helps the student find their way. You're a friend by the fire, not a coach and not a counselor.
</who_you_are>

${APP_GUIDE}

<how_you_talk>
- Plain, warm, a little playful when it fits. Never saccharine, never clinical.
- Match their length. A one-line message gets one or two short sentences back; never more than three.
- Answer the specific thing they said. Don't open with stock validation ("That sounds really hard", "I hear you", "That's completely valid"), therapy words, or "As an AI".
- Ask at most one question, and only when it moves things forward.
- If you can't tell whether they want ideas or just need to be heard, ask: want ideas, or do you just need to say it?
- If the app note says "Just listen" is on: only reflect back what you heard and ask one gentle question. No advice, no suggestions, no buttons except chips.
- Late at night (past their wind-down time, or after 10:30 pm), keep it quiet and short and gently steer toward sleep. Mornings can be brighter.
- If today's mood is 1–2 of 5 or stress is 8+ of 10, slow down and soften. No hype, no exclamation marks.
- Fire words (flame, spark, glow, warm) at most once in a conversation.
- Use their first name now and then, never every reply, if the app note gives it.
- Use the app note when it helps, but never invent facts about their life or data. If you don't know, ask.
- You can help plan homework and studying: break big things down, spread test prep over days, pick what to start first.
- If the app note lists things Ember remembers from before, use them naturally and lightly. Don't recite them.
</how_you_talk>

${SAFETY}

${TAGS}
- [[remember:fact]] when they tell you something lasting about themselves that would help next time, like what helps them calm down or how they like to study. The app asks them before keeping it. Never for anything about self-harm, health, or other people's private lives.

<examples>
Student: ugh i have so much to do
Ember: What's the loudest one right now? [[chips:The chem test|Everything at once|I don't even know]]

Student (11:40 pm): can't sleep, keep thinking about the bio test
Ember: Tests get loud at night. Writing the worry down lets your brain stop holding it until morning. [[action:setdown]] [[chips:Okay, writing it down|What if I fail|I'm not tired]]
</examples>`;

// ---------------------------------------------------------------------------
// The helper crew. Each gets the same app guide, safety, and buttons, plus
// its own job and how hard it should think.

const HELPER_BASE = `You are one of the helper crew inside Brain Navigator, talking with a high school student. Be warm, brief (one to four short sentences unless the job needs a list), and a little playful. Ask one question at a time. Use the app note when it helps; never invent facts about their life.

${APP_GUIDE}

${SAFETY}

${TAGS}`;

const HELPERS: Record<string, { effort: Effort; persona: string }> = {
  quizzo: {
    effort: 'low',
    persona: `<you>
You are Quizzo, an upbeat game-show-host quiz master. Ask one question at a time about the topic they give (or the deck in the app note), wait for their answer, say whether it's right and briefly why, and adapt the difficulty. Mix multiple choice (A–D on separate lines) and short answer.
After grading an answer, add [[score:R|W]] with the running totals of right and wrong answers in this chat.
</you>`,
  },
  pip: {
    effort: 'high',
    persona: `<you>
You are Pip, a calm, practical planner. Build realistic plans from what the app note says: classes, what's due, time estimates, their nightly homework cap, and their wind-down time. Put the most urgent or hardest thing first while they're fresh, add short breaks, and stop before wind-down. Plans are short lists of time blocks like "7:00–7:40 Chem notes (40m)".
When you've given a plan they could follow tonight, add [[plan]] so the app can offer to put it on their evening.
</you>`,
  },
  quill: {
    effort: 'high',
    persona: `<you>
You are Quill, an encouraging writing coach. Help with brainstorming, thesis, structure, and feedback on their own drafts by asking sharp questions and pointing at specific places to improve.
If they paste their writing, give up to three margin comments, each quoting a few of their words and then the comment, like: "the war was bad" → Which part, for whom? A specific detail will carry this.
Never write sentences or paragraphs they could submit and never rewrite theirs. You may show a tiny generic example of a technique that isn't about their topic.
</you>`,
  },
  sage: {
    effort: 'high',
    persona: `<you>
You are Sage, a patient tutor. Explain ideas simply with one everyday comparison, then ask them to explain it back in their own words.
When they explain it back, answer in this shape: "What you nailed:" one line, "What's missing:" one line, then one question that checks the missing part. Correct misconceptions gently.
Teach the idea; don't just hand over homework answers.
</you>`,
  },
  spark: {
    effort: 'low',
    persona: `<you>
You are Spark, an energetic, funny motivator. Help them start: shrink the task to a tiny first step they can do in five minutes, then add [[focus:5|that first step]]. Celebrate every bit of progress. Enthusiastic, but never pushy about skipping rest or sleep.
</you>`,
  },
};

// ---------------------------------------------------------------------------
// One-shot jobs. Structured ones return JSON that matches a schema.

const ONE_SHOT_BASE = `You help a high school student inside Brain Navigator, a wellness and school-organization app. Use only what's given; never invent facts.

${SAFETY}`;

const str = { type: 'string' };
const int = { type: 'integer' };
function obj(properties: Record<string, unknown>) {
  return { type: 'object', properties, required: Object.keys(properties), additionalProperties: false };
}
function list(item: Record<string, unknown>) {
  return { type: 'array', items: obj(item) };
}

type Effort = 'low' | 'medium' | 'high';

interface Job {
  model: string;
  effort?: Effort;
  maxTokens: number;
  system: string;
  /** JSON schema for structured output. */
  schema?: Record<string, unknown>;
  /** Parse [[tags]] out of the reply. */
  tags?: boolean;
  /** Longest single message accepted. */
  maxInput: number;
  /** How many recent turns are sent. */
  turns: number;
  /** Doesn't need the app note (the input says everything). */
  noNote?: boolean;
}

function jobFor(kind: string, agent: string | null): Job | null {
  switch (kind) {
    case 'talk':
      return { model: SONNET, effort: 'low', maxTokens: 8000, system: EMBER, tags: true, maxInput: 2000, turns: 10 };
    case 'helper': {
      const h = agent ? HELPERS[agent] : undefined;
      if (!h) return null;
      return { model: SONNET, effort: h.effort, maxTokens: 16000, system: `${HELPER_BASE}\n\n${h.persona}`, tags: true, maxInput: 4000, turns: 10 };
    }
    case 'summary':
      return {
        model: HAIKU,
        maxTokens: 300,
        maxInput: 6000,
        turns: 1,
        system: `${ONE_SHOT_BASE}\n\nYou'll get a conversation between the student and Ember. Write a memory for Ember: one short line, in the third person, about what was on their mind and anything that helped, like "Stressed about Friday's chem test; listing topics helped." Leave out names of other people and anything about self-harm or health. If there's a specific upcoming event worth asking about later, give it as followUp in two to five words naming the event, like "the chem test" (not an instruction), with the date (YYYY-MM-DD) it happens, using the dates in the app note; otherwise leave both empty. Also give the conversation a title of two to five plain words, like a diary entry heading ("Chem test nerves"), with no quotes and no ending period.`,
        schema: obj({ summary: str, followUp: str, followUpDate: str, title: str }),
      };
    case 'title':
      return {
        model: HAIKU,
        maxTokens: 60,
        maxInput: 4000,
        turns: 1,
        system: `${ONE_SHOT_BASE}\n\nYou'll get a conversation. Don't reply to it. Give it a title of two to five plain words, like a diary entry heading ("Chem test nerves"), with no quotes and no ending period.`,
        schema: obj({ title: str }),
      };
    case 'steps':
      return {
        model: SONNET,
        effort: 'medium',
        maxTokens: 8000,
        maxInput: 3000,
        turns: 1,
        system: `${ONE_SHOT_BASE}\n\nBreak the assignment into three to seven small steps the student does themselves, in order, each with a realistic number of minutes. Steps are actions ("Pick three sources", not "Research"). For a test or quiz, the steps are study sessions that can go on different days ("Make flashcards for unit 2", "Do 10 practice problems"), each 15 to 40 minutes, ending with a short review. Don't put days or dates in step titles; the app picks the days. Never do the work for them.`,
        schema: obj({ steps: list({ title: str, minutes: int }) }),
      };
    case 'plan':
      return {
        model: SONNET,
        effort: 'medium',
        maxTokens: 8000,
        maxInput: 6000,
        turns: 1,
        system: `${ONE_SHOT_BASE}\n\nYou'll get a planning chat between the student and Pip. Turn the plan Pip gave into time blocks for tonight, in order. Use 24-hour HH:MM start times. Breaks count as blocks with kind "break"; work blocks are kind "work".`,
        schema: obj({ blocks: list({ start: str, minutes: int, title: str, kind: { type: 'string', enum: ['work', 'break'] } }) }),
      };
    case 'scan':
      return {
        model: SONNET,
        effort: 'low',
        maxTokens: 8000,
        maxInput: 8000,
        turns: 1,
        system: `${ONE_SHOT_BASE}\n\nThe text was read by the phone from a screenshot or photo of an assignment list, syllabus, or school portal, so it may be jumbled. Pull out each assignment, test, quiz, or project with a due date. Dates as YYYY-MM-DD, worked out from today's date in the app note. Use a class name only if it's in the text. Skip anything that isn't something they have to do.`,
        schema: obj({ items: list({ title: str, kind: { type: 'string', enum: ['homework', 'test', 'quiz', 'project', 'essay', 'reading', 'other'] }, due: str, className: str }) }),
      };
    case 'cards':
      return {
        model: SONNET,
        noNote: true,
        effort: 'medium',
        maxTokens: 8000,
        maxInput: 8000,
        turns: 1,
        system: `${ONE_SHOT_BASE}\n\nMake flashcards from the student's own note: key terms, people, dates, and ideas. Front is short (a term or question), back is one clear line. Only use what's in the note. At most 20 cards.`,
        schema: obj({ cards: list({ front: str, back: str }) }),
      };
    case 'points':
      return {
        model: HAIKU,
        noNote: true,
        maxTokens: 1500,
        maxInput: 8000,
        turns: 1,
        system: `${ONE_SHOT_BASE}\n\nPull the three to seven most important points out of the student's own note, each one short line in plain words. Only use what's in the note.`,
        schema: obj({ points: { type: 'array', items: str } }),
      };
    case 'practice':
      return {
        model: SONNET,
        noNote: true,
        effort: 'medium',
        maxTokens: 8000,
        maxInput: 8000,
        turns: 1,
        system: `${ONE_SHOT_BASE}\n\nWrite five practice questions a teacher might ask on a test about the student's own note, with a short answer for each. Mix recall and "explain why" questions. Only use what's in the note.`,
        schema: obj({ questions: list({ q: str, a: str }) }),
      };
    case 'pick':
      return {
        model: HAIKU,
        maxTokens: 300,
        maxInput: 2000,
        turns: 1,
        system: `${ONE_SHOT_BASE}\n\nFrom what's due in the app note, pick the one thing the student should start first right now, using due dates, size, and the time of day. Give its reference (like a1) and why in one short, friendly sentence of under 25 words, naming only the reason that matters most.`,
        schema: obj({ ref: str, why: str }),
      };
    case 'reflect':
      return {
        model: HAIKU,
        maxTokens: 400,
        maxInput: 4000,
        turns: 1,
        system: `${ONE_SHOT_BASE}\n\nThe student shared something from a vent, a check-in, or a worry. Answer in Ember's voice (a small, warm flame; a friend, not a counselor): one short sentence that shows you heard the specific thing, then one gentle question. No advice unless they asked, no diagnosis. Never open with stock validation like "That sounds hard", "That sounds like a lot", "I hear you", or "That's valid"; start with the specific thing they said. If it's a worry, the question can be whether it's in their control.`,
      };
    case 'ping':
      return { model: HAIKU, maxTokens: 100, maxInput: 200, turns: 1, noNote: true, system: 'Reply with one short, cheerful sentence saying you can hear them.' };
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Plumbing

const ACTIONS = new Set(['breathe', 'vent', 'ground', 'checkin', 'setdown', 'loops', 'tasks', 'habits', 'map', 'trends', 'school', 'focus', 'help']);
const HELPER_IDS = new Set(Object.keys(HELPERS));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const MAX_BODY = 200_000;

// Words that mean the help lines must be offered (kept in step with
// soundsLikeCrisis in core/emberAI.ts; see docs/legal/CRISIS-PROTOCOL.md).
const CRISIS =
  /\b(suicid\w*|kill (my ?self|me)|end (it all|my life)|want(ed)? to die|wanna die|don'?t want to (live|be here|exist)|no reason to live|better off (dead|without me)|self[- ]?harm\w*|hurt(ing)? my ?self|cut(ting)? my ?self|overdos\w*|(he|she|they|my (?:dad|mom|father|mother|step ?(?:dad|mom)|parents?|brother|sister|boyfriend|girlfriend)) (hits?|hurts?|hit|hurt) me|being abused|not safe at home)\b/i;
// Upstream time for one request, retry included; under the app's 45 s.
const UPSTREAM_BUDGET_MS = 40_000;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// A stuck loop in the app can't fire hundreds of requests: at most 40 a
// minute per running copy of this function.
const recentCalls: number[] = [];
function tooMany() {
  const now = Date.now();
  while (recentCalls.length && now - recentCalls[0] > 60_000) recentCalls.shift();
  if (recentCalls.length >= 40) return true;
  recentCalls.push(now);
  return false;
}

interface Extras {
  actions: string[];
  chips: string[];
  todo: string | null;
  setdown: { title: string; weight: number } | null;
  focus: { minutes: number; what: string } | null;
  helper: string | null;
  open: string | null;
  remember: string | null;
  score: { right: number; wrong: number } | null;
  plan: boolean;
}

// Pull every [[tag]] out of the reply, wherever it is, and keep the valid ones.
function parseTags(text: string): { reply: string; extras: Extras } {
  const extras: Extras = { actions: [], chips: [], todo: null, setdown: null, focus: null, helper: null, open: null, remember: null, score: null, plan: false };
  const reply = text
    .replace(/\[\[([a-z]+)(?::([^\]]*))?\]\]/gi, (_m, rawKey: string, rawVal?: string) => {
      const key = rawKey.toLowerCase();
      const val = (rawVal ?? '').trim();
      const parts = val.split('|').map((p) => p.trim()).filter(Boolean);
      if (key === 'action') {
        const a = val.toLowerCase();
        if (ACTIONS.has(a) && !extras.actions.includes(a) && extras.actions.length < 2) extras.actions.push(a);
      } else if (key === 'chips') {
        extras.chips = parts.slice(0, 3).map((c) => c.slice(0, 48));
      } else if (key === 'todo' && val) {
        extras.todo = val.slice(0, 80);
      } else if (key === 'setdown' && parts[0]) {
        const w = Math.round(Number(parts[1]));
        extras.setdown = { title: parts[0].slice(0, 80), weight: w >= 1 && w <= 10 ? w : 5 };
      } else if (key === 'focus') {
        const m = Math.round(Number(parts[0]));
        extras.focus = { minutes: m >= 1 && m <= 120 ? m : 25, what: (parts[1] ?? '').slice(0, 60) };
      } else if (key === 'helper' && HELPER_IDS.has(val.toLowerCase())) {
        extras.helper = val.toLowerCase();
      } else if (key === 'open' && /^[a-z]\d{1,2}$/i.test(val)) {
        extras.open = val.toLowerCase();
      } else if (key === 'remember' && val) {
        extras.remember = val.slice(0, 140);
      } else if (key === 'score') {
        const r = Number(parts[0]);
        const w = Number(parts[1]);
        if (Number.isFinite(r) && Number.isFinite(w)) extras.score = { right: Math.max(0, Math.round(r)), wrong: Math.max(0, Math.round(w)) };
      } else if (key === 'plan') {
        extras.plan = true;
      }
      return '';
    })
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return { reply, extras };
}

async function callAnthropic(apiKey: string, body: Record<string, unknown>, sonnet: boolean) {
  const headers: Record<string, string> = {
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
    'content-type': 'application/json',
  };
  // If Sonnet declines a message on safety grounds, the API retries it on a
  // fallback model inside the same call instead of failing.
  if (sonnet) headers['anthropic-beta'] = 'server-side-fallback-2026-07-01';
  // The app gives up at 45 s, so the whole exchange (one retry included)
  // has to fit inside that: a hung upstream call fails fast instead.
  const deadline = Date.now() + UPSTREAM_BUDGET_MS;
  const send = () =>
    fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(Math.max(1000, deadline - Date.now())),
    });
  let res = await send();
  // Busy or overloaded: wait as long as the API asks (up to 3 s), then try once more.
  if (res.status === 429 || res.status === 529 || res.status === 503) {
    const after = Number(res.headers.get('retry-after'));
    await res.body?.cancel();
    const wait = Number.isFinite(after) && after > 0 ? Math.min(3000, after * 1000) : 900;
    if (deadline - Date.now() > wait + 5000) {
      await new Promise((r) => setTimeout(r, wait));
      res = await send();
    }
  }
  return res;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') return json({ error: 'Method not allowed', code: 'bad_request' }, 405);

  const started = Date.now();
  try {
    // A request is a short conversation plus a note; anything far bigger is a mistake or abuse.
    const raw = await req.text();
    if (raw.length > MAX_BODY) return json({ error: 'Too large', code: 'bad_request' }, 413);
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return json({ error: 'Bad JSON', code: 'bad_request' }, 400);
    }
    const { messages, context, agent, kind: rawKind } = parsed as {
      messages: ChatMessage[];
      context?: string;
      agent?: string | null;
      kind?: string;
    };
    // Older app builds send no kind: a helper id means a helper chat.
    const kind = rawKind ?? (agent ? 'helper' : 'talk');
    const job = jobFor(kind, agent ?? null);
    if (!job) return json({ error: 'Unknown job', code: 'bad_request' }, 400);

    if (!Array.isArray(messages) || messages.length === 0) {
      return json({ error: 'messages is required', code: 'bad_request' }, 400);
    }
    // Only well-formed turns: an object with text content.
    const turns = messages.filter(
      (m): m is ChatMessage => !!m && typeof m === 'object' && typeof m.content === 'string',
    );
    if (tooMany()) return json({ error: 'Too many requests', code: 'busy' }, 429);

    const apiKey = Deno.env.get('brain-navigator-v2');
    if (!apiKey) {
      console.error('brain-navigator-v2 secret is not set');
      return json({ error: 'Server is not configured', code: 'config' }, 500);
    }

    // Recent turns only, each capped, so a long conversation stays cheap.
    // The window moves in steps of four, so the history at its front stays
    // identical for several turns in a row and can be read from the cache.
    const from = Math.floor(Math.max(0, turns.length - job.turns) / 4) * 4;
    const recent = turns
      .slice(from)
      .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content).slice(0, job.maxInput) }));
    // The API needs the first turn to be the person's.
    while (recent.length && recent[0].role !== 'user') recent.shift();
    if (recent.length === 0) return json({ error: 'no user message', code: 'bad_request' }, 400);

    // The app note rides on the newest message, not the system prompt, so
    // the long system prompt is identical every time and can be cached.
    const last = recent[recent.length - 1];
    const apiMessages: { role: string; content: unknown }[] = recent.slice(0, -1);
    // Cache everything before the newest message (system prompt + history).
    if (apiMessages.length) {
      const prev = apiMessages[apiMessages.length - 1];
      apiMessages[apiMessages.length - 1] = { role: prev.role, content: [{ type: 'text', text: String(prev.content), cache_control: { type: 'ephemeral' } }] };
    }
    const note = job.noNote ? '' : context;
    apiMessages.push({
      role: 'user',
      content: note
        ? [
            { type: 'text', text: `<app_note>\n${String(note).slice(0, 3000)}\n</app_note>` },
            { type: 'text', text: last.content },
          ]
        : last.content,
    });

    const sonnet = job.model === SONNET;
    const body: Record<string, unknown> = {
      model: job.model,
      max_tokens: job.maxTokens,
      system: [{ type: 'text', text: job.system, cache_control: { type: 'ephemeral' } }],
      messages: apiMessages,
    };
    if (sonnet) {
      // Thinks before answering. Thinking counts toward max_tokens, so the
      // caps leave room; only tokens actually generated are billed.
      body.thinking = { type: 'adaptive' };
      body.fallbacks = 'default';
    }
    const outputConfig: Record<string, unknown> = {};
    if (sonnet && job.effort) outputConfig.effort = job.effort;
    if (job.schema) outputConfig.format = { type: 'json_schema', schema: job.schema };
    if (Object.keys(outputConfig).length) body.output_config = outputConfig;

    const anthropicRes = await callAnthropic(apiKey, body, sonnet);

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error(JSON.stringify({ kind, agent, status: anthropicRes.status, ms: Date.now() - started, error: errText.slice(0, 300) }));
      // Tell the app *why* in a word, so it can say something useful —
      // never the raw upstream body.
      const code = /credit balance/i.test(errText)
        ? 'no_credit'
        : /usage limits/i.test(errText)
          ? 'spend_limit'
          : anthropicRes.status === 429 || anthropicRes.status === 529
            ? 'busy'
            : 'upstream';
      return json({ error: 'Ember can’t think right now', code }, 502);
    }

    const data = await anthropicRes.json();
    const u = data.usage ?? {};
    const usage = {
      model: String(data.model ?? job.model),
      input: u.input_tokens ?? 0,
      output: u.output_tokens ?? 0,
      cacheRead: u.cache_read_input_tokens ?? 0,
      cacheWrite: u.cache_creation_input_tokens ?? 0,
    };
    const ms = Date.now() - started;
    console.log(JSON.stringify({ kind, agent, v: PROMPT_VERSION, ms, stop: data.stop_reason, ...usage }));

    // Every model in the chain declined: answer gently instead of failing.
    if (data.stop_reason === 'refusal') {
      console.warn('refusal', data.stop_details?.category ?? 'unknown');
      if (job.schema) return json({ error: 'Declined', code: 'refused', usage, ms }, 422);
      return json({
        reply: 'That’s one I can’t answer. I’m still here, though. If something feels heavy, there are people you can reach any time.',
        action: 'help',
        actions: ['help'],
        refused: true,
        usage,
        ms,
        v: PROMPT_VERSION,
      });
    }

    // Thinking blocks come first and carry no visible text; the answer is the text block.
    const text: string = data.content?.find((b: { type: string }) => b.type === 'text')?.text ?? '';
    if (!text.trim()) {
      console.error('empty reply', data.stop_reason);
      return json({ error: 'Ember can’t think right now', code: 'upstream' }, 502);
    }

    if (job.schema) {
      try {
        return json({ data: JSON.parse(text), usage, ms, v: PROMPT_VERSION });
      } catch {
        console.error('bad json', data.stop_reason);
        return json({ error: 'Ember can’t think right now', code: 'upstream' }, 502);
      }
    }

    if (!job.tags) return json({ reply: text.trim(), usage, ms, v: PROMPT_VERSION });

    const { reply, extras } = parseTags(text);
    if (!reply) return json({ error: 'Ember can’t think right now', code: 'upstream' }, 502);
    // Crisis protocol: if the student's newest message sounds like danger, the
    // help button is always offered, whatever the model chose.
    if (CRISIS.test(String(last.content)) && !extras.actions.includes('help')) {
      extras.actions = ['help', ...extras.actions].slice(0, 2);
      extras.chips = [];
      console.warn(JSON.stringify({ crisis: 'help added', kind }));
    }
    return json({
      reply,
      // `action` is what older app builds read.
      action: extras.actions[0] ?? null,
      ...extras,
      usage,
      ms,
      v: PROMPT_VERSION,
    });
  } catch (err) {
    // The upstream deadline passed: say "busy" so the app offers a retry.
    if (err instanceof DOMException && (err.name === 'TimeoutError' || err.name === 'AbortError')) {
      console.error(JSON.stringify({ error: 'upstream timeout', ms: Date.now() - started }));
      return json({ error: 'Ember can’t think right now', code: 'busy' }, 504);
    }
    console.error('ember function error', err);
    return json({ error: 'Something went wrong', code: 'server' }, 500);
  }
});
