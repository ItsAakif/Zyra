import axios from 'axios';

export interface VoiceCommand {
  action: 'pay' | 'balance' | 'convert' | 'history' | 'help';
  amount?: number;
  currency?: string;
  recipient?: string;
}

export class VoiceAssistant {
  private static apiKey = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY;
  private static voiceId = 'EXAVITQu4vr4xnSDxMaL'; // Bella voice

  static async processVoiceCommand(transcript: string): Promise<VoiceCommand | null> {
    const lowerTranscript = transcript.toLowerCase();

    // Payment commands
    if (lowerTranscript.includes('send') || lowerTranscript.includes('pay')) {
      const amountMatch = lowerTranscript.match(/(\d+(?:\.\d+)?)/);
      const amount = amountMatch ? parseFloat(amountMatch[1]) : undefined;
      
      return {
        action: 'pay',
        amount,
        currency: this.extractCurrency(lowerTranscript),
      };
    }

    // Balance commands
    if (lowerTranscript.includes('balance') || lowerTranscript.includes('zyro')) {
      return { action: 'balance' };
    }

    // Convert commands
    if (lowerTranscript.includes('convert') || lowerTranscript.includes('exchange')) {
      const amountMatch = lowerTranscript.match(/(\d+(?:\.\d+)?)/);
      const amount = amountMatch ? parseFloat(amountMatch[1]) : undefined;
      
      return {
        action: 'convert',
        amount,
        currency: this.extractCurrency(lowerTranscript),
      };
    }

    // History commands
    if (lowerTranscript.includes('history') || lowerTranscript.includes('transactions')) {
      return { action: 'history' };
    }

    // Help commands
    if (lowerTranscript.includes('help') || lowerTranscript.includes('what can')) {
      return { action: 'help' };
    }

    return null;
  }

  private static extractCurrency(text: string): string {
    if (text.includes('dollar') || text.includes('usd')) return 'USD';
    if (text.includes('euro') || text.includes('eur')) return 'EUR';
    if (text.includes('rupee') || text.includes('inr')) return 'INR';
    if (text.includes('yen') || text.includes('jpy')) return 'JPY';
    if (text.includes('pound') || text.includes('gbp')) return 'GBP';
    if (text.includes('zyro') || text.includes('zyr')) return 'ZYR';
    return 'USD';
  }

  static async generateSpeech(text: string): Promise<void> {
    try {
      if (this.apiKey) {
        // Use ElevenLabs for high-quality speech
        await this.generateElevenLabsSpeech(text);
      } else {
        // Fallback to web speech synthesis
        this.generateWebSpeech(text);
      }
    } catch (error) {
      console.error('Error generating speech:', error);
      // Fallback to web speech synthesis
      this.generateWebSpeech(text);
    }
  }

  private static generateWebSpeech(text: string): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    } else {
      console.log('Speech synthesis not available');
    }
  }

  private static async generateElevenLabsSpeech(text: string): Promise<void> {
    try {
      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${this.voiceId}`,
        {
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
          },
        },
        {
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': this.apiKey,
          },
          responseType: 'arraybuffer',
        }
      );

      // In a real implementation, you would play the audio buffer
      // For now, we'll fall back to web speech synthesis
      this.generateWebSpeech(text);
    } catch (error) {
      console.error('ElevenLabs API error:', error);
      throw error;
    }
  }

  static getHelpText(): string {
    return `I can help you with the following commands:
    
    • "Send 100 dollars to this QR code" - Make a payment
    • "Show my Zyro balance" - Check your balance
    • "Convert 300 Zyros to USD" - Convert currencies
    • "Show my transaction history" - View recent activity
    • "Help" - Get assistance
    
    Just speak naturally and I'll understand!`;
  }

  static getBalanceResponse(balance: number): string {
    return `Your current Zyro balance is ${balance.toLocaleString()} Zyros. You're doing great!`;
  }

  static getPaymentConfirmation(amount: number, currency: string): string {
    return `Payment of ${amount} ${currency} has been processed successfully. You earned ${(amount * 0.1).toFixed(2)} Zyros as a reward!`;
  }

  static getConversionResponse(amount: number, fromCurrency: string, toCurrency: string, result: number): string {
    return `${amount} ${fromCurrency} equals ${result.toFixed(2)} ${toCurrency} at current rates.`;
  }
}