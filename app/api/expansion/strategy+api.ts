import { globalExpansionService } from '@/lib/global-expansion';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { targetCountries, businessModel, budget, timeline, priorities } = body;

    if (!targetCountries || !businessModel || !budget || !timeline || !priorities) {
      return new Response('Missing required parameters', { status: 400 });
    }

    const strategy = await globalExpansionService.generateExpansionStrategy(
      targetCountries,
      businessModel,
      budget,
      timeline,
      priorities
    );
    
    return Response.json(strategy);
  } catch (error) {
    console.error('Expansion strategy API error:', error);
    return Response.json(
      { error: 'Expansion strategy generation failed' },
      { status: 500 }
    );
  }
}