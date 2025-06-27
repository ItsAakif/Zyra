<div align="center">
  <img src="assets/images/logo_gradient.png" alt="Zyra Logo" width="120" height="80">
  
  # Zyra - AI-Powered Global Payment Platform
  
  [![React Native](https://img.shields.io/badge/React%20Native-0.73-blue.svg)](https://reactnative.dev/)
  [![Expo SDK](https://img.shields.io/badge/Expo%20SDK-52-black.svg)](https://expo.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
  [![Algorand](https://img.shields.io/badge/Blockchain-Algorand-green.svg)](https://www.algorand.com/)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  
  **Revolutionary blockchain-powered payment platform with AI voice interface, NFT rewards, and global accessibility.**
  
  [🚀 Quick Start](#-quick-start) • [📱 Features](#-features) • [🛠️ Development](#️-development) • [📚 Documentation](#-documentation)
  
</div>

---

## 📋 Table of Contents

- [✨ Features](#-features)
- [🏗️ Architecture](#️-architecture)
- [🚀 Quick Start](#-quick-start)
- [⚙️ Installation](#️-installation)
- [🔧 Configuration](#-configuration)
- [🛠️ Development](#️-development)
- [🌐 Deployment](#-deployment)
- [🧪 Testing](#-testing)
- [📚 API Documentation](#-api-documentation)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [🆘 Support](#-support)

---

## ✨ Features

### 🔐 **Blockchain & Security**
- **Real Algorand Integration** - Live testnet transactions with actual blockchain verification
- **Secure Wallet Creation** - Generate real 58-character Algorand addresses
- **Transaction History** - Complete on-chain transaction tracking
- **Cross-border Payments** - Global transfers for just $0.0002 per transaction

### 🤖 **AI-Powered Interface**
- **Voice Assistant** - Natural language payment commands via ElevenLabs AI
- **Smart Transaction Processing** - AI-driven payment optimization
- **Contextual Help** - Intelligent assistance throughout the app

### 🎮 **Gamification & Rewards**
- **NFT Rewards** - Earn unique blockchain assets for transaction milestones
- **Achievement System** - Progress tracking with dynamic rewards
- **Multi-tier Subscriptions** - Basic, Pro, and Enterprise tiers with RevenueCat
- **Loyalty Program** - Transaction-based reward multipliers

### 🌐 **Global Accessibility**
- **QR Code Scanning** - Support for global payment formats (UPI, PIX, PayNow)
- **Multi-currency Support** - ALGO and custom Zyro token transfers
- **Dark/Light Themes** - Comprehensive theming system
- **Responsive Design** - Works on mobile and web platforms

### 🛡️ **Enterprise Features**
- **KYC Verification** - Compliance-ready identity verification
- **Demo Mode** - Presentation-ready demonstration toggle
- **Real-time Balances** - Live blockchain balance updates
- **Transaction Analytics** - Comprehensive payment insights

## 🏗️ Architecture

### **Frontend Stack**
| Technology | Version | Purpose |
|------------|---------|---------|
| **React Native** | 0.73+ | Core mobile framework |
| **Expo SDK** | 52 | Development platform |
| **TypeScript** | 5.0+ | Type safety and developer experience |
| **Expo Router** | 4 | File-based navigation system |

### **Backend & Services**
| Service | Provider | Purpose |
|---------|----------|---------|
| **Database** | Supabase | PostgreSQL with real-time subscriptions |
| **Authentication** | Supabase Auth | User management and security |
| **Blockchain** | Algorand | Decentralized transaction processing |
| **Voice AI** | ElevenLabs | Speech recognition and synthesis |
| **Payments** | RevenueCat | Subscription management |

### **Key Libraries**
```json
{
  "@supabase/supabase-js": "^2.39.0",
  "algosdk": "^2.7.0", 
  "expo-router": "^3.5.23",
  "lucide-react-native": "^0.400.0",
  "react-native-get-random-values": "^1.11.0"
}
```

## 🚀 Quick Start

> **⚡ Get Zyra running in under 5 minutes**

```bash
# Clone and install
git clone https://github.com/ItsAakif/Zyra.git
cd Zyra
npm install

# Set up environment (auto-guided setup)
npm run setup

# Start development server
npm start
```

**That's it!** The setup script will guide you through configuring all required services.

---

## ⚙️ Installation

### **Prerequisites**

Before starting, ensure you have:

| Requirement | Version | Download |
|-------------|---------|----------|
| **Node.js** | 18.0+ | [nodejs.org](https://nodejs.org/) |
| **npm/yarn** | Latest | Included with Node.js |
| **Expo CLI** | Latest | `npm install -g @expo/cli` |
| **Git** | Latest | [git-scm.com](https://git-scm.com/) |

### **Platform Setup**

<details>
<summary><strong>📱 Mobile Development (iOS/Android)</strong></summary>

**For iOS:**
- macOS with Xcode 14+
- iOS Simulator or physical device
- Apple Developer account (for device testing)

**For Android:**
- Android Studio with SDK 33+
- Android emulator or physical device
- USB debugging enabled

</details>

<details>
<summary><strong>🌐 Web Development</strong></summary>

- Modern browser (Chrome, Firefox, Safari, Edge)
- No additional setup required

</details>

### **Automated Setup**

Run our interactive setup script:

```bash
npm run setup
```

This will:
- ✅ Check system requirements
- ✅ Guide you through service configuration
- ✅ Set up environment variables
- ✅ Initialize database schema
- ✅ Verify installation

### **Manual Installation**

<details>
<summary><strong>🔧 Manual Setup Steps</strong></summary>

1. **Clone Repository**
   ```bash
   git clone https://github.com/ItsAakif/Zyra.git
   cd Zyra
   ```

2. **Install Dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure Environment**
   
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

4. **Start Development Server**
   ```bash
   npm start
   ```

</details>

---

## 🔧 Configuration

### **Environment Variables**

Zyra requires several API keys for full functionality. Create a `.env` file in the root directory:

```bash
# 🗄️ Database Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# ⛓️ Blockchain Configuration  
EXPO_PUBLIC_ALGORAND_NODE_URL=https://testnet-api.algonode.cloud
EXPO_PUBLIC_ALGORAND_INDEXER_URL=https://testnet-idx.algonode.cloud
EXPO_PUBLIC_ALGORAND_NETWORK=testnet

# 🎤 AI Voice Configuration (Optional)
EXPO_PUBLIC_ELEVENLABS_API_KEY=your-elevenlabs-api-key

# 💳 Subscription Configuration (Optional)
EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY=your-revenuecat-apple-key
EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY=your-revenuecat-google-key
```

### **Service Setup Guides**

<details>
<summary><strong>🗄️ Supabase Database Setup</strong></summary>

1. **Create Account**: Visit [supabase.com](https://supabase.com)
2. **New Project**: Create a new project
3. **Get Credentials**: Go to Settings → API
4. **Run Migration**: Copy `supabase/migrations/20250618221557_fading_swamp.sql` to SQL Editor
5. **Update .env**: Add your project URL and anon key

**Database Schema:**
- `users` - User profiles and authentication
- `transactions` - Payment history and analytics  
- `nft_rewards` - Blockchain NFT collectibles
- `achievements` - Gamification progress
- `kyc_verifications` - Compliance data

</details>

<details>
<summary><strong>⛓️ Algorand Blockchain Setup</strong></summary>

**Testnet (Development):**
- No API key required
- Uses free Algorand testnet nodes
- Get test ALGO from [testnet dispenser](https://testnet.algoexplorer.io/dispenser)

**Mainnet (Production):**
- Requires Algorand API service
- Real ALGO transactions
- Production-ready for live payments

</details>

<details>
<summary><strong>🎤 ElevenLabs Voice AI (Optional)</strong></summary>

1. **Sign Up**: Visit [elevenlabs.io](https://elevenlabs.io)
2. **Get API Key**: Go to Profile → API Keys
3. **Add to .env**: `EXPO_PUBLIC_ELEVENLABS_API_KEY=your_key`
4. **Test**: Voice commands will work in app

**Free Tier**: 10,000 characters/month

</details>

<details>
<summary><strong>💳 RevenueCat Subscriptions (Optional)</strong></summary>

1. **Create Account**: Visit [revenuecat.com](https://revenuecat.com)
2. **Set Up App**: Configure iOS/Android apps
3. **Get Keys**: Copy public API keys
4. **Configure Products**: Set up subscription tiers

**Free Tier**: Up to $10k revenue

</details>

### **Project Structure**

```
📦 Zyra/
├── 📱 app/                    # Application screens
│   ├── 🔐 (auth)/            # Authentication flow
│   ├── 📊 (tabs)/            # Main app navigation
│   ├── ⚙️ api/               # API route handlers
│   └── 🎨 _layout.tsx        # Root layout configuration
│
├── 🧩 components/            # Reusable UI components
│   ├── 💳 SubscriptionManager.tsx
│   ├── 🎙️ VoiceAssistant.tsx
│   └── 🔍 WalletDebug.tsx
│
├── ⚙️ lib/                   # Core business logic
│   ├── 🔐 auth.ts           # Authentication service
│   ├── ⛓️ algorand.ts       # Blockchain integration
│   ├── 🗄️ supabase.ts       # Database client
│   ├── 💰 real-wallet.ts    # Wallet management
│   ├── 🎤 voice-ai.ts       # AI voice processing
│   ├── 🎮 nft-marketplace.ts # NFT rewards system
│   └── 🌓 theme.tsx         # Dark/light theme system
│
├── 🎨 assets/               # Static assets
│   ├── 🖼️ images/          # App icons and logos
│   └── 📱 icons/            # Platform-specific icons
│
├── 🗄️ supabase/            # Database configuration
│   └── 📄 migrations/       # SQL schema migrations
│
└── 📋 types/               # TypeScript definitions
    └── 🔧 env.d.ts         # Environment type safety
```

---

## 🛠️ Development

### **Development Commands**

| Command | Description |
|---------|-------------|
| `npm start` | Start Metro bundler with QR code |
| `npm run ios` | Launch iOS simulator |
| `npm run android` | Launch Android emulator |
| `npm run web` | Launch web browser |
| `npm run setup` | Interactive environment setup |
| `npm run build` | Create production build |

### **Platform-Specific Development**

<details>
<summary><strong>📱 iOS Development</strong></summary>

```bash
# Start iOS simulator
npm run ios

# Open Xcode project
open ios/Zyra.xcworkspace

# Install on physical device
npx expo run:ios --device
```

**Requirements:**
- macOS with Xcode 14+
- iOS Simulator or physical device
- Apple Developer account (for device testing)

</details>

<details>
<summary><strong>🤖 Android Development</strong></summary>

```bash
# Start Android emulator
npm run android

# Install on physical device (USB debugging enabled)
npx expo run:android --device

# Open Android Studio
studio android/
```

**Requirements:**
- Android Studio with SDK 33+
- Android emulator or physical device
- USB debugging enabled

</details>

<details>
<summary><strong>🌐 Web Development</strong></summary>

```bash
# Start web development server
npm run web

# Build for web deployment
npx expo export:web

# Serve production build locally
npx serve web-build
```

**Features:**
- Full React Native Web compatibility
- Responsive design
- Progressive Web App (PWA) ready

</details>

### **Development Features**

#### **🔧 Hot Reload & Live Updates**
- **Fast Refresh**: Instant code updates during development
- **Live Reloading**: Automatic app restart on changes
- **Error Overlay**: In-app error messages and stack traces

#### **🐛 Debugging Tools**
- **React DevTools**: Component inspection and profiling
- **Flipper Integration**: Network requests and performance monitoring  
- **Wallet Debug Panel**: Blockchain transaction testing
- **Demo Mode Toggle**: Switch between real and demo data

#### **📊 Development Analytics**
- **Real-time Logs**: Console output from all platforms
- **Performance Metrics**: Bundle size and load times
- **Error Tracking**: Crash reports and error logs

### **Code Quality**

#### **TypeScript Configuration**
- Strict mode enabled for type safety
- Path mapping for clean imports (`@/lib`, `@/components`)
- Environment type definitions
- Consistent code style with ESLint

#### **Testing Strategy**
```bash
# Run all tests
npm run test

# Run specific test suite
npm run test:unit
npm run test:integration
npm run test:e2e

# Generate coverage report
npm run test:coverage
```

---

## 🧪 Testing

### **Testing Framework**

| Type | Framework | Purpose |
|------|-----------|---------|
| **Unit Tests** | Jest | Component and utility testing |
| **Integration** | Testing Library | User interaction testing |
| **E2E Tests** | Detox | Full app workflow testing |
| **Blockchain** | Custom | Transaction verification |

### **Test Categories**

<details>
<summary><strong>🔬 Unit Tests</strong></summary>

Test individual components and utilities:

```bash
# Run unit tests
npm run test:unit

# Watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage
```

**Coverage includes:**
- ✅ Utility functions
- ✅ Component rendering
- ✅ State management
- ✅ API integrations

</details>

<details>
<summary><strong>🔗 Integration Tests</strong></summary>

Test component interactions and data flow:

```bash
# Run integration tests
npm run test:integration

# Test specific features
npm run test:auth
npm run test:payments
npm run test:voice
```

**Test scenarios:**
- ✅ Authentication flow
- ✅ Payment processing
- ✅ Voice command handling
- ✅ NFT reward distribution

</details>

<details>
<summary><strong>🎭 End-to-End Tests</strong></summary>

Test complete user journeys:

```bash
# Run E2E tests (iOS)
npm run test:e2e:ios

# Run E2E tests (Android)
npm run test:e2e:android

# Run E2E tests (Web)
npm run test:e2e:web
```

**User journeys:**
- ✅ User registration → wallet creation → first payment
- ✅ Voice command → transaction → blockchain verification
- ✅ NFT earning → marketplace interaction
- ✅ Subscription upgrade → premium features

</details>

### **Blockchain Testing**

Special testing considerations for blockchain features:

```bash
# Test wallet functionality
npm run test:wallet

# Test transaction processing
npm run test:transactions

# Verify blockchain integration
npm run test:blockchain
```

**Blockchain test coverage:**
- ✅ Wallet creation and import
- ✅ Balance checking and updates
- ✅ Transaction signing and submission
- ✅ NFT minting and transfers
- ✅ Explorer link verification

---

## 🌐 Deployment

### **Production Builds**

<details>
<summary><strong>📱 Mobile App Deployment</strong></summary>

```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Configure EAS
eas login
eas build:configure

# Build for app stores
eas build --platform all

# Submit to stores
eas submit --platform all
```

**App Store Requirements:**
- Apple Developer Program membership ($99/year)
- Google Play Console account ($25 one-time)
- App icons and screenshots
- Store descriptions and metadata

</details>

<details>
<summary><strong>🌐 Web Deployment</strong></summary>

```bash
# Build web version
npx expo export:web

# Deploy to Vercel
npm install -g vercel
vercel --prod

# Deploy to Netlify
npm install -g netlify-cli
netlify deploy --prod --dir web-build
```

**Hosting Options:**
- **Vercel**: Automatic deployments from Git
- **Netlify**: JAMstack hosting with forms
- **Firebase Hosting**: Google Cloud integration
- **AWS Amplify**: Full-stack deployment

</details>

### **Environment Management**

Create environment-specific configurations:

```bash
# Development
.env.development

# Staging  
.env.staging

# Production
.env.production
```

**Environment Variables Checklist:**
- ✅ Database URLs (Supabase)
- ✅ API Keys (ElevenLabs, RevenueCat)
- ✅ Blockchain Network (testnet/mainnet)
- ✅ Feature Flags
- ✅ Analytics Tokens

---

## 📚 API Documentation

### **Blockchain API**

#### **Wallet Management**
```typescript
// Create new wallet
const wallet = await realWalletService.createWallet();

// Import existing wallet
const wallet = await realWalletService.importWallet(mnemonic);

// Get balance
const balance = await realWalletService.getBalance();
```

#### **Transaction Processing**
```typescript
// Send payment
const txId = await realWalletService.sendPayment(
  toAddress: string,
  amount: number,
  currency: 'ALGO' | 'ZYRO',
  note?: string
);

// Check transaction status
const status = await algorandService.getTransactionStatus(txId);
```

### **Voice AI API**

#### **Voice Commands**
```typescript
// Process voice command
const result = await voiceService.processCommand(audioData);

// Text-to-speech
await voiceService.speak(text, options);

// Speech-to-text
const transcript = await voiceService.transcribe(audioData);
```

### **NFT Marketplace API**

#### **NFT Operations**
```typescript
// Mint NFT reward
const nft = await nftService.mintRewardNFT(userId, rewardType);

// Get user NFTs
const nfts = await nftService.getUserNFTs(userId);

// Transfer NFT
await nftService.transferNFT(nftId, toAddress);
```

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### **Development Workflow**

1. **Fork & Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/Zyra.git
   cd Zyra
   npm install
   ```

2. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Changes**
   - Follow TypeScript best practices
   - Add tests for new features
   - Update documentation as needed

4. **Test Your Changes**
   ```bash
   npm run test
   npm run build
   ```

5. **Submit Pull Request**
   - Clear description of changes
   - Link to related issues
   - Include screenshots for UI changes

### **Code Standards**

- **TypeScript**: Strict mode enabled
- **ESLint**: Consistent code style
- **Prettier**: Automatic code formatting
- **Testing**: Unit and integration tests
- **Documentation**: JSDoc comments for public APIs

### **Contribution Areas**

- 🐛 **Bug Fixes**: Report and fix issues
- ✨ **Features**: Add new functionality
- 📚 **Documentation**: Improve guides and examples
- 🧪 **Testing**: Increase test coverage
- 🎨 **UI/UX**: Enhance user experience
- ⚡ **Performance**: Optimize app performance

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### **Third-Party Licenses**

- **Algorand SDK**: MIT License
- **Supabase**: MIT License
- **React Native**: MIT License
- **Expo**: MIT License

---

## 🆘 Support

### **Getting Help**

<details>
<summary><strong>📖 Documentation</strong></summary>

- **Setup Guide**: [SETUP.md](SETUP.md)
- **API Reference**: [API_SETUP_GUIDE.md](API_SETUP_GUIDE.md)
- **Testing Guide**: [TESTING_GUIDE.md](TESTING_GUIDE.md)
- **Implementation Status**: [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)

</details>

<details>
<summary><strong>🐛 Issues & Bugs</strong></summary>

1. **Search Existing Issues**: Check if your issue already exists
2. **Create New Issue**: Use issue templates
3. **Provide Details**: Include error messages, screenshots, and steps to reproduce
4. **Label Appropriately**: bug, feature request, documentation, etc.

[Report an Issue →](https://github.com/ItsAakif/Zyra/issues/new)

</details>

<details>
<summary><strong>💬 Community</strong></summary>

- **Discussions**: General questions and community chat
- **Discord**: Real-time community support
- **Twitter**: Updates and announcements

</details>

### **Troubleshooting**

**Common Issues:**

| Issue | Solution |
|-------|----------|
| **App won't start** | Run `npm install` and check environment variables |
| **Blockchain errors** | Verify Algorand network configuration |
| **Voice not working** | Check ElevenLabs API key and permissions |
| **Build failures** | Clear Metro cache: `npx expo start --clear` |

**Environment Check:**
```bash
# Verify environment setup
npm run setup

# Check service status
npm run health-check
```

---

<div align="center">

### 🚀 **Ready to revolutionize global payments?**

**[Get Started Now](#-quick-start)** **[Web Demo](https://zyra-payments-demo.netlify.app)** **[Mobile](exp://u.expo.dev/b7990505-d700-4424-91b2-90b56ad33951/group/f64c1873-960f-4245-aed4-a2fcbd8c8618)** 
---

**Built with ❤️ by Team Synergy**

*Making global payments accessible to everyone, everywhere.*

</div>
