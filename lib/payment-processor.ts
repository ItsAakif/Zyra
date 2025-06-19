import { algorandService } from './algorand';
import { authService } from './auth';
import { QRPaymentData } from './qr-parser';
import { supabase } from './supabase';

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  algorandTxId?: string;
  error?: string;
  zyroReward?: number;
  fiatAmount?: number;
  algoAmount?: number;
}

export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  timestamp: number;
}

export class PaymentProcessor {
  private static exchangeRates: Map<string, ExchangeRate> = new Map();
  private static lastRateUpdate = 0;
  private static readonly RATE_CACHE_DURATION = 60000; // 1 minute

  static async processPayment(
    qrData: QRPaymentData,
    fiatAmount: number,
    paymentNote?: string
  ): Promise<PaymentResult> {
    try {
      const authState = authService.getAuthState();
      
      if (!authState.isAuthenticated || !authState.algorandAccount) {
        return {
          success: false,
          error: 'User not authenticated or Algorand account not found',
        };
      }

      // Get current ALGO price
      const algoPrice = await algorandService.getAlgoUSDPrice();
      if (algoPrice === 0) {
        return {
          success: false,
          error: 'Unable to get current ALGO price',
        };
      }

      // Convert fiat to ALGO
      const exchangeRate = await this.getExchangeRate(qrData.currency, 'USD');
      const usdAmount = fiatAmount * exchangeRate.rate;
      const algoAmount = usdAmount / algoPrice;

      // Validate sufficient balance
      const currentBalance = await algorandService.getAccountBalance(authState.algorandAccount.address);
      if (currentBalance < algoAmount + 0.001) { // Include transaction fee
        return {
          success: false,
          error: 'Insufficient ALGO balance',
        };
      }

      // Create payment note with metadata
      const paymentMetadata = {
        originalAmount: fiatAmount,
        originalCurrency: qrData.currency,
        usdAmount,
        algoAmount,
        paymentMethod: qrData.type,
        country: qrData.country,
        recipient: qrData.recipient,
        timestamp: Date.now(),
        note: paymentNote,
      };

      // Process the Algorand transaction
      const algorandTxId = await this.processAlgorandPayment(
        authState.algorandAccount,
        qrData,
        algoAmount,
        JSON.stringify(paymentMetadata)
      );

      // Calculate and send Zyro rewards
      const zyroReward = await this.calculateZyroReward(fiatAmount, qrData.country);
      if (zyroReward > 0) {
        try {
          await algorandService.sendZyroReward(
            authState.algorandAccount,
            authState.algorandAccount.address,
            zyroReward,
            `Reward for payment ${algorandTxId}`
          );
        } catch (rewardError) {
          console.error('Error sending Zyro reward:', rewardError);
        }
      }

      // Record transaction in database
      await this.recordTransaction({
        userId: authState.user!.id,
        type: 'payment',
        fiatAmount,
        currency: qrData.currency,
        algoAmount,
        zyroEarned: zyroReward,
        country: qrData.country,
        paymentMethod: qrData.type,
        algorandTxId,
        metadata: paymentMetadata,
      });

      // Check for achievements and NFT rewards
      await this.processRewards(authState.user!.id, fiatAmount, qrData.country);

      return {
        success: true,
        transactionId: algorandTxId,
        algorandTxId,
        zyroReward,
        fiatAmount,
        algoAmount,
      };
    } catch (error) {
      console.error('Payment processing error:', error);
      return {
        success: false,
        error: 'Payment processing failed',
      };
    }
  }

  private static async processAlgorandPayment(
    fromAccount: any,
    qrData: QRPaymentData,
    algoAmount: number,
    note: string
  ): Promise<string> {
    // For demo purposes, we'll send to a treasury address
    // In production, this would integrate with actual payment rails
    const treasuryAddress = process.env.EXPO_PUBLIC_TREASURY_ADDRESS || fromAccount.address;
    
    return await algorandService.sendAlgos(
      fromAccount,
      treasuryAddress,
      algoAmount,
      note
    );
  }

  private static async calculateZyroReward(fiatAmount: number, country: string): Promise<number> {
    // Base reward: 10% of transaction amount
    let rewardRate = 0.10;

    // Country-specific bonuses
    const countryBonuses: { [key: string]: number } = {
      'India': 0.02,
      'Brazil': 0.02,
      'Nigeria': 0.03,
      'Philippines': 0.02,
      'Kenya': 0.03,
    };

    if (countryBonuses[country]) {
      rewardRate += countryBonuses[country];
    }

    // Volume bonuses
    if (fiatAmount >= 1000) {
      rewardRate += 0.05; // 5% bonus for large transactions
    }

    return fiatAmount * rewardRate;
  }

  private static async recordTransaction(data: {
    userId: string;
    type: string;
    fiatAmount: number;
    currency: string;
    algoAmount: number;
    zyroEarned: number;
    country: string;
    paymentMethod: string;
    algorandTxId: string;
    metadata: any;
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: data.userId,
          type: data.type,
          amount: data.fiatAmount,
          currency: data.currency,
          algo_amount: data.algoAmount,
          zyro_earned: data.zyroEarned,
          country: data.country,
          payment_method: data.paymentMethod,
          status: 'completed',
          algorand_tx_id: data.algorandTxId,
          metadata: data.metadata,
        });

