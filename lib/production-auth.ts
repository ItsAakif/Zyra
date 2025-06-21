import { Auth0Provider } from '@auth0/react-native';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';
import { supabase } from './supabase';

export interface ProductionAuthState {
  user: ProductionUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  mfaRequired: boolean;
  sessionExpiry: Date | null;
  deviceTrusted: boolean;
}

export interface ProductionUser {
  id: string;
  email: string;
  fullName: string;
  roles: UserRole[];
  permissions: Permission[];
  kycStatus: 'pending' | 'verified' | 'rejected';
  mfaEnabled: boolean;
  lastLogin: Date;
  deviceFingerprint: string;
  subscriptionTier: 'free' | 'plus' | 'pro';
  riskScore: number;
}

export interface UserRole {
  id: string;
  name: 'basic' | 'premium' | 'business' | 'admin';
  permissions: Permission[];
}

export interface Permission {
  resource: string;
  action: 'read' | 'write' | 'delete' | 'admin';
}

export class ProductionAuthService {
  private auth0: Auth0Provider | null = null;
  private refreshTokenInterval: NodeJS.Timeout | null = null;
  private listeners: ((state: ProductionAuthState) => void)[] = [];
  private currentState: ProductionAuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    mfaRequired: false,
    sessionExpiry: null,
    deviceTrusted: false,
  };

  constructor() {
    this.initializeAuth0();
    this.initializeSession();
  }

  private async initializeAuth0(): Promise<void> {
    try {
      if (Platform.OS !== 'web') {
        this.auth0 = new Auth0Provider({
          domain: process.env.EXPO_PUBLIC_AUTH0_DOMAIN || 'demo.auth0.com',
          clientId: process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID || 'demo-client-id',
        });
      }
    } catch (error) {
      console.warn('Auth0 initialization failed, using fallback auth:', error);
    }
  }

  private async initializeSession(): Promise<void> {
    try {
      // Check for existing session
      const accessToken = await SecureStore.getItemAsync('access_token');
      if (accessToken) {
        const user = await this.validateToken(accessToken);
        if (user) {
          this.updateState({
            user,
            isAuthenticated: true,
            isLoading: false,
            deviceTrusted: await this.isDeviceTrusted(),
          });
          this.setupSessionManagement();
          return;
        }
      }
    } catch (error) {
      console.error('Session initialization failed:', error);
    }

    // No valid session found
    this.updateState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      mfaRequired: false,
      sessionExpiry: null,
      deviceTrusted: false,
    });
  }

  async authenticateWithOAuth(provider: 'google' | 'apple' | 'microsoft'): Promise<AuthResult> {
    try {
      if (!this.auth0) {
        // Fallback to demo mode
        return this.authenticateDemo(provider);
      }

      const credentials = await this.auth0.authorize({
        scope: 'openid profile email offline_access',
        audience: process.env.EXPO_PUBLIC_AUTH0_AUDIENCE,
        connection: provider,
      });

      // Store tokens securely
      await this.storeTokensSecurely(credentials);

      // Get user profile
      const userProfile = await this.getUserProfile(credentials.accessToken);

      // Check device trust
      const deviceTrusted = await this.checkDeviceTrust(userProfile.id);

      // Setup session management
      this.setupSessionManagement();

      this.updateState({
        user: userProfile,
        isAuthenticated: true,
        isLoading: false,
        mfaRequired: userProfile.mfaEnabled && !credentials.mfaCompleted,
        deviceTrusted,
      });

      return {
        success: true,
        user: userProfile,
        requiresMFA: userProfile.mfaEnabled && !credentials.mfaCompleted,
      };
    } catch (error) {
      console.error('OAuth authentication failed:', error);
      return {
        success: false,
        error: 'Authentication failed',
      };
    }
  }

  private async authenticateDemo(provider: string): Promise<AuthResult> {
    // Demo authentication for development/testing
    const demoUser: ProductionUser = {
      id: 'demo-user-' + Date.now(),
      email: `demo@${provider}.com`,
      fullName: 'Demo User',
      roles: [
        {
          id: 'premium-role',
          name: 'premium',
          permissions: [
            { resource: 'payments', action: 'write' },
            { resource: 'wallet', action: 'read' },
            { resource: 'rewards', action: 'read' },
          ],
        },
      ],
      permissions: [
        { resource: 'payments', action: 'write' },
        { resource: 'wallet', action: 'read' },
        { resource: 'rewards', action: 'read' },
      ],
      kycStatus: 'verified',
      mfaEnabled: false,
      lastLogin: new Date(),
      deviceFingerprint: await this.generateDeviceFingerprint(),
      subscriptionTier: 'pro',
      riskScore: 0.1,
    };

    this.updateState({
      user: demoUser,
      isAuthenticated: true,
      isLoading: false,
      mfaRequired: false,
      deviceTrusted: true,
    });

    return {
      success: true,
      user: demoUser,
      requiresMFA: false,
    };
  }

  async enableMFA(method: 'sms' | 'email' | 'totp' | 'biometric'): Promise<MFAResult> {
    try {
      if (method === 'biometric' && Platform.OS !== 'web') {
        // Check biometric availability
        const biometricType = await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (biometricType.length === 0) {
          return {
            success: false,
            error: 'Biometric authentication not available',
          };
        }
      }

      const response = await fetch('/api/auth/mfa/enable', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await this.getAccessToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: this.currentState.user?.id, 
          method 
        }),
      });

      const result = await response.json();

      if (method === 'totp') {
        return {
          success: true,
          qrCode: result.qrCode,
          backupCodes: result.backupCodes,
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to enable MFA',
      };
    }
  }

  async verifyMFA(code: string, method: 'sms' | 'email' | 'totp' | 'biometric'): Promise<AuthResult> {
    try {
      if (method === 'biometric' && Platform.OS !== 'web') {
        const biometricResult = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Verify your identity',
          fallbackLabel: 'Use passcode',
        });

        if (!biometricResult.success) {
          return {
            success: false,
            error: 'Biometric verification failed',
          };
        }
      }

      const response = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await this.getAccessToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, method }),
      });

      const result = await response.json();
      
      if (result.success) {
        this.updateState({
          mfaRequired: false,
        });
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: 'MFA verification failed',
      };
    }
  }

  async checkPermission(resource: string, action: string): Promise<boolean> {
    try {
      const user = this.currentState.user;
      if (!user) return false;

      return user.permissions.some(
        permission => 
          permission.resource === resource && 
          (permission.action === action || permission.action === 'admin')
      );
    } catch (error) {
      console.error('Permission check failed:', error);
      return false;
    }
  }

  async refreshSession(): Promise<boolean> {
    try {
      const refreshToken = await SecureStore.getItemAsync('refresh_token');
      if (!refreshToken) return false;

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) return false;

      const tokens = await response.json();
      await this.storeTokensSecurely(tokens);
      
      return true;
    } catch (error) {
      console.error('Session refresh failed:', error);
      return false;
    }
  }

  async generateDeviceFingerprint(): Promise<string> {
    const deviceInfo = {
      platform: Platform.OS,
      version: Platform.Version,
      userAgent: Platform.OS === 'web' ? navigator.userAgent : undefined,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: Intl.DateTimeFormat().resolvedOptions().locale,
      screenResolution: Platform.OS === 'web' ? `${screen.width}x${screen.height}` : undefined,
    };

    // Create hash of device characteristics
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(deviceInfo));
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async validateToken(token: string): Promise<ProductionUser | null> {
    try {
      const response = await fetch('/api/auth/validate', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) return null;

      return await response.json();
    } catch (error) {
      console.error('Token validation failed:', error);
      return null;
    }
  }

  private async checkDeviceTrust(userId: string): Promise<boolean> {
    try {
      const deviceFingerprint = await this.generateDeviceFingerprint();
      
      const response = await fetch('/api/auth/device-trust', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await this.getAccessToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, deviceFingerprint }),
      });

      const result = await response.json();
      return result.trusted;
    } catch (error) {
      console.error('Device trust check failed:', error);
      return false;
    }
  }

  private async isDeviceTrusted(): Promise<boolean> {
    const trustedDevices = await SecureStore.getItemAsync('trusted_devices');
    if (!trustedDevices) return false;

    const deviceFingerprint = await this.generateDeviceFingerprint();
    const devices = JSON.parse(trustedDevices);
    
    return devices.includes(deviceFingerprint);
  }

  private async storeTokensSecurely(tokens: any): Promise<void> {
    await SecureStore.setItemAsync('access_token', tokens.accessToken, {
      requireAuthentication: Platform.OS !== 'web',
    });
    
    await SecureStore.setItemAsync('refresh_token', tokens.refreshToken, {
      requireAuthentication: Platform.OS !== 'web',
    });

    if (tokens.idToken) {
      await SecureStore.setItemAsync('id_token', tokens.idToken, {
        requireAuthentication: Platform.OS !== 'web',
      });
    }
  }

  private async getAccessToken(): Promise<string | null> {
    return await SecureStore.getItemAsync('access_token');
  }

  private async getUserProfile(accessToken: string): Promise<ProductionUser> {
    try {
      const response = await fetch('/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get user profile');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get user profile:', error);
      throw error;
    }
  }

  private setupSessionManagement(): void {
    // Setup automatic token refresh
    const refreshInterval = 15 * 60 * 1000; // 15 minutes

    this.refreshTokenInterval = setInterval(async () => {
      const success = await this.refreshSession();
      if (!success) {
        await this.signOut();
      }
    }, refreshInterval);
  }

  private updateState(newState: Partial<ProductionAuthState>): void {
    this.currentState = { ...this.currentState, ...newState };
    
    this.listeners.forEach(listener => {
      try {
        listener(this.currentState);
      } catch (error) {
        console.error('Error in auth state listener:', error);
      }
    });
  }

  subscribe(listener: (state: ProductionAuthState) => void): () => void {
    this.listeners.push(listener);
    // Immediately call with current state
    listener(this.currentState);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  getAuthState(): ProductionAuthState {
    return this.currentState;
  }

  async signOut(): Promise<void> {
    try {
      // Clear tokens
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('refresh_token');
      await SecureStore.deleteItemAsync('id_token');

      // Clear refresh interval
      if (this.refreshTokenInterval) {
        clearInterval(this.refreshTokenInterval);
        this.refreshTokenInterval = null;
      }

      // Logout from Auth0
      if (this.auth0) {
        await this.auth0.clearSession();
      }

      this.updateState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        mfaRequired: false,
        sessionExpiry: null,
        deviceTrusted: false,
      });
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  }
}

interface AuthResult {
  success: boolean;
  user?: ProductionUser;
  requiresMFA?: boolean;
  error?: string;
}

interface MFAResult {
  success: boolean;
  qrCode?: string;
  backupCodes?: string[];
  error?: string;
}

export const productionAuthService = new ProductionAuthService();