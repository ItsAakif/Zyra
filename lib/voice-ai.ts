import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { realWalletService } from './real-wallet';

export interface VoiceCommand {
  type: 'pay' | 'check_balance' | 'send' | 'scan' | 'help';
  amount?: number;
  currency?: string;
  recipient?: string;
  note?: string;
  confidence: number;
}

export interface VoiceResponse {
  text: string;
  audioUrl?: string;
  action?: {
    type: 'navigate' | 'execute_payment' | 'show_balance';
    data?: any;
  };
}

class VoiceAIService {
  private apiKey: string;
  private isInitialized = false;
  private isListening = false;
  private recording: Audio.Recording | null = null;

  constructor() {
    this.apiKey = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY || '';
    this.initializeAudio();
  }

  private async initializeAudio() {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      this.isInitialized = true;
      console.log('✅ Voice AI service initialized');
    } catch (error) {
      console.error('❌ Error initializing audio:', error);
    }
  }

  async startListening(): Promise<void> {
    if (this.isListening) {
      console.log('⚠️ Already listening, ignoring request');
      return;
    }

    try {
      // Request permissions first
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        console.error('❌ Audio permission denied');
        throw new Error('Audio permission required');
      }

      this.isListening = true;
      console.log('🎤 Starting voice recording...');

      this.recording = new Audio.Recording();
      await this.recording.prepareToRecordAsync({
        android: {
          extension: '.wav',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_PCM_16BIT,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_PCM_16BIT,
          sampleRate: 16000,
          numberOfChannels: 1,
        },
        ios: {
          extension: '.wav',
          outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_LINEARPCM,
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {},
      });

      await this.recording.startAsync();
      console.log('✅ Voice recording started successfully');
    } catch (error) {
      console.error('❌ Error starting recording:', error);
      this.isListening = false;
      throw error;
    }
  }

  async stopListening(): Promise<VoiceCommand | null> {
    if (!this.isListening || !this.recording) return null;

    try {
      console.log('🔇 Stopping voice recording...');
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      
      this.isListening = false;
      this.recording = null;

      if (!uri) return null;

      // Process the audio and extract command
      return await this.processAudioCommand(uri);
    } catch (error) {
      console.error('❌ Error stopping recording:', error);
      this.isListening = false;
      return null;
    }
  }

  private async processAudioCommand(audioUri: string): Promise<VoiceCommand | null> {
    try {
      if (!this.apiKey) {
        // Fallback to text-based parsing for demo
        return this.simulateVoiceCommand();
      }

      // Read audio file
      const audioData = await FileSystem.readAsStringAsync(audioUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Use OpenAI Whisper via ElevenLabs for speech-to-text
      const transcriptionResponse = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio: audioData,
          model: 'whisper-1',
        }),
      });

      if (!transcriptionResponse.ok) {
        console.error('Speech-to-text API error:', transcriptionResponse.status);
        return this.simulateVoiceCommand();
      }

      const transcription = await transcriptionResponse.json();
      const text = transcription.text.toLowerCase();

      // Parse the transcribed text into commands
      return this.parseVoiceCommand(text);
    } catch (error) {
      console.error('❌ Error processing audio command:', error);
      return this.simulateVoiceCommand();
    }
  }

  private parseVoiceCommand(text: string): VoiceCommand {
    console.log('🗣️ Processing voice command:', text);

    // Payment commands
    if (text.includes('pay') || text.includes('send')) {
      const amountMatch = text.match(/(\d+(?:\.\d+)?)\s*(dollars?|algos?|zyros?)?/);
      const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;
      const currency = amountMatch?.[2]?.toUpperCase() || 'ALGO';

      return {
        type: 'pay',
        amount,
        currency: currency.replace(/S$/, ''), // Remove plural 's'
        confidence: 0.8,
      };
    }

    // Balance check
    if (text.includes('balance') || text.includes('how much')) {
      return {
        type: 'check_balance',
        confidence: 0.9,
      };
    }

    // Scan command
    if (text.includes('scan') || text.includes('qr')) {
      return {
        type: 'scan',
        confidence: 0.85,
      };
    }

    // Help command
    if (text.includes('help') || text.includes('what can')) {
      return {
        type: 'help',
        confidence: 0.9,
      };
    }

    return {
      type: 'help',
      confidence: 0.3,
    };
  }

  private simulateVoiceCommand(): VoiceCommand {
    // For demo purposes when API is not configured
    console.log('🎲 Simulating voice command for demo');
    const commands = [
      { type: 'check_balance', confidence: 0.9 },
      { type: 'pay', amount: 5, currency: 'ALGO', confidence: 0.8 },
      { type: 'scan', confidence: 0.85 },
      { type: 'help', confidence: 0.7 },
    ] as VoiceCommand[];

    const selectedCommand = commands[Math.floor(Math.random() * commands.length)];
    console.log('🎯 Selected demo command:', selectedCommand);
    return selectedCommand;
  }

  async executeVoiceCommand(command: VoiceCommand): Promise<VoiceResponse> {
    console.log('🚀 Executing voice command:', command);

    try {
      switch (command.type) {
        case 'check_balance':
          return await this.handleBalanceCheck();
        
        case 'pay':
        case 'send':
          return await this.handlePaymentCommand(command);
        
        case 'scan':
          return this.handleScanCommand();
        
        case 'help':
          return this.handleHelpCommand();
        
        default:
          return {
            text: "I didn't understand that command. Try saying 'check balance', 'pay 5 algos', or 'scan QR code'.",
          };
      }
    } catch (error) {
      console.error('❌ Error executing voice command:', error);
      return {
        text: 'Sorry, I encountered an error processing your request.',
      };
    }
  }

  private async handleBalanceCheck(): Promise<VoiceResponse> {
    const walletState = realWalletService.getState();
    
    if (!walletState.isConnected) {
      return {
        text: 'Please connect your wallet first to check your balance.',
        action: { type: 'navigate', data: { screen: 'wallet' } },
      };
    }

    const algoBalance = walletState.algoBalance.toFixed(4);
    const zyroBalance = walletState.zyroBalance.toFixed(2);
    
    const responseText = `Your current balance is ${algoBalance} Algos and ${zyroBalance} Zyros.`;
    
    // Generate speech response if API is configured
    const audioUrl = await this.generateSpeech(responseText);
    
    return {
      text: responseText,
      audioUrl,
      action: { type: 'show_balance' },
    };
  }

  private async handlePaymentCommand(command: VoiceCommand): Promise<VoiceResponse> {
    const walletState = realWalletService.getState();
    
    if (!walletState.isConnected) {
      return {
        text: 'Please connect your wallet first to make payments.',
        action: { type: 'navigate', data: { screen: 'wallet' } },
      };
    }

    if (!command.amount || command.amount <= 0) {
      return {
        text: 'Please specify a valid amount to send.',
      };
    }

    const responseText = `Ready to send ${command.amount} ${command.currency || 'Algos'}. Please scan a QR code or provide the recipient address.`;
    const audioUrl = await this.generateSpeech(responseText);
    
    return {
      text: responseText,
      audioUrl,
      action: { 
        type: 'navigate', 
        data: { 
          screen: 'scan',
          prefillAmount: command.amount,
          prefillCurrency: command.currency,
        } 
      },
    };
  }

  private handleScanCommand(): VoiceResponse {
    return {
      text: 'Opening QR code scanner. Point your camera at any payment QR code.',
      action: { type: 'navigate', data: { screen: 'scan' } },
    };
  }

  private handleHelpCommand(): VoiceResponse {
    const helpText = `I can help you with: Check balance, Send payments, Scan QR codes. Try saying "check my balance" or "send 5 algos".`;
    
    return {
      text: helpText,
    };
  }

  private async generateSpeech(text: string): Promise<string | undefined> {
    if (!this.apiKey) return undefined;

    try {
      const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
          },
        }),
      });

      if (!response.ok) {
        console.error('Text-to-speech API error:', response.status);
        return undefined;
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      return audioUrl;
    } catch (error) {
      console.error('❌ Error generating speech:', error);
      return undefined;
    }
  }

  async playAudioResponse(audioUrl: string): Promise<void> {
    try {
      const { sound } = await Audio.Sound.createAsync({ uri: audioUrl });
      await sound.playAsync();
      
      // Cleanup after playing
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.error('❌ Error playing audio response:', error);
    }
  }

  isVoiceAIEnabled(): boolean {
    return this.isInitialized && !!this.apiKey;
  }

  getListeningState(): boolean {
    return this.isListening;
  }

  // Pre-built voice prompts for common actions
  async speakWelcome(): Promise<void> {
    const text = "Welcome to Zyra! I'm your voice payment assistant. Try saying 'check balance' or 'send payment'.";
    const audioUrl = await this.generateSpeech(text);
    if (audioUrl) {
      await this.playAudioResponse(audioUrl);
    }
  }

  async speakPaymentConfirmation(amount: number, currency: string): Promise<void> {
    const text = `Payment of ${amount} ${currency} has been sent successfully.`;
    const audioUrl = await this.generateSpeech(text);
    if (audioUrl) {
      await this.playAudioResponse(audioUrl);
    }
  }
}

export const voiceAI = new VoiceAIService();
