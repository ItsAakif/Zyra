import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Wallet, 
  Plus, 
  ExternalLink, 
  Copy,
  Trash2,
  CheckCircle,
  X,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react-native';
import { WalletConnectionService, ConnectedWallet } from '@/lib/wallet-connection';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';

interface WalletManagerProps {
  visible: boolean;
  onClose: () => void;
  onWalletSelected?: (wallet: ConnectedWallet) => void;
}

export default function WalletManager({ visible, onClose, onWalletSelected }: WalletManagerProps) {
  const [wallets, setWallets] = useState<ConnectedWallet[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (visible) {
      loadWallets();
    }
  }, [visible]);

  const loadWallets = async () => {
    setLoading(true);
    try {
      const connectedWallets = await WalletConnectionService.getConnectedWallets();
      setWallets(connectedWallets);
    } catch (error) {
      console.error('Error loading wallets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadWallets();
    setRefreshing(false);
  };

  const handleWalletSelect = async (wallet: ConnectedWallet) => {
    try {
      await WalletConnectionService.setPrimaryWallet(wallet.address);
      onWalletSelected?.(wallet);
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to select wallet');
    }
  };

  const handleAddWallet = () => {
    WalletConnectionService.showWalletConnectionOptions();
    // Refresh after potential wallet addition
    setTimeout(() => loadWallets(), 1000);
  };

  const handleCopyAddress = async (address: string) => {
    try {
      await Clipboard.setStringAsync(address);
      Alert.alert('Copied!', 'Wallet address copied to clipboard');
    } catch (error) {
      console.error('Clipboard error:', error);
      Alert.alert('Copy Failed', 'Could not copy to clipboard. Please copy manually: ' + address);
    }
  };

  const handleDisconnectWallet = (wallet: ConnectedWallet) => {
    Alert.alert(
      'Disconnect Wallet',
      `Are you sure you want to disconnect "${wallet.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            await WalletConnectionService.disconnectWallet(wallet.address);
            loadWallets();
          }
        }
      ]
    );
  };

  const getWalletTypeIcon = (type: string) => {
    switch (type) {
      case 'generated':
        return <Plus size={16} color="#8B5CF6" />;
      case 'imported':
        return <ArrowDownLeft size={16} color="#10B981" />;
      case 'external':
        return <ExternalLink size={16} color="#F59E0B" />;
      default:
        return <Wallet size={16} color="#6B7280" />;
    }
  };

  const getWalletTypeLabel = (type: string) => {
    switch (type) {
      case 'generated':
        return 'Generated';
      case 'imported':
        return 'Imported';
      case 'external':
        return 'External';
      default:
        return 'Wallet';
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Wallet Manager</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        >
          {wallets.length === 0 ? (
            <View style={styles.emptyState}>
              <Wallet size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No Wallets Connected</Text>
              <Text style={styles.emptyText}>
                Connect your first Algorand wallet to start making payments
              </Text>
              <TouchableOpacity style={styles.addButton} onPress={handleAddWallet}>
                <Text style={styles.addButtonText}>Connect Wallet</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {wallets.map((wallet, index) => (
                <TouchableOpacity
                  key={wallet.address}
                  style={[styles.walletCard, index === 0 && styles.primaryWallet]}
                  onPress={() => handleWalletSelect(wallet)}
                >
                  <LinearGradient
                    colors={index === 0 ? ['#8B5CF6', '#EC4899'] : ['#F9FAFB', '#F3F4F6']}
                    style={styles.walletGradient}
                  >
                    <View style={styles.walletHeader}>
                      <View style={styles.walletInfo}>
                        <View style={styles.walletTypeContainer}>
                          {getWalletTypeIcon(wallet.type)}
                          <Text style={[
                            styles.walletType,
                            index === 0 && styles.primaryText
                          ]}>
                            {getWalletTypeLabel(wallet.type)}
                          </Text>
                          {index === 0 && (
                            <View style={styles.primaryBadge}>
                              <CheckCircle size={12} color="white" />
                              <Text style={styles.primaryBadgeText}>Primary</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[
                          styles.walletName,
                          index === 0 && styles.primaryText
                        ]}>
                          {wallet.name}
                        </Text>
                      </View>
                      
                      <TouchableOpacity
                        onPress={() => handleDisconnectWallet(wallet)}
                        style={styles.disconnectButton}
                      >
                        <Trash2 size={16} color={index === 0 ? "white" : "#EF4444"} />
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      style={styles.addressContainer}
                      onPress={() => handleCopyAddress(wallet.address)}
                    >
                      <Text style={[
                        styles.walletAddress,
                        index === 0 && styles.primaryText
                      ]}>
                        {wallet.address.slice(0, 12)}...{wallet.address.slice(-12)}
                      </Text>
                      <Copy size={14} color={index === 0 ? "white" : "#6B7280"} />
                    </TouchableOpacity>

                    <View style={styles.balanceContainer}>
                      <View style={styles.balanceItem}>
                        <Text style={[
                          styles.balanceLabel,
                          index === 0 && styles.primaryText
                        ]}>
                          ALGO Balance
                        </Text>
                        <Text style={[
                          styles.balanceValue,
                          index === 0 && styles.primaryText
                        ]}>
                          {wallet.balance?.toFixed(4) || '0.0000'}
                        </Text>
                      </View>
                      
                      <View style={styles.balanceItem}>
                        <Text style={[
                          styles.balanceLabel,
                          index === 0 && styles.primaryText
                        ]}>
                          Zyro Balance
                        </Text>
                        <Text style={[
                          styles.balanceValue,
                          index === 0 && styles.primaryText
                        ]}>
                          {wallet.zyroBalance?.toFixed(2) || '0.00'}
                        </Text>
                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}

              <TouchableOpacity style={styles.addWalletCard} onPress={handleAddWallet}>
                <Plus size={24} color="#8B5CF6" />
                <Text style={styles.addWalletText}>Add Another Wallet</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    fontFamily: 'Inter-Regular',
  },
  addButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  walletCard: {
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  primaryWallet: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  walletGradient: {
    padding: 16,
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  walletInfo: {
    flex: 1,
  },
  walletTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  walletType: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
    fontFamily: 'Inter-Medium',
  },
  primaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  primaryBadgeText: {
    fontSize: 10,
    color: 'white',
    marginLeft: 2,
    fontFamily: 'Inter-Medium',
  },
  walletName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
  },
  primaryText: {
    color: 'white',
  },
  disconnectButton: {
    padding: 8,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  walletAddress: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
    flex: 1,
  },
  balanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceItem: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Inter-Regular',
    marginBottom: 2,
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
  },
  addWalletCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginVertical: 8,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  addWalletText: {
    fontSize: 16,
    color: '#8B5CF6',
    marginLeft: 8,
    fontFamily: 'Inter-Medium',
  },
});
