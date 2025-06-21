import algosdk from 'algosdk';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export interface AlgorandAccount {
  address: string;
  mnemonic?: string;
  privateKey?: Uint8Array;
  keyId?: string; // For HSM integration
}

export interface TransactionResult {
  success: boolean;
  txId?: string;
  error?: string;
  confirmationRound?: number;
  fee?: number;
}

export interface AssetInfo {
  assetId: number;
  name: string;
  unitName: string;
  decimals: number;
  total: number;
  creator: string;
  url?: string;
}

export class ProductionAlgorandService {
  private algodClient: algosdk.Algodv2;
  private indexerClient: algosdk.Indexer;
  private zyroAssetId: number;
  private treasuryAddress: string;

  constructor() {
    // Production MainNet configuration
    const algodToken = process.env.EXPO_PUBLIC_ALGOD_TOKEN || '';
    const algodServer = process.env.EXPO_PUBLIC_ALGOD_SERVER || 'https://mainnet-api.algonode.cloud';
    const algodPort = process.env.EXPO_PUBLIC_ALGOD_PORT || '';

    const indexerToken = process.env.EXPO_PUBLIC_INDEXER_TOKEN || '';
    const indexerServer = process.env.EXPO_PUBLIC_INDEXER_SERVER || 'https://mainnet-idx.algonode.cloud';
    const indexerPort = process.env.EXPO_PUBLIC_INDEXER_PORT || '';

    this.algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);
    this.indexerClient = new algosdk.Indexer(indexerToken, indexerServer, indexerPort);
    
