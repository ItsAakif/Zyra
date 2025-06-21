import { productionVoiceAI } from '@/lib/voice-ai-production';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { text, userId, userContext } = body;

    if (!text || !userId) {
      return new Response('Missing required fields', { status: 400 });
    }

    const response = await productionVoiceAI.processTextCommand(text, userId, userContext);
    
    return Response.json(response);
  } catch (error) {
    console.error('Voice processing API error:', error);
    return Response.json(
      { error: 'Voice processing failed' },
      { status: 500 }
    );
  }
}