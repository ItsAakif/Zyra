import { advancedAIIntegration } from '@/lib/advanced-ai-integration';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { query, userId, context } = body;

    if (!query || !userId) {
      return new Response('Query and userId are required', { status: 400 });
    }

    const response = await advancedAIIntegration.processAdvancedQuery(query, userId, context);
    
    return Response.json(response);
  } catch (error) {
    console.error('Advanced AI query API error:', error);
    return Response.json(
      { error: 'Advanced AI processing failed' },
      { status: 500 }
    );
  }
}