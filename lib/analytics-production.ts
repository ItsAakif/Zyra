export interface AnalyticsEvent {
  name: string;
  properties: { [key: string]: any };
  userId?: string;
  timestamp: number;
  sessionId: string;
}

export interface UserSegment {
  id: string;
  name: string;
  criteria: SegmentCriteria;
  userCount: number;
  createdAt: Date;
}

export interface SegmentCriteria {
  demographics?: {
    country?: string[];
    ageRange?: { min: number; max: number };
    subscriptionTier?: string[];
  };
  behavioral?: {
    transactionCount?: { min: number; max: number };
    totalVolume?: { min: number; max: number };
    lastActiveDate?: { after: Date; before: Date };
  };
  engagement?: {
    appOpens?: { min: number; max: number };
    featureUsage?: { [feature: string]: number };
  };
}

export interface AnalyticsReport {
  id: string;
  name: string;
  type: 'funnel' | 'retention' | 'revenue' | 'engagement';
  data: any;
  generatedAt: Date;
  filters: any;
}

export class ProductionAnalyticsService {
  private mixpanelToken: string;
  private amplitudeApiKey: string;
  private segmentWriteKey: string;
  private sessionId: string;

  constructor() {
    this.mixpanelToken = process.env.EXPO_PUBLIC_MIXPANEL_TOKEN || '';
    this.amplitudeApiKey = process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY || '';
    this.segmentWriteKey = process.env.EXPO_PUBLIC_SEGMENT_WRITE_KEY || '';
    this.sessionId = this.generateSessionId();
  }

