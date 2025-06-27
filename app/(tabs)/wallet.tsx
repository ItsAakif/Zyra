import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import {
  Plus,
  Minus,
  ArrowUpRight,
  ArrowDownLeft,
  Copy,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Wallet as WalletIcon,
  Coins,
  Settings,
} from 'lucide-react-native';
// WalletManager temporarily removed for simple wallet system
// import WalletManager from '@/components/WalletManager';
// import { WalletConnectionService, ConnectedWallet } from '@/lib/wallet-connection';
import { authService } from '@/lib/auth';
import { realWalletService, WalletState } from '@/lib/real-wallet';

import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { useTheme } from '@/lib/theme';

const { width } = Dimensions.get('window');

interface Token {
  id: string;
  symbol: string;
  name: string;
  balance: number;
  usdValue: number;
  change24h: number;
  icon: string;
}

interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'swap' | 'reward';
  token: string;
  amount: number;
  usdValue: number;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
  hash?: string;
}

export default function WalletScreen() {
  const { theme } = useTheme();
  const [selectedTab, setSelectedTab] = useState<'tokens' | 'nfts' | 'history'>('tokens');
  // const [showWalletManager, setShowWalletManager] = useState(false); // Removed for simple wallet
  const [connectedWallet, setConnectedWallet] = useState<WalletState | null>(realWalletService.getState());
  
  useEffect(() => {
    // Listen for wallet changes
    const unsubscribe = realWalletService.subscribe((walletState) => {
      console.log('🔄 [WALLET] Wallet changed:', walletState.isConnected ? walletState.address?.slice(0, 8) + '...' : 'disconnected');
      setConnectedWallet(walletState);
    });
    return unsubscribe;
  }, []);

  const tokens: Token[] = [
    {
      id: '1',
      symbol: 'ALGO',
      name: 'Algorand',
      balance: connectedWallet?.algoBalance || 0,
      usdValue: (connectedWallet?.algoBalance || 0) * 0.32, // Approximate ALGO price
      change24h: 2.1,
      icon: '🅰️',
    },
    {
      id: '2',
      symbol: 'ZYR',
      name: 'Zyro',
      balance: connectedWallet?.zyroBalance || 0,
      usdValue: (connectedWallet?.zyroBalance || 0) * 2.0, // $2 per ZYRO
      change24h: 12.5,
      icon: '⚡',
    },
  ];

  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Load real transaction history
  useEffect(() => {
    const loadTransactions = async () => {
      if (connectedWallet?.isConnected && connectedWallet.address) {
        try {
          const realTransactions = await realWalletService.getTransactionHistory();
          const formattedTransactions = realTransactions.map(tx => ({
            id: tx.id,
            type: tx.type === 'sent' ? 'send' : 'receive',
            token: tx.currency,
            amount: tx.type === 'sent' ? -tx.amount : tx.amount,
            usdValue: tx.amount * (tx.currency === 'ALGO' ? 0.32 : 2.0),
            timestamp: new Date(tx.timestamp).toLocaleDateString(),
            status: tx.status,
            hash: tx.id.slice(0, 6) + '...' + tx.id.slice(-4),
          }));
          
          // If no real transactions yet, add demo transactions for presentation
          if (formattedTransactions.length === 0) {
            const demoTransactions: Transaction[] = [
              {
                id: 'demo-1',
                type: 'receive',
                token: 'ALGO',
                amount: 10.0,
                usdValue: 3.2,
                timestamp: 'Today',
                status: 'completed',
                hash: 'DEMO...01'
              },
              {
                id: 'demo-2', 
                type: 'reward',
                token: 'ZYR',
                amount: 5.0,
                usdValue: 10.0,
                timestamp: 'Yesterday',
                status: 'completed',
                hash: 'DEMO...02'
              }
            ];
            setTransactions(demoTransactions);
          } else {
            setTransactions(formattedTransactions);
          }
        } catch (error) {
          console.error('Error loading transactions:', error);
          // Show demo transactions on error too
          const demoTransactions: Transaction[] = [
            {
              id: 'demo-1',
              type: 'receive',
              token: 'ALGO', 
              amount: 10.0,
              usdValue: 3.2,
              timestamp: 'Today',
              status: 'completed',
              hash: 'DEMO...01'
            }
          ];
          setTransactions(demoTransactions);
        }
      }
    };

    loadTransactions();
  }, [connectedWallet?.address]);

  const totalPortfolioValue = tokens.reduce((sum, token) => sum + token.usdValue, 0);

  const handleAddFunds = () => {
    router.push('/buy-crypto');
  };

  const handleSend = () => {
    router.push('/send-crypto');
  };

  const handleExplorer = () => {
    if (connectedWallet?.address) {
      const explorerUrl = `https://testnet.algoexplorer.io/address/${connectedWallet.address}`;
      Linking.openURL(explorerUrl).catch(() => {
        Alert.alert('Error', 'Could not open blockchain explorer');
      });
    }
  };

  const handleBuy = () => {
    router.push('/buy-crypto');
  };

  const handleSell = () => {
    router.push('/convert-crypto');
  };

  const copyWalletAddress = async () => {
    if (connectedWallet?.address) {
      await Clipboard.setStringAsync(connectedWallet.address);
      Alert.alert('Copied!', 'Wallet address copied to clipboard');
    }
  };

  const renderTokenItem = (token: Token) => (
    <TouchableOpacity key={token.id} style={[styles.tokenItem, { backgroundColor: theme.colors.card }]}>
      <View style={styles.tokenInfo}>
        <View style={styles.tokenIcon}>
          <Text style={styles.tokenEmoji}>{token.icon}</Text>
        </View>
        <View style={styles.tokenDetails}>
          <Text style={[styles.tokenSymbol, { color: theme.colors.text }]}>{token.symbol}</Text>
          <Text style={[styles.tokenName, { color: theme.colors.textSecondary }]}>{token.name}</Text>
        </View>
      </View>
      <View style={styles.tokenValues}>
        <Text style={[styles.tokenBalance, { color: theme.colors.text }]}>{token.balance.toLocaleString()}</Text>
        <View style={styles.tokenValueRow}>
          <Text style={styles.tokenUsdValue}>${token.usdValue.toLocaleString()}</Text>
          <View style={[
            styles.changeContainer,
            token.change24h >= 0 ? styles.positiveChange : styles.negativeChange
          ]}>
            {token.change24h >= 0 ? (
              <TrendingUp size={12} color="#10B981" />
            ) : (
              <TrendingDown size={12} color="#EF4444" />
            )}
            <Text style={[
              styles.changeText,
              token.change24h >= 0 ? styles.positiveChangeText : styles.negativeChangeText
            ]}>
              {Math.abs(token.change24h)}%
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderTransactionItem = (transaction: Transaction) => (
    <TouchableOpacity key={transaction.id} style={styles.transactionItem}>
      <View style={styles.transactionIcon}>
        {transaction.type === 'send' && <ArrowUpRight size={16} color="#EF4444" />}
        {transaction.type === 'receive' && <ArrowDownLeft size={16} color="#10B981" />}
        {transaction.type === 'reward' && <Coins size={16} color="#8B5CF6" />}
        {transaction.type === 'swap' && <ArrowUpRight size={16} color="#F59E0B" />}
      </View>
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionType}>
          {transaction.type === 'send' && 'Sent'}
          {transaction.type === 'receive' && 'Received'}
          {transaction.type === 'reward' && 'Reward'}
          {transaction.type === 'swap' && 'Swapped'}
        </Text>
        <Text style={styles.transactionTime}>{transaction.timestamp}</Text>
      </View>
      <View style={styles.transactionAmounts}>
        <Text style={[
          styles.transactionAmount,
          transaction.amount > 0 ? styles.positiveAmount : styles.negativeAmount
        ]}>
          {transaction.amount > 0 ? '+' : ''}{transaction.amount} {transaction.token}
        </Text>
        <Text style={styles.transactionUsdValue}>
          ${Math.abs(transaction.usdValue).toLocaleString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (!connectedWallet?.isConnected) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.connectWalletContainer}>
          <WalletIcon size={64} color="#8B5CF6" />
          <Text style={[styles.connectTitle, { color: theme.colors.text }]}>Connect Your Wallet</Text>
          <Text style={[styles.connectSubtitle, { color: theme.colors.textSecondary }]}>
            Connect a test wallet to start making payments and earning Zyros
          </Text>
          <TouchableOpacity 
            style={styles.connectButton}
            onPress={() => {
              console.log('🔄 [WALLET] Connect wallet button pressed');
              try {
                realWalletService.createTestWallet();
                console.log('🔄 [WALLET] Dialog should be showing...');
              } catch (error) {
                console.error('❌ [WALLET] Error showing dialog:', error);
              }
            }}
          >
            <Text style={styles.connectButtonText}>Connect Test Wallet</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>My Wallet</Text>
          <TouchableOpacity 
            style={styles.walletAddressButton}
            onPress={() => {
              Alert.alert(
                'Wallet Options',
                `Connected: Algorand Wallet\n${connectedWallet?.address?.slice(0, 12)}...${connectedWallet?.address?.slice(-12)}`,
                [
                  { text: 'Copy Address', onPress: copyWalletAddress },
                  { text: 'View Explorer', onPress: handleExplorer },
                  { text: 'Disconnect', onPress: () => realWalletService.disconnectWallet(), style: 'destructive' },
                  { text: 'Cancel', style: 'cancel' }
                ]
              );
            }}
          >
            <Text style={styles.walletAddress}>
              {connectedWallet?.address?.slice(0, 8)}...{connectedWallet?.address?.slice(-4)}
            </Text>
            <Settings size={16} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Portfolio Value Card */}
        <LinearGradient
          colors={['#1F2937', '#374151']}
          style={styles.portfolioCard}
        >
          <Text style={styles.portfolioLabel}>Total Portfolio Value</Text>
          <Text style={styles.portfolioValue}>${totalPortfolioValue.toLocaleString()}</Text>
          <View style={styles.portfolioActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleBuy}>
              <Plus size={20} color="white" />
              <Text style={styles.actionButtonText}>Buy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleSell}>
              <Minus size={20} color="white" />
              <Text style={styles.actionButtonText}>Sell</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleSend}>
              <ArrowUpRight size={20} color="white" />
              <Text style={styles.actionButtonText}>Send</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'tokens' && styles.activeTab]}
            onPress={() => setSelectedTab('tokens')}
          >
            <Text style={[styles.tabText, selectedTab === 'tokens' && styles.activeTabText]}>
              Tokens
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'nfts' && styles.activeTab]}
            onPress={() => setSelectedTab('nfts')}
          >
            <Text style={[styles.tabText, selectedTab === 'nfts' && styles.activeTabText]}>
              NFTs
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'history' && styles.activeTab]}
            onPress={() => setSelectedTab('history')}
          >
            <Text style={[styles.tabText, selectedTab === 'history' && styles.activeTabText]}>
              History
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {selectedTab === 'tokens' && (
            <View>
              {tokens.map(renderTokenItem)}
            </View>
          )}

          {selectedTab === 'nfts' && (
            <View style={styles.nftContainer}>
              <Text style={styles.emptyStateTitle}>No NFTs Yet</Text>
              <Text style={styles.emptyStateText}>
                Complete transactions to earn NFT rewards
              </Text>
            </View>
          )}

          {selectedTab === 'history' && (
            <View>
              {transactions.length > 0 ? (
                <View>
                  {transactions.map(renderTransactionItem)}
                  <TouchableOpacity style={styles.seeAllButton}>
                    <Text style={styles.seeAllText}>See All Transactions</Text>
                    <ArrowUpRight size={16} color="#8B5CF6" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.emptyHistoryContainer}>
                  <Text style={styles.emptyStateTitle}>No Transactions Yet</Text>
                  <Text style={styles.emptyStateText}>
                    Your transaction history will appear here once you start using your wallet
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity style={styles.quickActionItem} onPress={handleAddFunds}>
              <View style={styles.quickActionIcon}>
                <Plus size={24} color="#8B5CF6" />
              </View>
              <Text style={styles.quickActionText}>Add Funds</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionItem} onPress={handleSend}>
              <View style={styles.quickActionIcon}>
                <ArrowUpRight size={24} color="#EC4899" />
              </View>
              <Text style={styles.quickActionText}>Send</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionItem} onPress={handleExplorer}>
              <View style={styles.quickActionIcon}>
                <ExternalLink size={24} color="#F59E0B" />
              </View>
              <Text style={styles.quickActionText}>Explorer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      
      {/* Wallet Manager temporarily disabled for simple wallet system */}
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
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'SpaceGrotesk-Bold',
  },
  walletAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  walletAddress: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter-Medium',
  },
  portfolioCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },
  portfolioLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
  },
  portfolioValue: {
    fontSize: 32,
    fontWeight: '700',
    color: 'white',
    fontFamily: 'SpaceGrotesk-Bold',
    marginBottom: 24,
  },
  portfolioActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Inter-SemiBold',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: 'Inter-Medium',
  },
  activeTabText: {
    color: '#111827',
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  tabContent: {
    paddingHorizontal: 20,
  },
  tokenItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tokenInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tokenIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tokenEmoji: {
    fontSize: 20,
  },
  tokenDetails: {
    flex: 1,
  },
  tokenSymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  tokenName: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
  },
  tokenValues: {
    alignItems: 'flex-end',
  },
  tokenBalance: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  tokenValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tokenUsdValue: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 2,
  },
  positiveChange: {
    backgroundColor: '#DCFCE7',
  },
  negativeChange: {
    backgroundColor: '#FEE2E2',
  },
  changeText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  positiveChangeText: {
    color: '#10B981',
  },
  negativeChangeText: {
    color: '#EF4444',
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
  transactionType: {
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
    marginBottom: 2,
  },
  positiveAmount: {
    color: '#10B981',
  },
  negativeAmount: {
    color: '#EF4444',
  },
  transactionUsdValue: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
  },
  nftContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  emptyHistoryContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8B5CF6',
    fontFamily: 'Inter-Medium',
  },
  connectWalletContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  connectTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'SpaceGrotesk-Bold',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  connectSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
    marginBottom: 32,
    lineHeight: 24,
  },
  connectButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  connectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Inter-SemiBold',
  },
  quickActionsContainer: {
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionItem: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quickActionText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
});

// WalletManager code removed for simple wallet system