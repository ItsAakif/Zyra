// Environment configuration and validation service
export class EnvironmentService {
  static validateEnvironment(): EnvironmentStatus {
    const status: EnvironmentStatus = {
      isValid: true,
      errors: [],
      warnings: [],
      configuration: this.getConfiguration()
    };

    // Check core requirements
    if (!this.isSupabaseConfigured()) {
      status.isValid = false;
      status.errors.push('Supabase not configured');
    }

    // Check optional but recommended services
    if (!this.isAlgorandConfigured()) {
      status.warnings.push('Algorand testnet not configured - blockchain features disabled');
    }

    if (!this.isVoiceAIConfigured()) {
      status.warnings.push('ElevenLabs not configured - voice features disabled');
    }

    return status;
  }

  static isSupabaseConfigured(): boolean {
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    
    return !!(url && 
             key && 
             url.startsWith('https://') && 
             url.includes('.supabase.co') &&
             !url.includes('your-project-id') &&
             key.length > 100);
  }

  static isAlgorandConfigured(): boolean {
    const nodeUrl = process.env.EXPO_PUBLIC_ALGORAND_NODE_URL;
    const network = process.env.EXPO_PUBLIC_ALGORAND_NETWORK;
    
    return !!(nodeUrl && network && 
             (nodeUrl.includes('testnet') || nodeUrl.includes('mainnet')));
  }

  static isVoiceAIConfigured(): boolean {
    const apiKey = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY;
    return !!(apiKey && apiKey.length > 10 && !apiKey.includes('your-'));
  }

  static isRevenueCatConfigured(): boolean {
    const appleKey = process.env.EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY;
    const googleKey = process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY;
    return !!(appleKey || googleKey);
  }

  static getConfiguration(): EnvironmentConfiguration {
    return {
      environment: process.env.EXPO_PUBLIC_ENVIRONMENT || 'development',
      appVersion: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
      features: {
        voiceAI: process.env.EXPO_PUBLIC_ENABLE_VOICE_AI === 'true',
        realPayments: process.env.EXPO_PUBLIC_ENABLE_REAL_PAYMENTS === 'true',
        advancedFeatures: process.env.EXPO_PUBLIC_ENABLE_ADVANCED_FEATURES === 'true'
      },
      services: {
        supabase: this.isSupabaseConfigured(),
        algorand: this.isAlgorandConfigured(),
        elevenlabs: this.isVoiceAIConfigured(),
        revenuecat: this.isRevenueCatConfigured()
      },
      defaults: {
        currency: process.env.EXPO_PUBLIC_DEFAULT_CURRENCY || 'USD',
        country: process.env.EXPO_PUBLIC_DEFAULT_COUNTRY || 'US',
        language: process.env.EXPO_PUBLIC_DEFAULT_LANGUAGE || 'en'
      }
    };
  }

  static logEnvironmentStatus(): void {
    const status = this.validateEnvironment();
    const config = status.configuration;

    console.log('🚀 Zyra Environment Status:');
    console.log(`📱 App Version: ${config.appVersion}`);
    console.log(`🌍 Environment: ${config.environment}`);
    console.log('');
    
    console.log('✅ Services Status:');
    console.log(`   Database (Supabase): ${config.services.supabase ? '✅' : '❌'}`);
    console.log(`   Blockchain (Algorand): ${config.services.algorand ? '✅' : '⚠️'}`);
    console.log(`   Voice AI (ElevenLabs): ${config.services.elevenlabs ? '✅' : '⚠️'}`);
    console.log(`   Subscriptions (RevenueCat): ${config.services.revenuecat ? '✅' : '⚠️'}`);
    console.log('');

    console.log('🎛️ Feature Flags:');
    console.log(`   Voice AI: ${config.features.voiceAI ? '✅' : '❌'}`);
    console.log(`   Real Payments: ${config.features.realPayments ? '✅' : '❌'}`);
    console.log(`   Advanced Features: ${config.features.advancedFeatures ? '✅' : '❌'}`);
    console.log('');

    if (status.errors.length > 0) {
      console.log('❌ Critical Errors:');
      status.errors.forEach(error => console.log(`   • ${error}`));
      console.log('');
    }

    if (status.warnings.length > 0) {
      console.log('⚠️ Warnings:');
      status.warnings.forEach(warning => console.log(`   • ${warning}`));
      console.log('');
    }

    if (status.isValid) {
      console.log('🎉 Environment is ready for development!');
    } else {
      console.log('🔧 Please fix configuration errors to continue.');
    }
  }

  static getSetupInstructions(): SetupInstructions {
    return {
      supabase: {
        title: 'Supabase Database Setup',
        steps: [
          '1. Go to https://supabase.com and create a new project',
          '2. Copy your Project URL and anon/public key',
          '3. Add to .env: EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY',
          '4. Run the database migration: Copy supabase/migrations/20250618221557_fading_swamp.sql to Supabase SQL Editor and execute'
        ],
        priority: 'REQUIRED'
      },
      algorand: {
        title: 'Algorand Blockchain Setup',
        steps: [
          '1. For testnet: No API key needed, just use default testnet URLs',
          '2. Add to .env: EXPO_PUBLIC_ALGORAND_NETWORK=testnet',
          '3. For mainnet: Get API key from AlgoNode or PureStake',
          '4. Create Zyro token: Run scripts/create-zyro-token.js'
        ],
        priority: 'RECOMMENDED'
      },
      elevenlabs: {
        title: 'ElevenLabs Voice AI Setup',
        steps: [
          '1. Sign up at https://elevenlabs.io',
          '2. Get your API key from account settings',
          '3. Add to .env: EXPO_PUBLIC_ELEVENLABS_API_KEY=your_api_key',
          '4. Choose a voice ID or use default: EXAVITQu4vr4xnSDxMaL'
        ],
        priority: 'RECOMMENDED'
      },
      revenuecat: {
        title: 'RevenueCat Subscriptions Setup',
        steps: [
          '1. Create account at https://www.revenuecat.com',
          '2. Set up your app in RevenueCat dashboard',
          '3. Get API keys for iOS and Android',
          '4. Add to .env: EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY and EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY'
        ],
        priority: 'OPTIONAL'
      }
    };
  }
}

export interface EnvironmentStatus {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  configuration: EnvironmentConfiguration;
}

export interface EnvironmentConfiguration {
  environment: string;
  appVersion: string;
  features: {
    voiceAI: boolean;
    realPayments: boolean;
    advancedFeatures: boolean;
  };
  services: {
    supabase: boolean;
    algorand: boolean;
    elevenlabs: boolean;
    revenuecat: boolean;
  };
  defaults: {
    currency: string;
    country: string;
    language: string;
  };
}

export interface SetupInstructions {
  [key: string]: {
    title: string;
    steps: string[];
    priority: 'REQUIRED' | 'RECOMMENDED' | 'OPTIONAL';
  };
}
