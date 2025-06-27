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
  ArrowUpDown, 
  TrendingUp,
  Clock,
  CheckCircle,
  RefreshCw,
  Info
} from 'lucide-react-native';
import { useTheme } from '@/lib/theme';

export default function ConvertCryptoScreen() {
  const { theme } = useTheme();
  const [fromCrypto, setFromCrypto] = useState('ALGO');
  const [toCrypto, setToCrypto] = useState('ZYR');
  const [fromAmount, setFromAmount] = useState('100');
  const [refreshing, setRefreshing] = useState(false);

  const cryptoOptions = [
    {
      symbol: 'ALGO',
      name: 'Algorand',
      price: 0.32,
      balance: 1250.5,
      icon: '🅰️'
    },
    {
      symbol: 'ZYR',
      name: 'Zyro Token',
      price: 2.0,
      balance: 75.25,
      icon: '⚡'
    },
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      price: 43250,
      balance: 0.025,
      icon: '₿'
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      price: 2680,
      balance: 0.5,
      icon: '♦️'
    }
  ];

  const fromCryptoData = cryptoOptions.find(crypto => crypto.symbol === fromCrypto);
  const toCryptoData = cryptoOptions.find(crypto => crypto.symbol === toCrypto);
  
  const exchangeRate = fromCryptoData && toCryptoData 
    ? fromCryptoData.price / toCryptoData.price 
    : 0;
  
  const toAmount = fromAmount ? (parseFloat(fromAmount) * exchangeRate).toFixed(6) : '0';
  const fee = fromAmount ? (parseFloat(fromAmount) * 0.005).toFixed(6) : '0'; // 0.5% fee
  const netReceive = toAmount ? (parseFloat(toAmount) - parseFloat(fee)).toFixed(6) : '0';

  const handleSwapCrypto = () => {
    const temp = fromCrypto;
    setFromCrypto(toCrypto);
    setToCrypto(temp);
  };

  const handleRefreshRates = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      Alert.alert('Rates Updated', 'Exchange rates have been refreshed.');
    }, 1000);
  };

  const handleConvert = () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount to convert.');
      return;
    }

    if (fromCryptoData && parseFloat(fromAmount) > fromCryptoData.balance) {
      Alert.alert('Insufficient Balance', `You don't have enough ${fromCrypto} to convert.`);
      return;
    }

    Alert.alert(
      'Convert Crypto',
      `Convert ${fromAmount} ${fromCrypto} to ${netReceive} ${toCrypto}?\n\nExchange rate: 1 ${fromCrypto} = ${exchangeRate.toFixed(6)} ${toCrypto}\nFee: ${fee} ${fromCrypto}\n\nThis feature is coming soon!`,
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
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Convert Crypto</Text>
        <TouchableOpacity onPress={handleRefreshRates} style={styles.refreshButton}>
          <RefreshCw size={20} color="#8B5CF6" style={{ transform: [{ rotate: refreshing ? '180deg' : '0deg' }] }} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* From Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>From</Text>
          
          <View style={styles.cryptoSelector}>
            <TouchableOpacity style={styles.cryptoButton}>
              <Text style={styles.cryptoIcon}>{fromCryptoData?.icon}</Text>
              <View style={styles.cryptoInfo}>
                <Text style={styles.cryptoSymbol}>{fromCrypto}</Text>
                <Text style={styles.cryptoName}>{fromCryptoData?.name}</Text>
              </View>
              <View style={styles.cryptoBalance}>
                <Text style={styles.balanceText}>
                  {fromCryptoData?.balance.toLocaleString()} {fromCrypto}
                </Text>
                <Text style={styles.balanceUsd}>
                  ${((fromCryptoData?.balance || 0) * (fromCryptoData?.price || 0)).toLocaleString()}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.amountContainer}>
            <TextInput
              style={styles.amountInput}
              value={fromAmount}
              onChangeText={setFromAmount}
              placeholder="0.00"
              keyboardType="numeric"
              placeholderTextColor="#9CA3AF"
            />
            <TouchableOpacity
              style={styles.maxButton}
              onPress={() => setFromAmount(fromCryptoData?.balance.toString() || '0')}
            >
              <Text style={styles.maxButtonText}>MAX</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Swap Button */}
        <View style={styles.swapContainer}>
          <TouchableOpacity style={styles.swapButton} onPress={handleSwapCrypto}>
            <ArrowUpDown size={20} color="#8B5CF6" />
          </TouchableOpacity>
        </View>

        {/* To Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>To</Text>
          
          <View style={styles.cryptoSelector}>
            <TouchableOpacity style={styles.cryptoButton}>
              <Text style={styles.cryptoIcon}>{toCryptoData?.icon}</Text>
              <View style={styles.cryptoInfo}>
                <Text style={styles.cryptoSymbol}>{toCrypto}</Text>
                <Text style={styles.cryptoName}>{toCryptoData?.name}</Text>
              </View>
              <View style={styles.cryptoBalance}>
                <Text style={styles.balanceText}>
                  {toCryptoData?.balance.toLocaleString()} {toCrypto}
                </Text>
                <Text style={styles.balanceUsd}>
                  ${((toCryptoData?.balance || 0) * (toCryptoData?.price || 0)).toLocaleString()}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.amountContainer}>
            <Text style={styles.receiveAmount}>{toAmount} {toCrypto}</Text>
          </View>
        </View>

        {/* Exchange Rate */}
        <View style={styles.rateSection}>
          <View style={styles.rateHeader}>
            <TrendingUp size={20} color="#10B981" />
            <Text style={styles.rateTitle}>Exchange Rate</Text>
          </View>
          <Text style={styles.rateValue}>
            1 {fromCrypto} = {exchangeRate.toFixed(6)} {toCrypto}
          </Text>
          <Text style={styles.rateTime}>Updated just now</Text>
        </View>

        {/* Conversion Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conversion Summary</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>You're converting</Text>
            <Text style={styles.summaryValue}>{fromAmount} {fromCrypto}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Exchange rate</Text>
            <Text style={styles.summaryValue}>
              1 {fromCrypto} = {exchangeRate.toFixed(6)} {toCrypto}
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>You'll receive</Text>
            <Text style={styles.summaryValue}>{toAmount} {toCrypto}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Network fee (0.5%)</Text>
            <Text style={styles.summaryValue}>{fee} {fromCrypto}</Text>
          </View>
          
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Net amount received</Text>
            <Text style={styles.totalValue}>{netReceive} {toCrypto}</Text>
          </View>
        </View>

        {/* Info Notice */}
        <View style={styles.infoNotice}>
          <Info size={20} color="#3B82F6" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Best Rate Guarantee</Text>
            <Text style={styles.infoText}>
              We automatically find the best exchange rate across multiple liquidity providers 
              to ensure you get the most value for your conversion.
            </Text>
          </View>
        </View>

        {/* Convert Button */}
        <TouchableOpacity style={styles.convertButton} onPress={handleConvert}>
          <Text style={styles.convertButtonText}>
            Convert {fromCrypto} to {toCrypto}
          </Text>
        </TouchableOpacity>

        {/* Coming Soon Notice */}
        <View style={styles.comingSoonNotice}>
          <Clock size={20} color="#F59E0B" />
          <View style={styles.comingSoonContent}>
            <Text style={styles.comingSoonTitle}>Feature Coming Soon</Text>
            <Text style={styles.comingSoonText}>
              Crypto conversion will be available in the next update. This feature will use 
              real-time exchange rates and smart routing for optimal conversions.
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
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  cryptoSelector: {
    marginBottom: 16,
  },
  cryptoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cryptoIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  cryptoInfo: {
    flex: 1,
  },
  cryptoSymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  cryptoName: {
    fontSize: 14,
    color: '#6B7280',
  },
  cryptoBalance: {
    alignItems: 'flex-end',
  },
  balanceText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  balanceUsd: {
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
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
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
  receiveAmount: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  swapContainer: {
    alignItems: 'center',
    marginVertical: 5,
  },
  swapButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  rateSection: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    marginVertical: 10,
  },
  rateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rateTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 8,
  },
  rateValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 4,
  },
  rateTime: {
    fontSize: 12,
    color: '#6B7280',
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
    color: '#10B981',
  },
  infoNotice: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 10,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 18,
  },
  convertButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginVertical: 10,
  },
  convertButtonText: {
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
