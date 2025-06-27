import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Bell, 
  Eye, 
  EyeOff, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownLeft,
  Gift,
  Wallet,
  Zap,
  QrCode,
  Send,
  Bitcoin,
  Image as ImageIcon
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import SubscriptionBenefits from '@/components/SubscriptionBenefits';
import PlatformBadges from '@/components/PlatformBadges';
import { authService } from '@/lib/auth';
import { realWalletService } from '@/lib/real-wallet';
import { settingsService } from '@/lib/settings';
import { useTheme } from '@/lib/theme';

interface RecentTransaction {
  id: string;
  type: 'reward' | 'payment' | 'receive' | 'send';
  amount: number;
  currency: string;
  description: string;
  created_at: string;
  zyro_earned?: number;
}

export default function HomeScreen() {
  const { theme } = useTheme();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [walletState, setWalletState] = useState(realWalletService.getState());
  const [demoMode, setDemoMode] = useState(settingsService.isDemoMode());

  useEffect(() => {
    const unsubscribeWallet = realWalletService.subscribe(setWalletState);
    const unsubscribeSettings = settingsService.subscribe((settings) => {
      setDemoMode(settings.demoMode);
    });

    return () => {
      unsubscribeWallet();
      unsubscribeSettings();
    };
  }, []);
  const [balances, setBalances] = useState({
    algo: demoMode ? 12.5432 : (walletState.algoBalance || 0),
    zyro: demoMode ? 1247.89 : (walletState.zyroBalance || 0),
    totalUSD: demoMode ? 3456.78 : ((walletState.algoBalance || 0) * 0.32 + (walletState.zyroBalance || 0) * 2.0),
  });

  // Update balances when wallet state or demo mode changes
  useEffect(() => {
    setBalances({
      algo: demoMode ? 12.5432 : (walletState.algoBalance || 0),
      zyro: demoMode ? 1247.89 : (walletState.zyroBalance || 0),
      totalUSD: demoMode ? 3456.78 : ((walletState.algoBalance || 0) * 0.32 + (walletState.zyroBalance || 0) * 2.0),
    });
  }, [walletState, demoMode]);

  // Load recent transactions
  useEffect(() => {
    const loadRecentTransactions = async () => {
      if (demoMode) {
        // Demo mode - show sample transactions
        setRecentTransactions([
          {
            id: '1',
            type: 'reward',
            amount: 25.50,
            currency: 'ZYR',
            description: 'Payment reward',
            created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            zyro_earned: 25.50,
          },
          {
            id: '2',
            type: 'payment',
            amount: -100.00,
            currency: 'USD',
            description: 'Coffee payment',
            created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            zyro_earned: 10.00,
          },
        ]);
      } else if (walletState.isConnected) {
        // Real mode - load actual transactions
        try {
          const realTransactions = await realWalletService.getTransactionHistory();
          const formattedTransactions: RecentTransaction[] = realTransactions.slice(0, 3).map(tx => ({
            id: tx.id,
            type: tx.type === 'sent' ? 'send' : 'receive',
            amount: tx.type === 'sent' ? -tx.amount : tx.amount,
            currency: tx.currency,
            description: tx.type === 'sent' ? 'Sent crypto' : 'Received crypto',
            created_at: new Date(tx.timestamp).toISOString(),
            zyro_earned: tx.type === 'received' ? tx.amount * 0.1 : undefined, // 10% reward
          }));
          
          // If no real transactions, show demo data for presentation
          if (formattedTransactions.length === 0) {
            setRecentTransactions([
              {
                id: 'demo-1',
                type: 'receive',
                amount: 10.0,
                currency: 'ALGO',
                description: 'Received ALGO',
                created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
                zyro_earned: 1.0,
              },
            ]);
          } else {
            setRecentTransactions(formattedTransactions);
          }
        } catch (error) {
          console.error('Error loading recent transactions:', error);
          setRecentTransactions([]);
        }
      } else {
        setRecentTransactions([]);
      }
    };

    loadRecentTransactions();
  }, [walletState, demoMode]);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);

  const authState = authService.getAuthState();

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate loading
    setTimeout(() => setRefreshing(false), 1000);
  };



  const handleNotificationPress = () => {
    router.push('/notifications' as any);
  };

  const quickActions = [
    { 
      id: '1', 
      title: 'Scan QR', 
      icon: QrCode, 
      color: '#8B5CF6',
      onPress: () => router.push('/scan')
    },
    { 
      id: '2', 
      title: 'Send Money', 
      icon: Send, 
      color: '#EC4899',
      onPress: () => router.push('/wallet')
    },
    { 
      id: '3', 
      title: 'Buy Crypto', 
      icon: Bitcoin, 
      color: '#F59E0B',
      onPress: () => router.push('/buy-crypto')
    },
    { 
      id: '4', 
      title: 'NFT Gallery', 
      icon: ImageIcon, 
      color: '#10B981',
      onPress: () => router.push('/rewards')
    },
  ];

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatTransactionAmount = (transaction: any) => {
    const isPositive = transaction.type === 'reward' || transaction.zyro_earned > 0;
    const amount = transaction.amount || 0;
    return {
      text: `${isPositive ? '+' : '-'}${formatCurrency(Math.abs(amount))}`,
      color: isPositive ? '#10B981' : '#EF4444',
    };
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: theme.colors.textSecondary }]}>Good morning</Text>
            <Text style={[styles.userName, { color: theme.colors.text }]}>{authState.user?.full_name || 'User'}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.notificationButton} onPress={handleNotificationPress}>
              <Bell size={24} color="#6B7280" />
              <View style={styles.notificationDot} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Balance Card */}
        <LinearGradient
          colors={['#8B5CF6', '#EC4899']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Total Portfolio Value</Text>
            <TouchableOpacity onPress={() => setBalanceVisible(!balanceVisible)}>
              {balanceVisible ? (
                <Eye size={20} color="white" />
              ) : (
                <EyeOff size={20} color="white" />
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.balanceAmount}>
            {balanceVisible ? formatCurrency(balances.totalUSD) : '••••••'}
          </Text>
          <View style={styles.balanceDetails}>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceItemLabel}>ALGO</Text>
              <Text style={styles.balanceItemValue}>
                {balanceVisible ? balances.algo.toFixed(4) : '••••'}
              </Text>
            </View>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceItemLabel}>Zyro</Text>
              <Text style={styles.balanceItemValue}>
                {balanceVisible ? balances.zyro.toLocaleString() : '••••'}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action) => {
              const IconComponent = action.icon;
              return (
                <TouchableOpacity 
                  key={action.id} 
                  style={styles.actionButton}
                  onPress={action.onPress}
                >
                  <View style={[styles.actionIcon, { backgroundColor: action.color + '20' }]}>
                    <IconComponent size={24} color={action.color} strokeWidth={2} />
                  </View>
                  <Text style={styles.actionTitle}>{action.title}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
            <View style={styles.statHeader}>
              <TrendingUp size={20} color="#10B981" />
              <Text style={[styles.statValue, { color: theme.colors.text }]}>+24.5%</Text>
            </View>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>This Month</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
            <View style={styles.statHeader}>
              <Gift size={20} color="#F59E0B" />
              <Text style={[styles.statValue, { color: theme.colors.text }]}>{recentTransactions.length}</Text>
            </View>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Transactions</Text>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.transactionsSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Recent Activity</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/wallet')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {recentTransactions.length > 0 ? (
            recentTransactions.map((transaction) => {
              const amountInfo = formatTransactionAmount(transaction);
              return (
                <View key={transaction.id} style={[styles.transactionItem, { backgroundColor: theme.colors.card }]}>
                  <View style={styles.transactionIcon}>
                    {transaction.type === 'payment' ? (
                      <ArrowUpRight size={16} color="#EF4444" />
                    ) : (
                      <Zap size={16} color="#8B5CF6" />
                    )}
                  </View>
                  <View style={styles.transactionDetails}>
                    <Text style={[styles.transactionDescription, { color: theme.colors.text }]}>
                      {transaction.description}
                    </Text>
                    <Text style={[styles.transactionTime, { color: theme.colors.textSecondary }]}>
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.transactionAmounts}>
                    <Text style={[styles.transactionAmount, { color: amountInfo.color }]}>
                      {amountInfo.text}
                    </Text>
                    {transaction.zyro_earned && transaction.zyro_earned > 0 && (
                      <Text style={styles.zyroEarned}>+{transaction.zyro_earned} ZYR</Text>
                    )}
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyTransactions}>
              <Wallet size={48} color="#D1D5DB" />
              <Text style={[styles.emptyTransactionsText, { color: theme.colors.textSecondary }]}>No transactions yet</Text>
              <Text style={[styles.emptyTransactionsSubtext, { color: theme.colors.textTertiary }]}>
                Start making payments to see your activity here
              </Text>
            </View>
          )}
        </View>

        {/* Subscription Benefits */}
        <SubscriptionBenefits 
          onUpgrade={() => router.push('/(tabs)/profile')}
        />
      </ScrollView>
      
      {/* Platform Badges */}
      <PlatformBadges style={styles.badgeContainer} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  greeting: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'SpaceGrotesk-Bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  notificationButton: {
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  balanceCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Inter-Regular',
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: 'white',
    fontFamily: 'SpaceGrotesk-Bold',
    marginBottom: 16,
  },
  balanceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceItem: {
    flex: 1,
  },
  balanceItemLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  balanceItemValue: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Inter-SemiBold',
  },
  quickActions: {
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
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionEmoji: {
    fontSize: 24,
  },
  actionTitle: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
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
    borderRadius: 16,
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
    gap: 8,
    marginBottom: 4,
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
  transactionsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: '#8B5CF6',
    fontFamily: 'Inter-Medium',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  transactionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    fontFamily: 'Inter-Medium',
    marginBottom: 2,
  },
  transactionTime: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
  },
  transactionAmounts: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  zyroEarned: {
    fontSize: 12,
    color: '#8B5CF6',
    fontFamily: 'Inter-Medium',
    marginTop: 2,
  },
  emptyTransactions: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTransactionsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: 'Inter-SemiBold',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyTransactionsSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  promoBanner: {
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  promoContent: {
    flex: 1,
  },
  promoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  promoSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Inter-Regular',
  },
  promoButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  promoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Inter-SemiBold',
  },
  
  // Badge Container Position
  badgeContainer: {
    position: 'absolute',
    bottom: 100, // Above tab bar
    right: 20,
  },
});
