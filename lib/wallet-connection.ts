import { algorandService } from './algorand';
import { supabase } from './supabase';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';

export interface WalletConnectionResult {
  success: boolean;
  address?: string;
  error?: string;
}

export interface ConnectedWallet {
  address: string;
  type: 'generated' | 'imported' | 'external';
  name: string;
  balance?: number;
  zyroBalance?: number;
}

export class WalletConnectionService {
  private static readonly WALLET_STORAGE_KEY = 'zyra_connected_wallets';

  // Connect wallet by importing mnemonic
  static async connectWithMnemonic(mnemonic: string, walletName?: string): Promise<WalletConnectionResult> {
    try {
      // Validate mnemonic
      const account = await algorandService.importAccount(mnemonic);
      
      // Get wallet balance
      const balance = await algorandService.getAccountBalance(account.address);
      
      // Save wallet connection
      await this.saveWalletConnection({
        address: account.address,
        type: 'imported',
        name: walletName || `Wallet ${account.address.slice(0, 8)}...`,
        balance
      });

      // Update user profile with connected wallet
      await this.updateUserWalletAddress(account.address);

      return {
        success: true,
        address: account.address
      };
    } catch (error) {
      console.error('Wallet connection error:', error);
      return {
        success: false,
        error: 'Invalid mnemonic phrase or connection failed'
      };
    }
  }

  // Generate new wallet
  static async generateNewWallet(walletName?: string): Promise<WalletConnectionResult> {
    try {
      console.log('🔄 Generating new wallet...');
      
      const account = await algorandService.createAccount();
      console.log('✅ Algorand account created:', account.address.slice(0, 8) + '...');
      
      // Save wallet connection
      await this.saveWalletConnection({
        address: account.address,
        type: 'generated',
        name: walletName || `New Wallet ${account.address.slice(0, 8)}...`,
        balance: 0
      });
      console.log('✅ Wallet connection saved');

      // Update user profile
      await this.updateUserWalletAddress(account.address);
      console.log('✅ User profile updated');

      return {
        success: true,
        address: account.address
      };
    } catch (error) {
      console.error('❌ Wallet generation error:', error);
      console.error('Error details:', error.message);
      return {
        success: false,
        error: `Failed to generate new wallet: ${error.message}`
      };
    }
  }

  // Connect external wallet (WalletConnect-style)
  static async connectExternalWallet(address: string, walletName?: string): Promise<WalletConnectionResult> {
    try {
      // Validate address format
      if (!await algorandService.isValidAddress(address)) {
        return {
          success: false,
          error: 'Invalid Algorand address format'
        };
      }

      // Get wallet balance
      const balance = await algorandService.getAccountBalance(address);
      
      // Save wallet connection
      await this.saveWalletConnection({
        address,
        type: 'external',
        name: walletName || `External ${address.slice(0, 8)}...`,
        balance
      });

      // Update user profile
      await this.updateUserWalletAddress(address);

      return {
        success: true,
        address
      };
    } catch (error) {
      console.error('External wallet connection error:', error);
      return {
        success: false,
        error: 'Failed to connect external wallet'
      };
    }
  }

  // Get all connected wallets
  static async getConnectedWallets(): Promise<ConnectedWallet[]> {
    try {
      console.log('🔄 Getting connected wallets...');
      
      const walletsData = await SecureStore.getItemAsync(this.WALLET_STORAGE_KEY);
      if (!walletsData) {
        console.log('📭 No wallets found in storage');
        return [];
      }

      const wallets: ConnectedWallet[] = JSON.parse(walletsData);
      console.log('📝 Found wallets in storage:', wallets.length);
      
      // For now, skip balance updates to avoid API issues during testing
      // Just return the stored wallets
      return wallets;
      
      // TODO: Enable balance updates when Algorand API is stable
      /*
      // Update balances for all wallets
      const updatedWallets = await Promise.all(
        wallets.map(async (wallet) => {
          try {
            const [balance, zyroBalance] = await Promise.all([
              algorandService.getAccountBalance(wallet.address),
              algorandService.getZyroBalance(wallet.address)
            ]);
            
            return { ...wallet, balance, zyroBalance };
          } catch (error) {
            console.error(`Error updating balance for ${wallet.address}:`, error);
            return wallet;
          }
        })
      );

      // Save updated balances
      await SecureStore.setItemAsync(this.WALLET_STORAGE_KEY, JSON.stringify(updatedWallets));
      
      return updatedWallets;
      */
    } catch (error) {
      console.error('❌ Error getting connected wallets:', error);
      return [];
    }
  }

  // Get primary wallet (most recently connected)
  static async getPrimaryWallet(): Promise<ConnectedWallet | null> {
    const wallets = await this.getConnectedWallets();
    return wallets.length > 0 ? wallets[0] : null;
  }

