# Zyra - Global Payment & Rewards App

A React Native Expo app built with TypeScript that enables global payments with cryptocurrency rewards and gamification features.

## Features

- **Authentication**: Secure user registration and login with Supabase
- **Global Payments**: Send money worldwide with competitive rates
- **Crypto Rewards**: Earn Zyro tokens for every transaction
- **NFT Rewards**: Collect unique NFTs based on payment activity
- **Gamification**: Achievement system with progress tracking
- **Voice Assistant**: AI-powered voice commands for payments
- **QR Code Scanning**: Quick payment initiation via QR codes
- **Multi-tier Subscriptions**: Free, Plus, and Pro tiers with different benefits

## Tech Stack

- **Frontend**: React Native with Expo SDK 52
- **Navigation**: Expo Router 4
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Blockchain**: Algorand for crypto transactions
- **Styling**: React Native StyleSheet
- **Icons**: Lucide React Native
- **Fonts**: Expo Google Fonts (Inter, Space Grotesk)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Expo CLI
- Supabase account
- Algorand wallet/account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd zyra-app
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:

Create a `.env` file in the root directory and add your Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important**: Replace the placeholder values with your actual Supabase project URL and anonymous key. You can find these in your Supabase project dashboard under Settings > API.

4. Set up the database:

Run the SQL migration in your Supabase SQL editor:
```sql
-- The migration file is located at: supabase/migrations/20250618221557_fading_swamp.sql
-- Copy and paste the contents into your Supabase SQL editor and run it
```

5. Start the development server:
```bash
npm start
```

### Database Schema

The app uses the following main tables:
- `users` - User profiles and settings
- `transactions` - Payment and reward transactions
- `nft_rewards` - NFT collectibles earned by users
- `achievements` - Gamification progress tracking
- `zyro_balances` - User token balances
- `kyc_verifications` - KYC compliance data
- `soulbound_tokens` - Non-transferable identity tokens

### Project Structure

```
app/
├── (auth)/          # Authentication screens
├── (tabs)/          # Main app tabs
├── api/             # API routes
└── _layout.tsx      # Root layout

components/          # Reusable components
lib/                # Core services and utilities
├── auth.ts         # Authentication service
├── supabase.ts     # Database client
├── algorand.ts     # Blockchain integration
└── payment-processor.ts # Payment logic

supabase/
└── migrations/     # Database migrations
```

### Key Features Implementation

#### Authentication Flow
- Email/password registration and login
- Password reset functionality
- Protected routes based on auth state
- User profile management

#### Payment System
- Multi-currency support
- Real-time exchange rates
- Transaction history
- Reward calculation and distribution

#### Gamification
- Achievement tracking
- NFT reward system
- Progress indicators
- Tier-based benefits

#### Voice Assistant
- Natural language payment commands
- Transaction status queries
- Balance inquiries
- Help and navigation

## Development

### Running on Different Platforms

```bash
# iOS Simulator
npm run ios

# Android Emulator  
npm run android

# Web Browser
npm run web
```

### Environment Variables

All environment variables must be prefixed with `EXPO_PUBLIC_` to be accessible in the client:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database Migrations

To create a new migration:
1. Create a new SQL file in `supabase/migrations/`
2. Add your schema changes
3. Run the migration in your Supabase dashboard

## Deployment

### Building for Production

```bash
# Create production build
eas build --platform all

# Submit to app stores
eas submit --platform all
```

### Environment Setup

Create environment-specific `.env` files:
- `.env.development`
- `.env.staging` 
- `.env.production`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the database schema

---

**Note**: Make sure to configure your Supabase environment variables before running the app. The application will not function properly without valid Supabase credentials.