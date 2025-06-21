import { emergingTechnologyService } from '@/lib/emerging-tech';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { technologyIds, businessPriorities, timeline, budget } = body;

    if (!technologyIds || !businessPriorities || !timeline || !budget) {
      return new Response('Missing required parameters', { status: 400 });
    }

    const roadmap = await emergingTechnologyService.generateImplementationRoadmap(
      technologyIds,
      businessPriorities,
      timeline,
      budget
    );
    
    return Response.json(roadmap);
  } catch (error) {
    console.error('Implementation roadmap API error:', error);
    return Response.json(
      { error: 'Implementation roadmap generation failed' },
      { status: 500 }
    );
  }
}