    this.zyroAssetId = parseInt(process.env.EXPO_PUBLIC_ZYRO_ASSET_ID || '0');
    this.treasuryAddress = process.env.EXPO_PUBLIC_TREASURY_ADDRESS || '';
  }

  async createSecureAccount(): Promise<AlgorandAccount> {
    try {
      const account = algosdk.generateAccount();
      const mnemonic = algosdk.secretKeyToMnemonic(account.sk);
      
      // Store in secure hardware-backed storage
      await this.storeAccountSecurely({
        address: account.addr,
        mnemonic,
        privateKey: account.sk,
      });
      
      return {
        address: account.addr,
        mnemonic,
        privateKey: account.sk,
      };
    } catch (error) {
      console.error('Error creating secure account:', error);
      throw new Error('Failed to create Algorand account');
    }
  }

  async importAccount(mnemonic: string): Promise<AlgorandAccount> {
    try {
      const account = algosdk.mnemonicToSecretKey(mnemonic);
      
      const accountData: AlgorandAccount = {
        address: account.addr,
        mnemonic,
        privateKey: account.sk,
      };

      await this.storeAccountSecurely(accountData);
      
      return accountData;
    } catch (error) {
      console.error('Error importing account:', error);
      throw new Error('Invalid mnemonic phrase');
    }
  }

  async getStoredAccount(): Promise<AlgorandAccount | null> {
    try {
      const encryptedData = await SecureStore.getItemAsync('algorand_account');
      if (!encryptedData) return null;

      const accountData = JSON.parse(encryptedData);
      return {
        address: accountData.address,
        mnemonic: accountData.mnemonic,
        privateKey: new Uint8Array(accountData.privateKey),
      };
    } catch (error) {
      console.error('Error retrieving account:', error);
      return null;
    }
  }

  async getAccountBalance(address: string): Promise<number> {
    try {
      const accountInfo = await this.algodClient.accountInformation(address).do();
      return accountInfo.amount / 1000000; // Convert microAlgos to Algos
    } catch (error) {
      console.error('Error getting balance:', error);
      return 0;
    }
  }

  async getAssetBalance(address: string, assetId: number): Promise<number> {
    try {
      const accountInfo = await this.algodClient.accountInformation(address).do();
      const asset = accountInfo.assets?.find((a: any) => a['asset-id'] === assetId);
      
      if (!asset) return 0;
      
      const assetInfo = await this.getAssetInfo(assetId);
      return asset.amount / Math.pow(10, assetInfo.decimals);
    } catch (error) {
      console.error('Error getting asset balance:', error);
      return 0;
    }
  }

  async getZyroBalance(address: string): Promise<number> {
    if (!this.zyroAssetId) return 0;
    return this.getAssetBalance(address, this.zyroAssetId);
  }

  async processRealPayment(
    fromAccount: AlgorandAccount,
    toAddress: string,
    amount: number,
    note: string
  ): Promise<TransactionResult> {
    try {
      const params = await this.algodClient.getTransactionParams().do();
      const amountMicroAlgos = Math.round(amount * 1000000);

      // Validate sufficient balance
      const balance = await this.getAccountBalance(fromAccount.address);
      const requiredAmount = (amountMicroAlgos + params.fee) / 1000000;
      
      if (balance < requiredAmount) {
        return {
          success: false,
          error: 'Insufficient balance',
        };
      }

      const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: fromAccount.address,
        to: toAddress,
        amount: amountMicroAlgos,
        note: new TextEncoder().encode(note),
        suggestedParams: params,
      });

      if (!fromAccount.privateKey) {
        throw new Error('Private key not available');
      }

      const signedTxn = txn.signTxn(fromAccount.privateKey);
      const { txId } = await this.algodClient.sendRawTransaction(signedTxn).do();

      // Wait for confirmation
      const confirmedTxn = await this.waitForConfirmation(txId);

      return {
        success: true,
        txId,
        confirmationRound: confirmedTxn['confirmed-round'],
        fee: params.fee / 1000000,
      };
    } catch (error) {
      console.error('Error processing payment:', error);
      return {
        success: false,
        error: 'Payment processing failed',
      };
    }
  }

  async sendAsset(
    fromAccount: AlgorandAccount,
    toAddress: string,
    assetId: number,
    amount: number,
    note?: string
  ): Promise<TransactionResult> {
    try {
      const params = await this.algodClient.getTransactionParams().do();
      const assetInfo = await this.getAssetInfo(assetId);
      const amountBaseUnits = Math.round(amount * Math.pow(10, assetInfo.decimals));

      // Validate sufficient asset balance
      const balance = await this.getAssetBalance(fromAccount.address, assetId);
      if (balance < amount) {
        return {
          success: false,
          error: 'Insufficient asset balance',
        };
      }

      const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        from: fromAccount.address,
        to: toAddress,
        amount: amountBaseUnits,
        assetIndex: assetId,
        note: note ? new TextEncoder().encode(note) : undefined,
        suggestedParams: params,
      });

      if (!fromAccount.privateKey) {
        throw new Error('Private key not available');
      }

      const signedTxn = txn.signTxn(fromAccount.privateKey);
      const { txId } = await this.algodClient.sendRawTransaction(signedTxn).do();

      const confirmedTxn = await this.waitForConfirmation(txId);

      return {
        success: true,
        txId,
        confirmationRound: confirmedTxn['confirmed-round'],
        fee: params.fee / 1000000,
      };
    } catch (error) {
      console.error('Error sending asset:', error);
      return {
        success: false,
        error: 'Asset transfer failed',
      };
    }
  }

  async sendZyroReward(
    fromAccount: AlgorandAccount,
    toAddress: string,
    amount: number,
    note?: string
  ): Promise<TransactionResult> {
    if (!this.zyroAssetId) {
      return {
        success: false,
        error: 'Zyro asset not configured',
      };
    }
    return this.sendAsset(fromAccount, toAddress, this.zyroAssetId, amount, note);
  }

  async optInToAsset(account: AlgorandAccount, assetId: number): Promise<TransactionResult> {
    try {
      const params = await this.algodClient.getTransactionParams().do();

      const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        from: account.address,
        to: account.address,
        amount: 0,
        assetIndex: assetId,
        suggestedParams: params,
      });

      if (!account.privateKey) {
        throw new Error('Private key not available');
      }

      const signedTxn = txn.signTxn(account.privateKey);
      const { txId } = await this.algodClient.sendRawTransaction(signedTxn).do();

      const confirmedTxn = await this.waitForConfirmation(txId);

      return {
        success: true,
        txId,
        confirmationRound: confirmedTxn['confirmed-round'],
      };
    } catch (error) {
      console.error('Error opting in to asset:', error);
      return {
        success: false,
        error: 'Asset opt-in failed',
      };
    }
  }

  async getAssetInfo(assetId: number): Promise<AssetInfo> {
    try {
      const assetInfo = await this.algodClient.getAssetByID(assetId).do();
      return {
        assetId,
        name: assetInfo.params.name,
        unitName: assetInfo.params['unit-name'],
        decimals: assetInfo.params.decimals,
        total: assetInfo.params.total,
        creator: assetInfo.params.creator,
        url: assetInfo.params.url,
      };
    } catch (error) {
      console.error('Error getting asset info:', error);
      throw new Error('Failed to get asset information');
    }
  }

  async getTransactionHistory(address: string, limit: number = 50): Promise<any[]> {
    try {
      const response = await this.indexerClient
        .lookupAccountTransactions(address)
        .limit(limit)
        .do();

      return response.transactions.map((txn: any) => ({
        txId: txn.id,
        from: txn.sender,
        to: txn['payment-transaction']?.receiver || txn['asset-transfer-transaction']?.receiver,
        amount: txn['payment-transaction']?.amount || txn['asset-transfer-transaction']?.amount || 0,
        fee: txn.fee,
        note: txn.note ? new TextDecoder().decode(Buffer.from(txn.note, 'base64')) : undefined,
        confirmedRound: txn['confirmed-round'],
        timestamp: txn['round-time'],
      }));
    } catch (error) {
      console.error('Error getting transaction history:', error);
      return [];
    }
  }

  async simulateCrossBorderPayment(
    fromAccount: AlgorandAccount,
    toAddress: string,
    fiatAmount: number,
    fiatCurrency: string,
    paymentMethod: string
  ): Promise<{ success: boolean; txId?: string; zyroReward?: number; error?: string }> {
    try {
      // Get current ALGO price
      const algoPrice = await this.getAlgoUSDPrice();
      if (algoPrice === 0) {
        return {
          success: false,
          error: 'Unable to get current ALGO price',
        };
      }

      // Convert fiat to ALGO equivalent
      const usdAmount = await this.convertToUSD(fiatAmount, fiatCurrency);
      const algoAmount = usdAmount / algoPrice;

      // Create payment note with metadata
      const note = JSON.stringify({
        fiatAmount,
        fiatCurrency,
        usdAmount,
        algoAmount,
        paymentMethod,
        timestamp: Date.now(),
      });

      // Send ALGO transaction to treasury
      const result = await this.processRealPayment(
        fromAccount,
        this.treasuryAddress || toAddress,
        algoAmount,
        note
      );

      if (!result.success) {
        return result;
      }

      // Calculate Zyro reward (10% of fiat amount)
      const zyroReward = fiatAmount * 0.1;

      // Send Zyro reward if asset is configured
      if (this.zyroAssetId && zyroReward > 0) {
        try {
          await this.sendZyroReward(
            fromAccount,
            fromAccount.address,
            zyroReward,
            `Reward for payment ${result.txId}`
          );
        } catch (rewardError) {
          console.error('Error sending Zyro reward:', rewardError);
        }
      }

      return {
        success: true,
        txId: result.txId,
        zyroReward,
      };
    } catch (error) {
      console.error('Error processing cross-border payment:', error);
      return {
        success: false,
        error: 'Payment processing failed',
      };
    }
  }

  private async storeAccountSecurely(account: AlgorandAccount): Promise<void> {
    try {
      const accountData = {
        address: account.address,
        mnemonic: account.mnemonic,
        privateKey: account.privateKey ? Array.from(account.privateKey) : undefined,
      };

      await SecureStore.setItemAsync('algorand_account', JSON.stringify(accountData), {
        requireAuthentication: Platform.OS !== 'web',
      });
    } catch (error) {
      console.error('Error storing account:', error);
      throw new Error('Failed to store account securely');
    }
  }

  private async waitForConfirmation(txId: string): Promise<any> {
    const status = await this.algodClient.status().do();
    let lastRound = status['last-round'];

    while (true) {
      const pendingInfo = await this.algodClient.pendingTransactionInformation(txId).do();
      
      if (pendingInfo['confirmed-round'] !== null && pendingInfo['confirmed-round'] > 0) {
        return pendingInfo;
      }

      lastRound++;
      await this.algodClient.statusAfterBlock(lastRound).do();
    }
  }

  private async getAlgoUSDPrice(): Promise<number> {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=algorand&vs_currencies=usd');
      const data = await response.json();
      return data.algorand?.usd || 0;
    } catch (error) {
      console.error('Error getting ALGO price:', error);
      return 0;
    }
  }

  private async convertToUSD(amount: number, currency: string): Promise<number> {
    if (currency === 'USD') return amount;
    
    try {
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${currency}`);
      const data = await response.json();
      return amount * data.rates.USD;
    } catch (error) {
      console.error('Error converting currency:', error);
      return amount; // Fallback to 1:1 ratio
    }
  }

  async isValidAddress(address: string): Promise<boolean> {
    try {
      return algosdk.isValidAddress(address);
    } catch {
      return false;
    }
  }
}

export const productionAlgorandService = new ProductionAlgorandService();