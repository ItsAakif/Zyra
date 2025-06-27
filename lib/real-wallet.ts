import { algorandService, AlgorandAccount } from './algorand';
import { subscriptionService } from './subscription';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import will be added when NFT marketplace is implemented
let nftMarketplaceService: any = null;

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  algoBalance: number;
  zyroBalance: number;
  isLoading: boolean;
  error: string | null;
}

export interface Transaction {
  id: string;
  type: 'sent' | 'received';
  amount: number;
  currency: 'ALGO' | 'ZYRO';
  from: string;
  to: string;
  timestamp: number;
  status: 'confirmed' | 'pending' | 'failed';
  fee?: number;
  note?: string;
}

class RealWalletService {
  private state: WalletState = {
    isConnected: false,
    address: null,
    algoBalance: 0,
    zyroBalance: 0,
    isLoading: false,
    error: null,
  };

  private listeners: ((state: WalletState) => void)[] = [];
  private account: AlgorandAccount | null = null;
  private balanceUpdateInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeWallet();
  }

  private async initializeWallet() {
    try {
      this.updateState({ isLoading: true, error: null });
      
      // Try to load existing account
      const storedAccount = await algorandService.getStoredAccount();
      if (storedAccount) {
        this.account = storedAccount;
        this.updateState({
          isConnected: true,
          address: storedAccount.address,
          isLoading: false,
        });
        
        // Start balance updates
        this.startBalanceUpdates();
        await this.updateBalances();
      } else {
        this.updateState({ isLoading: false });
      }
    } catch (error) {
      console.error('❌ Error initializing wallet:', error);
      this.updateState({
        isLoading: false,
        error: 'Failed to initialize wallet',
      });
    }
  }

  async createTestWallet(): Promise<void> {
    try {
      this.updateState({ isLoading: true, error: null });
      
      console.log('🔄 Creating new Algorand testnet account...');
      const newAccount = await algorandService.createAccount();
      
      this.account = newAccount;
      this.updateState({
        isConnected: true,
        address: newAccount.address,
        isLoading: false,
      });

      console.log('✅ Wallet created:', newAccount.address);
      
      // Start balance updates
      this.startBalanceUpdates();
      await this.updateBalances();
      
      // Note: Mainnet requires real ALGO funding - not auto-funded
      console.log('💰 Mainnet wallet created - requires manual funding');
      
    } catch (error) {
      console.error('❌ Error creating wallet:', error);
      this.updateState({
        isLoading: false,
        error: 'Failed to create wallet',
      });
    }
  }

  async connectExistingWallet(mnemonic: string): Promise<void> {
    try {
      this.updateState({ isLoading: true, error: null });
      
      const importedAccount = await algorandService.importAccount(mnemonic);
      this.account = importedAccount;
      
      this.updateState({
        isConnected: true,
        address: importedAccount.address,
        isLoading: false,
      });

      console.log('✅ Wallet imported:', importedAccount.address);
      
      // Start balance updates
      this.startBalanceUpdates();
      await this.updateBalances();
      
    } catch (error) {
      console.error('❌ Error importing wallet:', error);
      this.updateState({
        isLoading: false,
        error: 'Invalid mnemonic phrase',
      });
    }
  }

  async disconnectWallet(): Promise<void> {
    try {
      this.stopBalanceUpdates();
      
      // Clear stored account
      await AsyncStorage.removeItem('algorand_account');
      
      this.account = null;
      this.updateState({
        isConnected: false,
        address: null,
        algoBalance: 0,
        zyroBalance: 0,
        error: null,
      });

      console.log('✅ Wallet disconnected');
    } catch (error) {
      console.error('❌ Error disconnecting wallet:', error);
    }
  }

  private async requestTestnetFunding(): Promise<void> {
    if (!this.account) return;

    try {
      console.log('💰 Requesting testnet funding...');
      
      // Use Algorand testnet dispenser
      const response = await fetch('https://testnet-api.algonode.cloud/v2/accounts/' + this.account.address);
      
      if (response.ok) {
        // Try to get funding from dispenser
        const fundingResponse = await fetch('https://dispenser.testnet.aws.algodev.network/dispense', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `account=${this.account.address}`,
        });

        if (fundingResponse.ok) {
          console.log('✅ Testnet funding requested successfully');
          // Wait a bit then update balances
          setTimeout(() => this.updateBalances(), 3000);
        } else {
          console.log('ℹ️ Funding dispenser might be rate limited');
        }
      }
    } catch (error) {
      console.log('ℹ️ Could not request testnet funding automatically');
    }
  }

  private async updateBalances(): Promise<void> {
    if (!this.account) return;

    try {
      const [algoBalance, zyroBalance] = await Promise.all([
        algorandService.getAccountBalance(this.account.address),
        algorandService.getZyroBalance(this.account.address),
      ]);

      this.updateState({
        algoBalance,
        zyroBalance,
      });

      console.log(`💰 Balance updated: ${algoBalance.toFixed(6)} ALGO, ${zyroBalance.toFixed(6)} ZYRO`);
    } catch (error) {
      console.error('❌ Error updating balances:', error);
    }
  }

  private startBalanceUpdates(): void {
    this.stopBalanceUpdates();
    
    // Update balance every 30 seconds
    this.balanceUpdateInterval = setInterval(() => {
      this.updateBalances();
    }, 30000);
  }

  private stopBalanceUpdates(): void {
    if (this.balanceUpdateInterval) {
      clearInterval(this.balanceUpdateInterval);
      this.balanceUpdateInterval = null;
    }
  }

  async sendPayment(
    toAddress: string,
    amount: number,
    currency: 'ALGO' | 'ZYRO',
    note?: string
  ): Promise<string> {
    if (!this.account) {
      throw new Error('No wallet connected');
    }

    try {
      this.updateState({ isLoading: true, error: null });

      let txId: string;
      
      if (currency === 'ALGO') {
        txId = await algorandService.sendAlgos(this.account, toAddress, amount, note);
      } else {
        txId = await algorandService.sendZyroReward(this.account, toAddress, amount, note);
      }

      console.log(`✅ Payment sent: ${txId}`);
      
      // Award NFT for transaction milestone
      await this.checkAndAwardNFTRewards();
      
      // Update balances after transaction
      setTimeout(() => this.updateBalances(), 2000);
      
      this.updateState({ isLoading: false });
      return txId;
      
    } catch (error) {
      console.error('❌ Error sending payment:', error);
      this.updateState({
        isLoading: false,
        error: 'Failed to send payment',
      });
      throw error;
    }
  }

  async getTransactionHistory(): Promise<Transaction[]> {
    if (!this.account) return [];

    try {
      const txnHistory = await algorandService.getTransactionHistory(this.account.address);
      
      return txnHistory.map(txn => ({
        id: txn.txId,
        type: txn.from === this.account!.address ? 'sent' : 'received',
        amount: txn.amount / 1000000, // Convert microAlgos
        currency: 'ALGO' as const,
        from: txn.from,
        to: txn.to,
        timestamp: Date.now(), // In real app, get from confirmed round
        status: 'confirmed' as const,
        fee: txn.fee,
        note: txn.note,
      }));
    } catch (error) {
      console.error('❌ Error getting transaction history:', error);
      return [];
    }
  }

  async processCrossBorderPayment(
    toAddress: string,
    fiatAmount: number,
    currency: string,
    paymentMethod: string
  ): Promise<{ success: boolean; txId?: string; zyroReward?: number; error?: string }> {
    if (!this.account) {
      return { success: false, error: 'No wallet connected' };
    }

    try {
      this.updateState({ isLoading: true, error: null });
      
      const result = await algorandService.simulateCrossBorderPayment(
        this.account,
        toAddress,
        fiatAmount,
        currency,
        paymentMethod
      );

      if (result.success) {
        // Update balances after transaction
        setTimeout(() => this.updateBalances(), 2000);
      }

      this.updateState({ isLoading: false });
      return result;
      
    } catch (error) {
      console.error('❌ Error processing cross-border payment:', error);
      this.updateState({
        isLoading: false,
        error: 'Payment processing failed',
      });
      return { success: false, error: 'Payment processing failed' };
    }
  }

  getState(): WalletState {
    return { ...this.state };
  }

  subscribe(listener: (state: WalletState) => void): () => void {
    this.listeners.push(listener);
    
    // Immediately call with current state
    listener(this.state);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private updateState(updates: Partial<WalletState>): void {
    this.state = { ...this.state, ...updates };
    this.listeners.forEach(listener => listener(this.state));
  }

  getMnemonic(): string | null {
    return this.account?.mnemonic || null;
  }

  isValidAddress(address: string): Promise<boolean> {
    return algorandService.isValidAddress(address);
  }

  private async checkAndAwardNFTRewards(): Promise<void> {
    try {
      // Load NFT marketplace service dynamically to avoid circular imports
      if (!nftMarketplaceService) {
        const { nftMarketplaceService: nftService } = await import('./nft-marketplace');
        nftMarketplaceService = nftService;
      }

      const transactionHistory = await this.getTransactionHistory();
      const transactionCount = transactionHistory.length;
      const totalVolume = transactionHistory.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

      // Check for milestone rewards
      const rewards = [];

      if (transactionCount === 1) {
        rewards.push({
          name: 'First Payment Pioneer',
          description: 'Completed your first payment',
          rarity: 'common' as const,
          reason: 'First transaction completed'
        });
      }

      if (transactionCount === 5) {
        rewards.push({
          name: 'Active Trader',
          description: 'Completed 5 transactions',
          rarity: 'rare' as const,
          reason: 'Transaction milestone: 5 payments'
        });
      }

      if (transactionCount === 10) {
        rewards.push({
          name: 'Crypto Enthusiast',
          description: 'Completed 10 transactions',
          rarity: 'epic' as const,
          reason: 'Transaction milestone: 10 payments'
        });
      }

      if (totalVolume >= 100) {
        rewards.push({
          name: 'Volume Master',
          description: 'Completed $100+ in transactions',
          rarity: 'epic' as const,
          reason: 'Volume milestone: $100+'
        });
      }

      if (this.state.zyroBalance >= 50) {
        rewards.push({
          name: 'Zyro Collector',
          description: 'Earned 50+ ZYR tokens',
          rarity: 'rare' as const,
          reason: 'ZYR balance milestone'
        });
      }

      // Award new NFTs for achieved milestones
      for (const reward of rewards) {
        console.log(`🏆 NFT Reward Earned: ${reward.name} - ${reward.reason}`);
        
        // Check if we already have this reward to avoid duplicates
        const existingRewards = await this.getEarnedNFTRewards();
        const alreadyHas = existingRewards.some(existing => existing.name === reward.name);
        
        if (!alreadyHas) {
          try {
            // Mint real NFT on Algorand blockchain
            const realNFTId = await this.mintRewardNFT(reward);
            await this.storeNFTReward({ ...reward, blockchainAssetId: realNFTId });
            console.log(`🎨 Real NFT reward minted: Asset ID ${realNFTId}`);
          } catch (error) {
            console.error('❌ Error minting reward NFT, storing locally:', error);
            await this.storeNFTReward(reward);
          }
        }
      }

    } catch (error) {
      console.error('❌ Error checking NFT rewards:', error);
    }
  }

  private async storeNFTReward(reward: any): Promise<void> {
    try {
      const key = `nft_reward_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const nftReward = {
        id: key,
        ...reward,
        earnedDate: new Date().toISOString(),
        transactionId: `reward_${Date.now()}`,
        zyroValue: this.calculateZyroValue(reward.rarity),
        image: this.getRewardImage(reward.name),
      };

      await AsyncStorage.setItem(key, JSON.stringify(nftReward));
      console.log(`💾 Stored NFT reward: ${reward.name}`);
    } catch (error) {
      console.error('❌ Error storing NFT reward:', error);
    }
  }

  private calculateZyroValue(rarity: string): number {
    switch (rarity) {
      case 'common': return 10;
      case 'rare': return 25;
      case 'epic': return 50;
      case 'legendary': return 100;
      default: return 5;
    }
  }

  private getRewardImage(rewardName: string): string {
    // Map reward names to appropriate images
    const imageMap: { [key: string]: string } = {
      'First Payment Pioneer': 'https://images.pexels.com/photos/844124/pexels-photo-844124.jpeg?auto=compress&cs=tinysrgb&w=400',
      'Active Trader': 'https://images.pexels.com/photos/1166209/pexels-photo-1166209.jpeg?auto=compress&cs=tinysrgb&w=400',
      'Crypto Enthusiast': 'https://images.pexels.com/photos/730547/pexels-photo-730547.jpeg?auto=compress&cs=tinysrgb&w=400',
      'Volume Master': 'https://images.pexels.com/photos/355948/pexels-photo-355948.jpeg?auto=compress&cs=tinysrgb&w=400',
      'Zyro Collector': 'https://images.pexels.com/photos/1509428/pexels-photo-1509428.jpeg?auto=compress&cs=tinysrgb&w=400',
    };

    return imageMap[rewardName] || 'https://images.pexels.com/photos/844124/pexels-photo-844124.jpeg?auto=compress&cs=tinysrgb&w=400';
  }

  async getEarnedNFTRewards(): Promise<any[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const nftKeys = keys.filter(key => key.startsWith('nft_reward_'));
      
      const nftRewards = await Promise.all(
        nftKeys.map(async (key) => {
          const data = await AsyncStorage.getItem(key);
          return data ? JSON.parse(data) : null;
        })
      );

      return nftRewards.filter(Boolean);
    } catch (error) {
      console.error('❌ Error loading NFT rewards:', error);
      return [];
    }
  }

  private async mintRewardNFT(reward: any): Promise<number> {
    if (!this.account) {
      throw new Error('No wallet connected');
    }

    try {
      const params = await algorandService.algodClient.getTransactionParams().do();
      
      const algosdk = await import('algosdk');
      const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
        from: this.account.address,
        suggestedParams: params,
        assetName: reward.name,
        unitName: reward.name.substring(0, 8).toUpperCase(),
        assetURL: this.getRewardImage(reward.name),
        assetMetadataHash: undefined,
        total: 1, // NFT = unique asset
        decimals: 0,
        defaultFrozen: false,
        manager: this.account.address,
        reserve: this.account.address,
        freeze: undefined,
        clawback: undefined,
      });

      // Sign and submit transaction
      const signedTxn = txn.signTxn(this.account.privateKey);
      const { txId } = await algorandService.algodClient.sendRawTransaction(signedTxn).do();
      
      // Wait for confirmation
      const result = await algorandService.waitForConfirmation(txId);
      const assetId = result['asset-index'];
      
      return assetId;
    } catch (error) {
      console.error('❌ Error minting reward NFT:', error);
      throw error;
    }
  }
}

export const realWalletService = new RealWalletService();
