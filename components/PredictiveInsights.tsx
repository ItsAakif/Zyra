import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { TrendingUp, Brain, Target, Clock, Gift, CircleAlert as AlertCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface UserPrediction {
  churnRisk: number;
  lifetimeValue: number;
  nextTransactionAmount: number;
  preferredPaymentMethod: string;
  optimalOfferTiming: Date;
  riskScore: number;
}

interface PersonalizedOffer {
  id: string;
  type: 'DISCOUNT' | 'UPGRADE' | 'FEATURE' | 'CASHBACK';
  title: string;
  description: string;
  value: number;
  validUntil: Date;
  targetSegment: string;
}

interface MarketInsight {
  currency: string;
  prediction: 'UP' | 'DOWN' | 'STABLE';
  confidence: number;
  timeframe: string;
  factors: string[];
}

export default function PredictiveInsights({ userId }: { userId: string }) {
  const [predictions, setPredictions] = useState<UserPrediction | null>(null);
  const [offers, setOffers] = useState<PersonalizedOffer[]>([]);
  const [marketInsights, setMarketInsights] = useState<MarketInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPredictiveData();
  }, [userId]);

  const loadPredictiveData = async () => {
    try {
      // Mock predictive data
      const mockPredictions: UserPrediction = {
        churnRisk: 0.23,
        lifetimeValue: 2450,
        nextTransactionAmount: 185,
        preferredPaymentMethod: 'UPI',
        optimalOfferTiming: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        riskScore: 0.15
      };

      const mockOffers: PersonalizedOffer[] = [
        {
          id: '1',
          type: 'DISCOUNT',
          title: '20% Off Pro Subscription',
          description: 'Upgrade to Pro and save 20% for the first 6 months',
          value: 20,
          validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          targetSegment: 'high_value'
        },
        {
          id: '2',
          type: 'CASHBACK',
          title: 'Double Zyro Rewards',
          description: 'Earn 2x Zyro tokens on your next 5 transactions',
          value: 100,
          validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          targetSegment: 'active_user'
        }
      ];

      const mockMarketInsights: MarketInsight[] = [
        {
          currency: 'ALGO',
          prediction: 'UP',
          confidence: 0.78,
          timeframe: '24h',
          factors: ['Positive market sentiment', 'Technical breakout']
        },
        {
          currency: 'ETH',
          prediction: 'STABLE',
          confidence: 0.65,
          timeframe: '7d',
          factors: ['Consolidation pattern', 'Mixed signals']
        }
      ];

      setPredictions(mockPredictions);
      setOffers(mockOffers);
      setMarketInsights(mockMarketInsights);
    } catch (error) {
      console.error('Error loading predictive data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk: number) => {
    if (risk < 0.3) return '#10B981';
    if (risk < 0.6) return '#F59E0B';
    return '#EF4444';
  };

  const getPredictionIcon = (prediction: string) => {
    switch (prediction) {
      case 'UP': return '📈';
      case 'DOWN': return '📉';
      case 'STABLE': return '➡️';
      default: return '❓';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Brain size={48} color="#8B5CF6" />
        <Text style={styles.loadingText}>Analyzing patterns...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Brain size={24} color="#8B5CF6" />
        <Text style={styles.headerTitle}>Predictive Insights</Text>
      </View>

      {/* User Predictions */}
      {predictions && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Predictions</Text>
          
          <View style={styles.predictionGrid}>
            {/* Churn Risk */}
            <View style={styles.predictionCard}>
              <View style={styles.predictionHeader}>
                <Target size={20} color={getRiskColor(predictions.churnRisk)} />
                <Text style={styles.predictionLabel}>Retention Score</Text>
              </View>
              <Text style={[styles.predictionValue, { color: getRiskColor(predictions.churnRisk) }]}>
                {((1 - predictions.churnRisk) * 100).toFixed(0)}%
              </Text>
              <Text style={styles.predictionSubtext}>
                {predictions.churnRisk < 0.3 ? 'Highly engaged' : 
                 predictions.churnRisk < 0.6 ? 'Moderately engaged' : 'At risk'}
              </Text>
            </View>

            {/* Lifetime Value */}
            <View style={styles.predictionCard}>
              <View style={styles.predictionHeader}>
                <TrendingUp size={20} color="#10B981" />
                <Text style={styles.predictionLabel}>Lifetime Value</Text>
              </View>
              <Text style={[styles.predictionValue, { color: '#10B981' }]}>
                {formatCurrency(predictions.lifetimeValue)}
              </Text>
              <Text style={styles.predictionSubtext}>Projected total value</Text>
            </View>

            {/* Next Transaction */}
            <View style={styles.predictionCard}>
              <View style={styles.predictionHeader}>
                <Clock size={20} color="#8B5CF6" />
                <Text style={styles.predictionLabel}>Next Transaction</Text>
              </View>
              <Text style={[styles.predictionValue, { color: '#8B5CF6' }]}>
                {formatCurrency(predictions.nextTransactionAmount)}
              </Text>
              <Text style={styles.predictionSubtext}>
                via {predictions.preferredPaymentMethod}
              </Text>
            </View>

            {/* Risk Score */}
            <View style={styles.predictionCard}>
              <View style={styles.predictionHeader}>
                <AlertCircle size={20} color={getRiskColor(predictions.riskScore)} />
                <Text style={styles.predictionLabel}>Risk Score</Text>
              </View>
              <Text style={[styles.predictionValue, { color: getRiskColor(predictions.riskScore) }]}>
                {(predictions.riskScore * 100).toFixed(0)}%
              </Text>
              <Text style={styles.predictionSubtext}>
                {predictions.riskScore < 0.3 ? 'Low risk' : 
                 predictions.riskScore < 0.6 ? 'Medium risk' : 'High risk'}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Personalized Offers */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personalized Offers</Text>
        
        {offers.map((offer) => (
          <LinearGradient
            key={offer.id}
            colors={offer.type === 'DISCOUNT' ? ['#8B5CF6', '#EC4899'] : ['#10B981', '#059669']}
            style={styles.offerCard}
          >
            <View style={styles.offerHeader}>
              <Gift size={20} color="white" />
              <Text style={styles.offerType}>{offer.type}</Text>
            </View>
            
            <Text style={styles.offerTitle}>{offer.title}</Text>
            <Text style={styles.offerDescription}>{offer.description}</Text>
            
            <View style={styles.offerFooter}>
              <Text style={styles.offerValue}>
                {offer.type === 'DISCOUNT' ? `${offer.value}% OFF` : 
                 offer.type === 'CASHBACK' ? `${offer.value}% CASHBACK` : 
                 `${offer.value}% BONUS`}
              </Text>
              <Text style={styles.offerExpiry}>
                Expires {formatDate(offer.validUntil)}
              </Text>
            </View>
            
            <TouchableOpacity style={styles.claimButton}>
              <Text style={styles.claimButtonText}>Claim Offer</Text>
            </TouchableOpacity>
          </LinearGradient>
        ))}
      </View>

      {/* Market Insights */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Market Insights</Text>
        
        {marketInsights.map((insight, index) => (
          <View key={index} style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <Text style={styles.insightCurrency}>{insight.currency}</Text>
              <View style={styles.insightPrediction}>
                <Text style={styles.predictionEmoji}>
                  {getPredictionIcon(insight.prediction)}
                </Text>
                <Text style={styles.predictionText}>{insight.prediction}</Text>
              </View>
            </View>
            
            <View style={styles.insightDetails}>
              <Text style={styles.insightTimeframe}>{insight.timeframe} outlook</Text>
              <Text style={styles.insightConfidence}>
                {(insight.confidence * 100).toFixed(0)}% confidence
              </Text>
            </View>
            
            <View style={styles.factorsContainer}>
              {insight.factors.map((factor, factorIndex) => (
                <View key={factorIndex} style={styles.factorBadge}>
                  <Text style={styles.factorText}>{factor}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>

      {/* Optimal Timing */}
      {predictions && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Optimal Timing</Text>
          
          <View style={styles.timingCard}>
            <Clock size={24} color="#8B5CF6" />
            <View style={styles.timingContent}>
              <Text style={styles.timingTitle}>Best time for offers</Text>
              <Text style={styles.timingValue}>
                {formatDate(predictions.optimalOfferTiming)}
              </Text>
              <Text style={styles.timingSubtext}>
                Based on your activity patterns
              </Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'Inter-Medium',
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  predictionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  predictionCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  predictionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  predictionLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter-Medium',
  },
  predictionValue: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'SpaceGrotesk-Bold',
    marginBottom: 4,
  },
  predictionSubtext: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: 'Inter-Regular',
  },
  offerCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  offerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  offerType: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: 'Inter-SemiBold',
  },
  offerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    fontFamily: 'SpaceGrotesk-Bold',
    marginBottom: 8,
  },
  offerDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: 'Inter-Regular',
    marginBottom: 16,
    lineHeight: 20,
  },
  offerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  offerValue: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    fontFamily: 'SpaceGrotesk-Bold',
  },
  offerExpiry: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Inter-Regular',
  },
  claimButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  claimButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Inter-SemiBold',
  },
  insightCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightCurrency: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'SpaceGrotesk-Bold',
  },
  insightPrediction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  predictionEmoji: {
    fontSize: 16,
  },
  predictionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
  },
  insightDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  insightTimeframe: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
  },
  insightConfidence: {
    fontSize: 12,
    color: '#8B5CF6',
    fontFamily: 'Inter-Medium',
  },
  factorsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  factorBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  factorText: {
    fontSize: 10,
    color: '#6B7280',
    fontFamily: 'Inter-Medium',
  },
  timingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  timingContent: {
    marginLeft: 16,
    flex: 1,
  },
  timingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  timingValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8B5CF6',
    fontFamily: 'Inter-Medium',
    marginBottom: 4,
  },
  timingSubtext: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
  },
});