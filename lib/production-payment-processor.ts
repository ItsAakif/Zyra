import { productionAlgorandService } from './production-blockchain';
import { productionAuthService } from './production-auth';
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
  complianceFlags?: string[];
  riskScore?: number;
}

export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  timestamp: number;
  provider: string;
  spread?: number;
}

export interface ComplianceCheck {
  passed: boolean;
  flags: string[];
  riskScore: number;
  requiresManualReview: boolean;
}

export class ProductionPaymentProcessor {
  private static exchangeRates: Map<string, ExchangeRate> = new Map();
  private static lastRateUpdate = 0;
  private static readonly RATE_CACHE_DURATION = 60000; // 1 minute

  static async processPayment(
    qrData: QRPaymentData,
    fiatAmount: number,
    paymentNote?: string
  ): Promise<PaymentResult> {
    try {
      const authState = productionAuthService.getAuthState();
      
      if (!authState.isAuthenticated || !authState.user) {
        return {
          success: false,
          error: 'User not authenticated',
        };
      }

      // Get user's Algorand account
      const algorandAccount = await productionAlgorandService.getStoredAccount();
      if (!algorandAccount) {
        return {
          success: false,
          error: 'Algorand account not found',
        };
      }

      // Perform compliance checks
      const complianceResult = await this.performComplianceChecks({
        userId: authState.user.id,
        amount: fiatAmount,
        currency: qrData.currency,
        country: qrData.country,
        recipient: qrData.recipient,
        paymentMethod: qrData.type,
      });

      if (!complianceResult.passed) {
        return {
          success: false,
          error: 'Transaction failed compliance checks',
          complianceFlags: complianceResult.flags,
          riskScore: complianceResult.riskScore,
        };
      }

      // Get current exchange rates
      const exchangeRate = await this.getExchangeRate(qrData.currency, 'USD');
      const usdAmount = fiatAmount * exchangeRate.rate;

      // Get ALGO price and calculate amount
      const algoPrice = await this.getAlgoPrice();
      if (algoPrice === 0) {
        return {
          success: false,
          error: 'Unable to get current ALGO price',
        };
      }

      const algoAmount = usdAmount / algoPrice;

      // Validate sufficient balance
      const currentBalance = await productionAlgorandService.getAccountBalance(algorandAccount.address);
      if (currentBalance < algoAmount + 0.001) { // Include transaction fee
        return {
          success: false,
          error: 'Insufficient ALGO balance',
        };
      }

      // Create payment metadata
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
        complianceScore: complianceResult.riskScore,
      };

      // Process the blockchain transaction
      const blockchainResult = await this.processBlockchainTransaction(
        algorandAccount,
        qrData,
        algoAmount,
        JSON.stringify(paymentMetadata)
      );

      if (!blockchainResult.success) {
        return blockchainResult;
      }

      // Calculate and process Zyro rewards
      const zyroReward = await this.calculateZyroReward(
        fiatAmount, 
        qrData.country, 
        authState.user.subscriptionTier
      );

      if (zyroReward > 0) {
        try {
          await productionAlgorandService.sendZyroReward(
            algorandAccount,
            algorandAccount.address,
            zyroReward,
            `Reward for payment ${blockchainResult.algorandTxId}`
          );
        } catch (rewardError) {
          console.error('Error sending Zyro reward:', rewardError);
        }
      }

      // Record transaction in database
      await this.recordTransaction({
        userId: authState.user.id,
        type: 'payment',
        fiatAmount,
        currency: qrData.currency,
        algoAmount,
        zyroEarned: zyroReward,
        country: qrData.country,
        paymentMethod: qrData.type,
        algorandTxId: blockchainResult.algorandTxId!,
        metadata: paymentMetadata,
        complianceFlags: complianceResult.flags,
        riskScore: complianceResult.riskScore,
      });

      // Process achievements and rewards
      await this.processAchievements(authState.user.id, fiatAmount, qrData.country);

      return {
        success: true,
        transactionId: blockchainResult.algorandTxId,
        algorandTxId: blockchainResult.algorandTxId,
        zyroReward,
        fiatAmount,
        algoAmount,
        complianceFlags: complianceResult.flags,
        riskScore: complianceResult.riskScore,
      };
    } catch (error) {
      console.error('Payment processing error:', error);
      return {
        success: false,
        error: 'Payment processing failed',
      };
    }
  }

  private static async performComplianceChecks(transaction: any): Promise<ComplianceCheck> {
    try {
      // AML screening
      const amlFlags = await this.performAMLScreening(transaction);
      
      // Sanctions checking
      const sanctionsFlags = await this.performSanctionsCheck(transaction);
      
      // Transaction limits check
      const limitsFlags = await this.checkTransactionLimits(transaction);
      
      // Risk assessment
      const riskScore = await this.calculateRiskScore(transaction);

      const allFlags = [...amlFlags, ...sanctionsFlags, ...limitsFlags];
      const passed = allFlags.length === 0 && riskScore < 0.7;

      return {
        passed,
        flags: allFlags,
        riskScore,
        requiresManualReview: riskScore > 0.5 || allFlags.length > 0,
      };
    } catch (error) {
      console.error('Compliance check error:', error);
      return {
        passed: false,
        flags: ['COMPLIANCE_CHECK_FAILED'],
        riskScore: 1.0,
        requiresManualReview: true,
      };
    }
  }

  private static async performAMLScreening(transaction: any): Promise<string[]> {
    const flags: string[] = [];

    // Check for round numbers (potential structuring)
    if (transaction.amount % 1000 === 0 || transaction.amount % 500 === 0) {
      flags.push('ROUND_NUMBER');
    }

    // Check for rapid succession of transactions
    try {
      const recentTransactions = await this.getRecentTransactions(transaction.userId, 24);
      if (recentTransactions.length > 10) {
        flags.push('RAPID_SUCCESSION');
      }

      // Check for structuring (multiple transactions under reporting threshold)
      const totalAmount = recentTransactions.reduce((sum, tx) => sum + tx.amount, 0) + transaction.amount;
      if (totalAmount > 10000 && recentTransactions.every(tx => tx.amount < 10000) && transaction.amount < 10000) {
        flags.push('POTENTIAL_STRUCTURING');
      }
    } catch (error) {
      console.error('Error in AML screening:', error);
    }

    return flags;
  }

  private static async performSanctionsCheck(transaction: any): Promise<string[]> {
    const flags: string[] = [];

    try {
      // Check against OFAC sanctions list
      const ofacResult = await this.checkOFACSanctions(transaction.recipient);
      if (ofacResult.isMatch) {
        flags.push('OFAC_SANCTIONS_MATCH');
      }

      // Check against UN sanctions list
      const unResult = await this.checkUNSanctions(transaction.recipient);
      if (unResult.isMatch) {
        flags.push('UN_SANCTIONS_MATCH');
      }

      // Check country sanctions
      if (this.isSanctionedCountry(transaction.country)) {
        flags.push('SANCTIONED_COUNTRY');
      }
    } catch (error) {
      console.error('Error in sanctions check:', error);
    }

    return flags;
  }

  private static async checkTransactionLimits(transaction: any): Promise<string[]> {
    const flags: string[] = [];

    try {
      // Get user limits based on KYC status and subscription tier
      const userLimits = await this.getUserLimits(transaction.userId);
      
      // Check daily limit
      const dailyVolume = await this.getDailyVolume(transaction.userId);
      if (dailyVolume + transaction.amount > userLimits.dailyLimit) {
        flags.push('DAILY_LIMIT_EXCEEDED');
      }

      // Check monthly limit
      const monthlyVolume = await this.getMonthlyVolume(transaction.userId);
      if (monthlyVolume + transaction.amount > userLimits.monthlyLimit) {
        flags.push('MONTHLY_LIMIT_EXCEEDED');
      }

      // Check single transaction limit
      if (transaction.amount > userLimits.singleTransactionLimit) {
        flags.push('SINGLE_TRANSACTION_LIMIT_EXCEEDED');
      }
    } catch (error) {
      console.error('Error checking transaction limits:', error);
    }

    return flags;
  }

  private static async calculateRiskScore(transaction: any): Promise<number> {
    let riskScore = 0;

    // Base risk factors
    const factors = {
      amount: Math.min(transaction.amount / 10000, 1) * 0.3, // Higher amounts = higher risk
      country: this.getCountryRisk(transaction.country) * 0.2,
      paymentMethod: this.getPaymentMethodRisk(transaction.paymentMethod) * 0.2,
      velocity: await this.getVelocityRisk(transaction.userId) * 0.3,
    };

    riskScore = Object.values(factors).reduce((sum, factor) => sum + factor, 0);

    return Math.min(riskScore, 1.0);
  }

  private static async processBlockchainTransaction(
    fromAccount: any,
    qrData: QRPaymentData,
    algoAmount: number,
    note: string
  ): Promise<PaymentResult> {
    try {
      // For demo purposes, we'll send to treasury address
      // In production, this would integrate with actual payment rails
      const treasuryAddress = process.env.EXPO_PUBLIC_TREASURY_ADDRESS || fromAccount.address;
      
      const result = await productionAlgorandService.processRealPayment(
        fromAccount,
        treasuryAddress,
        algoAmount,
        note
      );

      if (result.success) {
        return {
          success: true,
          algorandTxId: result.txId,
        };
      } else {
        return {
          success: false,
          error: result.error,
        };
      }
    } catch (error) {
      console.error('Blockchain transaction error:', error);
      return {
        success: false,
        error: 'Blockchain transaction failed',
      };
    }
  }

  private static async calculateZyroReward(
    fiatAmount: number, 
    country: string, 
    subscriptionTier: string
  ): Promise<number> {
    // Base reward: 10% of transaction amount
    let rewardRate = 0.10;

    // Subscription tier bonuses
    const tierBonuses = {
      'free': 0,
      'plus': 0.02,
      'pro': 0.05,
    };

    rewardRate += tierBonuses[subscriptionTier as keyof typeof tierBonuses] || 0;

    // Country-specific bonuses for emerging markets
    const countryBonuses: { [key: string]: number } = {
      'India': 0.02,
      'Brazil': 0.02,
      'Nigeria': 0.03,
      'Philippines': 0.02,
      'Kenya': 0.03,
      'Mexico': 0.02,
      'Indonesia': 0.02,
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

  private static async recordTransaction(data: any): Promise<void> {
    try {
      if (!supabase) {
        console.log('Supabase not available, skipping transaction recording');
        return;
      }

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
          metadata: {
            ...data.metadata,
            complianceFlags: data.complianceFlags,
            riskScore: data.riskScore,
          },
        });

      if (error) {
        console.error('Database error:', error);
      }
    } catch (error) {
      console.error('Error recording transaction:', error);
    }
  }

  private static async processAchievements(userId: string, amount: number, country: string): Promise<void> {
    try {
      // Implementation for processing achievements and NFT rewards
      // This would check for milestones and award appropriate rewards
      console.log('Processing achievements for user:', userId);
    } catch (error) {
      console.error('Error processing achievements:', error);
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
        provider: 'ExchangeRate-API',
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
        provider: 'Fallback',
      };
    }
  }

  private static async getAlgoPrice(): Promise<number> {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=algorand&vs_currencies=usd');
      const data = await response.json();
      return data.algorand?.usd || 0;
    } catch (error) {
      console.error('Error getting ALGO price:', error);
      return 0;
    }
  }

  // Helper methods for compliance checks
  private static async getRecentTransactions(userId: string, hours: number): Promise<any[]> {
    // Implementation to fetch recent transactions
    return [];
  }

  private static async checkOFACSanctions(recipient: string): Promise<{ isMatch: boolean }> {
    // Implementation for OFAC sanctions checking
    return { isMatch: false };
  }

  private static async checkUNSanctions(recipient: string): Promise<{ isMatch: boolean }> {
    // Implementation for UN sanctions checking
    return { isMatch: false };
  }

  private static isSanctionedCountry(country: string): boolean {
    const sanctionedCountries = ['Iran', 'North Korea', 'Syria', 'Cuba'];
    return sanctionedCountries.includes(country);
  }

  private static async getUserLimits(userId: string): Promise<any> {
    // Implementation to get user-specific limits
    return {
      dailyLimit: 10000,
      monthlyLimit: 50000,
      singleTransactionLimit: 5000,
    };
  }

  private static async getDailyVolume(userId: string): Promise<number> {
    // Implementation to calculate daily transaction volume
    return 0;
  }

  private static async getMonthlyVolume(userId: string): Promise<number> {
    // Implementation to calculate monthly transaction volume
    return 0;
  }

  private static getCountryRisk(country: string): number {
    const highRiskCountries = ['Afghanistan', 'Iran', 'North Korea', 'Syria'];
    const mediumRiskCountries = ['Russia', 'China', 'Venezuela'];
    
    if (highRiskCountries.includes(country)) return 1.0;
    if (mediumRiskCountries.includes(country)) return 0.6;
    return 0.2;
  }

  private static getPaymentMethodRisk(method: string): number {
    const riskScores = {
      'UPI': 0.2,
      'PIX': 0.2,
      'SEPA': 0.1,
      'SWIFT': 0.3,
      'CRYPTO': 0.8,
    };
    
    return riskScores[method as keyof typeof riskScores] || 0.5;
  }

  private static async getVelocityRisk(userId: string): Promise<number> {
    // Implementation to calculate velocity risk based on transaction patterns
    return 0.1;
  }
}

export { ProductionPaymentProcessor };