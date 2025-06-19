import { supabase } from './supabase';
import { User } from './supabase';
import { Platform } from 'react-native';

export interface AuthState {
  user: User | null;
  algorandAccount: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: User;
}

class AuthService {
  private listeners: ((state: AuthState) => void)[] = [];
  private currentState: AuthState = {
    user: null,
    algorandAccount: null,
    isLoading: true,
    isAuthenticated: false,
  };
  private initialized = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    if (this.initialized) return;
    this.initialized = true;

    try {
      console.log('Initializing auth service...');
      
      if (!supabase) {
        console.log('Supabase not configured, running in demo mode');
        // Set demo user for testing without Supabase
        setTimeout(() => {
          const demoUser: User = {
            id: 'demo-user',
            email: 'demo@zyra.app',
            full_name: 'Alex Chen',
            kyc_verified: true,
            subscription_tier: 'pro',
            anonymous_mode: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          this.updateState({
            user: demoUser,
            algorandAccount: {
              address: 'DEMO123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
            },
            isLoading: false,
            isAuthenticated: true,
          });
        }, Platform.OS === 'android' ? 1500 : 800);
        return;
      }

      // Get initial session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const userData = await this.fetchUserData(session.user.id);
        this.updateState({
          user: userData,
          algorandAccount: null, // Will be set when needed
          isLoading: false,
          isAuthenticated: true,
        });
      } else {
        this.updateState({
          user: null,
          algorandAccount: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event);
        if (session?.user) {
          const userData = await this.fetchUserData(session.user.id);
          this.updateState({
            user: userData,
            algorandAccount: null,
            isLoading: false,
            isAuthenticated: true,
          });
        } else {
          this.updateState({
            user: null,
            algorandAccount: null,
            isLoading: false,
            isAuthenticated: false,
          });
        }
      });
    } catch (error) {
      console.error('Auth initialization error:', error);
      // Fallback to demo mode on error
      const demoUser: User = {
        id: 'demo-user',
        email: 'demo@zyra.app',
        full_name: 'Alex Chen',
        kyc_verified: true,
        subscription_tier: 'pro',
        anonymous_mode: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      this.updateState({
        user: demoUser,
        algorandAccount: {
          address: 'DEMO123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        },
        isLoading: false,
        isAuthenticated: true,
      });
    }
  }

  private async fetchUserData(userId: string): Promise<User | null> {
    try {
      if (!supabase) return null;

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user data:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  }

  private updateState(newState: Partial<AuthState>) {
    this.currentState = { ...this.currentState, ...newState };
    console.log('Auth state updated:', this.currentState);
    
    this.listeners.forEach(listener => {
      try {
        listener(this.currentState);
      } catch (error) {
        console.error('Error in auth state listener:', error);
      }
    });
  }

  subscribe(listener: (state: AuthState) => void): () => void {
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

  getAuthState(): AuthState {
    return this.currentState;
  }

  async signIn(email: string, password: string): Promise<AuthResult> {
    try {
      if (!supabase) {
        // Demo mode - simulate successful login
        const demoUser: User = {
          id: 'demo-user',
          email,
          full_name: 'Alex Chen',
          kyc_verified: true,
          subscription_tier: 'pro',
          anonymous_mode: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        this.updateState({
          user: demoUser,
          algorandAccount: {
            address: 'DEMO123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
          },
          isLoading: false,
          isAuthenticated: true,
        });
        
        return { success: true, user: demoUser };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, user: data.user as any };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  async signUp(email: string, password: string, fullName: string): Promise<AuthResult> {
    try {
      if (!supabase) {
        // Demo mode - simulate successful signup
        const demoUser: User = {
          id: 'demo-user',
          email,
          full_name: fullName,
          kyc_verified: false,
          subscription_tier: 'free',
          anonymous_mode: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        this.updateState({
          user: demoUser,
          algorandAccount: {
            address: 'DEMO123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
          },
          isLoading: false,
          isAuthenticated: true,
        });
        
        return { success: true, user: demoUser };
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, user: data.user as any };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  async signOut(): Promise<AuthResult> {
    try {
      if (!supabase) {
        // Demo mode - simulate signout
        this.updateState({
          user: null,
          algorandAccount: null,
          isLoading: false,
          isAuthenticated: false,
        });
        return { success: true };
      }

      const { error } = await supabase.auth.signOut();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  async resetPassword(email: string): Promise<AuthResult> {
    try {
      if (!supabase) {
        return { success: true }; // Demo mode
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  }
}

export const authService = new AuthService();