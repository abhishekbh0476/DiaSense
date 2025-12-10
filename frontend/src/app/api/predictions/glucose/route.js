/**
 * Next.js API Route: POST /api/predictions/glucose
 * Forwards requests to Backend-Model Flask server at http://127.0.0.1:5001
 */

export async function POST(request) {
  try {
    const body = await request.json();
    // Accept both lowercase (from monitor page) and uppercase (legacy) formats
    const heart_rate = body.heart_rate ?? body.HeartRate;
    const spo2 = body.spo2 ?? body.SpO2;
    const gsr = body.gsr ?? body.GSR;

    console.log('[api/predictions/glucose] Received:', { heart_rate, spo2, gsr, rawBody: body });

    if (heart_rate === undefined || spo2 === undefined || gsr === undefined) {
      console.error('[api/predictions/glucose] Missing fields. Received:', body);
      return Response.json(
        { error: 'Missing required fields: heart_rate, spo2, gsr', received: body },
        { status: 400 }
      );
    }

    console.log('[api/predictions/glucose] Forwarding to backend with:', { heart_rate, spo2, gsr });

    const resp = await fetch('http://127.0.0.1:5001/api/predictions/glucose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ heart_rate, spo2, gsr }),
    });

    console.log('[api/predictions/glucose] Backend response status:', resp.status);
    const data = await resp.json();
    console.log('[api/predictions/glucose] Backend response data:', data);

    if (!resp.ok) {
      console.error('[api/predictions/glucose] Backend error response (status', resp.status + '):', data);
      return Response.json(data, { status: resp.status });
    }

    console.log('[api/predictions/glucose] ✅ Success, returning data to client');
    return Response.json(data, { status: 200 });
  } catch (err) {
    console.error('[api/predictions/glucose] Exception:', err.message, err.stack);
    return Response.json({ error: err.message || 'Internal server error', stack: err.stack }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ error: 'Method not allowed. Use POST.' }, { status: 405 });
}
