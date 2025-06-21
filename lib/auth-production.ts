import { Auth0Provider } from '@auth0/react-native';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

export interface ProductionAuthState {
  user: ProductionUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  mfaRequired: boolean;
  sessionExpiry: Date | null;
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
  private auth0: Auth0Provider;
  private refreshTokenInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.auth0 = new Auth0Provider({
      domain: process.env.EXPO_PUBLIC_AUTH0_DOMAIN!,
      clientId: process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID!,
    });
  }

  async authenticateWithOAuth(provider: 'google' | 'apple' | 'microsoft'): Promise<AuthResult> {
    try {
      const credentials = await this.auth0.authorize({
        scope: 'openid profile email offline_access',
        audience: process.env.EXPO_PUBLIC_AUTH0_AUDIENCE,
        connection: provider,
      });

      // Store tokens securely
      await this.storeTokensSecurely(credentials);

      // Get user profile
      const userProfile = await this.getUserProfile(credentials.accessToken);

      // Setup session management
      this.setupSessionManagement(credentials);

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

  async enableMFA(userId: string, method: 'sms' | 'email' | 'totp' | 'biometric'): Promise<MFAResult> {
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
        body: JSON.stringify({ userId, method }),
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
      const user = await this.getCurrentUser();
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
    };

    // Create hash of device characteristics
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(deviceInfo));
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async storeTokensSecurely(tokens: any): Promise<void> {
    await SecureStore.setItemAsync('access_token', tokens.accessToken, {
      requireAuthentication: true,
    });
    
    await SecureStore.setItemAsync('refresh_token', tokens.refreshToken, {
      requireAuthentication: true,
    });

    await SecureStore.setItemAsync('id_token', tokens.idToken, {
      requireAuthentication: true,
    });
  }

  private async getAccessToken(): Promise<string | null> {
    return await SecureStore.getItemAsync('access_token');
  }

  private async getUserProfile(accessToken: string): Promise<ProductionUser> {
    const response = await fetch('/api/auth/profile', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    return await response.json();
  }

  private setupSessionManagement(credentials: any): void {
    // Setup automatic token refresh
    const expiryTime = new Date(credentials.expiresIn * 1000);
    const refreshTime = expiryTime.getTime() - Date.now() - 300000; // 5 minutes before expiry

    this.refreshTokenInterval = setTimeout(async () => {
      await this.refreshSession();
    }, refreshTime);
  }

  private async getCurrentUser(): Promise<ProductionUser | null> {
    try {
      const accessToken = await this.getAccessToken();
      if (!accessToken) return null;

      return await this.getUserProfile(accessToken);
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  async signOut(): Promise<void> {
    try {
      // Clear tokens
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('refresh_token');
      await SecureStore.deleteItemAsync('id_token');

      // Clear refresh interval
      if (this.refreshTokenInterval) {
        clearTimeout(this.refreshTokenInterval);
        this.refreshTokenInterval = null;
      }

      // Logout from Auth0
      await this.auth0.clearSession();
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