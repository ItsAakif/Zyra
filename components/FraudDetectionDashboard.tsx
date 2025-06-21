import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Shield, AlertTriangle, CheckCircle, TrendingUp, Activity } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface FraudAlert {
  id: string;
  userId: string;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  flags: string[];
  timestamp: Date;
  status: 'PENDING' | 'REVIEWED' | 'RESOLVED';
}

interface FraudStats {
  totalTransactions: number;
  flaggedTransactions: number;
  falsePositives: number;
  accuracy: number;
  avgProcessingTime: number;
}

export default function FraudDetectionDashboard() {
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [stats, setStats] = useState<FraudStats>({
    totalTransactions: 15420,
    flaggedTransactions: 127,
    falsePositives: 8,
    accuracy: 94.2,
    avgProcessingTime: 0.3
  });
  const [selectedTimeframe, setSelectedTimeframe] = useState<'24h' | '7d' | '30d'>('24h');

  useEffect(() => {
    loadFraudAlerts();
  }, [selectedTimeframe]);

  const loadFraudAlerts = async () => {
    // Mock fraud alerts data
    const mockAlerts: FraudAlert[] = [
      {
        id: '1',
        userId: 'user_123',
        riskScore: 0.89,
        riskLevel: 'HIGH',
        flags: ['VELOCITY_EXCEEDED', 'UNUSUAL_LOCATION'],
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        status: 'PENDING'
      },
      {
        id: '2',
        userId: 'user_456',
        riskScore: 0.95,
        riskLevel: 'CRITICAL',
        flags: ['SANCTIONS_MATCH', 'SUSPICIOUS_DEVICE'],
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        status: 'PENDING'
      },
      {
        id: '3',
        userId: 'user_789',
        riskScore: 0.67,
        riskLevel: 'MEDIUM',
        flags: ['ROUND_AMOUNT', 'NEW_DEVICE'],
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
        status: 'REVIEWED'
      }
    ];

    setAlerts(mockAlerts);
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'CRITICAL': return '#DC2626';
      case 'HIGH': return '#EA580C';
      case 'MEDIUM': return '#D97706';
      case 'LOW': return '#059669';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <AlertTriangle size={16} color="#F59E0B" />;
      case 'REVIEWED': return <Activity size={16} color="#3B82F6" />;
      case 'RESOLVED': return <CheckCircle size={16} color="#10B981" />;
      default: return <AlertTriangle size={16} color="#6B7280" />;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}m ago`;
    return `${minutes}m ago`;
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Shield size={24} color="#8B5CF6" />
          <Text style={styles.headerTitle}>Fraud Detection</Text>
        </View>
        
        <View style={styles.timeframeSelector}>
          {(['24h', '7d', '30d'] as const).map((timeframe) => (
            <TouchableOpacity
              key={timeframe}
              style={[
                styles.timeframeButton,
                selectedTimeframe === timeframe && styles.timeframeButtonActive
              ]}
              onPress={() => setSelectedTimeframe(timeframe)}
            >
              <Text
                style={[
                  styles.timeframeText,
                  selectedTimeframe === timeframe && styles.timeframeTextActive
                ]}
              >
                {timeframe}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Activity size={20} color="#8B5CF6" />
            <Text style={styles.statValue}>{stats.totalTransactions.toLocaleString()}</Text>
          </View>
          <Text style={styles.statLabel}>Total Transactions</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <AlertTriangle size={20} color="#F59E0B" />
            <Text style={styles.statValue}>{stats.flaggedTransactions}</Text>
          </View>
          <Text style={styles.statLabel}>Flagged</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <TrendingUp size={20} color="#10B981" />
            <Text style={styles.statValue}>{stats.accuracy}%</Text>
          </View>
          <Text style={styles.statLabel}>Accuracy</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <CheckCircle size={20} color="#3B82F6" />
            <Text style={styles.statValue}>{stats.avgProcessingTime}s</Text>
          </View>
          <Text style={styles.statLabel}>Avg Processing</Text>
        </View>
      </View>

      {/* Fraud Alerts */}
      <View style={styles.alertsSection}>
        <Text style={styles.sectionTitle}>Recent Fraud Alerts</Text>
        
        {alerts.map((alert) => (
          <View key={alert.id} style={styles.alertCard}>
            <View style={styles.alertHeader}>
              <View style={styles.alertInfo}>
                <View style={[styles.riskBadge, { backgroundColor: getRiskColor(alert.riskLevel) + '20' }]}>
                  <Text style={[styles.riskText, { color: getRiskColor(alert.riskLevel) }]}>
                    {alert.riskLevel}
                  </Text>
                </View>
                <Text style={styles.riskScore}>{(alert.riskScore * 100).toFixed(1)}%</Text>
              </View>
              
              <View style={styles.alertStatus}>
                {getStatusIcon(alert.status)}
                <Text style={styles.statusText}>{alert.status}</Text>
              </View>
            </View>

            <View style={styles.alertDetails}>
              <Text style={styles.userId}>User: {alert.userId}</Text>
              <Text style={styles.timestamp}>{formatTimestamp(alert.timestamp)}</Text>
            </View>

            <View style={styles.flagsContainer}>
              {alert.flags.map((flag, index) => (
                <View key={index} style={styles.flagBadge}>
                  <Text style={styles.flagText}>{flag.replace(/_/g, ' ')}</Text>
                </View>
              ))}
            </View>

            <View style={styles.alertActions}>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonText}>Review</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.approveButton]}>
                <Text style={[styles.actionButtonText, styles.approveButtonText]}>Approve</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* Model Performance */}
      <View style={styles.performanceSection}>
        <Text style={styles.sectionTitle}>Model Performance</Text>
        
        <LinearGradient
          colors={['#8B5CF6', '#EC4899']}
          style={styles.performanceCard}
        >
          <View style={styles.performanceHeader}>
            <Text style={styles.performanceTitle}>Fraud Detection Model</Text>
            <Text style={styles.performanceSubtitle}>Last updated: 2 hours ago</Text>
          </View>
          
          <View style={styles.performanceMetrics}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Precision</Text>
              <Text style={styles.metricValue}>94.2%</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Recall</Text>
              <Text style={styles.metricValue}>91.8%</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>F1 Score</Text>
              <Text style={styles.metricValue}>93.0%</Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
  },
  timeframeSelector: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 2,
  },
  timeframeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  timeframeButtonActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  timeframeText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter-Medium',
  },
  timeframeTextActive: {
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'SpaceGrotesk-Bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
  },
  alertsSection: {
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
  alertCard: {
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
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  riskText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  riskScore: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'SpaceGrotesk-Bold',
  },
  alertStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter-Medium',
  },
  alertDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  userId: {
    fontSize: 14,
    color: '#111827',
    fontFamily: 'Inter-Medium',
  },
  timestamp: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
  },
  flagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  flagBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  flagText: {
    fontSize: 10,
    color: '#92400E',
    fontFamily: 'Inter-Medium',
  },
  alertActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: 'Inter-Medium',
  },
  approveButton: {
    backgroundColor: '#DCFCE7',
  },
  approveButtonText: {
    color: '#059669',
  },
  performanceSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  performanceCard: {
    borderRadius: 16,
    padding: 20,
  },
  performanceHeader: {
    marginBottom: 16,
  },
  performanceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  performanceSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Inter-Regular',
  },
  performanceMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    fontFamily: 'SpaceGrotesk-Bold',
  },
});