import OpenAI from 'openai';
import { Platform } from 'react-native';

export interface VoiceCommand {
  intent: string;
  entities: { [key: string]: any };
  confidence: number;
  action: string;
  parameters: { [key: string]: any };
}

export interface VoiceResponse {
  text: string;
  audio?: ArrayBuffer;
  actions: VoiceAction[];
  followUp?: string;
}

export interface VoiceAction {
  type: 'navigate' | 'payment' | 'balance' | 'transaction' | 'help';
  payload: any;
}

export interface ConversationContext {
  userId: string;
  sessionId: string;
  history: ConversationTurn[];
  currentIntent?: string;
  awaitingConfirmation?: boolean;
}

export interface ConversationTurn {
  timestamp: number;
  userInput: string;
  assistantResponse: string;
  intent: string;
  entities: any;
}

export class ProductionVoiceAI {
  private openai: OpenAI;
  private speechService: AzureCognitiveService;
  private conversationContexts: Map<string, ConversationContext> = new Map();

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
    });
    this.speechService = new AzureCognitiveService();
  }

  async processVoiceCommand(
    audioBuffer: ArrayBuffer, 
    userId: string, 
    userContext: any
  ): Promise<VoiceResponse> {
    try {
      // Speech to text
      const transcript = await this.speechService.speechToText(audioBuffer);
      
      // Get or create conversation context
      const context = this.getConversationContext(userId);
      
      // Process with advanced NLP
      const command = await this.processWithAdvancedNLP(transcript, context, userContext);
      
      // Generate contextual response
      const response = await this.generateContextualResponse(command, context, userContext);
      
      // Update conversation context
      this.updateConversationContext(userId, transcript, response.text, command);
      
      // Generate speech audio
      const audioResponse = await this.speechService.textToSpeech(response.text);
      
      return {
        ...response,
        audio: audioResponse,
      };
    } catch (error) {
      console.error('Voice AI processing error:', error);
      return {
        text: "I'm sorry, I encountered an error processing your request. Please try again.",
        actions: [],
      };
    }
  }

  async processTextCommand(
    text: string, 
    userId: string, 
    userContext: any
  ): Promise<VoiceResponse> {
    try {
      const context = this.getConversationContext(userId);
      const command = await this.processWithAdvancedNLP(text, context, userContext);
      const response = await this.generateContextualResponse(command, context, userContext);
      
      this.updateConversationContext(userId, text, response.text, command);
      
      return response;
    } catch (error) {
      console.error('Text AI processing error:', error);
      return {
        text: "I'm sorry, I couldn't understand that. Could you please rephrase?",
        actions: [],
      };
    }
  }

  private async processWithAdvancedNLP(
    input: string, 
    context: ConversationContext, 
    userContext: any
  ): Promise<VoiceCommand> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: this.getSystemPrompt(userContext, context)
          },
          ...this.getConversationHistory(context),
          {
            role: "user",
            content: input
          }
        ],
        functions: [
          {
            name: "process_payment_command",
            description: "Process payment-related commands",
            parameters: {
              type: "object",
              properties: {
                intent: { type: "string", enum: ["send_money", "request_money", "check_balance"] },
                amount: { type: "number" },
                currency: { type: "string" },
                recipient: { type: "string" },
                note: { type: "string" }
              }
            }
          },
          {
            name: "process_wallet_command",
            description: "Process wallet-related commands",
            parameters: {
              type: "object",
              properties: {
                intent: { type: "string", enum: ["check_balance", "view_transactions", "add_funds"] },
                currency: { type: "string" },
                timeframe: { type: "string" }
              }
            }
          },
          {
            name: "process_navigation_command",
            description: "Process navigation commands",
            parameters: {
              type: "object",
              properties: {
                intent: { type: "string", enum: ["navigate_to", "open_screen"] },
                destination: { type: "string" },
                parameters: { type: "object" }
              }
            }
          }
        ],
        function_call: "auto",
        temperature: 0.3,
      });

      const message = completion.choices[0].message;
      
      if (message.function_call) {
        const functionArgs = JSON.parse(message.function_call.arguments);
        return {
          intent: functionArgs.intent,
          entities: functionArgs,
          confidence: 0.9,
          action: message.function_call.name,
          parameters: functionArgs,
        };
      }

      // Fallback to text analysis
      return await this.analyzeTextIntent(input, context);
    } catch (error) {
      console.error('NLP processing error:', error);
      return {
        intent: 'unknown',
        entities: {},
        confidence: 0,
        action: 'help',
        parameters: {},
      };
    }
  }

  private async generateContextualResponse(
    command: VoiceCommand, 
    context: ConversationContext, 
    userContext: any
  ): Promise<VoiceResponse> {
    try {
      const actions: VoiceAction[] = [];
      let responseText = '';
      let followUp = '';

      switch (command.intent) {
        case 'send_money':
          responseText = await this.handleSendMoneyIntent(command, userContext, actions);
          break;
        
        case 'check_balance':
          responseText = await this.handleCheckBalanceIntent(command, userContext, actions);
          break;
        
        case 'view_transactions':
          responseText = await this.handleViewTransactionsIntent(command, userContext, actions);
          break;
        
        case 'navigate_to':
          responseText = await this.handleNavigationIntent(command, userContext, actions);
          break;
        
        case 'help':
          responseText = this.getHelpResponse(userContext);
          break;
        
        default:
          responseText = await this.handleUnknownIntent(command, context, userContext);
          followUp = "Is there something specific I can help you with?";
      }

      return {
        text: responseText,
        actions,
        followUp,
      };
    } catch (error) {
      console.error('Response generation error:', error);
      return {
        text: "I encountered an error processing your request. Please try again.",
        actions: [],
      };
    }
  }

  private async handleSendMoneyIntent(
    command: VoiceCommand, 
    userContext: any, 
    actions: VoiceAction[]
  ): Promise<string> {
    const { amount, currency, recipient, note } = command.parameters;

    if (!amount) {
      return "How much would you like to send?";
    }

    if (!recipient && !userContext.lastScannedQR) {
      actions.push({
        type: 'navigate',
        payload: { screen: 'scan' }
      });
      return `I'll help you send ${amount} ${currency || 'USD'}. Please scan the recipient's QR code.`;
    }

    // Check balance
    const balance = await this.getUserBalance(userContext.userId, currency || 'USD');
    if (balance < amount) {
      return `You don't have enough ${currency || 'USD'} to send ${amount}. Your current balance is ${balance}.`;
    }

    actions.push({
      type: 'payment',
      payload: {
        amount,
        currency: currency || 'USD',
        recipient: recipient || userContext.lastScannedQR,
        note,
      }
    });

    return `I'll send ${amount} ${currency || 'USD'}${recipient ? ` to ${recipient}` : ''}. Please confirm this transaction.`;
  }

  private async handleCheckBalanceIntent(
    command: VoiceCommand, 
    userContext: any, 
    actions: VoiceAction[]
  ): Promise<string> {
    const { currency } = command.parameters;

    actions.push({
      type: 'balance',
      payload: { currency }
    });

    if (currency) {
      const balance = await this.getUserBalance(userContext.userId, currency);
      return `Your ${currency} balance is ${balance}.`;
    } else {
      const balances = await this.getAllBalances(userContext.userId);
      const balanceText = Object.entries(balances)
        .map(([curr, bal]) => `${bal} ${curr}`)
        .join(', ');
      return `Your balances are: ${balanceText}.`;
    }
  }

  private async handleViewTransactionsIntent(
    command: VoiceCommand, 
    userContext: any, 
    actions: VoiceAction[]
  ): Promise<string> {
    const { timeframe } = command.parameters;

    actions.push({
      type: 'transaction',
      payload: { timeframe }
    });

    actions.push({
      type: 'navigate',
      payload: { screen: 'wallet', tab: 'history' }
    });

    return `I'll show you your ${timeframe || 'recent'} transactions.`;
  }

  private async handleNavigationIntent(
    command: VoiceCommand, 
    userContext: any, 
    actions: VoiceAction[]
  ): Promise<string> {
    const { destination, parameters } = command.parameters;

    actions.push({
      type: 'navigate',
      payload: { screen: destination, ...parameters }
    });

    return `I'll take you to ${destination}.`;
  }

  private getHelpResponse(userContext: any): string {
    return `I can help you with:

• "Send 100 dollars" - Make payments
• "What's my balance?" - Check balances  
• "Show my transactions" - View transaction history
• "Go to wallet" - Navigate to different screens
• "Help me with..." - Get assistance

What would you like to do?`;
  }

  private async handleUnknownIntent(
    command: VoiceCommand, 
    context: ConversationContext, 
    userContext: any
  ): Promise<string> {
    // Try to provide helpful suggestions based on context
    if (context.history.length > 0) {
      const lastIntent = context.history[context.history.length - 1].intent;
      return `I didn't quite understand that. Were you trying to ${lastIntent}?`;
    }

    return "I didn't understand that. You can ask me to send money, check your balance, or view your transactions.";
  }

  private getSystemPrompt(userContext: any, context: ConversationContext): string {
    return `You are Zyra, an intelligent payment assistant. You help users with:

1. Making payments and transfers
2. Checking account balances
3. Viewing transaction history
4. Navigating the app
5. General payment-related questions

User context:
- User ID: ${userContext.userId}
- Subscription: ${userContext.subscriptionTier}
- KYC Status: ${userContext.kycStatus}
- Available currencies: USD, EUR, GBP, INR, BRL, ZYR (Zyro tokens)

Conversation context:
- Session ID: ${context.sessionId}
- Previous turns: ${context.history.length}
- Current intent: ${context.currentIntent || 'none'}

Guidelines:
- Be helpful and concise
- Always confirm payment amounts and recipients
- Suggest scanning QR codes for payments when needed
- Provide balance information when relevant
- Guide users through complex tasks step by step
- Use natural, conversational language

Respond with appropriate function calls for actionable requests.`;
  }

  private getConversationHistory(context: ConversationContext): any[] {
    return context.history.slice(-5).flatMap(turn => [
      { role: "user", content: turn.userInput },
      { role: "assistant", content: turn.assistantResponse }
    ]);
  }

  private async analyzeTextIntent(input: string, context: ConversationContext): Promise<VoiceCommand> {
    // Fallback intent analysis using simple pattern matching
    const lowerInput = input.toLowerCase();

    if (lowerInput.includes('send') || lowerInput.includes('pay')) {
      return {
        intent: 'send_money',
        entities: this.extractPaymentEntities(input),
        confidence: 0.7,
        action: 'process_payment_command',
        parameters: this.extractPaymentEntities(input),
      };
    }

    if (lowerInput.includes('balance')) {
      return {
        intent: 'check_balance',
        entities: {},
        confidence: 0.8,
        action: 'process_wallet_command',
        parameters: { intent: 'check_balance' },
      };
    }

    if (lowerInput.includes('transaction') || lowerInput.includes('history')) {
      return {
        intent: 'view_transactions',
        entities: {},
        confidence: 0.8,
        action: 'process_wallet_command',
        parameters: { intent: 'view_transactions' },
      };
    }

    return {
      intent: 'unknown',
      entities: {},
      confidence: 0.1,
      action: 'help',
      parameters: {},
    };
  }

  private extractPaymentEntities(input: string): any {
    const entities: any = {};
    
    // Extract amount
    const amountMatch = input.match(/(\d+(?:\.\d+)?)/);
    if (amountMatch) {
      entities.amount = parseFloat(amountMatch[1]);
    }

    // Extract currency
    const currencyMatch = input.match(/\b(USD|EUR|GBP|INR|BRL|ZYR|dollar|euro|pound|rupee|real|zyro)\b/i);
    if (currencyMatch) {
      const currency = currencyMatch[1].toLowerCase();
      entities.currency = this.normalizeCurrency(currency);
    }

    return entities;
  }

  private normalizeCurrency(currency: string): string {
    const currencyMap: { [key: string]: string } = {
      'dollar': 'USD',
      'euro': 'EUR',
      'pound': 'GBP',
      'rupee': 'INR',
      'real': 'BRL',
      'zyro': 'ZYR',
    };

    return currencyMap[currency] || currency.toUpperCase();
  }

  private getConversationContext(userId: string): ConversationContext {
    if (!this.conversationContexts.has(userId)) {
      this.conversationContexts.set(userId, {
        userId,
        sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        history: [],
      });
    }

    return this.conversationContexts.get(userId)!;
  }

  private updateConversationContext(
    userId: string, 
    userInput: string, 
    assistantResponse: string, 
    command: VoiceCommand
  ): void {
    const context = this.getConversationContext(userId);
    
    context.history.push({
      timestamp: Date.now(),
      userInput,
      assistantResponse,
      intent: command.intent,
      entities: command.entities,
    });

    // Keep only last 10 turns
    if (context.history.length > 10) {
      context.history = context.history.slice(-10);
    }

    context.currentIntent = command.intent;
  }

  private async getUserBalance(userId: string, currency: string): Promise<number> {
    // Implementation to get user balance
    return 1000; // Mock balance
  }

  private async getAllBalances(userId: string): Promise<{ [currency: string]: number }> {
    // Implementation to get all user balances
    return {
      USD: 1000,
      ZYR: 2500,
      EUR: 850,
    };
  }
}

