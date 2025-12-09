/**
 * Next.js API Route: POST /api/predictions/batch
 * Proxies batch prediction requests to Backend-Model Flask server
 */

export async function POST(request) {
  try {
    const body = await request.json();
    const { samples } = body;
    if (!samples || !Array.isArray(samples)) {
      return Response.json({ error: 'Invalid data format. Expected array under "samples".' }, { status: 400 });
    }

    const resp = await fetch('http://127.0.0.1:5001/api/predictions/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ samples }),
    });

    const data = await resp.json();
    return Response.json(data, { status: resp.status });
  } catch (err) {
    console.error('[api/predictions/batch] Error:', err);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ error: 'Method not allowed. Use POST.' }, { status: 405 });
}
