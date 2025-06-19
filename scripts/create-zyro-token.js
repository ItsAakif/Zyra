const algosdk = require('algosdk');

// Configuration
const algodToken = '';
const algodServer = 'https://testnet-api.algonode.cloud';
const algodPort = 443;

// Initialize Algod client
const algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);

async function createZyroToken() {
  try {
    // You'll need to replace this with your treasury account mnemonic
    const creatorMnemonic = 'YOUR_TREASURY_MNEMONIC_HERE';
    const creatorAccount = algosdk.mnemonicToSecretKey(creatorMnemonic);
    
    console.log('Creating Zyro token...');
    console.log('Creator address:', creatorAccount.addr);
    
    // Get transaction parameters
    const params = await algodClient.getTransactionParams().do();
    
    // Create asset creation transaction
    const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
      from: creatorAccount.addr,
      total: 1000000000000000, // 1 billion Zyro tokens with 6 decimals
      decimals: 6,
      assetName: 'Zyro',
      unitName: 'ZYR',
      assetURL: 'https://zyra.app',
      assetMetadataHash: undefined,
      defaultFrozen: false,
      freeze: undefined,
      manager: creatorAccount.addr,
      clawback: undefined,
      reserve: creatorAccount.addr,
      suggestedParams: params,
    });
    
    // Sign the transaction
    const signedTxn = txn.signTxn(creatorAccount.sk);
    
    // Submit the transaction
    const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
    console.log('Transaction ID:', txId);
    
    // Wait for confirmation
    const confirmedTxn = await waitForConfirmation(algodClient, txId);
    const assetId = confirmedTxn['asset-index'];
    
    console.log('\n✅ Zyro Token Created Successfully!');
    console.log('Asset ID:', assetId);
    console.log('Add this to your .env file as EXPO_PUBLIC_ZYRO_ASSET_ID');
    
    return assetId;
  } catch (error) {
    console.error('Error creating Zyro token:', error);
  }
}

async function waitForConfirmation(algodClient, txId) {
  const status = await algodClient.status().do();
  let lastRound = status['last-round'];
  
  while (true) {
    const pendingInfo = await algodClient.pendingTransactionInformation(txId).do();
    
    if (pendingInfo['confirmed-round'] !== null && pendingInfo['confirmed-round'] > 0) {
      return pendingInfo;
    }
    
    lastRound++;
    await algodClient.statusAfterBlock(lastRound).do();
  }
}

// Run the script
createZyroToken();