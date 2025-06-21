export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response('Unauthorized', { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // In production, validate JWT token here
    // For demo, return mock user profile
    const userProfile = {
      id: 'user_' + Date.now(),
      email: 'demo@zyra.app',
      fullName: 'Alex Chen',
      roles: [
        {
          id: 'premium-role',
          name: 'premium',
          permissions: [
            { resource: 'payments', action: 'write' },
            { resource: 'wallet', action: 'read' },
            { resource: 'rewards', action: 'read' },
          ],
        },
      ],
      permissions: [
        { resource: 'payments', action: 'write' },
        { resource: 'wallet', action: 'read' },
        { resource: 'rewards', action: 'read' },
      ],
      kycStatus: 'verified',
      mfaEnabled: false,
      lastLogin: new Date(),
      deviceFingerprint: 'demo-fingerprint',
      subscriptionTier: 'pro',
      riskScore: 0.1,
    };

    return Response.json(userProfile);
  } catch (error) {
    console.error('Profile API error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}