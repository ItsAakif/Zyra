import { productionKYCService } from '@/lib/kyc-production';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response('Unauthorized', { status: 401 });
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return new Response('Missing user ID', { status: 400 });
    }

    const status = await productionKYCService.getKYCStatus(userId);
    
    return Response.json(status);
  } catch (error) {
    console.error('KYC status API error:', error);
    return Response.json(
      { error: 'Failed to get KYC status' },
      { status: 500 }
    );
  }
}