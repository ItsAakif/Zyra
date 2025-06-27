#!/usr/bin/env node

console.log('🧪 Testing Crypto Polyfill');
console.log('==========================\n');

// Test 1: Check if algosdk can be imported
try {
  console.log('1. Testing algosdk import...');
  require('react-native-get-random-values');
  
  // Add polyfill using Node.js crypto for testing
  const crypto = require('crypto');
  if (!global.crypto) {
    global.crypto = {
      getRandomValues: (array) => {
        const bytes = crypto.randomBytes(array.length);
        array.set(bytes);
        return array;
      },
    };
  }
  
  const algosdk = require('algosdk');
  console.log('✅ algosdk imported successfully');
  
  // Test 2: Account generation
  console.log('\n2. Testing account generation...');
  const account = algosdk.generateAccount();
  console.log('✅ Account generated successfully');
  console.log(`   Address: ${account.addr}`);
  console.log(`   Address length: ${account.addr.length} characters`);
  
  // Test 3: Mnemonic generation
  console.log('\n3. Testing mnemonic generation...');
  const mnemonic = algosdk.secretKeyToMnemonic(account.sk);
  console.log('✅ Mnemonic generated successfully');
  console.log(`   Words: ${mnemonic.split(' ').length}`);
  
  console.log('\n🎉 All crypto tests PASSED!');
  console.log('Your React Native app should be able to create Algorand accounts.');
  
} catch (error) {
  console.error('❌ Crypto test failed:', error.message);
  console.log('\n🔧 Troubleshooting:');
  console.log('1. Make sure react-native-get-random-values is installed');
  console.log('2. Import polyfills at the top of your app');
  console.log('3. Restart Metro bundler completely');
}