class AzureCognitiveService {
  private subscriptionKey: string;
  private region: string;

  constructor() {
    this.subscriptionKey = process.env.EXPO_PUBLIC_AZURE_SPEECH_KEY || '';
    this.region = process.env.EXPO_PUBLIC_AZURE_SPEECH_REGION || 'eastus';
  }

  async speechToText(audioBuffer: ArrayBuffer): Promise<string> {
    try {
      if (Platform.OS === 'web' && 'webkitSpeechRecognition' in window) {
        // Use Web Speech API as fallback
        return await this.webSpeechToText();
      }

      // Use Azure Cognitive Services
      const response = await fetch(
        `https://${this.region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1`,
        {
          method: 'POST',
          headers: {
            'Ocp-Apim-Subscription-Key': this.subscriptionKey,
            'Content-Type': 'audio/wav',
          },
          body: audioBuffer,
        }
      );

      const result = await response.json();
      return result.DisplayText || '';
    } catch (error) {
      console.error('Speech to text error:', error);
      return '';
    }
  }

  async textToSpeech(text: string): Promise<ArrayBuffer> {
    try {
      if (Platform.OS === 'web' && 'speechSynthesis' in window) {
        // Use Web Speech API as fallback
        this.webTextToSpeech(text);
        return new ArrayBuffer(0);
      }

      // Use Azure Cognitive Services
      const ssml = `
        <speak version='1.0' xml:lang='en-US'>
          <voice xml:lang='en-US' xml:gender='Female' name='en-US-AriaNeural'>
            ${text}
          </voice>
        </speak>
      `;

      const response = await fetch(
        `https://${this.region}.tts.speech.microsoft.com/cognitiveservices/v1`,
        {
          method: 'POST',
          headers: {
            'Ocp-Apim-Subscription-Key': this.subscriptionKey,
            'Content-Type': 'application/ssml+xml',
            'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
          },
          body: ssml,
        }
      );

      return await response.arrayBuffer();
    } catch (error) {
      console.error('Text to speech error:', error);
      return new ArrayBuffer(0);
    }
  }

  private async webSpeechToText(): Promise<string> {
    return new Promise((resolve) => {
      if (!('webkitSpeechRecognition' in window)) {
        resolve('');
        return;
      }

      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        resolve(transcript);
      };

      recognition.onerror = () => {
        resolve('');
      };

      recognition.start();
    });
  }

  private webTextToSpeech(text: string): void {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  }
}

export const productionVoiceAI = new ProductionVoiceAI();