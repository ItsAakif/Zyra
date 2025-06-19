import { VoiceAssistant } from '@/lib/voice-assistant';
import { supabase } from '@/lib/supabase';
import { web3Service } from '@/lib/web3';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { transcript, userWalletAddress } = body;

    if (!transcript || !userWalletAddress) {
      return Response.json(
        { error: 'Transcript and wallet address required' },
        { status: 400 }
      );
    }

    // Process voice command
    const command = await VoiceAssistant.processVoiceCommand(transcript);

    if (!command) {
      return Response.json({
        success: false,
        response: "I didn't understand that command. Try saying 'help' to see what I can do.",
      });
    }

    let responseText = '';

    try {
      switch (command.action) {
        case 'balance':
          const balance = await web3Service.getZyroBalance(userWalletAddress);
          responseText = VoiceAssistant.getBalanceResponse(balance);
          break;

        case 'pay':
          if (command.amount) {
            responseText = `I'll help you send ${command.amount} ${command.currency || 'USD'}. Please scan the QR code to proceed.`;
          } else {
            responseText = "Please specify the amount you'd like to send.";
          }
          break;

        case 'convert':
          if (command.amount && command.currency) {
            // Mock conversion for demo
            const convertedAmount = command.amount * 2; // Mock rate
            responseText = VoiceAssistant.getConversionResponse(
              command.amount,
              command.currency,
              'USD',
              convertedAmount
            );
          } else {
            responseText = "Please specify the amount and currency you'd like to convert.";
          }
          break;

        case 'history':
          responseText = "Here's your recent transaction history. You can see more details in the app.";
          break;

        case 'help':
          responseText = VoiceAssistant.getHelpText();
          break;

        default:
          responseText = "I'm not sure how to help with that. Try saying 'help' to see available commands.";
      }
    } catch (error) {
      console.error('Voice command processing error:', error);
      responseText = "I encountered an error processing your request. Please try again.";
    }

    return Response.json({
      success: true,
      command,
      response: responseText,
    });
  } catch (error) {
    console.error('Voice API error:', error);
    return Response.json(
      { error: 'Voice processing failed' },
      { status: 500 }
    );
  }
}