      if (error) {
        console.error('Database error:', error);
      }
    } catch (error) {
      console.error('Error recording transaction:', error);
    }
  }

  private static async processRewards(userId: string, amount: number, country: string): Promise<void> {
    try {
      // Check for first payment achievement
      const { data: existingTransactions } = await supabase
        .from('transactions')
        .select('id')
        .eq('user_id', userId)
        .eq('type', 'payment');

      if (existingTransactions && existingTransactions.length === 1) {
        // This is the first payment - award NFT
        await this.awardNFT(userId, 'first_payment');
      }

      // Check for volume milestones
      const { data: totalVolume } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', userId)
        .eq('type', 'payment');

      if (totalVolume) {
        const total = totalVolume.reduce((sum, tx) => sum + tx.amount, 0);
        
        if (total >= 1000 && total - amount < 1000) {
          await this.awardNFT(userId, 'volume_1k');
        } else if (total >= 10000 && total - amount < 10000) {
          await this.awardNFT(userId, 'volume_10k');
        }
      }

      // Update achievements
      await this.updateAchievements(userId, amount, country);
    } catch (error) {
      console.error('Error processing rewards:', error);
    }
  }

  private static async awardNFT(userId: string, achievementType: string): Promise<void> {
    const nftRewards: { [key: string]: any } = {
      first_payment: {
        name: 'First Payment Pioneer',
        description: 'Completed your first QR payment',
        image_url: 'https://images.pexels.com/photos/844124/pexels-photo-844124.jpeg?auto=compress&cs=tinysrgb&w=400',
        rarity: 'common',
        zyro_value: 10,
      },
      volume_1k: {
        name: 'Rising Trader',
        description: 'Completed $1,000 in total transactions',
        image_url: 'https://images.pexels.com/photos/730547/pexels-photo-730547.jpeg?auto=compress&cs=tinysrgb&w=400',
        rarity: 'rare',
        zyro_value: 50,
      },
      volume_10k: {
        name: 'Crypto Whale',
        description: 'Completed $10,000 in total transactions',
        image_url: 'https://images.pexels.com/photos/1166209/pexels-photo-1166209.jpeg?auto=compress&cs=tinysrgb&w=400',
        rarity: 'epic',
        zyro_value: 200,
      },
    };

    const nftData = nftRewards[achievementType];
    if (!nftData) return;

    try {
      const { error } = await supabase
        .from('nft_rewards')
        .insert({
          user_id: userId,
          ...nftData,
          earned_date: new Date().toISOString(),
        });

      if (error) {
        console.error('Error awarding NFT:', error);
      }
    } catch (error) {
      console.error('Error awarding NFT:', error);
    }
  }

  private static async updateAchievements(userId: string, amount: number, country: string): Promise<void> {
    try {
      const achievements = [
        {
          title: 'Payment Streak',
          description: 'Make payments for 7 consecutive days',
          max_progress: 7,
          reward_amount: 25,
          progress_increment: 1,
        },
        {
          title: 'Volume Master',
          description: 'Complete $5000 in total transactions',
          max_progress: 5000,
          reward_amount: 200,
          progress_increment: amount,
        },
        {
          title: 'Global Explorer',
          description: 'Make payments in 10 different countries',
          max_progress: 10,
          reward_amount: 100,
          progress_increment: 1,
        },
      ];

      for (const achievement of achievements) {
        const { data: existing } = await supabase
          .from('achievements')
          .select('*')
          .eq('user_id', userId)
          .eq('title', achievement.title)
          .single();

        if (existing) {
          const newProgress = Math.min(
            existing.progress + achievement.progress_increment,
            achievement.max_progress
          );
          const completed = newProgress >= achievement.max_progress;

          await supabase
            .from('achievements')
            .update({
              progress: newProgress,
              completed,
              completed_date: completed ? new Date().toISOString() : null,
            })
            .eq('id', existing.id);
        } else {
          const completed = achievement.progress_increment >= achievement.max_progress;
          
          await supabase
            .from('achievements')
            .insert({
              user_id: userId,
              title: achievement.title,
              description: achievement.description,
              progress: achievement.progress_increment,
              max_progress: achievement.max_progress,
              reward_amount: achievement.reward_amount,
              completed,
              completed_date: completed ? new Date().toISOString() : null,
            });
        }
      }
    } catch (error) {
      console.error('Error updating achievements:', error);
    }
  }

  static async getExchangeRate(from: string, to: string): Promise<ExchangeRate> {
    const key = `${from}_${to}`;
    const now = Date.now();

    // Check cache
    if (
      this.exchangeRates.has(key) &&
      now - this.lastRateUpdate < this.RATE_CACHE_DURATION
    ) {
      return this.exchangeRates.get(key)!;
    }

    try {
      // Fetch from exchange rate API
      const response = await fetch(
        `https://api.exchangerate-api.com/v4/latest/${from}`
      );
      const data = await response.json();

      const rate: ExchangeRate = {
        from,
        to,
        rate: data.rates[to] || 1,
        timestamp: now,
      };

      this.exchangeRates.set(key, rate);
      this.lastRateUpdate = now;

      return rate;
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      
      // Return cached rate or default
      return this.exchangeRates.get(key) || {
        from,
        to,
        rate: 1,
        timestamp: now,
      };
    }
  }

  static async getTransactionHistory(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching transaction history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      return [];
    }
  }
}