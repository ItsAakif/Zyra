import OpenAI from 'openai';

export class AIVoiceAssistant {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
    });
  }

  async processVoiceCommand(transcript: string, userContext: any): Promise<VoiceResponse> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are Zyra, a helpful payment assistant. You can help users with:
            - Making payments ("send $100 to this QR code")
            - Checking balances ("what's my Zyro balance?")
            - Converting currencies ("convert 500 Zyros to USD")
            - Transaction history ("show my recent payments")
            
            User context: ${JSON.stringify(userContext)}
            
            Respond with a JSON object containing:
            - action: string (pay|balance|convert|history|help|unknown)
            - amount: number (if applicable)
            - currency: string (if applicable)
            - response: string (what to say back to user)
            `
          },
          {
            role: "user",
            content: transcript
          }
        ],
        temperature: 0.7,
        max_tokens: 200,
      });

      const result = JSON.parse(completion.choices[0].message.content || '{}');
      
      return {
        action: result.action,
        amount: result.amount,
        currency: result.currency,
        response: result.response,
      };
    } catch (error) {
      console.error('AI processing error:', error);
      return {
        action: 'unknown',
        response: "I'm sorry, I didn't understand that. Could you please try again?",
      };
    }
  }

  async generateSpeech(text: string): Promise<ArrayBuffer> {
    try {
      const response = await this.openai.audio.speech.create({
        model: "tts-1",
        voice: "nova",
        input: text,
      });

      return await response.arrayBuffer();
    } catch (error) {
      console.error('Speech generation error:', error);
      throw error;
    }
  }
}

interface VoiceResponse {
  action: string;
  amount?: number;
  currency?: string;
  response: string;
}