#!/usr/bin/env node

// Simple test to verify wallet functionality
console.log('🧪 Testing Zyra Wallet System...');

const testAlgorandAddress = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

function isValidAlgorandAddress(address) {
  // Basic validation: 58 characters, alphanumeric
  const pattern = /^[A-Z2-7]{58}$/;
  return pattern.test(address);
}

console.log('📝 Running basic tests...');

// Test 1: Address validation
console.log('Test 1: Address validation');
console.log(`Valid address test: ${isValidAlgorandAddress(testAlgorandAddress) ? '✅' : '❌'}`);
console.log(`Invalid address test: ${!isValidAlgorandAddress('invalid') ? '✅' : '❌'}`);

// Test 2: Environment check
console.log('\nTest 2: Environment check');
const hasEnvFile = require('fs').existsSync('.env');
console.log(`Environment file exists: ${hasEnvFile ? '✅' : '❌'}`);

// Test 3: Dependencies check
console.log('\nTest 3: Dependencies check');
try {
  require('expo-clipboard');
  console.log('expo-clipboard package: ✅');
} catch (e) {
  console.log('expo-clipboard package: ❌');
}

try {
  require('expo-secure-store');
  console.log('expo-secure-store package: ✅');
} catch (e) {
  console.log('expo-secure-store package: ❌');
}

try {
  require('algosdk');
  console.log('algosdk package: ✅');
} catch (e) {
  console.log('algosdk package: ❌');
}

console.log('\n🎉 Basic tests completed!');
console.log('Start the app with: npm start');
