import { advancedPaymentRailsService } from '@/lib/advanced-payment-rails';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'find_routes':
        const routes = await advancedPaymentRailsService.findOptimalRoute(
          data.fromCountry,
          data.toCountry,
          data.currency,
          data.amount,
          data.priority
        );
        return Response.json({ routes });

      case 'process_payment':
        const result = await advancedPaymentRailsService.processPayment(
          data.route,
          data.paymentData
        );
        return Response.json(result);

      default:
        return new Response('Invalid action', { status: 400 });
    }
  } catch (error) {
    console.error('Payment rails API error:', error);
    return Response.json(
      { error: 'Payment processing failed' },
      { status: 500 }
    );
  }
}