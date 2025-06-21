import { WebSocket } from 'ws';

export class ProductionExchangeRateService {
  private providers: ExchangeRateProvider[];
  private cache: Map<string, CachedRate> = new Map();
  private websockets: Map<string, WebSocket> = new Map();
  private subscribers: Map<string, Set<RateSubscriber>> = new Map();

  constructor() {
    this.providers = [
      new BloombergProvider(),
      new ReutersProvider(),
      new XEProvider(),
      new CentralBankProvider(),
    ];
    
    this.setupRealTimeConnections();
  }

  async getRealTimeRate(from: string, to: string): Promise<ExchangeRate> {
    const pair = `${from}_${to}`;
    
    // Check cache first
    const cached = this.cache.get(pair);
    if (cached && !this.isStale(cached)) {
      return cached.rate;
    }

    try {
      // Fetch from multiple providers
      const ratePromises = this.providers.map(provider => 
        provider.getRate(from, to).catch(error => {
          console.warn(`Provider ${provider.name} failed:`, error);
          return null;
        })
      );

      const rates = (await Promise.all(ratePromises)).filter(Boolean) as ExchangeRate[];
      
      if (rates.length === 0) {
        throw new Error('No exchange rate providers available');
      }

      // Calculate weighted average
      const aggregatedRate = this.calculateWeightedAverage(rates);
      
      // Validate rate against historical data
      await this.validateRate(aggregatedRate);

      // Cache result
      this.cache.set(pair, {
        rate: aggregatedRate,
        timestamp: Date.now(),
        ttl: 60000, // 1 minute
      });

      // Notify subscribers
      this.notifySubscribers(pair, aggregatedRate);

      return aggregatedRate;
    } catch (error) {
      console.error('Failed to get exchange rate:', error);
      
      // Return stale cache if available
      if (cached) {
        console.warn('Returning stale exchange rate');
        return cached.rate;
      }
      
      throw error;
    }
  }

