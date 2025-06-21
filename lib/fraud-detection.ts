export interface FraudDetectionResult {
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  flags: string[];
  recommendation: 'APPROVE' | 'REVIEW' | 'DECLINE';
  confidence: number;
  reasons: string[];
}

export interface TransactionPattern {
  userId: string;
  amount: number;
  currency: string;
  country: string;
  timestamp: Date;
  deviceFingerprint: string;
  ipAddress: string;
  paymentMethod: string;
}

export interface UserBehaviorProfile {
  userId: string;
  averageTransactionAmount: number;
  typicalCountries: string[];
  usualTransactionTimes: number[];
  preferredPaymentMethods: string[];
  velocityPattern: number[];
  riskHistory: number[];
}

export class FraudDetectionEngine {
  private mlModel: MachineLearningModel;
  private ruleEngine: RuleEngine;
  private behaviorAnalyzer: BehaviorAnalyzer;
  private deviceAnalyzer: DeviceAnalyzer;

  constructor() {
    this.mlModel = new MachineLearningModel();
    this.ruleEngine = new RuleEngine();
    this.behaviorAnalyzer = new BehaviorAnalyzer();
    this.deviceAnalyzer = new DeviceAnalyzer();
  }

  async analyzeTransaction(transaction: TransactionPattern): Promise<FraudDetectionResult> {
    try {
      // Run parallel analysis
      const [
        mlScore,
        ruleResults,
        behaviorScore,
        deviceScore,
        velocityScore,
        geolocationScore
      ] = await Promise.all([
        this.mlModel.predictFraudScore(transaction),
        this.ruleEngine.evaluateRules(transaction),
        this.behaviorAnalyzer.analyzeBehavior(transaction),
        this.deviceAnalyzer.analyzeDevice(transaction),
        this.analyzeVelocity(transaction),
        this.analyzeGeolocation(transaction)
      ]);

      // Combine scores with weighted algorithm
      const combinedScore = this.combineScores({
        ml: mlScore,
        rules: ruleResults.score,
        behavior: behaviorScore,
        device: deviceScore,
        velocity: velocityScore,
        geolocation: geolocationScore
      });

      const riskLevel = this.calculateRiskLevel(combinedScore);
      const flags = this.aggregateFlags(ruleResults.flags, behaviorScore, deviceScore);
      const recommendation = this.getRecommendation(combinedScore, riskLevel, flags);

      return {
        riskScore: combinedScore,
        riskLevel,
        flags,
        recommendation,
        confidence: this.calculateConfidence(combinedScore, flags.length),
        reasons: this.generateReasons(flags, combinedScore)
      };
    } catch (error) {
      console.error('Fraud detection error:', error);
      return {
        riskScore: 0.5,
        riskLevel: 'MEDIUM',
        flags: ['ANALYSIS_ERROR'],
        recommendation: 'REVIEW',
        confidence: 0.1,
        reasons: ['Unable to complete fraud analysis']
      };
    }
  }

  private combineScores(scores: {
    ml: number;
    rules: number;
    behavior: number;
    device: number;
    velocity: number;
    geolocation: number;
  }): number {
    const weights = {
      ml: 0.3,
      rules: 0.2,
      behavior: 0.2,
      device: 0.1,
      velocity: 0.1,
      geolocation: 0.1
    };

    return Object.entries(scores).reduce((total, [key, score]) => {
      return total + (score * weights[key as keyof typeof weights]);
    }, 0);
  }

