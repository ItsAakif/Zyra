import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Modal,
  TextInput,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Flashlight, FlashlightOff, Image as ImageIcon, CircleCheck as CheckCircle, CircleAlert as AlertCircle, Loader } from 'lucide-react-native';
import { authService } from '@/lib/auth';
import { PaymentProcessor } from '@/lib/payment-processor';
import { QRParser } from '@/lib/qr-parser';
import { realWalletService } from '@/lib/real-wallet';

import { useTheme } from '@/lib/theme';

const { width, height } = Dimensions.get('window');

export default function ScanScreen() {
  const { theme } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [qrData, setQrData] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState(realWalletService.getState());

  const authState = authService.getAuthState();

  useEffect(() => {
    // Listen for wallet changes
    const unsubscribe = realWalletService.subscribe((walletState) => {
      console.log('🔄 [SCAN] Wallet changed:', walletState.isConnected ? walletState.address?.slice(0, 8) + '...' : 'disconnected');
      setConnectedWallet(walletState);
    });
    return unsubscribe;
  }, []);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    
    setScanned(true);
    const parsedData = QRParser.parseQRCode(data);
    setQrData(parsedData);
    setShowPaymentModal(true);
  };

  const processPayment = async () => {
    if (!qrData || !paymentAmount || !authState.user) return;
    
    setProcessing(true);
    
    try {
      const result = await PaymentProcessor.processPayment(
        qrData,
        parseFloat(paymentAmount),
        `Payment via ${qrData.type}`
      );

      if (result.success) {
        setShowPaymentModal(false);
        setScanned(false);
        setQrData(null);
        setPaymentAmount('');
        
        Alert.alert(
          'Payment Successful!',
          `Payment of ${paymentAmount} ${qrData.currency} completed.\n\nTransaction ID: ${result.algorandTxId}\n\nYou earned ${result.zyroReward?.toFixed(2)} Zyros!`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Payment Failed', result.error || 'Please try again');
      }
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Error', 'Payment processing failed');
    } finally {
      setProcessing(false);
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setQrData(null);
    setShowPaymentModal(false);
    setPaymentAmount('');
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.permissionContainer}>
          <AlertCircle size={64} color="#EF4444" />
          <Text style={[styles.permissionTitle, { color: theme.colors.text }]}>Camera Permission Required</Text>
          <Text style={[styles.permissionText, { color: theme.colors.textSecondary }]}>
            We need camera access to scan QR codes for payments
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!authState.isAuthenticated || !connectedWallet?.isConnected) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.permissionContainer}>
          <AlertCircle size={64} color="#F59E0B" />
          <Text style={[styles.permissionTitle, { color: theme.colors.text }]}>
            {!authState.isAuthenticated ? 'Please Sign In' : 'Wallet Not Connected'}
          </Text>
          <Text style={[styles.permissionText, { color: theme.colors.textSecondary }]}>
            {!authState.isAuthenticated 
              ? 'Sign in to your account to continue' 
              : 'Connect a test wallet to make payments with any QR code'
            }
          </Text>
          {authState.isAuthenticated && (
            <TouchableOpacity 
              style={styles.connectWalletButton}
              onPress={() => {
                console.log('🔄 [SCAN] Connect Test Wallet button pressed');
                try {
                  realWalletService.createTestWallet();
                  console.log('🔄 [SCAN] Dialog should be showing...');
                } catch (error) {
                  console.error('❌ [SCAN] Error showing dialog:', error);
                }
              }}
            >
              <Text style={styles.connectWalletButtonText}>Connect Test Wallet</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Scan QR Code</Text>
          <TouchableOpacity
            style={styles.flashButton}
            onPress={() => setFlashEnabled(!flashEnabled)}
          >
            {flashEnabled ? (
              <FlashlightOff size={24} color="white" />
            ) : (
              <Flashlight size={24} color="white" />
            )}
          </TouchableOpacity>
        </View>

        {/* Scanning Frame */}
        <View style={styles.scanningArea}>
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            Point your camera at any payment QR code
          </Text>
          <Text style={styles.supportedText}>
            Supports UPI, PIX, Alipay, PayNow & more
          </Text>
        </View>

        {/* Gallery Button */}
        <TouchableOpacity style={styles.galleryButton}>
          <ImageIcon size={24} color="white" />
        </TouchableOpacity>
      </CameraView>

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={resetScanner}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Confirm Payment</Text>
              <TouchableOpacity onPress={resetScanner}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {qrData && (
              <View style={styles.paymentDetails}>
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentLabel}>Payment Method</Text>
                  <View style={styles.paymentMethodRow}>
                    <Text style={styles.paymentMethod}>{qrData.type}</Text>
                    <Text style={styles.paymentCountry}>{qrData.country}</Text>
                  </View>
                </View>

                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentLabel}>Recipient</Text>
                  <Text style={styles.paymentValue}>{qrData.recipient}</Text>
                </View>

                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentLabel}>Amount ({qrData.currency})</Text>
                  <TextInput
                    style={styles.amountInput}
                    value={paymentAmount}
                    onChangeText={setPaymentAmount}
                    placeholder={qrData.amount ? qrData.amount.toString() : "Enter amount"}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.rewardInfo}>
                  <Text style={styles.rewardText}>
                    You'll earn {paymentAmount ? (parseFloat(paymentAmount) * 0.1).toFixed(2) : '0'} Zyros
                  </Text>
                </View>

                <View style={styles.walletInfo}>
                  <Text style={styles.walletLabel}>Paying from</Text>
                  <Text style={styles.walletAddress}>
                    {connectedWallet?.name || 'Unknown Wallet'}
                  </Text>
                  <Text style={styles.walletAddressSmall}>
                    {connectedWallet?.address.slice(0, 8)}...{connectedWallet?.address.slice(-8)}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={resetScanner}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.payButton, (!paymentAmount || processing) && styles.payButtonDisabled]}
                onPress={processPayment}
                disabled={!paymentAmount || processing}
              >
                {processing ? (
                  <Loader size={20} color="white" />
                ) : (
                  <Text style={styles.payButtonText}>Pay Now</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Inter-SemiBold',
  },
  flashButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanningArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#8B5CF6',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  instructions: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  instructionText: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    fontFamily: 'Inter-Medium',
    marginBottom: 8,
  },
  supportedText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
  },
  galleryButton: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'SpaceGrotesk-Bold',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
    marginBottom: 32,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Inter-SemiBold',
  },
  connectWalletButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  connectWalletButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Inter-SemiBold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: height * 0.8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
  },
  paymentDetails: {
    marginBottom: 32,
  },
  paymentInfo: {
    marginBottom: 20,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentMethod: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
  },
  paymentCountry: {
    fontSize: 14,
    color: '#8B5CF6',
    fontFamily: 'Inter-Medium',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  paymentValue: {
    fontSize: 16,
    color: '#111827',
    fontFamily: 'Inter-Medium',
  },
  amountInput: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
  },
  rewardInfo: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginBottom: 16,
  },
  rewardText: {
    fontSize: 14,
    color: '#0369A1',
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  walletInfo: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  walletLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  walletAddress: {
    fontSize: 14,
    color: '#111827',
    fontFamily: 'Inter-Medium',
  },
  walletAddressSmall: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: 'Inter-SemiBold',
  },
  payButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Inter-SemiBold',
  },
});