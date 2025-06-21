import { productionKYCService } from '@/lib/kyc-production';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { userId, provider = 'persona' } = body;

    if (!userId) {
      return new Response('Missing user ID', { status: 400 });
    }

    const result = await productionKYCService.startKYCVerification(userId, provider);
    
    return Response.json(result);
  } catch (error) {
    console.error('KYC start API error:', error);
    return Response.json(
      { success: false, error: 'KYC verification failed to start' },
      { status: 500 }
    );
  }
}