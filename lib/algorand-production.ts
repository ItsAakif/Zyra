import algosdk from 'algosdk';
import * as SecureStore from 'expo-secure-store';

export class ProductionAlgorandService {
  private algodClient: algosdk.Algodv2;
  private indexerClient: algosdk.Indexer;

  constructor() {
    // Production MainNet configuration
    this.algodClient = new algosdk.Algodv2(
      process.env.EXPO_PUBLIC_ALGOD_TOKEN!,
      process.env.EXPO_PUBLIC_ALGOD_SERVER!,
      process.env.EXPO_PUBLIC_ALGOD_PORT!
    );
    
    this.indexerClient = new algosdk.Indexer(
      process.env.EXPO_PUBLIC_INDEXER_TOKEN!,
      process.env.EXPO_PUBLIC_INDEXER_SERVER!,
      process.env.EXPO_PUBLIC_INDEXER_PORT!
    );
  }

  async createRealAccount(): Promise<AlgorandAccount> {
    const account = algosdk.generateAccount();
    const mnemonic = algosdk.secretKeyToMnemonic(account.sk);
    
    // Store in secure hardware-backed storage
    await SecureStore.setItemAsync('algo_private_key', 
      JSON.stringify(Array.from(account.sk)), 
      { requireAuthentication: true }
    );
    
    return {
      address: account.addr,
      mnemonic,
      privateKey: account.sk,
    };
  }

  async processRealPayment(
    fromAccount: AlgorandAccount,
    toAddress: string,
    amount: number,
    note: string
  ): Promise<string> {
    const params = await this.algodClient.getTransactionParams().do();
    
    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: fromAccount.address,
      to: toAddress,
      amount: Math.round(amount * 1000000), // Convert to microAlgos
      note: new TextEncoder().encode(note),
      suggestedParams: params,
    });

    const signedTxn = txn.signTxn(fromAccount.privateKey);
    const { txId } = await this.algodClient.sendRawTransaction(signedTxn).do();
    
    // Wait for confirmation
    await this.waitForConfirmation(txId);
    return txId;
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
}