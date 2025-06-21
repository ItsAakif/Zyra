import { ProductionPaymentProcessor } from '@/lib/production-payment-processor';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');

    if (!from || !to) {
      return new Response('Missing currency parameters', { status: 400 });
    }

    const rate = await ProductionPaymentProcessor.getExchangeRate(from, to);
    
    return Response.json(rate);
  } catch (error) {
    console.error('Exchange rate API error:', error);
    return Response.json(
      { error: 'Failed to get exchange rate' },
      { status: 500 }
    );
  }
}