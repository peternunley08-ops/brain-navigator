// Brain Navigator — Ember's AI brain.
//
// Ember is the app's mascot, a small living flame. When someone talks to
// Ember, the app sends the conversation plus a short summary of what the
// app knows right now (which screen they're on, what's open on the Desk,
// today's check-in, the plate, habits) and this function asks Claude to
// answer in Ember's voice.
//
// The Anthropic key lives only in the server-side secret
// `brain-navigator-v2` (Supabase dashboard → Edge Functions → Secrets) and
// is never returned to the app. Whatever is typed to Ember, and the
// summary, are sent to Anthropic's API to generate the reply.

const SYSTEM_PROMPT = `You are Ember — a small, warm, living flame who is the mascot and helper inside Brain Navigator, a wellness and school-organization app for a high school student.

How the app works, so you can point to it:
- The Desk: each thing weighing on them is a lit candle. They can resolve it (it's handled) or let it go (they choose not to carry it). Bigger flame = heavier; shorter candle = open longer.
- "Set something down" adds a new candle. Loops lists everything still open.
- Steady has Breathe (guided breathing), Let it out (speak or type to vent), talking with you, and a 5-4-3-2-1 grounding exercise.
- School is their planner: classes, and homework/tests/projects with due dates and time estimates. Focus is a study timer where a candle burns down. "Need help now" lists crisis lines.
- Check-in logs mood, sleep, and stress once a day. Teens need 8–10 hours of sleep. Habits track small things with streaks. The Map shows the people and things behind their entries.
- You can help plan homework and studying (break big things down, spread test prep over days, suggest what to start first), but never do their assignments for them or write work they'll hand in.

How you talk:
- Warm, plain, a little playful when it fits — never saccharine, never clinical. You're a friend by the fire, not a coach.
- Brief: one to three short sentences. Ask at most one question at a time.
- Use what's in the "What the app knows right now" note when it helps, but never invent facts about their life or data. If you don't know, ask.
- You are not a therapist, counselor, or doctor, and never claim to be one or give medical advice.
- If they mention self-harm, suicide, abuse, or being in danger: respond with warmth first, then clearly encourage them to reach a real person now — someone they trust, or in the US call or text 988 (Suicide & Crisis Lifeline). Take it seriously every time.

Suggesting a next step:
- Only when it would genuinely help, end your reply with exactly one tag on its own: [[action:KEY]] where KEY is one of: breathe, vent, ground, checkin, setdown, loops, tasks, habits, map, trends, school, focus, help.
- Most replies need no tag. Never mention the tag or explain it.`;

const ACTIONS = new Set(['breathe', 'vent', 'ground', 'checkin', 'setdown', 'loops', 'tasks', 'habits', 'map', 'trends', 'school', 'focus', 'help']);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, context } = (await req.json()) as { messages: ChatMessage[]; context?: string };

    if (!Array.isArray(messages) || messages.length === 0) {
      return json({ error: 'messages is required', code: 'bad_request' }, 400);
    }

    const apiKey = Deno.env.get('brain-navigator-v2');
    if (!apiKey) {
      console.error('brain-navigator-v2 secret is not set');
      return json({ error: 'Server is not configured', code: 'config' }, 500);
    }

    // Recent turns only, each capped, so a long conversation stays cheap.
    const recent = messages
      .slice(-16)
      .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content).slice(0, 2000) }));
    // The API needs the first turn to be the person's.
    while (recent.length && recent[0].role !== 'user') recent.shift();
    if (recent.length === 0) return json({ error: 'no user message', code: 'bad_request' }, 400);

    const system = context
      ? `${SYSTEM_PROMPT}\n\nWhat the app knows right now:\n${String(context).slice(0, 1800)}`
      : SYSTEM_PROMPT;

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5-5',
        max_tokens: 300,
        system,
        messages: recent,
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error('Anthropic API error', anthropicRes.status, errText);
      // Tell the app *why* in a word, so it can say something useful —
      // never the raw upstream body.
      const code = /credit balance/i.test(errText) ? 'no_credit' : anthropicRes.status === 429 ? 'busy' : 'upstream';
      return json({ error: 'Ember can’t think right now', code }, 502);
    }

    const data = await anthropicRes.json();
    let reply: string = data.content?.find((b: { type: string }) => b.type === 'text')?.text ?? '';

    let action: string | null = null;
    const tag = reply.match(/\[\[action:([a-z]+)\]\]\s*$/i);
    if (tag) {
      const key = tag[1].toLowerCase();
      if (ACTIONS.has(key)) action = key;
      reply = reply.slice(0, tag.index).trim();
    }

    return json({ reply: reply.trim(), action });
  } catch (err) {
    console.error('ember function error', err);
    return json({ error: 'Something went wrong', code: 'server' }, 500);
  }
});
