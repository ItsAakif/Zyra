import { supabase } from './supabase';
import { User } from './supabase';
import { Platform } from 'react-native';

export interface AuthState {
  user: User | null;
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
    isLoading: true,
    isAuthenticated: false,
  };
  private initialized = false;

  constructor() {
    // Start initialization immediately
    this.initialize();
  }

  private async initialize() {
    if (this.initialized) return;
    this.initialized = true;

    console.log('Initializing auth service...');
    
    try {
      if (!supabase) {
        console.error('Supabase not configured. Please provide environment variables.');
        this.updateState({ isLoading: false });
        return;
      }

      // Get initial session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const userData = await this.fetchUserData(session.user.id);
        this.updateState({
          user: userData,
          isLoading: false,
          isAuthenticated: true,
        });
      } else {
        this.updateState({
          user: null,
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
            isLoading: false,
            isAuthenticated: true,
          });
        } else {
          this.updateState({
            user: null,
            isLoading: false,
            isAuthenticated: false,
          });
        }
      });
    } catch (error) {
      console.error('Auth initialization error:', error);
      this.updateState({ isLoading: false });
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
        return { success: false, error: 'Supabase not configured' };
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
        return { success: false, error: 'Supabase not configured' };
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
        return { success: false, error: 'Supabase not configured' };
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
        return { success: false, error: 'Supabase not configured' };
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