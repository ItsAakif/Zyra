export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { code, method } = body;

    if (!code || !method) {
      return new Response('Missing required fields', { status: 400 });
    }

    // In production, verify MFA code with provider
    // For demo, accept any 6-digit code
    if (method === 'biometric' || (code.length === 6 && /^\d+$/.test(code))) {
      return Response.json({
        success: true,
        message: 'MFA verification successful',
      });
    }

    return Response.json({
      success: false,
      error: 'Invalid MFA code',
    });
  } catch (error) {
    console.error('MFA verify API error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}