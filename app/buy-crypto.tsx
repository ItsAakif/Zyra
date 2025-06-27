import React, { useState } from 'react';
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
  CreditCard, 
  DollarSign, 
  TrendingUp,
  Shield,
  Clock,
  CheckCircle,
  AlertCircle,
  Wallet
} from 'lucide-react-native';
import { useTheme } from '@/lib/theme';

export default function BuyCryptoScreen() {
  const { theme } = useTheme();
  const [selectedCrypto, setSelectedCrypto] = useState('ALGO');
  const [fiatAmount, setFiatAmount] = useState('100');
  const [selectedPayment, setSelectedPayment] = useState('card');

  const cryptoOptions = [
    {
      symbol: 'ALGO',
      name: 'Algorand',
      price: 0.32,
      change: '+2.1%',
      icon: '🅰️'
    },
    {
      symbol: 'ZYR',
      name: 'Zyro Token',
      price: 2.0,
      change: '+12.5%',
      icon: '⚡'
    },
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      price: 43250,
      change: '+1.8%',
      icon: '₿'
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      price: 2680,
      change: '-0.5%',
      icon: '♦️'
    }
  ];

  const paymentMethods = [
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: CreditCard,
      fee: '2.9%',
      time: 'Instant'
    },
    {
      id: 'bank',
      name: 'Bank Transfer',
      icon: DollarSign,
      fee: '0.5%',
      time: '1-3 days'
    },
    {
      id: 'apple',
      name: 'Apple Pay',
      icon: Wallet,
      fee: '2.9%',
      time: 'Instant'
    }
  ];

  const selectedCryptoData = cryptoOptions.find(crypto => crypto.symbol === selectedCrypto);
  const selectedPaymentData = paymentMethods.find(method => method.id === selectedPayment);
  const cryptoAmount = selectedCryptoData ? (parseFloat(fiatAmount) / selectedCryptoData.price).toFixed(6) : '0';
  const fee = selectedPaymentData ? (parseFloat(fiatAmount) * parseFloat(selectedPaymentData.fee.replace('%', '')) / 100).toFixed(2) : '0';
  const total = (parseFloat(fiatAmount) + parseFloat(fee)).toFixed(2);

  const handleBuy = () => {
    Alert.alert(
      'Buy Crypto',
      `You are about to buy ${cryptoAmount} ${selectedCrypto} for $${total} (including $${fee} fee).\n\nThis feature is coming soon!`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Coming Soon', onPress: () => {} }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: theme.colors.surface }]}>
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Buy Crypto</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Amount Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Amount to Spend</Text>
          <View style={[styles.amountContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.currencySymbol, { color: theme.colors.textSecondary }]}>$</Text>
            <TextInput
              style={[styles.amountInput, { color: theme.colors.text }]}
              value={fiatAmount}
              onChangeText={setFiatAmount}
              placeholder="0.00"
              keyboardType="numeric"
              placeholderTextColor={theme.colors.textSecondary}
            />
            <Text style={[styles.currencyText, { color: theme.colors.textSecondary }]}>USD</Text>
          </View>
          <Text style={[styles.amountNote, { color: theme.colors.textSecondary }]}>
            You'll receive approximately {cryptoAmount} {selectedCrypto}
          </Text>
        </View>

        {/* Crypto Selection */}
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Select Cryptocurrency</Text>
          <View style={styles.cryptoGrid}>
            {cryptoOptions.map((crypto) => (
              <TouchableOpacity
                key={crypto.symbol}
                style={[
                  styles.cryptoOption,
                  { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                  selectedCrypto === crypto.symbol && { borderColor: theme.colors.primary, backgroundColor: theme.colors.primarySurface }
                ]}
                onPress={() => setSelectedCrypto(crypto.symbol)}
              >
                <Text style={styles.cryptoIcon}>{crypto.icon}</Text>
                <Text style={[styles.cryptoSymbol, { color: theme.colors.text }]}>{crypto.symbol}</Text>
                <Text style={[styles.cryptoName, { color: theme.colors.textSecondary }]}>{crypto.name}</Text>
                <Text style={[styles.cryptoPrice, { color: theme.colors.text }]}>${crypto.price.toLocaleString()}</Text>
                <Text style={[
                  styles.cryptoChange,
                  crypto.change.startsWith('+') ? styles.positiveChange : styles.negativeChange
                ]}>
                  {crypto.change}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Payment Method */}
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Payment Method</Text>
          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.paymentMethod,
                { borderColor: theme.colors.border },
                selectedPayment === method.id && { borderColor: theme.colors.primary, backgroundColor: theme.colors.primarySurface }
              ]}
              onPress={() => setSelectedPayment(method.id)}
            >
              <View style={styles.paymentHeader}>
                <View style={[styles.paymentIcon, { backgroundColor: theme.colors.primarySurface }]}>
                  <method.icon size={24} color={theme.colors.primary} />
                </View>
                <View style={styles.paymentInfo}>
                  <Text style={[styles.paymentName, { color: theme.colors.text }]}>{method.name}</Text>
                  <View style={styles.paymentDetails}>
                    <Text style={[styles.paymentFee, { color: theme.colors.textSecondary }]}>Fee: {method.fee}</Text>
                    <Text style={[styles.paymentTime, { color: theme.colors.textSecondary }]}>{method.time}</Text>
                  </View>
                </View>
                {selectedPayment === method.id && (
                  <CheckCircle size={20} color={theme.colors.primary} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Order Summary */}
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Order Summary</Text>
          
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>You're buying</Text>
            <Text style={[styles.summaryValue, { color: theme.colors.text }]}>{cryptoAmount} {selectedCrypto}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Price per {selectedCrypto}</Text>
            <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
              ${selectedCryptoData?.price.toLocaleString()}
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Subtotal</Text>
            <Text style={[styles.summaryValue, { color: theme.colors.text }]}>${fiatAmount}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
              Fee ({selectedPaymentData?.fee})
            </Text>
            <Text style={[styles.summaryValue, { color: theme.colors.text }]}>${fee}</Text>
          </View>
          
          <View style={[styles.summaryRow, styles.totalRow, { borderTopColor: theme.colors.border }]}>
            <Text style={[styles.totalLabel, { color: theme.colors.text }]}>Total</Text>
            <Text style={[styles.totalValue, { color: theme.colors.text }]}>${total}</Text>
          </View>
        </View>

        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <Shield size={20} color="#10B981" />
          <View style={styles.securityContent}>
            <Text style={styles.securityTitle}>Secure Transaction</Text>
            <Text style={styles.securityText}>
              Your purchase is protected by bank-level security and delivered instantly to your wallet.
            </Text>
          </View>
        </View>

        {/* Buy Button */}
        <TouchableOpacity style={[styles.buyButton, { backgroundColor: theme.colors.primary }]} onPress={handleBuy}>
          <Text style={styles.buyButtonText}>
            Buy {selectedCrypto} - ${total}
          </Text>
        </TouchableOpacity>

        {/* Coming Soon Notice */}
        <View style={styles.comingSoonNotice}>
          <Clock size={20} color="#F59E0B" />
          <View style={styles.comingSoonContent}>
            <Text style={styles.comingSoonTitle}>Feature Coming Soon</Text>
            <Text style={styles.comingSoonText}>
              Crypto purchasing will be available in the next update. For now, you can use the 
              Algorand testnet dispenser to get free testnet ALGO for development.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    borderRadius: 12,
    padding: 20,
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
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
  currencySymbol: {
    fontSize: 24,
    fontWeight: '600',
    color: '#6B7280',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
  },
  currencyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  amountNote: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  cryptoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  cryptoOption: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
  },
  cryptoIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  cryptoSymbol: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  cryptoName: {
    fontSize: 12,
    marginBottom: 4,
  },
  cryptoPrice: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  cryptoChange: {
    fontSize: 12,
    fontWeight: '500',
  },
  positiveChange: {
    color: '#10B981',
  },
  negativeChange: {
    color: '#EF4444',
  },
  paymentMethod: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  paymentDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  paymentFee: {
    fontSize: 14,
  },
  paymentTime: {
    fontSize: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
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
  buyButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginVertical: 10,
  },
  buyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  comingSoonNotice: {
    flexDirection: 'row',
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 16,
    marginVertical: 10,
    marginBottom: 30,
  },
  comingSoonContent: {
    flex: 1,
    marginLeft: 12,
  },
  comingSoonTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
    marginBottom: 4,
  },
  comingSoonText: {
    fontSize: 14,
    color: '#D97706',
    lineHeight: 18,
  },
});
