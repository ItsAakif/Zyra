import algosdk from 'algosdk';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

export interface AlgorandAccount {
  address: string;
  mnemonic: string;
  privateKey: Uint8Array;
}

export interface AlgorandTransaction {
  txId: string;
  from: string;
  to: string;
  amount: number;
  fee: number;
  note?: string;
  confirmedRound?: number;
}

export interface AssetInfo {
  assetId: number;
  name: string;
  unitName: string;
  decimals: number;
  total: number;
  creator: string;
}

export class AlgorandService {
  private algodClient: algosdk.Algodv2;
  private indexerClient: algosdk.Indexer;
  private zyroAssetId: number;

  constructor() {
    // MainNet configuration
    const algodToken = process.env.EXPO_PUBLIC_ALGOD_TOKEN || '';
    const algodServer = process.env.EXPO_PUBLIC_ALGOD_SERVER || 'https://mainnet-api.algonode.cloud';
    const algodPort = process.env.EXPO_PUBLIC_ALGOD_PORT || '';

    const indexerToken = process.env.EXPO_PUBLIC_INDEXER_TOKEN || '';
    const indexerServer = process.env.EXPO_PUBLIC_INDEXER_SERVER || 'https://mainnet-idx.algonode.cloud';
    const indexerPort = process.env.EXPO_PUBLIC_INDEXER_PORT || '';

    this.algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);
    this.indexerClient = new algosdk.Indexer(indexerToken, indexerServer, indexerPort);
    