  async getHistoricalRates(
    from: string, 
    to: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<HistoricalRate[]> {
    const provider = this.providers.find(p => p.supportsHistorical);
    if (!provider) {
      throw new Error('No provider supports historical rates');
    }

    return await provider.getHistoricalRates(from, to, startDate, endDate);
  }

  subscribeToRates(pairs: string[], callback: RateSubscriber): () => void {
    pairs.forEach(pair => {
      if (!this.subscribers.has(pair)) {
        this.subscribers.set(pair, new Set());
      }
      this.subscribers.get(pair)!.add(callback);
    });

    // Return unsubscribe function
    return () => {
      pairs.forEach(pair => {
        this.subscribers.get(pair)?.delete(callback);
      });
    };
  }

  private setupRealTimeConnections(): void {
    this.providers.forEach(provider => {
      if (provider.supportsRealTime) {
        const ws = provider.createWebSocketConnection();
        
        ws.on('message', (data) => {
          try {
            const update = JSON.parse(data.toString()) as RateUpdate;
            this.handleRateUpdate(update);
          } catch (error) {
            console.error('Failed to parse rate update:', error);
          }
        });

        ws.on('error', (error) => {
          console.error(`WebSocket error for ${provider.name}:`, error);
          this.reconnectProvider(provider);
        });

        this.websockets.set(provider.name, ws);
      }
    });
  }

  private handleRateUpdate(update: RateUpdate): void {
    const pair = `${update.from}_${update.to}`;
    
    // Validate update
    if (!this.isValidRateUpdate(update)) {
      console.warn('Invalid rate update received:', update);
      return;
    }

    // Update cache
    this.cache.set(pair, {
      rate: {
        from: update.from,
        to: update.to,
        rate: update.rate,
        timestamp: update.timestamp,
        provider: update.provider,
        spread: update.spread,
      },
      timestamp: Date.now(),
      ttl: 300000, // 5 minutes for real-time updates
    });

    // Notify subscribers
    this.notifySubscribers(pair, this.cache.get(pair)!.rate);
  }

  private calculateWeightedAverage(rates: ExchangeRate[]): ExchangeRate {
    const weights = {
      'Bloomberg': 0.4,
      'Reuters': 0.3,
      'XE': 0.2,
      'CentralBank': 0.1,
    };

    let totalWeight = 0;
    let weightedSum = 0;

    rates.forEach(rate => {
      const weight = weights[rate.provider as keyof typeof weights] || 0.1;
      weightedSum += rate.rate * weight;
      totalWeight += weight;
    });

    const averageRate = weightedSum / totalWeight;
    const averageSpread = rates.reduce((sum, rate) => sum + (rate.spread || 0), 0) / rates.length;

    return {
      from: rates[0].from,
      to: rates[0].to,
      rate: averageRate,
      timestamp: Date.now(),
      provider: 'Aggregated',
      spread: averageSpread,
      confidence: this.calculateConfidence(rates),
    };
  }

  private calculateConfidence(rates: ExchangeRate[]): number {
    if (rates.length < 2) return 0.5;

    const rateValues = rates.map(r => r.rate);
    const mean = rateValues.reduce((sum, rate) => sum + rate, 0) / rateValues.length;
    const variance = rateValues.reduce((sum, rate) => sum + Math.pow(rate - mean, 2), 0) / rateValues.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Higher confidence for lower standard deviation
    const coefficientOfVariation = standardDeviation / mean;
    return Math.max(0, 1 - coefficientOfVariation * 10);
  }

  private async validateRate(rate: ExchangeRate): Promise<void> {
    // Check against historical volatility
    const historicalRates = await this.getRecentHistoricalRates(rate.from, rate.to, 7);
    if (historicalRates.length === 0) return;

    const recentAverage = historicalRates.reduce((sum, hr) => sum + hr.rate, 0) / historicalRates.length;
    const deviation = Math.abs(rate.rate - recentAverage) / recentAverage;

    // Flag if deviation is more than 5%
    if (deviation > 0.05) {
      console.warn(`Unusual rate detected: ${rate.from}/${rate.to} = ${rate.rate}, recent average = ${recentAverage}`);
      
      // Could trigger additional validation or manual review
      await this.flagUnusualRate(rate, deviation);
    }
  }

  private async getRecentHistoricalRates(from: string, to: string, days: number): Promise<HistoricalRate[]> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
    
    try {
      return await this.getHistoricalRates(from, to, startDate, endDate);
    } catch (error) {
      console.warn('Failed to get historical rates for validation:', error);
      return [];
    }
  }

  private async flagUnusualRate(rate: ExchangeRate, deviation: number): Promise<void> {
    // Implementation for flagging unusual rates
    // Could send alerts, log to monitoring system, etc.
    console.log(`Flagged unusual rate: ${JSON.stringify(rate)}, deviation: ${deviation}`);
  }

  private isStale(cached: CachedRate): boolean {
    return Date.now() - cached.timestamp > cached.ttl;
  }

  private isValidRateUpdate(update: RateUpdate): boolean {
    return (
      update.rate > 0 &&
      update.timestamp > 0 &&
      update.from && update.to &&
      update.from !== update.to
    );
  }

  private notifySubscribers(pair: string, rate: ExchangeRate): void {
    const subscribers = this.subscribers.get(pair);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(rate);
        } catch (error) {
          console.error('Error notifying rate subscriber:', error);
        }
      });
    }
  }

  private reconnectProvider(provider: ExchangeRateProvider): void {
    setTimeout(() => {
      console.log(`Reconnecting to ${provider.name}...`);
      const ws = provider.createWebSocketConnection();
      this.websockets.set(provider.name, ws);
    }, 5000); // Retry after 5 seconds
  }
}

abstract class ExchangeRateProvider {
  abstract name: string;
  abstract supportsRealTime: boolean;
  abstract supportsHistorical: boolean;

