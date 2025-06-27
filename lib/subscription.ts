import Purchases, { 
  CustomerInfo, 
  Offering, 
  PurchasesPackage,
  PurchasesStoreProduct,
  PURCHASES_ERROR_CODE 
} from 'react-native-purchases';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: string;
  period: string;
  features: string[];
  isPopular?: boolean;
  zyroMultiplier: number;
  transactionLimit: number;
  crossBorderFeeDiscount: number;
}

export interface SubscriptionState {
  isSubscribed: boolean;
  activePlan: SubscriptionPlan | null;
  expirationDate: Date | null;
  isLoading: boolean;
  error: string | null;
}

class SubscriptionService {
  private state: SubscriptionState = {
    isSubscribed: false,
    activePlan: null,
    expirationDate: null,
    isLoading: false,
    error: null,
  };

  private listeners: ((state: SubscriptionState) => void)[] = [];
  private isInitialized = false;

  // Available subscription plans
  private plans: SubscriptionPlan[] = [
    {
      id: 'zyra_basic',
      name: 'Zyra Basic',
      description: 'Perfect for casual users',
      price: '$4.99',
      period: 'month',
      features: [
        '1.5x Zyro rewards',
        '50 transactions/month',
        '5% cross-border fee discount',
        'Basic voice commands',
        'Standard support'
      ],
      zyroMultiplier: 1.5,
      transactionLimit: 50,
      crossBorderFeeDiscount: 0.05,
    },
    {
      id: 'zyra_pro',
      name: 'Zyra Pro',
      description: 'Best for frequent traders',
      price: '$14.99',
      period: 'month',
      features: [
        '2x Zyro rewards',
        '500 transactions/month',
        '15% cross-border fee discount',
        'Advanced voice AI',
        'Priority support',
        'Analytics dashboard'
      ],
      isPopular: true,
      zyroMultiplier: 2.0,
      transactionLimit: 500,
      crossBorderFeeDiscount: 0.15,
    },
    {
      id: 'zyra_enterprise',
      name: 'Zyra Enterprise',
      description: 'For businesses and power users',
      price: '$49.99',
      period: 'month',
      features: [
        '3x Zyro rewards',
        'Unlimited transactions',
        '25% cross-border fee discount',
        'Custom voice models',
        'Dedicated support',
        'API access',
        'White-label options'
      ],
      zyroMultiplier: 3.0,
      transactionLimit: -1, // Unlimited
      crossBorderFeeDiscount: 0.25,
    }
  ];

  constructor() {
    this.initializeRevenueCat();
  }

  private async initializeRevenueCat() {
    try {
      const apiKey = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;
      
      if (!apiKey) {
        console.log('ℹ️ RevenueCat API key not found - using demo mode');
        this.simulateSubscriptionData();
        return;
      }

      // Configure RevenueCat
      await Purchases.configure({ apiKey });
      
      // Set user identification if available
      // await Purchases.logIn(userId);
      
      // Listen for purchase updates
      Purchases.addCustomerInfoUpdateListener(this.handleCustomerInfoUpdate.bind(this));
      
      // Load initial customer info
      await this.refreshCustomerInfo();
      
      this.isInitialized = true;
      console.log('✅ RevenueCat subscription service initialized');
      
    } catch (error) {
      console.error('❌ Error initializing RevenueCat:', error);
      this.updateState({ error: 'Failed to initialize subscription service' });
      this.simulateSubscriptionData();
    }
  }

  private simulateSubscriptionData() {
    // Demo data for development
    this.updateState({
      isSubscribed: false,
      activePlan: null,
      expirationDate: null,
      isLoading: false,
      error: null,
    });
  }

  private handleCustomerInfoUpdate(customerInfo: CustomerInfo) {
    this.processCustomerInfo(customerInfo);
  }

  private processCustomerInfo(customerInfo: CustomerInfo) {
    const activeEntitlements = customerInfo.activeSubscriptions;
    const isSubscribed = activeEntitlements.length > 0;
    
    let activePlan: SubscriptionPlan | null = null;
    let expirationDate: Date | null = null;

    if (isSubscribed) {
      // Find the active subscription plan
      const activeSubscription = activeEntitlements[0];
      activePlan = this.plans.find(plan => 
        activeSubscription.includes(plan.id)
      ) || null;

      // Get expiration date
      const entitlement = customerInfo.entitlements.active[activeSubscription];
      if (entitlement) {
        expirationDate = new Date(entitlement.expirationDate);
      }
    }

    this.updateState({
      isSubscribed,
      activePlan,
      expirationDate,
      isLoading: false,
      error: null,
    });
  }

