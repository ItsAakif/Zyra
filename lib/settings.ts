import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AppSettings {
  demoMode: boolean;
  debugMode: boolean;
  enableVoiceAI: boolean;
  enableRealPayments: boolean;
  defaultCurrency: string;
  notifications: boolean;
  darkMode: boolean;
}

class SettingsService {
  private settings: AppSettings = {
    demoMode: false,
    debugMode: __DEV__, // Enable debug in development
    enableVoiceAI: true,
    enableRealPayments: true,
    defaultCurrency: 'USD',
    notifications: true,
    darkMode: false,
  };

  private listeners: ((settings: AppSettings) => void)[] = [];

  constructor() {
    this.loadSettings();
  }

  private async loadSettings() {
    try {
      const stored = await AsyncStorage.getItem('app_settings');
      if (stored) {
        this.settings = { ...this.settings, ...JSON.parse(stored) };
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  private async saveSettings() {
    try {
      await AsyncStorage.setItem('app_settings', JSON.stringify(this.settings));
      this.notifyListeners();
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.settings));
  }

  getSettings(): AppSettings {
    return { ...this.settings };
  }

  async updateSetting<K extends keyof AppSettings>(
    key: K, 
    value: AppSettings[K]
  ): Promise<void> {
    this.settings[key] = value;
    await this.saveSettings();
    
    // Special handling for demo mode
    if (key === 'demoMode') {
      console.log(value ? '🎭 Demo mode enabled' : '🔧 Production mode enabled');
    }
  }

  subscribe(listener: (settings: AppSettings) => void): () => void {
    this.listeners.push(listener);
    listener(this.settings);
    
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Convenience getters
  isDemoMode(): boolean {
    return this.settings.demoMode;
  }

  isDebugMode(): boolean {
    return this.settings.debugMode;
  }

  shouldUseRealPayments(): boolean {
    return this.settings.enableRealPayments && !this.settings.demoMode;
  }

  shouldUseVoiceAI(): boolean {
    return this.settings.enableVoiceAI;
  }

  async toggleDemoMode(): Promise<void> {
    await this.updateSetting('demoMode', !this.settings.demoMode);
  }

  async enableHackathonDemo(): Promise<void> {
    // Perfect settings for hackathon demo
    this.settings = {
      ...this.settings,
      demoMode: true,
      debugMode: true,
      enableVoiceAI: true,
      enableRealPayments: false, // Use mock for smooth demo
    };
    await this.saveSettings();
    console.log('🎯 Hackathon demo mode activated!');
  }

  async enableProduction(): Promise<void> {
    // Settings for real blockchain usage
    this.settings = {
      ...this.settings,
      demoMode: false,
      debugMode: false,
      enableVoiceAI: true,
      enableRealPayments: true,
    };
    await this.saveSettings();
    console.log('🚀 Production mode activated!');
  }
}

export const settingsService = new SettingsService();
