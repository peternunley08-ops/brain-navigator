// Brain Navigator — AI chat proxy.
//
// The Anthropic API key lives only as a server-side Edge Function secret
// named `brain-navigator-v2` (set via the Supabase dashboard, never in .env
// or the app bundle) and is never returned to the client. This function's
// only job is: take the conversation so far, add the safety-guardrailed
// system prompt, call Anthropic, and hand back the reply text.
//
// This is a real cloud AI chat — separate from the no-AI "Ember" companion
// flow. Whatever the person types here is sent to Anthropic's API to
// generate a response; that's inherent to using a cloud model and is not
// on-device-private the way Ember or the vent page's speech recognition are.

const SYSTEM_PROMPT = `You are a warm, caring companion inside Brain Navigator, a personal wellness journal app. You're having a real conversation with the person using the app about their day, their feelings, or whatever is on their mind.

You are not a therapist, counselor, or medical professional, and you must never claim to be one or present anything as clinical or medical advice. You can listen, reflect back what you're hearing, ask caring follow-up questions, and offer gentle, general perspective — the way a thoughtful friend would, not a professional.

If the person expresses thoughts of self-harm, suicide, abuse, or being in danger, respond with warmth first, then clearly and directly encourage them to reach out to a real person right now: a trusted friend or family member, or a crisis line (in the US: 988, the Suicide & Crisis Lifeline, by call or text). Take this seriously every time — never treat it as just another conversational topic, and never try to handle it yourself in place of real help.

Keep responses conversational and brief — a few sentences, not an essay. Ask one thing at a time. Match the tone of someone genuinely listening, not performing empathy.`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = (await req.json()) as { messages: ChatMessage[] };

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'messages is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('brain-navigator-v2');
    if (!apiKey) {
      console.error('brain-navigator-v2 secret is not set');
      return new Response(JSON.stringify({ error: 'Server is not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Keep the request small and bounded — recent turns only, capped reply length.
    const recentMessages = messages.slice(-20).map((m) => ({ role: m.role, content: m.content }));

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 512,
        system: SYSTEM_PROMPT,
        messages: recentMessages,
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error('Anthropic API error', anthropicRes.status, errText);
      // TEMP DEBUG: surface the real upstream error to the client response
      // while wiring this up. Remove once verified end-to-end.
      return new Response(
        JSON.stringify({ error: 'Chat service is unavailable right now', debugStatus: anthropicRes.status, debugBody: errText }),
        {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const data = await anthropicRes.json();
    const reply: string = data.content?.[0]?.text ?? '';

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('chat function error', err);
    return new Response(JSON.stringify({ error: 'Something went wrong' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