  abstract getRate(from: string, to: string): Promise<ExchangeRate>;
  abstract getHistoricalRates(from: string, to: string, startDate: Date, endDate: Date): Promise<HistoricalRate[]>;
  abstract createWebSocketConnection(): WebSocket;
}

class BloombergProvider extends ExchangeRateProvider {
  name = 'Bloomberg';
  supportsRealTime = true;
  supportsHistorical = true;

  async getRate(from: string, to: string): Promise<ExchangeRate> {
    // Implementation for Bloomberg Terminal API
    const response = await fetch(`https://api.bloomberg.com/v1/rates/${from}${to}`, {
      headers: {
        'Authorization': `Bearer ${process.env.BLOOMBERG_API_KEY}`,
      },
    });

    const data = await response.json();
    return {
      from,
      to,
      rate: data.rate,
      timestamp: Date.now(),
      provider: this.name,
      spread: data.spread,
    };
  }

  async getHistoricalRates(from: string, to: string, startDate: Date, endDate: Date): Promise<HistoricalRate[]> {
    // Implementation for historical rates
    return [];
  }

  createWebSocketConnection(): WebSocket {
    const ws = new WebSocket('wss://api.bloomberg.com/v1/rates/stream');
    return ws;
  }
}

class ReutersProvider extends ExchangeRateProvider {
  name = 'Reuters';
  supportsRealTime = true;
  supportsHistorical = true;

  async getRate(from: string, to: string): Promise<ExchangeRate> {
    // Implementation for Reuters Eikon API
    return {
      from,
      to,
      rate: 1.0, // Placeholder
      timestamp: Date.now(),
      provider: this.name,
    };
  }

  async getHistoricalRates(from: string, to: string, startDate: Date, endDate: Date): Promise<HistoricalRate[]> {
    return [];
  }

  createWebSocketConnection(): WebSocket {
    return new WebSocket('wss://api.reuters.com/v1/rates/stream');
  }
}

class XEProvider extends ExchangeRateProvider {
  name = 'XE';
  supportsRealTime = false;
  supportsHistorical = true;

  async getRate(from: string, to: string): Promise<ExchangeRate> {
    const response = await fetch(`https://xecdapi.xe.com/v1/convert_from.json/?from=${from}&to=${to}&amount=1`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${process.env.XE_ACCOUNT_ID}:${process.env.XE_API_KEY}`).toString('base64')}`,
      },
    });

    const data = await response.json();
    return {
      from,
      to,
      rate: data.to[0].mid,
      timestamp: Date.now(),
      provider: this.name,
    };
  }

  async getHistoricalRates(from: string, to: string, startDate: Date, endDate: Date): Promise<HistoricalRate[]> {
    return [];
  }

  createWebSocketConnection(): WebSocket {
    throw new Error('XE Provider does not support real-time connections');
  }
}

class CentralBankProvider extends ExchangeRateProvider {
  name = 'CentralBank';
  supportsRealTime = false;
  supportsHistorical = true;

  async getRate(from: string, to: string): Promise<ExchangeRate> {
    // Implementation for central bank feeds (ECB, Fed, etc.)
    return {
      from,
      to,
      rate: 1.0, // Placeholder
      timestamp: Date.now(),
      provider: this.name,
    };
  }

  async getHistoricalRates(from: string, to: string, startDate: Date, endDate: Date): Promise<HistoricalRate[]> {
    return [];
  }

  createWebSocketConnection(): WebSocket {
    throw new Error('Central Bank Provider does not support real-time connections');
  }
}

interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  timestamp: number;
  provider: string;
  spread?: number;
  confidence?: number;
}

interface HistoricalRate {
  date: Date;
  rate: number;
  high?: number;
  low?: number;
  volume?: number;
}

interface CachedRate {
  rate: ExchangeRate;
  timestamp: number;
  ttl: number;
}

interface RateUpdate {
  from: string;
  to: string;
  rate: number;
  timestamp: number;
  provider: string;
  spread?: number;
}

type RateSubscriber = (rate: ExchangeRate) => void;

export const productionExchangeRateService = new ProductionExchangeRateService();