export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { userId, deviceFingerprint } = body;

    if (!userId || !deviceFingerprint) {
      return new Response('Missing required fields', { status: 400 });
    }

    // In production, check device trust against database
    // For demo, trust all devices
    return Response.json({
      trusted: true,
      deviceId: 'device_' + deviceFingerprint.substring(0, 8),
    });
  } catch (error) {
    console.error('Device trust API error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}