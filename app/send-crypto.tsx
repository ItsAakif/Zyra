import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { 
  ArrowLeft, 
  Send, 
  QrCode,
  Users,
  Clock,
  Shield,
  CheckCircle
} from 'lucide-react-native';
import { realWalletService } from '@/lib/real-wallet';
import { useTheme } from '@/lib/theme';

export default function SendCryptoScreen() {
  const { theme } = useTheme();
  const [walletState, setWalletState] = useState(realWalletService.getState());
  const [selectedCrypto, setSelectedCrypto] = useState('ALGO');
  const [amount, setAmount] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const unsubscribe = realWalletService.subscribe(setWalletState);
    return unsubscribe;
  }, []);

  const cryptoOptions = [
    {
      symbol: 'ALGO',
      name: 'Algorand',
      balance: walletState.algoBalance || 0,
      icon: '🅰️'
    },
    {
      symbol: 'ZYR',
      name: 'Zyro Token',
      balance: walletState.zyroBalance || 0,
      icon: '⚡'
    }
  ];

  const selectedCryptoData = cryptoOptions.find(crypto => crypto.symbol === selectedCrypto);
  const maxAmount = selectedCryptoData?.balance || 0;
  
  // Validate Algorand address - trim whitespace and check length
  const trimmedAddress = recipientAddress.trim();
  const isValidAddress = trimmedAddress.length === 58 && /^[A-Z2-7]+$/.test(trimmedAddress);
  
  const canSend = amount && parseFloat(amount) > 0 && parseFloat(amount) <= maxAmount && isValidAddress;

  const handleSend = async () => {
    if (!canSend) return;

    setSending(true);
    try {
      const result = await realWalletService.sendPayment(
        trimmedAddress,
        parseFloat(amount),
        selectedCrypto as 'ALGO' | 'ZYRO',
        note
      );

      Alert.alert(
        'Transaction Sent!',
        `Successfully sent ${amount} ${selectedCrypto}\nTransaction ID: ${result}`,
        [
          { text: 'View in Explorer', onPress: () => {
            // Open transaction in explorer
          }},
          { text: 'Done', onPress: () => router.back() }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send transaction. Please try again.');
      console.error('Send error:', error);
    } finally {
      setSending(false);
    }
  };

  const handleScanQR = () => {
    router.push('/(tabs)/scan');
  };

  const handleRecentRecipient = (address: string) => {
    setRecipientAddress(address);
  };

  const handleMaxAmount = () => {
    setAmount(maxAmount.toString());
  };

  if (!walletState.isConnected) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.header, { backgroundColor: theme.colors.card }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Send Crypto</Text>
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.connectWalletContainer}>
          <Text style={[styles.connectTitle, { color: theme.colors.text }]}>Wallet Not Connected</Text>
          <Text style={[styles.connectSubtitle, { color: theme.colors.textSecondary }]}>
            Please connect your wallet to send cryptocurrency
          </Text>
          <TouchableOpacity 
            style={styles.connectButton}
            onPress={() => router.push('/(tabs)/wallet')}
          >
            <Text style={styles.connectButtonText}>Go to Wallet</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.card }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Send Crypto</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Currency Selection */}
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Select Currency</Text>
          <View style={styles.cryptoGrid}>
            {cryptoOptions.map((crypto) => (
              <TouchableOpacity
                key={crypto.symbol}
                style={[
                  styles.cryptoOption,
                  { backgroundColor: theme.colors.surface },
                  selectedCrypto === crypto.symbol && styles.selectedCrypto
                ]}
                onPress={() => setSelectedCrypto(crypto.symbol)}
              >
                <Text style={styles.cryptoIcon}>{crypto.icon}</Text>
                <Text style={[styles.cryptoSymbol, { color: theme.colors.text }]}>{crypto.symbol}</Text>
                <Text style={[styles.cryptoBalance, { color: theme.colors.textSecondary }]}>
                  {crypto.balance.toLocaleString()} {crypto.symbol}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Amount Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Amount</Text>
          <View style={[styles.amountContainer, { backgroundColor: theme.colors.surface }]}>
            <TextInput
              style={[styles.amountInput, { color: theme.colors.text }]}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="numeric"
              placeholderTextColor={theme.colors.textSecondary}
            />
            <Text style={[styles.currencyLabel, { color: theme.colors.textSecondary }]}>{selectedCrypto}</Text>
          </View>
          <View style={styles.amountActions}>
            <TouchableOpacity style={styles.maxButton} onPress={handleMaxAmount}>
              <Text style={styles.maxButtonText}>MAX</Text>
            </TouchableOpacity>
            <Text style={[styles.availableText, { color: theme.colors.textSecondary }]}>
              Available: {maxAmount.toLocaleString()} {selectedCrypto}
            </Text>
          </View>
        </View>

        {/* Recipient Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Recipient</Text>
            <TouchableOpacity style={styles.scanButton} onPress={handleScanQR}>
              <QrCode size={20} color="#8B5CF6" />
              <Text style={styles.scanButtonText}>Scan QR</Text>
            </TouchableOpacity>
          </View>
          
          <TextInput
            style={[styles.addressInput, { backgroundColor: theme.colors.surface, color: theme.colors.text }]}
            value={recipientAddress}
            onChangeText={setRecipientAddress}
            placeholder="Enter Algorand address (58 characters)"
            placeholderTextColor={theme.colors.textSecondary}
            multiline
          />
          
          {recipientAddress.length > 0 && !isValidAddress && (
            <Text style={styles.errorText}>
              {trimmedAddress.length !== 58 
                ? `Address must be exactly 58 characters (current: ${trimmedAddress.length})`
                : 'Invalid Algorand address format'
              }
            </Text>
          )}
        </View>

        {/* Recent Recipients */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Recipients</Text>
          <View style={styles.recentRecipients}>
            <TouchableOpacity 
              style={styles.recentRecipient}
              onPress={() => handleRecentRecipient('SAMPLEADDRESS123456789012345678901234567890123456AB')}
            >
              <Users size={20} color="#6B7280" />
              <View style={styles.recipientInfo}>
                <Text style={styles.recipientName}>Sample Address</Text>
                <Text style={styles.recipientAddress}>SAMPLE...56AB</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Note Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Note (Optional)</Text>
          <TextInput
            style={styles.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder="Add a note to this transaction"
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={1000}
          />
        </View>

        {/* Transaction Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaction Summary</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>You're sending</Text>
            <Text style={styles.summaryValue}>{amount || '0'} {selectedCrypto}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Network fee</Text>
            <Text style={styles.summaryValue}>0.001 ALGO</Text>
          </View>
          
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              {amount ? (parseFloat(amount) + 0.001).toFixed(6) : '0.001'} ALGO
            </Text>
          </View>
        </View>

        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <Shield size={20} color="#10B981" />
          <View style={styles.securityContent}>
            <Text style={styles.securityTitle}>Secure Transaction</Text>
            <Text style={styles.securityText}>
              All transactions are secured by the Algorand blockchain and cannot be reversed.
            </Text>
          </View>
        </View>

        {/* Send Button */}
        <TouchableOpacity 
          style={[styles.sendButton, !canSend && styles.sendButtonDisabled]} 
          onPress={handleSend}
          disabled={!canSend || sending}
        >
          {sending ? (
            <Text style={styles.sendButtonText}>Sending...</Text>
          ) : (
            <>
              <Send size={20} color="white" />
              <Text style={styles.sendButtonText}>Send {selectedCrypto}</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginVertical: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  cryptoGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  cryptoOption: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  selectedCrypto: {
    borderColor: '#8B5CF6',
    backgroundColor: '#EEF2FF',
  },
  cryptoIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  cryptoSymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  cryptoBalance: {
    fontSize: 12,
    color: '#6B7280',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
  },
  currencyLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  amountActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  maxButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  maxButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  availableText: {
    fontSize: 14,
    color: '#6B7280',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  scanButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8B5CF6',
  },
  addressInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 14,
    color: '#111827',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 8,
  },
  recentRecipients: {
    gap: 12,
  },
  recentRecipient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  recipientInfo: {
    marginLeft: 12,
  },
  recipientName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  recipientAddress: {
    fontSize: 12,
    color: '#6B7280',
  },
  noteInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 14,
    color: '#111827',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginTop: 8,
    paddingTop: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  securityNotice: {
    flexDirection: 'row',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    marginVertical: 10,
  },
  securityContent: {
    flex: 1,
    marginLeft: 12,
  },
  securityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 4,
  },
  securityText: {
    fontSize: 14,
    color: '#059669',
    lineHeight: 18,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 16,
    marginVertical: 10,
    marginBottom: 30,
    gap: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
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
    marginBottom: 12,
    textAlign: 'center',
  },
  connectSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
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
  },
});