    // Zyro token asset ID (will be created during deployment)
    this.zyroAssetId = parseInt(process.env.EXPO_PUBLIC_ZYRO_ASSET_ID || '0');
  }

  // Account Management
  async createAccount(): Promise<AlgorandAccount> {
    try {
      const account = algosdk.generateAccount();
      const mnemonic = algosdk.secretKeyToMnemonic(account.sk);
      
      const accountData: AlgorandAccount = {
        address: account.addr,
        mnemonic,
        privateKey: account.sk,
      };

      // Store securely
      await this.storeAccountSecurely(accountData);
      
      return accountData;
    } catch (error) {
      console.error('Error creating account:', error);
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

  private async storeAccountSecurely(account: AlgorandAccount): Promise<void> {
    try {
      const accountData = {
        address: account.address,
        mnemonic: account.mnemonic,
        privateKey: Array.from(account.privateKey),
      };

      await SecureStore.setItemAsync('algorand_account', JSON.stringify(accountData));
    } catch (error) {
      console.error('Error storing account:', error);
      throw new Error('Failed to store account securely');
    }
  }

  // Balance and Asset Management
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
      };
    } catch (error) {
      console.error('Error getting asset info:', error);
      throw new Error('Failed to get asset information');
    }
  }

  // Transaction Management
  async sendAlgos(
    fromAccount: AlgorandAccount,
    toAddress: string,
    amount: number,
    note?: string
  ): Promise<string> {
    try {
      const params = await this.algodClient.getTransactionParams().do();
      const amountMicroAlgos = Math.round(amount * 1000000);

      const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: fromAccount.address,
        to: toAddress,
        amount: amountMicroAlgos,
        note: note ? new TextEncoder().encode(note) : undefined,
        suggestedParams: params,
      });

      const signedTxn = txn.signTxn(fromAccount.privateKey);
      const { txId } = await this.algodClient.sendRawTransaction(signedTxn).do();

      await this.waitForConfirmation(txId);
      return txId;
    } catch (error) {
      console.error('Error sending Algos:', error);
      throw new Error('Failed to send transaction');
    }
  }

  async sendAsset(
    fromAccount: AlgorandAccount,
    toAddress: string,
    assetId: number,
    amount: number,
    note?: string
  ): Promise<string> {
    try {
      const params = await this.algodClient.getTransactionParams().do();
      const assetInfo = await this.getAssetInfo(assetId);
      const amountBaseUnits = Math.round(amount * Math.pow(10, assetInfo.decimals));

      const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        from: fromAccount.address,
        to: toAddress,
        amount: amountBaseUnits,
        assetIndex: assetId,
        note: note ? new TextEncoder().encode(note) : undefined,
        suggestedParams: params,
      });

      const signedTxn = txn.signTxn(fromAccount.privateKey);
      const { txId } = await this.algodClient.sendRawTransaction(signedTxn).do();

      await this.waitForConfirmation(txId);
      return txId;
    } catch (error) {
      console.error('Error sending asset:', error);
      throw new Error('Failed to send asset');
    }
  }

  async sendZyroReward(
    fromAccount: AlgorandAccount,
    toAddress: string,
    amount: number,
    note?: string
  ): Promise<string> {
    if (!this.zyroAssetId) {
      throw new Error('Zyro asset not configured');
    }
    return this.sendAsset(fromAccount, toAddress, this.zyroAssetId, amount, note);
  }

  // Asset Creation (for Zyro token)
  async createZyroAsset(creatorAccount: AlgorandAccount): Promise<number> {
    try {
      const params = await this.algodClient.getTransactionParams().do();

      const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
        from: creatorAccount.address,
        total: 1000000000000, // 1 trillion Zyro tokens
        decimals: 6,
        assetName: 'Zyro',
        unitName: 'ZYR',
        assetURL: 'https://zyra.app',
        assetMetadataHash: undefined,
        defaultFrozen: false,
        freeze: undefined,
        manager: creatorAccount.address,
        clawback: undefined,
        reserve: creatorAccount.address,
        suggestedParams: params,
      });

      const signedTxn = txn.signTxn(creatorAccount.privateKey);
      const { txId } = await this.algodClient.sendRawTransaction(signedTxn).do();

      const confirmedTxn = await this.waitForConfirmation(txId);
      const assetId = confirmedTxn['asset-index'];

      console.log('Zyro asset created with ID:', assetId);
      return assetId;
    } catch (error) {
      console.error('Error creating Zyro asset:', error);
      throw new Error('Failed to create Zyro asset');
    }
  }

  // Opt-in to Asset
  async optInToAsset(account: AlgorandAccount, assetId: number): Promise<string> {
    try {
      const params = await this.algodClient.getTransactionParams().do();

      const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        from: account.address,
        to: account.address,
        amount: 0,
        assetIndex: assetId,
        suggestedParams: params,
      });

      const signedTxn = txn.signTxn(account.privateKey);
      const { txId } = await this.algodClient.sendRawTransaction(signedTxn).do();

      await this.waitForConfirmation(txId);
      return txId;
    } catch (error) {
      console.error('Error opting in to asset:', error);
      throw new Error('Failed to opt-in to asset');
    }
  }

  // Transaction History
  async getTransactionHistory(address: string, limit: number = 50): Promise<AlgorandTransaction[]> {
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
      }));
    } catch (error) {
      console.error('Error getting transaction history:', error);
      return [];
    }
  }

  // Utility Methods
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

  async isValidAddress(address: string): Promise<boolean> {
    try {
      return algosdk.isValidAddress(address);
    } catch {
      return false;
    }
  }

  // Smart Contract Integration (for advanced features)
  async deploySmartContract(
    creatorAccount: AlgorandAccount,
    approvalProgram: Uint8Array,
    clearProgram: Uint8Array
  ): Promise<number> {
    try {
      const params = await this.algodClient.getTransactionParams().do();

      const txn = algosdk.makeApplicationCreateTxnFromObject({
        from: creatorAccount.address,
        suggestedParams: params,
        onComplete: algosdk.OnApplicationComplete.NoOpOC,
        approvalProgram,
        clearProgram,
        numLocalInts: 0,
        numLocalByteSlices: 0,
        numGlobalInts: 2,
        numGlobalByteSlices: 0,
      });

      const signedTxn = txn.signTxn(creatorAccount.privateKey);
      const { txId } = await this.algodClient.sendRawTransaction(signedTxn).do();

      const confirmedTxn = await this.waitForConfirmation(txId);
      return confirmedTxn['application-index'];
    } catch (error) {
      console.error('Error deploying smart contract:', error);
      throw new Error('Failed to deploy smart contract');
    }
  }

  // Exchange Rate Integration
  async getAlgoUSDPrice(): Promise<number> {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=algorand&vs_currencies=usd');
      const data = await response.json();
      return data.algorand.usd;
    } catch (error) {
      console.error('Error getting ALGO price:', error);
      return 0;
    }
  }

  // Cross-border payment simulation
  async simulateCrossBorderPayment(
    fromAccount: AlgorandAccount,
    toAddress: string,
    fiatAmount: number,
    fiatCurrency: string,
    paymentMethod: string
  ): Promise<{ success: boolean; txId?: string; zyroReward?: number; error?: string }> {
    try {
      // Convert fiat to ALGO equivalent
      const algoPrice = await this.getAlgoUSDPrice();
      const algoAmount = fiatAmount / algoPrice;

      // Add payment processing note
      const note = JSON.stringify({
        fiatAmount,
        fiatCurrency,
        paymentMethod,
        timestamp: Date.now(),
      });

      // Send ALGO transaction
      const txId = await this.sendAlgos(fromAccount, toAddress, algoAmount, note);

      // Calculate Zyro reward (10% of fiat amount)
      const zyroReward = fiatAmount * 0.1;

      // Send Zyro reward if asset is configured
      if (this.zyroAssetId && zyroReward > 0) {
        try {
          await this.sendZyroReward(
            fromAccount,
            fromAccount.address,
            zyroReward,
            `Reward for payment ${txId}`
          );
        } catch (rewardError) {
          console.error('Error sending Zyro reward:', rewardError);
        }
      }

      return {
        success: true,
        txId,
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
}

export const algorandService = new AlgorandService();