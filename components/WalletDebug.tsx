import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Wallet, 
  RefreshCw, 
  Copy, 
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Loader
} from 'lucide-react-native';
import { realWalletService, WalletState } from '../lib/real-wallet';
import { algorandService } from '../lib/algorand';
import * as Clipboard from 'expo-clipboard';

export default function WalletDebug() {
  const [walletState, setWalletState] = useState<WalletState>(realWalletService.getState());
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const unsubscribe = realWalletService.subscribe(setWalletState);
    return unsubscribe;
  }, []);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`${timestamp}: ${message}`, ...prev.slice(0, 9)]);
  };

  const handleCreateWallet = async () => {
    addLog('🔄 Starting wallet creation...');
    try {
      await realWalletService.createTestWallet();
      addLog('✅ Wallet creation completed');
    } catch (error) {
      addLog(`❌ Wallet creation failed: ${error}`);
    }
  };

  const handleRefreshBalance = async () => {
    addLog('🔄 Refreshing balance...');
    // Force balance update
    if (walletState.address) {
      try {
        const balance = await algorandService.getAccountBalance(walletState.address);
        addLog(`💰 Balance updated: ${balance.toFixed(6)} ALGO`);
      } catch (error) {
        addLog(`❌ Balance refresh failed: ${error}`);
      }
    }
  };

  const copyAddress = async () => {
    if (walletState.address) {
      await Clipboard.setStringAsync(walletState.address);
      Alert.alert('Copied!', 'Wallet address copied to clipboard');
    }
  };

  const openInExplorer = () => {
    if (walletState.address) {
      const url = `https://testnet.explorer.perawallet.app/address/${walletState.address}`;
      Alert.alert(
        'View in Explorer',
        'Open wallet in Algorand testnet explorer?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open', onPress: () => console.log('Would open:', url) }
        ]
      );
    }
  };

  const getStatusColor = () => {
    if (walletState.isLoading) return '#F59E0B';
    if (walletState.error) return '#EF4444';
    if (walletState.isConnected) return '#10B981';
    return '#6B7280';
  };

  const getStatusText = () => {
    if (walletState.isLoading) return 'Creating...';
    if (walletState.error) return 'Error';
    if (walletState.isConnected) return 'Connected';
    return 'Disconnected';
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[getStatusColor(), getStatusColor() + '80']}
        style={styles.header}
      >
        <View style={styles.statusRow}>
          <Wallet size={24} color="white" />
          <Text style={styles.statusText}>{getStatusText()}</Text>
          {walletState.isLoading && <Loader size={20} color="white" />}
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Wallet Info */}
        {walletState.isConnected && walletState.address && (
          <View style={styles.walletInfo}>
            <Text style={styles.label}>Wallet Address:</Text>
            <View style={styles.addressRow}>
              <Text style={styles.address} numberOfLines={1}>
                {walletState.address}
              </Text>
              <TouchableOpacity onPress={copyAddress} style={styles.iconButton}>
                <Copy size={16} color="#8B5CF6" />
              </TouchableOpacity>
              <TouchableOpacity onPress={openInExplorer} style={styles.iconButton}>
                <ExternalLink size={16} color="#8B5CF6" />
              </TouchableOpacity>
            </View>

            <View style={styles.balanceRow}>
              <View style={styles.balanceItem}>
                <Text style={styles.balanceLabel}>ALGO</Text>
                <Text style={styles.balanceValue}>
                  {walletState.algoBalance.toFixed(6)}
                </Text>
              </View>
              <View style={styles.balanceItem}>
                <Text style={styles.balanceLabel}>ZYRO</Text>
                <Text style={styles.balanceValue}>
                  {walletState.zyroBalance.toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Error Display */}
        {walletState.error && (
          <View style={styles.errorContainer}>
            <AlertCircle size={16} color="#EF4444" />
            <Text style={styles.errorText}>{walletState.error}</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={handleCreateWallet}
            disabled={walletState.isLoading}
          >
            <Text style={styles.primaryButtonText}>
              {walletState.isConnected ? 'Create New Wallet' : 'Create Wallet'}
            </Text>
          </TouchableOpacity>

          {walletState.isConnected && (
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={handleRefreshBalance}
              disabled={walletState.isLoading}
            >
              <RefreshCw size={16} color="#8B5CF6" />
              <Text style={styles.secondaryButtonText}>Refresh</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Debug Logs */}
        <View style={styles.logsContainer}>
          <Text style={styles.logsTitle}>Debug Logs:</Text>
          <ScrollView style={styles.logsScroll} showsVerticalScrollIndicator={false}>
            {logs.map((log, index) => (
              <Text key={index} style={styles.logText}>
                {log}
              </Text>
            ))}
            {logs.length === 0 && (
              <Text style={styles.noLogsText}>No logs yet...</Text>
            )}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    margin: 16,
  },
  header: {
    padding: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  content: {
    padding: 16,
  },
  walletInfo: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  address: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#374151',
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 6,
  },
  iconButton: {
    padding: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    gap: 16,
  },
  balanceItem: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#8B5CF6',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  secondaryButtonText: {
    color: '#8B5CF6',
    fontSize: 14,
    fontWeight: '600',
  },
  logsContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
  },
  logsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  logsScroll: {
    maxHeight: 120,
  },
  logText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#6B7280',
    marginBottom: 2,
  },
  noLogsText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
});
