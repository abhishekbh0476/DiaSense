/**
 * Next.js API Route: GET /api/predictions/info
 * Forwards info requests to Backend-Model Flask server
 */

export async function GET() {
  try {
    const resp = await fetch('http://127.0.0.1:5001/api/predictions/info');
    const data = await resp.json();
    return Response.json(data, { status: resp.status });
  } catch (err) {
    console.error('[api/predictions/info] Error:', err);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST() {
  return Response.json({ error: 'Method not allowed. Use GET.' }, { status: 405 });
}
