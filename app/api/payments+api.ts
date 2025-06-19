import { supabase } from '@/lib/supabase';
import { PaymentProcessor } from '@/lib/payment-processor';
import { QRParser } from '@/lib/qr-parser';
import { web3Service } from '@/lib/web3';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { qrData, amount, cryptoAmount, cryptoCurrency, userWalletAddress } = body;

    // Parse QR code data
    const parsedQRData = QRParser.parseQRCode(qrData);

    // Process payment
    const paymentResult = await PaymentProcessor.processPayment(
      parsedQRData,
      amount,
      cryptoAmount,
      cryptoCurrency,
      userWalletAddress
    );

    if (paymentResult.success) {
      // Mint Zyro rewards
      if (paymentResult.zyroReward) {
        try {
          await web3Service.mintZyroReward(userWalletAddress, paymentResult.zyroReward);
        } catch (error) {
          console.error('Error minting Zyro reward:', error);
        }
      }

      // Store transaction in database
      try {
        const { error } = await supabase
          .from('transactions')
          .insert({
            user_id: userWalletAddress, // Using wallet address as user ID for now
            type: 'payment',
            amount,
            currency: parsedQRData.currency,
            zyro_earned: paymentResult.zyroReward || 0,
            country: parsedQRData.country,
            payment_method: parsedQRData.type,
            status: 'completed',
            transaction_hash: paymentResult.transactionId,
          });

        if (error) {
          console.error('Database error:', error);
        }
      } catch (error) {
        console.error('Database operation error:', error);
      }
    }

    return Response.json(paymentResult);
  } catch (error) {
    console.error('Payment API error:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userWalletAddress = url.searchParams.get('wallet');

    if (!userWalletAddress) {
      return Response.json(
        { error: 'Wallet address required' },
        { status: 400 }
      );
    }

    // Get user's transaction history
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userWalletAddress)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Database query error:', error);
      return Response.json(
        { error: 'Failed to fetch transactions' },
        { status: 500 }
      );
    }

    return Response.json({ transactions });
  } catch (error) {
    console.error('Get transactions error:', error);
    return Response.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}