  async getAvailablePackages(): Promise<PurchasesPackage[]> {
    try {
      if (!this.isInitialized) {
        return [];
      }

      const offerings = await Purchases.getOfferings();
      const currentOffering = offerings.current;
      
      if (!currentOffering) {
        console.log('No current offering available');
        return [];
      }

      return currentOffering.availablePackages;
    } catch (error) {
      console.error('❌ Error getting available packages:', error);
      return [];
    }
  }

  async purchaseSubscription(packageToPurchase: PurchasesPackage): Promise<boolean> {
    try {
      this.updateState({ isLoading: true, error: null });

      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      this.processCustomerInfo(customerInfo);
      
      console.log('✅ Subscription purchased successfully');
      return true;
      
    } catch (error: any) {
      console.error('❌ Error purchasing subscription:', error);
      
      let errorMessage = 'Purchase failed';
      
      if (error.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
        errorMessage = 'Purchase was cancelled';
      } else if (error.code === PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR) {
        errorMessage = 'Payment is pending';
      } else if (error.code === PURCHASES_ERROR_CODE.INSUFFICIENT_PERMISSIONS_ERROR) {
        errorMessage = 'Insufficient permissions';
      }
      
      this.updateState({ 
        isLoading: false, 
        error: errorMessage 
      });
      
      return false;
    }
  }

  async restorePurchases(): Promise<boolean> {
    try {
      this.updateState({ isLoading: true, error: null });

      const customerInfo = await Purchases.restorePurchases();
      this.processCustomerInfo(customerInfo);
      
      console.log('✅ Purchases restored successfully');
      return true;
      
    } catch (error) {
      console.error('❌ Error restoring purchases:', error);
      this.updateState({ 
        isLoading: false, 
        error: 'Failed to restore purchases' 
      });
      return false;
    }
  }

  async refreshCustomerInfo(): Promise<void> {
    try {
      if (!this.isInitialized) return;

      const customerInfo = await Purchases.getCustomerInfo();
      this.processCustomerInfo(customerInfo);
      
    } catch (error) {
      console.error('❌ Error refreshing customer info:', error);
    }
  }

  // Demo subscription for testing without API
  async purchaseDemo(planId: string): Promise<boolean> {
    const plan = this.plans.find(p => p.id === planId);
    if (!plan) return false;

    // Simulate purchase delay
    this.updateState({ isLoading: true });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Set demo subscription
    const expirationDate = new Date();
    expirationDate.setMonth(expirationDate.getMonth() + 1);
    
    this.updateState({
      isSubscribed: true,
      activePlan: plan,
      expirationDate,
      isLoading: false,
      error: null,
    });

    console.log('✅ Demo subscription activated:', plan.name);
    return true;
  }

  async cancelSubscription(): Promise<boolean> {
    try {
      // Note: RevenueCat doesn't handle cancellation directly
      // Users need to cancel through App Store/Play Store
      // This is for demo purposes
      
      this.updateState({
        isSubscribed: false,
        activePlan: null,
        expirationDate: null,
        error: null,
      });

      console.log('✅ Subscription cancelled (demo)');
      return true;
      
    } catch (error) {
      console.error('❌ Error cancelling subscription:', error);
      return false;
    }
  }

  getAvailablePlans(): SubscriptionPlan[] {
    return this.plans;
  }

  getState(): SubscriptionState {
    return { ...this.state };
  }

  subscribe(listener: (state: SubscriptionState) => void): () => void {
    this.listeners.push(listener);
    
    // Immediately call with current state
    listener(this.state);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private updateState(updates: Partial<SubscriptionState>): void {
    this.state = { ...this.state, ...updates };
    this.listeners.forEach(listener => listener(this.state));
  }

  // Utility methods for checking subscription benefits
  getZyroMultiplier(): number {
    return this.state.activePlan?.zyroMultiplier || 1.0;
  }

  getTransactionLimit(): number {
    return this.state.activePlan?.transactionLimit || 10; // Free tier limit
  }

  getCrossBorderFeeDiscount(): number {
    return this.state.activePlan?.crossBorderFeeDiscount || 0;
  }

  canMakeTransaction(): boolean {
    const limit = this.getTransactionLimit();
    return limit === -1 || true; // In real app, track transaction count
  }

  hasFeature(feature: string): boolean {
    if (!this.state.activePlan) return false;
    return this.state.activePlan.features.some(f => 
      f.toLowerCase().includes(feature.toLowerCase())
    );
  }

  getDaysUntilExpiration(): number {
    if (!this.state.expirationDate) return 0;
    const now = new Date();
    const diffTime = this.state.expirationDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  isExpiringSoon(): boolean {
    return this.getDaysUntilExpiration() <= 3;
  }
}

export const subscriptionService = new SubscriptionService();
