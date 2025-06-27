#!/usr/bin/env node

const algosdk = require('algosdk');

console.log('🧪 Testing Real Blockchain Integration');
console.log('=====================================\n');

async function testAlgorandConnection() {
  try {
    console.log('1. Testing Algorand Connection...');
    
    // Create clients using the same config as the app
    const algodClient = new algosdk.Algodv2(
      '',
      'https://testnet-api.algonode.cloud',
      ''
    );
    
    // Test connection
    const status = await algodClient.status().do();
    console.log('✅ Connected to Algorand testnet');
    console.log(`   Last round: ${status['last-round']}`);
    console.log(`   Network: ${status['genesis-id']}`);
    
    return algodClient;
  } catch (error) {
    console.error('❌ Algorand connection failed:', error.message);
    return null;
  }
}

async function testAccountCreation() {
  try {
    console.log('\n2. Testing Account Creation...');
    
    // Generate a new account
    const account = algosdk.generateAccount();
    const mnemonic = algosdk.secretKeyToMnemonic(account.sk);
    
    console.log('✅ Account created successfully');
    console.log(`   Address: ${account.addr}`);
    console.log(`   Mnemonic: ${mnemonic.substring(0, 20)}...`);
    
    // Verify address format
    if (account.addr.length === 58) {
      console.log('✅ Address format is correct (58 characters)');
    } else {
      console.log('❌ Address format is incorrect');
    }
    
    return account;
  } catch (error) {
    console.error('❌ Account creation failed:', error.message);
    return null;
  }
}

async function testBalanceCheck(algodClient, address) {
  try {
    console.log('\n3. Testing Balance Check...');
    
    const accountInfo = await algodClient.accountInformation(address).do();
    const balance = accountInfo.amount / 1000000; // Convert microAlgos
    
    console.log('✅ Balance check successful');
    console.log(`   Balance: ${balance.toFixed(6)} ALGO`);
    
    if (balance === 0) {
      console.log('ℹ️  New account has 0 balance (expected)');
      console.log('   💡 Fund at: https://dispenser.testnet.aws.algodev.network/');
    }
    
    return balance;
  } catch (error) {
    console.error('❌ Balance check failed:', error.message);
    return null;
  }
}

async function testTransactionParams(algodClient) {
  try {
    console.log('\n4. Testing Transaction Parameters...');
    
    const params = await algodClient.getTransactionParams().do();
    
    console.log('✅ Transaction params retrieved');
    console.log(`   Fee: ${params.fee} microAlgos`);
    console.log(`   Min fee: ${params.minFee} microAlgos`);
    console.log(`   First valid round: ${params.firstRound}`);
    console.log(`   Last valid round: ${params.lastRound}`);
    
    return params;
  } catch (error) {
    console.error('❌ Transaction params failed:', error.message);
    return null;
  }
}

async function testIndexerConnection() {
  try {
    console.log('\n5. Testing Indexer Connection...');
    
    const indexerClient = new algosdk.Indexer(
      '',
      'https://testnet-idx.algonode.cloud',
      ''
    );
    
    const health = await indexerClient.makeHealthCheck().do();
    
    console.log('✅ Indexer connection successful');
    console.log(`   Round: ${health.round}`);
    console.log(`   Version: ${health.version}`);
    
    return indexerClient;
  } catch (error) {
    console.error('❌ Indexer connection failed:', error.message);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Starting blockchain integration tests...\n');
  
  const algodClient = await testAlgorandConnection();
  if (!algodClient) {
    console.log('\n❌ Basic connection failed. Check your internet connection.');
    return;
  }
  
  const account = await testAccountCreation();
  if (!account) {
    console.log('\n❌ Account creation failed. Check algosdk installation.');
    return;
  }
  
  const balance = await testBalanceCheck(algodClient, account.addr);
  if (balance === null) {
    console.log('\n❌ Balance check failed. Account might not exist on chain yet.');
  }
  
  const params = await testTransactionParams(algodClient);
  if (!params) {
    console.log('\n❌ Transaction params failed. Network might be down.');
  }
  
  const indexer = await testIndexerConnection();
  if (!indexer) {
    console.log('\n⚠️  Indexer connection failed. Transaction history might not work.');
  }
  
  console.log('\n🎉 Test Summary:');
  console.log('================');
  console.log(`✅ Algorand Connection: ${algodClient ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Account Creation: ${account ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Balance Check: ${balance !== null ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Transaction Params: ${params ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Indexer Connection: ${indexer ? 'PASS' : 'FAIL'}`);
  
  if (algodClient && account && balance !== null && params) {
    console.log('\n🎯 RESULT: Real blockchain integration is WORKING!');
    console.log('Your app will create real Algorand accounts and process real transactions.');
    console.log('\n📝 Next steps:');
    console.log('1. Fund test accounts at: https://dispenser.testnet.aws.algodev.network/');
    console.log('2. Test wallet creation in your app');
    console.log('3. Make real blockchain transactions');
  } else {
    console.log('\n⚠️  RESULT: Some tests failed. Check your configuration.');
  }
}

// Run the tests
runTests().catch(console.error);
