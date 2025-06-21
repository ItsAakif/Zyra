import { ProductionPaymentProcessor } from '@/lib/production-payment-processor';
import { QRParser } from '@/lib/qr-parser';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { qrData, amount, note } = body;

    if (!qrData || !amount) {
      return new Response('Missing required fields', { status: 400 });
    }

    // Parse QR code data
    const parsedQRData = QRParser.parseQRCode(qrData);

    // Process payment
    const result = await ProductionPaymentProcessor.processPayment(
      parsedQRData,
      amount,
      note
    );

    return Response.json(result);
  } catch (error) {
    console.error('Payment processing API error:', error);
    return Response.json(
      { success: false, error: 'Payment processing failed' },
      { status: 500 }
    );
  }
}