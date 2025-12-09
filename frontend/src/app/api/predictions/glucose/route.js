/**
 * Next.js API Route: POST /api/predictions/glucose
 * Forwards requests to Backend-Model Flask server at http://127.0.0.1:5001
 */

export async function POST(request) {
  try {
    const body = await request.json();
    const { HeartRate, SpO2, GSR } = body;

    if (HeartRate === undefined || SpO2 === undefined || GSR === undefined) {
      return Response.json({ error: 'Missing required fields: HeartRate, SpO2, GSR' }, { status: 400 });
    }

    const resp = await fetch('http://127.0.0.1:5001/api/predictions/glucose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ HeartRate, SpO2, GSR }),
    });

    const data = await resp.json();
    return Response.json(data, { status: resp.status });
  } catch (err) {
    console.error('[api/predictions/glucose] Error:', err);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ error: 'Method not allowed. Use POST.' }, { status: 405 });
}