  private calculateRiskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (score >= 0.8) return 'CRITICAL';
    if (score >= 0.6) return 'HIGH';
    if (score >= 0.4) return 'MEDIUM';
    return 'LOW';
  }

  private getRecommendation(score: number, riskLevel: string, flags: string[]): 'APPROVE' | 'REVIEW' | 'DECLINE' {
    if (riskLevel === 'CRITICAL' || flags.includes('SANCTIONS_MATCH')) return 'DECLINE';
    if (riskLevel === 'HIGH' || score > 0.7) return 'REVIEW';
    return 'APPROVE';
  }

  private aggregateFlags(ruleFlags: string[], behaviorScore: number, deviceScore: number): string[] {
    const flags = [...ruleFlags];
    
    if (behaviorScore > 0.7) flags.push('UNUSUAL_BEHAVIOR');
    if (deviceScore > 0.8) flags.push('SUSPICIOUS_DEVICE');
    
    return flags;
  }

  private calculateConfidence(score: number, flagCount: number): number {
    const baseConfidence = 0.8;
    const scoreConfidence = Math.abs(score - 0.5) * 2; // Higher confidence for extreme scores
    const flagPenalty = Math.min(flagCount * 0.1, 0.3);
    
    return Math.max(0.1, Math.min(1.0, baseConfidence + scoreConfidence - flagPenalty));
  }

  private generateReasons(flags: string[], score: number): string[] {
    const reasons: string[] = [];
    
    if (flags.includes('VELOCITY_EXCEEDED')) {
      reasons.push('Transaction frequency exceeds normal patterns');
    }
    if (flags.includes('UNUSUAL_BEHAVIOR')) {
      reasons.push('Transaction differs from user\'s typical behavior');
    }
    if (flags.includes('SUSPICIOUS_DEVICE')) {
      reasons.push('Device characteristics indicate potential risk');
    }
    if (score > 0.7) {
      reasons.push('Machine learning model indicates high fraud probability');
    }
    
    return reasons;
  }

  private async analyzeVelocity(transaction: TransactionPattern): Promise<number> {
    // Analyze transaction velocity patterns
    const recentTransactions = await this.getRecentTransactions(transaction.userId, 24);
    const velocityScore = Math.min(recentTransactions.length / 10, 1.0);
    return velocityScore;
  }

  private async analyzeGeolocation(transaction: TransactionPattern): Promise<number> {
    // Analyze geolocation patterns
    const userProfile = await this.getUserProfile(transaction.userId);
    const isUnusualLocation = !userProfile.typicalCountries.includes(transaction.country);
    return isUnusualLocation ? 0.6 : 0.1;
  }

  private async getRecentTransactions(userId: string, hours: number): Promise<TransactionPattern[]> {
    // Implementation to fetch recent transactions
    return [];
  }

  private async getUserProfile(userId: string): Promise<UserBehaviorProfile> {
    // Implementation to get user behavior profile
    return {
      userId,
      averageTransactionAmount: 100,
      typicalCountries: ['US', 'CA'],
      usualTransactionTimes: [9, 10, 11, 14, 15, 16],
      preferredPaymentMethods: ['UPI', 'CARD'],
      velocityPattern: [1, 2, 1, 0, 1],
      riskHistory: [0.1, 0.2, 0.1, 0.3]
    };
  }
}

class MachineLearningModel {
  async predictFraudScore(transaction: TransactionPattern): Promise<number> {
    // In production, this would use a trained ML model
    // For demo, we'll simulate ML prediction based on transaction features
    
    const features = this.extractFeatures(transaction);
    const score = this.simulateMLPrediction(features);
    
    return Math.max(0, Math.min(1, score));
  }

  private extractFeatures(transaction: TransactionPattern): number[] {
    return [
      transaction.amount / 1000, // Normalized amount
      this.timeOfDayFeature(transaction.timestamp),
      this.dayOfWeekFeature(transaction.timestamp),
      this.countryRiskFeature(transaction.country),
      this.paymentMethodFeature(transaction.paymentMethod)
    ];
  }

  private simulateMLPrediction(features: number[]): number {
    // Simulate ML model prediction
    const weights = [0.3, 0.1, 0.1, 0.4, 0.1];
    return features.reduce((sum, feature, index) => sum + feature * weights[index], 0);
  }

  private timeOfDayFeature(timestamp: Date): number {
    const hour = timestamp.getHours();
    // Higher risk for unusual hours (2-6 AM)
    return (hour >= 2 && hour <= 6) ? 0.8 : 0.2;
  }

  private dayOfWeekFeature(timestamp: Date): number {
    const day = timestamp.getDay();
    // Slightly higher risk on weekends
    return (day === 0 || day === 6) ? 0.3 : 0.1;
  }

  private countryRiskFeature(country: string): number {
    const highRiskCountries = ['AF', 'IR', 'KP', 'SY'];
    const mediumRiskCountries = ['RU', 'CN', 'VE'];
    
    if (highRiskCountries.includes(country)) return 1.0;
    if (mediumRiskCountries.includes(country)) return 0.6;
    return 0.1;
  }

  private paymentMethodFeature(method: string): number {
    const riskScores = {
      'CRYPTO': 0.7,
      'CASH': 0.8,
      'WIRE': 0.4,
      'CARD': 0.2,
      'UPI': 0.1
    };
    
    return riskScores[method as keyof typeof riskScores] || 0.5;
  }
}

class RuleEngine {
  private rules: FraudRule[];

  constructor() {
    this.rules = [
      new VelocityRule(),
      new AmountRule(),
      new GeolocationRule(),
      new TimePatternRule(),
      new DeviceRule()
    ];
  }

  async evaluateRules(transaction: TransactionPattern): Promise<{ score: number; flags: string[] }> {
    const results = await Promise.all(
      this.rules.map(rule => rule.evaluate(transaction))
    );

    const flags = results.flatMap(result => result.flags);
    const score = results.reduce((sum, result) => sum + result.score, 0) / this.rules.length;

    return { score, flags };
  }
}

abstract class FraudRule {
  abstract evaluate(transaction: TransactionPattern): Promise<{ score: number; flags: string[] }>;
}

class VelocityRule extends FraudRule {
  async evaluate(transaction: TransactionPattern): Promise<{ score: number; flags: string[] }> {
    // Check transaction velocity
    const recentCount = await this.getRecentTransactionCount(transaction.userId, 1);
    const flags: string[] = [];
    let score = 0;

    if (recentCount > 10) {
      flags.push('VELOCITY_EXCEEDED');
      score = 0.8;
    } else if (recentCount > 5) {
      flags.push('HIGH_VELOCITY');
      score = 0.5;
    }

    return { score, flags };
  }

