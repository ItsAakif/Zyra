const algosdk = require('algosdk');

// Create a new account for treasury
const account = algosdk.generateAccount();
const mnemonic = algosdk.secretKeyToMnemonic(account.sk);

console.log('Treasury Account Created:');
console.log('Address:', account.addr);
console.log('Mnemonic:', mnemonic);
console.log('\nAdd this address to your .env file as EXPO_PUBLIC_TREASURY_ADDRESS');
console.log('\nFund this account with TestNet ALGO at:');
console.log('https://testnet.algoexplorer.io/dispenser');