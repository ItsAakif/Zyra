#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorLog(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupEnvironment() {
  colorLog('cyan', '🚀 Welcome to Zyra Environment Setup!');
  console.log('');
  
  const envPath = path.join(process.cwd(), '.env');
  const envExamplePath = path.join(process.cwd(), '.env.example');
  
  // Check if .env.example exists
  if (!fs.existsSync(envExamplePath)) {
    colorLog('red', '❌ Error: .env.example file not found!');
    colorLog('yellow', 'Please ensure you are running this from the project root directory.');
    process.exit(1);
  }
  
  // Read .env.example
  const envExample = fs.readFileSync(envExamplePath, 'utf8');
  let envContent = envExample;
  
  colorLog('green', '✅ Found .env.example template');
  console.log('');
  
  // Supabase Configuration
  colorLog('blue', '📱 SUPABASE CONFIGURATION');
  colorLog('yellow', 'Go to https://supabase.com and create a new project');
  console.log('');
  
  const supabaseUrl = await question('Enter your Supabase URL: ');
  const supabaseKey = await question('Enter your Supabase anon key: ');
  
  if (supabaseUrl && supabaseKey) {
    envContent = envContent.replace('https://your-project-id.supabase.co', supabaseUrl);
    envContent = envContent.replace('your-supabase-anon-key', supabaseKey);
    colorLog('green', '✅ Supabase configuration added');
  } else {
    colorLog('yellow', '⚠️ Skipping Supabase configuration');
  }
  
  console.log('');
  
  // ElevenLabs Configuration
  colorLog('blue', '🎤 ELEVENLABS VOICE AI CONFIGURATION');
  colorLog('yellow', 'Go to https://elevenlabs.io and get your API key');
  console.log('');
  
  const elevenLabsKey = await question('Enter your ElevenLabs API key (optional): ');
  
  if (elevenLabsKey) {
    envContent = envContent.replace('your-elevenlabs-api-key', elevenLabsKey);
    envContent = envContent.replace('EXPO_PUBLIC_ENABLE_VOICE_AI=true', 'EXPO_PUBLIC_ENABLE_VOICE_AI=true');
    colorLog('green', '✅ ElevenLabs configuration added');
  } else {
    envContent = envContent.replace('EXPO_PUBLIC_ENABLE_VOICE_AI=true', 'EXPO_PUBLIC_ENABLE_VOICE_AI=false');
    colorLog('yellow', '⚠️ Voice AI disabled');
  }
  
  console.log('');
  
  // Algorand Configuration
  colorLog('blue', '⚡ ALGORAND BLOCKCHAIN CONFIGURATION');
  colorLog('green', 'Using Algorand testnet (no API key required)');
  
  // Set testnet as default
  envContent = envContent.replace('EXPO_PUBLIC_ALGORAND_NETWORK=testnet', 'EXPO_PUBLIC_ALGORAND_NETWORK=testnet');
  
  console.log('');
  
  // Exchange Rate API
  colorLog('blue', '💱 EXCHANGE RATE API CONFIGURATION');
  colorLog('yellow', 'Get a free API key from https://exchangerate-api.com');
  console.log('');
  
  const exchangeRateKey = await question('Enter your Exchange Rate API key (optional): ');
  
  if (exchangeRateKey) {
    envContent = envContent.replace('your-exchange-rate-api-key', exchangeRateKey);
    colorLog('green', '✅ Exchange Rate API configured');
  } else {
    colorLog('yellow', '⚠️ Using fallback exchange rates');
  }
  
  console.log('');
  
  // RevenueCat Configuration
  colorLog('blue', '💰 REVENUECAT SUBSCRIPTIONS CONFIGURATION');
  colorLog('yellow', 'Set up at https://www.revenuecat.com (optional for basic testing)');
  console.log('');
  
  const skipRevenueCat = await question('Skip RevenueCat setup for now? (y/n): ');
  
  if (skipRevenueCat.toLowerCase() !== 'y') {
    const revenueCatApple = await question('Enter RevenueCat Apple API key: ');
    const revenueCatGoogle = await question('Enter RevenueCat Google API key: ');
    
    if (revenueCatApple) {
      envContent = envContent.replace('your-revenuecat-apple-key', revenueCatApple);
    }
    if (revenueCatGoogle) {
      envContent = envContent.replace('your-revenuecat-google-key', revenueCatGoogle);
    }
    
    colorLog('green', '✅ RevenueCat configuration added');
  } else {
    colorLog('yellow', '⚠️ Skipping RevenueCat configuration');
  }
  
  // Write .env file
  try {
    fs.writeFileSync(envPath, envContent);
    colorLog('green', '✅ .env file created successfully!');
  } catch (error) {
    colorLog('red', '❌ Error writing .env file:');
    console.error(error);
    process.exit(1);
  }
  
  console.log('');
  colorLog('cyan', '🎉 Environment setup complete!');
  console.log('');
  
  colorLog('yellow', '📋 Next Steps:');
  console.log('1. Run: npm start');
  console.log('2. Check the console for environment status');
  console.log('3. If using Supabase, run the database migration:');
  console.log('   • Go to your Supabase dashboard');
  console.log('   • Open SQL Editor');
  console.log('   • Copy/paste contents of supabase/migrations/20250618221557_fading_swamp.sql');
  console.log('   • Run the migration');
  console.log('');
  
  colorLog('green', '🚀 Ready to build the future of payments!');
  
  rl.close();
}

// Handle process interruption
process.on('SIGINT', () => {
  console.log('');
  colorLog('yellow', '⚠️ Setup interrupted');
  rl.close();
  process.exit(0);
});

// Run setup
setupEnvironment().catch(error => {
  colorLog('red', '❌ Setup failed:');
  console.error(error);
  rl.close();
  process.exit(1);
});