  // Switch primary wallet
  static async setPrimaryWallet(address: string): Promise<boolean> {
    try {
      const wallets = await this.getConnectedWallets();
      const walletIndex = wallets.findIndex(w => w.address === address);
      
      if (walletIndex === -1) return false;

      // Move selected wallet to front
      const selectedWallet = wallets[walletIndex];
      wallets.splice(walletIndex, 1);
      wallets.unshift(selectedWallet);

      await SecureStore.setItemAsync(this.WALLET_STORAGE_KEY, JSON.stringify(wallets));
      await this.updateUserWalletAddress(address);
      
      return true;
    } catch (error) {
      console.error('Error setting primary wallet:', error);
      return false;
    }
  }

  // Remove wallet connection
  static async disconnectWallet(address: string): Promise<boolean> {
    try {
      const wallets = await this.getConnectedWallets();
      const filteredWallets = wallets.filter(w => w.address !== address);
      
      await SecureStore.setItemAsync(this.WALLET_STORAGE_KEY, JSON.stringify(filteredWallets));
      
      // If this was the primary wallet, update user profile
      const currentUser = await this.getCurrentUser();
      if (currentUser?.algorand_address === address) {
        const newPrimary = filteredWallets.length > 0 ? filteredWallets[0].address : null;
        await this.updateUserWalletAddress(newPrimary);
      }
      
      return true;
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      return false;
    }
  }

  // Private helper methods
  private static async saveWalletConnection(wallet: ConnectedWallet): Promise<void> {
    try {
      console.log('🔄 Saving wallet connection:', wallet.address.slice(0, 8) + '...');
      
      const wallets = await this.getConnectedWallets();
      console.log('📝 Current wallets count:', wallets.length);
      
      // Remove existing wallet with same address
      const filteredWallets = wallets.filter(w => w.address !== wallet.address);
      
      // Add new wallet at the beginning (primary position)
      filteredWallets.unshift(wallet);
      
      const walletData = JSON.stringify(filteredWallets);
      await SecureStore.setItemAsync(this.WALLET_STORAGE_KEY, walletData);
      
      console.log('✅ Wallet connection saved successfully');
    } catch (error) {
      console.error('❌ Error saving wallet connection:', error);
      throw new Error(`Failed to save wallet: ${error.message}`);
    }
  }

  private static async updateUserWalletAddress(address: string | null): Promise<void> {
    if (!supabase) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('users')
        .update({ algorand_address: address })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating user wallet address:', error);
      }
    } catch (error) {
      console.error('Error updating user wallet address:', error);
    }
  }

  private static async getCurrentUser() {
    if (!supabase) return null;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      return data;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Wallet connection UI helpers
  static showWalletConnectionOptions(): void {
    Alert.alert(
      'Connect Wallet',
      'Choose how you want to connect your Algorand wallet:',
      [
        {
          text: 'Generate New Wallet',
          onPress: () => this.handleGenerateWallet()
        },
        {
          text: 'Import Existing Wallet',
          onPress: () => this.handleImportWallet()
        },
        {
          text: 'Connect External Wallet',
          onPress: () => this.handleExternalWallet()
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  }

  private static handleGenerateWallet(): void {
    Alert.prompt(
      'New Wallet',
      'Enter a name for your new wallet:',
      async (walletName) => {
        const name = walletName?.trim() || 'My Zyra Wallet';
        console.log('🔄 Generating wallet with name:', name);
        
        const result = await this.generateNewWallet(name);
        if (result.success) {
          Alert.alert(
            'Success! 🎉', 
            `New wallet created successfully!\n\nAddress: ${result.address?.slice(0, 8)}...${result.address?.slice(-8)}\n\nYou can now make payments and earn Zyro rewards!`,
            [{ text: 'Great!', style: 'default' }]
          );
        } else {
          Alert.alert('Error', result.error || 'Failed to create wallet');
        }
      },
      'plain-text',
      'My Zyra Wallet'
    );
  }

  private static handleImportWallet(): void {
    Alert.prompt(
      'Import Wallet',
      'Enter your 25-word mnemonic phrase:',
      async (mnemonic) => {
        if (mnemonic && mnemonic.trim()) {
          const result = await this.connectWithMnemonic(mnemonic.trim());
          if (result.success) {
            Alert.alert('Success', `Wallet imported: ${result.address?.slice(0, 8)}...`);
          } else {
            Alert.alert('Error', result.error || 'Failed to import wallet');
          }
        }
      },
      'plain-text'
    );
  }

  private static handleExternalWallet(): void {
    Alert.prompt(
      'External Wallet',
      'Enter your Algorand wallet address:',
      async (address) => {
        if (address && address.trim()) {
          const cleanAddress = address.trim();
          const result = await this.connectExternalWallet(cleanAddress);
          if (result.success) {
            Alert.alert('Success', `External wallet connected: ${result.address?.slice(0, 8)}...`);
          } else {
            Alert.alert('Error', result.error || 'Failed to connect wallet');
          }
        }
      },
      'plain-text'
    );
  }
}