  async trackEvent(
    eventName: string,
    properties: { [key: string]: any } = {},
    userId?: string
  ): Promise<void> {
    try {
      const event: AnalyticsEvent = {
        name: eventName,
        properties: {
          ...properties,
          platform: 'mobile',
          app_version: '1.0.0',
          timestamp: Date.now(),
        },
        userId,
        timestamp: Date.now(),
        sessionId: this.sessionId,
      };

      // Send to multiple analytics providers
      await Promise.all([
        this.sendToMixpanel(event),
        this.sendToAmplitude(event),
        this.sendToSegment(event),
        this.sendToCustomAnalytics(event),
      ]);
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  }

  async trackUserProperty(userId: string, properties: { [key: string]: any }): Promise<void> {
    try {
      await Promise.all([
        this.setMixpanelUserProperties(userId, properties),
        this.setAmplitudeUserProperties(userId, properties),
        this.setSegmentUserTraits(userId, properties),
      ]);
    } catch (error) {
      console.error('User property tracking error:', error);
    }
  }

  async trackPaymentEvent(
    userId: string,
    amount: number,
    currency: string,
    paymentMethod: string,
    success: boolean,
    metadata: any = {}
  ): Promise<void> {
    const eventName = success ? 'Payment Completed' : 'Payment Failed';
    
    await this.trackEvent(eventName, {
      amount,
      currency,
      payment_method: paymentMethod,
      success,
      ...metadata,
    }, userId);

    // Track revenue for successful payments
    if (success) {
      await this.trackRevenue(userId, amount, currency, metadata);
    }
  }

  async trackKYCEvent(
    userId: string,
    step: string,
    status: 'started' | 'completed' | 'failed',
    provider?: string,
    metadata: any = {}
  ): Promise<void> {
    await this.trackEvent('KYC Step', {
      step,
      status,
      provider,
      ...metadata,
    }, userId);
  }

  async trackVoiceInteraction(
    userId: string,
    intent: string,
    confidence: number,
    success: boolean,
    duration: number
  ): Promise<void> {
    await this.trackEvent('Voice Interaction', {
      intent,
      confidence,
      success,
      duration_ms: duration,
    }, userId);
  }

  async trackNFTEvent(
    userId: string,
    action: 'mint' | 'list' | 'buy' | 'transfer',
    nftId: string,
    price?: number,
    currency?: string
  ): Promise<void> {
    await this.trackEvent('NFT Action', {
      action,
      nft_id: nftId,
      price,
      currency,
    }, userId);
  }

  async createUserSegment(segment: Omit<UserSegment, 'id' | 'userCount' | 'createdAt'>): Promise<string> {
    try {
      const segmentId = `segment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Calculate user count based on criteria
      const userCount = await this.calculateSegmentSize(segment.criteria);
      
      const fullSegment: UserSegment = {
        id: segmentId,
        userCount,
        createdAt: new Date(),
        ...segment,
      };

      // Store segment definition
      await this.storeSegment(fullSegment);
      
      return segmentId;
    } catch (error) {
      console.error('Segment creation error:', error);
      throw error;
    }
  }

  async generateFunnelReport(
    steps: string[],
    timeRange: { start: Date; end: Date },
    filters?: any
  ): Promise<AnalyticsReport> {
    try {
      const funnelData = await this.calculateFunnelMetrics(steps, timeRange, filters);
      
      return {
        id: `report_${Date.now()}`,
        name: 'Funnel Analysis',
        type: 'funnel',
        data: funnelData,
        generatedAt: new Date(),
        filters,
      };
    } catch (error) {
      console.error('Funnel report error:', error);
      throw error;
    }
  }

  async generateRetentionReport(
    timeRange: { start: Date; end: Date },
    cohortType: 'daily' | 'weekly' | 'monthly' = 'weekly'
  ): Promise<AnalyticsReport> {
    try {
      const retentionData = await this.calculateRetentionMetrics(timeRange, cohortType);
      
      return {
        id: `report_${Date.now()}`,
        name: 'Retention Analysis',
        type: 'retention',
        data: retentionData,
        generatedAt: new Date(),
        filters: { cohortType },
      };
    } catch (error) {
      console.error('Retention report error:', error);
      throw error;
    }
  }

  async generateRevenueReport(
    timeRange: { start: Date; end: Date },
    groupBy: 'day' | 'week' | 'month' = 'day'
  ): Promise<AnalyticsReport> {
    try {
      const revenueData = await this.calculateRevenueMetrics(timeRange, groupBy);
      
      return {
        id: `report_${Date.now()}`,
        name: 'Revenue Analysis',
        type: 'revenue',
        data: revenueData,
        generatedAt: new Date(),
        filters: { groupBy },
      };
    } catch (error) {
      console.error('Revenue report error:', error);
      throw error;
    }
  }

  private async sendToMixpanel(event: AnalyticsEvent): Promise<void> {
    try {
      if (!this.mixpanelToken) return;

      const payload = {
        event: event.name,
        properties: {
          ...event.properties,
          distinct_id: event.userId || 'anonymous',
          time: event.timestamp,
          $insert_id: `${event.sessionId}_${event.timestamp}`,
        },
      };

      await fetch('https://api.mixpanel.com/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([payload]),
      });
    } catch (error) {
      console.error('Mixpanel tracking error:', error);
    }
  }

  private async sendToAmplitude(event: AnalyticsEvent): Promise<void> {
    try {
      if (!this.amplitudeApiKey) return;

      const payload = {
        api_key: this.amplitudeApiKey,
        events: [{
          user_id: event.userId || 'anonymous',
          event_type: event.name,
          event_properties: event.properties,
          time: event.timestamp,
          session_id: event.sessionId,
        }],
      };

      await fetch('https://api2.amplitude.com/2/httpapi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error('Amplitude tracking error:', error);
    }
  }

  private async sendToSegment(event: AnalyticsEvent): Promise<void> {
    try {
      if (!this.segmentWriteKey) return;

      const payload = {
        userId: event.userId || 'anonymous',
        event: event.name,
        properties: event.properties,
        timestamp: new Date(event.timestamp).toISOString(),
        context: {
          sessionId: event.sessionId,
        },
      };

      await fetch('https://api.segment.io/v1/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(this.segmentWriteKey + ':').toString('base64')}`,
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error('Segment tracking error:', error);
    }
  }

  private async sendToCustomAnalytics(event: AnalyticsEvent): Promise<void> {
    try {
      // Send to custom analytics backend
      await fetch('/api/analytics/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });
    } catch (error) {
      console.error('Custom analytics error:', error);
    }
  }

  private async trackRevenue(
    userId: string,
    amount: number,
    currency: string,
    metadata: any
  ): Promise<void> {
    // Track revenue in Mixpanel
    if (this.mixpanelToken) {
      await fetch('https://api.mixpanel.com/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([{
          event: '$transaction',
          properties: {
            distinct_id: userId,
            $amount: amount,
            $currency: currency,
            time: Date.now(),
            ...metadata,
          },
        }]),
      });
    }
  }

  private async setMixpanelUserProperties(userId: string, properties: any): Promise<void> {
    try {
      if (!this.mixpanelToken) return;

      await fetch('https://api.mixpanel.com/engage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([{
          $distinct_id: userId,
          $set: properties,
        }]),
      });
    } catch (error) {
      console.error('Mixpanel user properties error:', error);
    }
  }

  private async setAmplitudeUserProperties(userId: string, properties: any): Promise<void> {
    try {
      if (!this.amplitudeApiKey) return;

      const payload = {
        api_key: this.amplitudeApiKey,
        identification: [{
          user_id: userId,
          user_properties: properties,
        }],
      };

      await fetch('https://api2.amplitude.com/identify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error('Amplitude user properties error:', error);
    }
  }

  private async setSegmentUserTraits(userId: string, traits: any): Promise<void> {
    try {
      if (!this.segmentWriteKey) return;

      const payload = {
        userId,
        traits,
        timestamp: new Date().toISOString(),
      };

      await fetch('https://api.segment.io/v1/identify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(this.segmentWriteKey + ':').toString('base64')}`,
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error('Segment user traits error:', error);
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async calculateSegmentSize(criteria: SegmentCriteria): Promise<number> {
    // Implementation to calculate segment size based on criteria
    return Math.floor(Math.random() * 1000); // Mock implementation
  }

  private async storeSegment(segment: UserSegment): Promise<void> {
    // Implementation to store segment definition
  }

  private async calculateFunnelMetrics(steps: string[], timeRange: any, filters: any): Promise<any> {
    // Implementation to calculate funnel metrics
    return {
      steps: steps.map((step, index) => ({
        name: step,
        users: Math.floor(Math.random() * 1000) * (steps.length - index),
        conversionRate: Math.random() * 100,
      })),
    };
  }

  private async calculateRetentionMetrics(timeRange: any, cohortType: string): Promise<any> {
    // Implementation to calculate retention metrics
    return {
      cohorts: [],
      overallRetention: Math.random() * 100,
    };
  }

  private async calculateRevenueMetrics(timeRange: any, groupBy: string): Promise<any> {
    // Implementation to calculate revenue metrics
    return {
      totalRevenue: Math.random() * 100000,
      revenueByPeriod: [],
      averageRevenuePerUser: Math.random() * 100,
    };
  }
}

export const productionAnalyticsService = new ProductionAnalyticsService();