  private async getRecentTransactionCount(userId: string, hours: number): Promise<number> {
    // Implementation to count recent transactions
    return Math.floor(Math.random() * 15); // Mock data
  }
}

class AmountRule extends FraudRule {
  async evaluate(transaction: TransactionPattern): Promise<{ score: number; flags: string[] }> {
    const flags: string[] = [];
    let score = 0;

    // Check for round numbers (potential structuring)
    if (transaction.amount % 1000 === 0 || transaction.amount % 500 === 0) {
      flags.push('ROUND_AMOUNT');
      score += 0.3;
    }

    // Check for unusually large amounts
    if (transaction.amount > 10000) {
      flags.push('LARGE_AMOUNT');
      score += 0.4;
    }

    return { score, flags };
  }
}

class GeolocationRule extends FraudRule {
  async evaluate(transaction: TransactionPattern): Promise<{ score: number; flags: string[] }> {
    const flags: string[] = [];
    let score = 0;

    const userProfile = await this.getUserProfile(transaction.userId);
    
    if (!userProfile.typicalCountries.includes(transaction.country)) {
      flags.push('UNUSUAL_LOCATION');
      score = 0.6;
    }

    return { score, flags };
  }

  private async getUserProfile(userId: string): Promise<{ typicalCountries: string[] }> {
    return { typicalCountries: ['US', 'CA', 'GB'] };
  }
}

class TimePatternRule extends FraudRule {
  async evaluate(transaction: TransactionPattern): Promise<{ score: number; flags: string[] }> {
    const flags: string[] = [];
    let score = 0;

    const hour = transaction.timestamp.getHours();
    
    // Unusual hours (2-6 AM)
    if (hour >= 2 && hour <= 6) {
      flags.push('UNUSUAL_TIME');
      score = 0.4;
    }

    return { score, flags };
  }
}

class DeviceRule extends FraudRule {
  async evaluate(transaction: TransactionPattern): Promise<{ score: number; flags: string[] }> {
    const flags: string[] = [];
    let score = 0;

    // Check if device is known
    const isKnownDevice = await this.isKnownDevice(transaction.userId, transaction.deviceFingerprint);
    
    if (!isKnownDevice) {
      flags.push('NEW_DEVICE');
      score = 0.3;
    }

    return { score, flags };
  }

  private async isKnownDevice(userId: string, deviceFingerprint: string): Promise<boolean> {
    // Implementation to check if device is known
    return Math.random() > 0.3; // Mock: 70% chance device is known
  }
}

class BehaviorAnalyzer {
  async analyzeBehavior(transaction: TransactionPattern): Promise<number> {
    const userProfile = await this.getUserBehaviorProfile(transaction.userId);
    
    let behaviorScore = 0;
    
    // Analyze amount deviation
    const amountDeviation = Math.abs(transaction.amount - userProfile.averageTransactionAmount) / userProfile.averageTransactionAmount;
    if (amountDeviation > 2) behaviorScore += 0.3;
    
    // Analyze time pattern
    const hour = transaction.timestamp.getHours();
    if (!userProfile.usualTransactionTimes.includes(hour)) {
      behaviorScore += 0.2;
    }
    
    // Analyze payment method
    if (!userProfile.preferredPaymentMethods.includes(transaction.paymentMethod)) {
      behaviorScore += 0.2;
    }
    
    return Math.min(behaviorScore, 1.0);
  }

  private async getUserBehaviorProfile(userId: string): Promise<UserBehaviorProfile> {
    // Implementation to get user behavior profile
    return {
      userId,
      averageTransactionAmount: 150,
      typicalCountries: ['US', 'CA'],
      usualTransactionTimes: [9, 10, 11, 14, 15, 16, 17],
      preferredPaymentMethods: ['UPI', 'CARD'],
      velocityPattern: [1, 2, 1, 0, 1],
      riskHistory: [0.1, 0.2, 0.1, 0.3]
    };
  }
}

class DeviceAnalyzer {
  async analyzeDevice(transaction: TransactionPattern): Promise<number> {
    let deviceScore = 0;
    
    // Check device reputation
    const deviceReputation = await this.getDeviceReputation(transaction.deviceFingerprint);
    deviceScore += deviceReputation;
    
    // Check IP reputation
    const ipReputation = await this.getIPReputation(transaction.ipAddress);
    deviceScore += ipReputation;
    
    return Math.min(deviceScore, 1.0);
  }

  private async getDeviceReputation(deviceFingerprint: string): Promise<number> {
    // Implementation to check device reputation
    return Math.random() * 0.3; // Mock: low device risk
  }

  private async getIPReputation(ipAddress: string): Promise<number> {
    // Implementation to check IP reputation
    return Math.random() * 0.2; // Mock: low IP risk
  }
}

export const fraudDetectionEngine = new FraudDetectionEngine();