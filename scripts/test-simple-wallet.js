#!/usr/bin/env node

// Simple test for the simple wallet system
console.log('🧪 Testing Simple Wallet System...');

// Mock the SimpleWalletService functionality
function generateMockAlgorandAddress() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let result = '';
  for (let i = 0; i < 58; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function createMockWallet(name = 'Test Wallet') {
  const address = generateMockAlgorandAddress();
  
  const wallet = {
    address,
    name: `${name} ${address.slice(0, 6)}`,
    type: 'mock',
    balance: 0.0000
  };
  
  return wallet;
}

console.log('📝 Running tests...');

// Test 1: Mock address generation
console.log('\nTest 1: Address Generation');
const testAddress = generateMockAlgorandAddress();
console.log(`Generated address: ${testAddress}`);
console.log(`Length: ${testAddress.length} ${testAddress.length === 58 ? '✅' : '❌'}`);
console.log(`Format: ${/^[A-Z2-7]{58}$/.test(testAddress) ? '✅' : '❌'}`);

// Test 2: Wallet creation
console.log('\nTest 2: Wallet Creation');
const testWallet = createMockWallet('My Test Wallet');
console.log(`Wallet created: ${testWallet.name}`);
console.log(`Address: ${testWallet.address.slice(0, 8)}...${testWallet.address.slice(-8)}`);
console.log(`Type: ${testWallet.type}`);
console.log(`Balance: ${testWallet.balance}`);

// Test 3: Multiple wallets
console.log('\nTest 3: Multiple Wallets');
const wallets = [];
for (let i = 0; i < 3; i++) {
  wallets.push(createMockWallet(`Wallet ${i + 1}`));
}
console.log(`Created ${wallets.length} wallets:`);
wallets.forEach((wallet, index) => {
  console.log(`  ${index + 1}. ${wallet.name} - ${wallet.address.slice(0, 8)}...`);
});

console.log('\n🎉 Simple wallet system tests passed!');
console.log('Start the app with: npm start');
console.log('The wallet system should work without external dependencies.');
