import { createClient } from '@supabase/supabase-js';

// Get environment variables with fallback values to prevent crashes
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Enhanced validation for production readiness
const isValidUrl = supabaseUrl && 
  !supabaseUrl.includes('your-project-id') && 
  supabaseUrl.startsWith('https://') &&
  supabaseUrl.includes('.supabase.co');

const isValidKey = supabaseAnonKey && 
  !supabaseAnonKey.includes('your-supabase-anon-key') &&
  supabaseAnonKey.length > 100; // Supabase keys are long

if (!isValidUrl || !isValidKey) {
  console.warn('🔧 Supabase Configuration Required:');
  console.warn('Please set up your Supabase project and update .env file:');
  console.warn('1. Go to https://supabase.com and create a new project');
  console.warn('2. Copy your project URL and anon key');
  console.warn('3. Update EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env');
  console.warn('4. Run the database migration from supabase/migrations/');
}

// Create client with enhanced error handling
export const supabase = isValidUrl && isValidKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })
  : null;

// Environment status helper
export const getEnvironmentStatus = () => ({
  supabaseConfigured: isValidUrl && isValidKey,
  environment: process.env.EXPO_PUBLIC_ENVIRONMENT || 'development',
  appVersion: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
  features: {
    voiceAI: process.env.EXPO_PUBLIC_ENABLE_VOICE_AI === 'true',
    realPayments: process.env.EXPO_PUBLIC_ENABLE_REAL_PAYMENTS === 'true',
    advancedFeatures: process.env.EXPO_PUBLIC_ENABLE_ADVANCED_FEATURES === 'true'
  }
});

// Database types
export interface User {
  id: string;
  email: string;
  full_name: string;
  algorand_address?: string;
  kyc_verified: boolean;
  subscription_tier: 'free' | 'plus' | 'pro';
  anonymous_mode: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'payment' | 'reward' | 'conversion';
  amount: number;
  currency: string;
  algo_amount?: number;
  zyro_earned: number;
  country: string;
  payment_method: string;
  status: 'pending' | 'completed' | 'failed';
  algorand_tx_id?: string;
  metadata?: any;
  created_at: string;
}

export interface NFTReward {
  id: string;
  user_id: string;
  name: string;
  description: string;
  image_url: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  zyro_value: number;
  algorand_asset_id?: number;
  earned_date: string;
}

export interface Achievement {
  id: string;
  user_id: string;
  title: string;
  description: string;
  progress: number;
  max_progress: number;
  reward_amount: number;
  completed: boolean;
  completed_date?: string;
  created_at: string;
}

export interface ZyroBalance {
  id: string;
  user_id: string;
  balance: number;
  total_earned: number;
  total_spent: number;
  updated_at: string;
}

export interface KYCVerification {
  id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  verification_data?: any;
  verified_at?: string;
  created_at: string;
}

export interface SoulboundToken {
  id: string;
  user_id: string;
  token_id: string;
  token_type: 'identity' | 'achievement' | 'reputation';
  algorand_asset_id?: number;
  metadata: any;
  issued_date: string;
}