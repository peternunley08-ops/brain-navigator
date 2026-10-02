// Brain Navigator — push-only Notion sync.
//
// The Notion key lives only in the server-side secret `NOTION_API_KEY`
// (Supabase dashboard → Edge Functions → Secrets) and is never returned to
// the app. This function does three things and nothing else: create a page in
// a database, update a page's properties, archive a page. Page content is
// never logged.
//
// Body: { action: 'create', databaseId, properties }
//       { action: 'update', pageId, properties }
//       { action: 'archive', pageId }

const NOTION_VERSION = '2022-06-28';
const NOTION_API = 'https://api.notion.com/v1';
const ID = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;
const MAX_BODY = 60_000;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function isProps(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v) && Object.keys(v).length <= 50;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== 'POST') return json({ error: 'Method not allowed', code: 'bad_request' }, 405);

  try {
    const raw = await req.text();
    if (raw.length > MAX_BODY) return json({ error: 'Too large', code: 'bad_request' }, 413);
    let input: { action?: unknown; databaseId?: unknown; pageId?: unknown; properties?: unknown };
    try {
      input = JSON.parse(raw);
    } catch {
      return json({ error: 'Bad JSON', code: 'bad_request' }, 400);
    }

    const key = Deno.env.get('NOTION_API_KEY');
    if (!key) return json({ error: 'Server is not configured', code: 'config' }, 500);

    let url: string;
    let method: 'POST' | 'PATCH';
    let payload: Record<string, unknown>;

    if (input.action === 'create') {
      if (typeof input.databaseId !== 'string' || !ID.test(input.databaseId) || !isProps(input.properties)) {
        return json({ error: 'Invalid input', code: 'bad_request' }, 400);
      }
      url = `${NOTION_API}/pages`;
      method = 'POST';
      payload = { parent: { database_id: input.databaseId }, properties: input.properties };
    } else if (input.action === 'update') {
      if (typeof input.pageId !== 'string' || !ID.test(input.pageId) || !isProps(input.properties)) {
        return json({ error: 'Invalid input', code: 'bad_request' }, 400);
      }
      url = `${NOTION_API}/pages/${input.pageId}`;
      method = 'PATCH';
      payload = { properties: input.properties };
    } else if (input.action === 'archive') {
      if (typeof input.pageId !== 'string' || !ID.test(input.pageId)) {
        return json({ error: 'Invalid input', code: 'bad_request' }, 400);
      }
      url = `${NOTION_API}/pages/${input.pageId}`;
      method = 'PATCH';
      payload = { archived: true };
    } else {
      return json({ error: 'Unknown action', code: 'bad_request' }, 400);
    }

    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${key}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return json({ error: 'Notion declined', code: 'upstream', status: res.status }, 502);
    const data = await res.json();
    return json({ id: typeof data.id === 'string' ? data.id : null });
  } catch {
    return json({ error: 'Something went wrong', code: 'server' }, 500);
  }
});
