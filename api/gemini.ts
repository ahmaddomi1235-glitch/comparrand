interface VercelRequest {
  method?: string;
  body: unknown;
  query: Record<string, string | string[]>;
  headers: Record<string, string | string[] | undefined>;
}

interface VercelResponse {
  status(code: number): VercelResponse;
  json(data: unknown): void;
  end(): void;
  setHeader(name: string, value: string | string[]): void;
}

const GEMINI_DIRECT_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent';

function getAllowedOrigin(): string {
  const origin = process.env.ALLOWED_ORIGIN;
  if (origin && origin.trim() !== '') return origin.trim();

  return '*';
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  const allowedOrigin = getAllowedOrigin();

  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed — use POST' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    console.error('[api/gemini] GEMINI_API_KEY is not set in server environment');
    res.status(500).json({
      error: 'Gemini API key not configured on server',
      hint: 'Set GEMINI_API_KEY in Vercel Environment Variables (no VITE_ prefix)',
    });
    return;
  }

  if (!req.body || typeof req.body !== 'object') {
    res.status(400).json({ error: 'Invalid request body — expected JSON object' });
    return;
  }

  try {
    const geminiRes = await fetch(
      `${GEMINI_DIRECT_URL}?key=${encodeURIComponent(apiKey.trim())}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
      }
    );

    const data: unknown = await geminiRes.json();

    res.status(geminiRes.status).json(data);
  } catch (error) {
    console.error('[api/gemini] Failed to contact Gemini:', error);
    res.status(502).json({
      error: 'Failed to contact Gemini API',
      detail: error instanceof Error ? error.message.slice(0, 200) : 'Unknown error',
    });
  }
}
