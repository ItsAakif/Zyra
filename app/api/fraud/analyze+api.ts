import { fraudDetectionEngine } from '@/lib/fraud-detection';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { transaction } = body;

    if (!transaction) {
      return new Response('Missing transaction data', { status: 400 });
    }

    const result = await fraudDetectionEngine.analyzeTransaction(transaction);
    
    return Response.json(result);
  } catch (error) {
    console.error('Fraud analysis API error:', error);
    return Response.json(
      { error: 'Fraud analysis failed' },
      { status: 500 }
    );
  }
}