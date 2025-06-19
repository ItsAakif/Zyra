declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_SUPABASE_URL: string;
      EXPO_PUBLIC_SUPABASE_ANON_KEY: string;
      EXPO_PUBLIC_ALGOD_TOKEN: string;
      EXPO_PUBLIC_ALGOD_SERVER: string;
      EXPO_PUBLIC_ALGOD_PORT: string;
      EXPO_PUBLIC_INDEXER_TOKEN: string;
      EXPO_PUBLIC_INDEXER_SERVER: string;
      EXPO_PUBLIC_INDEXER_PORT: string;
      EXPO_PUBLIC_ZYRO_ASSET_ID: string;
      EXPO_PUBLIC_TREASURY_ADDRESS: string;
      EXPO_PUBLIC_ELEVENLABS_API_KEY: string;
      EXPO_PUBLIC_TRANSAK_API_KEY: string;
      EXPO_PUBLIC_RAMP_API_KEY: string;
      EXPO_PUBLIC_MOONPAY_API_KEY: string;
    }
  }
}

export {};