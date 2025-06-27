// Simple wallet management that definitely works
import { Alert } from 'react-native';

export interface SimpleWallet {
  address: string;
  name: string;
  type: 'mock' | 'real';
  balance: number;
}

// In-memory storage for now (will persist later)
let connectedWallet: SimpleWallet | null = null;
let walletListeners: ((wallet: SimpleWallet | null) => void)[] = [];

export class SimpleWalletService {
  
  static getWallet(): SimpleWallet | null {
    return connectedWallet;
  }
  
  static isWalletConnected(): boolean {
    return connectedWallet !== null;
  }
  
  static createMockWallet(name?: string): SimpleWallet {
    console.log('🧪 Creating simple mock wallet...');
    
    // Generate mock Algorand address
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let address = '';
    for (let i = 0; i < 58; i++) {
      address += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    const wallet: SimpleWallet = {
      address,
      name: name || `Test Wallet ${address.slice(0, 6)}`,
      type: 'mock',
      balance: 0.0000
    };
    
    console.log('✅ Mock wallet created:', wallet.address.slice(0, 8) + '...');
    return wallet;
  }
  
  static connectWallet(wallet: SimpleWallet): void {
    console.log('🔗 Connecting wallet:', wallet.address.slice(0, 8) + '...');
    connectedWallet = wallet;
    
    // Notify all listeners
    walletListeners.forEach(listener => {
      try {
        listener(wallet);
      } catch (error) {
        console.error('Error in wallet listener:', error);
      }
    });
    
    console.log('✅ Wallet connected successfully');
  }
  
  static disconnectWallet(): void {
    console.log('🔌 Disconnecting wallet...');
    connectedWallet = null;
    
    // Notify all listeners
    walletListeners.forEach(listener => {
      try {
        listener(null);
      } catch (error) {
        console.error('Error in wallet listener:', error);
      }
    });
    
    console.log('✅ Wallet disconnected');
  }
  
  static onWalletChange(listener: (wallet: SimpleWallet | null) => void): () => void {
    walletListeners.push(listener);
    
    // Immediately call with current state
    listener(connectedWallet);
    
    // Return unsubscribe function
    return () => {
      const index = walletListeners.indexOf(listener);
      if (index > -1) {
        walletListeners.splice(index, 1);
      }
    };
  }
  
  static showConnectionDialog(): void {
    console.log('🔄 Show connection dialog called');
    
    // For debugging: create wallet immediately without dialog
    const isDev = process.env.EXPO_PUBLIC_ENVIRONMENT === 'development';
    
    if (isDev) {
      console.log('🧪 [DEV MODE] Creating wallet immediately for testing...');
      this.createAndConnectWallet();
      return;
    }
    
    Alert.alert(
      'Connect Test Wallet',
      'This will create a test wallet for development',
      [
        {
          text: 'Create Test Wallet',
          onPress: () => {
            console.log('🔄 Create test wallet pressed');
            this.createAndConnectWallet();
          }
        },
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => console.log('❌ Wallet creation cancelled')
        }
      ]
    );
  }
  
  static createAndConnectWallet(): void {
    try {
      console.log('🔄 Creating and connecting wallet...');
      
      // Generate a random wallet name
      const randomId = Math.floor(Math.random() * 1000);
      const walletName = `Test Wallet ${randomId}`;
      
      const wallet = this.createMockWallet(walletName);
      this.connectWallet(wallet);
      
      Alert.alert(
        'Success! 🎉',
        `Test wallet created successfully!\n\nName: ${wallet.name}\nAddress: ${wallet.address.slice(0, 12)}...${wallet.address.slice(-12)}\n\nYou can now make payments!`,
        [{ text: 'Great!', onPress: () => console.log('✅ Wallet creation confirmed') }]
      );
      
    } catch (error) {
      console.error('❌ Error creating wallet:', error);
      Alert.alert('Error', 'Failed to create wallet: ' + error.message);
    }
  }
  
  static getWalletInfo(): string {
    if (!connectedWallet) {
      return 'No wallet connected';
    }
    
    return `${connectedWallet.address.slice(0, 8)}...${connectedWallet.address.slice(-4)}`;
  }
}
