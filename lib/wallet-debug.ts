// Debug version of wallet connection for testing
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';

export interface MockWallet {
  address: string;
  type: 'generated' | 'imported' | 'external';
  name: string;
  balance: number;
  zyroBalance: number;
}

export class WalletDebugService {
  private static readonly WALLET_STORAGE_KEY = 'zyra_debug_wallets';

  static async generateMockWallet(walletName?: string): Promise<{ success: boolean; address?: string; error?: string }> {
    try {
      console.log('🧪 [DEBUG] Generating mock wallet...');
      
      // Generate a mock Algorand address (58 characters)
      const mockAddress = this.generateMockAlgorandAddress();
      
      const wallet: MockWallet = {
        address: mockAddress,
        type: 'generated',
        name: walletName || `Mock Wallet ${mockAddress.slice(0, 8)}...`,
        balance: 0.0000,
        zyroBalance: 0.00
      };

      // Save to storage
      await this.saveMockWallet(wallet);
      
      console.log('✅ [DEBUG] Mock wallet created:', mockAddress.slice(0, 8) + '...');
      
      return {
        success: true,
        address: mockAddress
      };
    } catch (error) {
      console.error('❌ [DEBUG] Mock wallet error:', error);
      return {
        success: false,
        error: `Failed to create mock wallet: ${error.message}`
      };
    }
  }

  static async getMockWallets(): Promise<MockWallet[]> {
    try {
      const walletsData = await SecureStore.getItemAsync(this.WALLET_STORAGE_KEY);
      if (!walletsData) return [];
      
      return JSON.parse(walletsData);
    } catch (error) {
      console.error('❌ [DEBUG] Error getting mock wallets:', error);
      return [];
    }
  }

  private static async saveMockWallet(wallet: MockWallet): Promise<void> {
    try {
      const wallets = await this.getMockWallets();
      
      // Remove existing wallet with same address
      const filteredWallets = wallets.filter(w => w.address !== wallet.address);
      
      // Add new wallet at the beginning
      filteredWallets.unshift(wallet);
      
      await SecureStore.setItemAsync(this.WALLET_STORAGE_KEY, JSON.stringify(filteredWallets));
    } catch (error) {
      console.error('❌ [DEBUG] Error saving mock wallet:', error);
      throw error;
    }
  }

  private static generateMockAlgorandAddress(): string {
    // Generate a realistic-looking Algorand address
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let result = '';
    for (let i = 0; i < 58; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  static showMockWalletOptions(): void {
    Alert.alert(
      'Debug: Connect Wallet',
      'Choose a debug option for testing:',
      [
        {
          text: 'Generate Mock Wallet',
          onPress: () => this.handleMockWallet()
        },
        {
          text: 'Try Real Algorand',
          onPress: () => {
            const { WalletConnectionService } = require('./wallet-connection');
            WalletConnectionService.showWalletConnectionOptions();
          }
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  }

  private static handleMockWallet(): void {
    Alert.prompt(
      'Mock Wallet',
      'Enter a name for your test wallet:',
      async (walletName) => {
        const name = walletName?.trim() || 'Test Wallet';
        
        const result = await this.generateMockWallet(name);
        if (result.success) {
          Alert.alert(
            'Debug Success! 🧪',
            `Mock wallet created for testing!\n\nAddress: ${result.address?.slice(0, 8)}...${result.address?.slice(-8)}\n\nThis is a test wallet for UI development.`,
            [{ text: 'Got it!', style: 'default' }]
          );
        } else {
          Alert.alert('Debug Error', result.error || 'Failed to create mock wallet');
        }
      },
      'plain-text',
      'Test Wallet'
    );
  }

  static async clearMockWallets(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.WALLET_STORAGE_KEY);
      console.log('🧹 [DEBUG] Mock wallets cleared');
    } catch (error) {
      console.error('❌ [DEBUG] Error clearing mock wallets:', error);
    }
  }
}
