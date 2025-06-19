-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  algorand_address TEXT,
  kyc_verified BOOLEAN DEFAULT FALSE,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'plus', 'pro')),
  anonymous_mode BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('payment', 'reward', 'conversion')),
  amount DECIMAL(20, 8) NOT NULL,
  currency TEXT NOT NULL,
  algo_amount DECIMAL(20, 8),
  zyro_earned DECIMAL(20, 8) DEFAULT 0,
  country TEXT,
  payment_method TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  algorand_tx_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NFT Rewards table
CREATE TABLE IF NOT EXISTS public.nft_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  rarity TEXT CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  zyro_value DECIMAL(20, 8) DEFAULT 0,
  algorand_asset_id BIGINT,
  earned_date TIMESTAMPTZ DEFAULT NOW()
);

-- Achievements table
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  progress INTEGER DEFAULT 0,
  max_progress INTEGER NOT NULL,
  reward_amount DECIMAL(20, 8) DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completed_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Zyro Balance table
CREATE TABLE IF NOT EXISTS public.zyro_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  balance DECIMAL(20, 8) DEFAULT 0,
  total_earned DECIMAL(20, 8) DEFAULT 0,
  total_spent DECIMAL(20, 8) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- KYC Verifications table
CREATE TABLE IF NOT EXISTS public.kyc_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  verification_data JSONB,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Soulbound Tokens table
CREATE TABLE IF NOT EXISTS public.soulbound_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  token_id TEXT NOT NULL,
  token_type TEXT CHECK (token_type IN ('identity', 'achievement', 'reputation')),
  algorand_asset_id BIGINT,
  metadata JSONB,
  issued_date TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_nft_rewards_user_id ON public.nft_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON public.achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_users_algorand_address ON public.users(algorand_address);

-- Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nft_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zyro_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.soulbound_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read own data" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON public.users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can read own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own NFT rewards" ON public.nft_rewards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own NFT rewards" ON public.nft_rewards FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own achievements" ON public.achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own achievements" ON public.achievements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own achievements" ON public.achievements FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can read own Zyro balance" ON public.zyro_balances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own Zyro balance" ON public.zyro_balances FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own Zyro balance" ON public.zyro_balances FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can read own KYC data" ON public.kyc_verifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own KYC data" ON public.kyc_verifications FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own soulbound tokens" ON public.soulbound_tokens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own soulbound tokens" ON public.soulbound_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Functions and Triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_zyro_balances_updated_at BEFORE UPDATE ON public.zyro_balances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'));
  
  INSERT INTO public.zyro_balances (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();