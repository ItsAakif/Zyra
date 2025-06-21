import { productionAnalyticsService } from '@/lib/analytics-production';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { eventName, properties, userId } = body;

    if (!eventName) {
      return new Response('Missing event name', { status: 400 });
    }

    await productionAnalyticsService.trackEvent(eventName, properties, userId);
    
    return Response.json({ success: true });
  } catch (error) {
    console.error('Analytics API error:', error);
    return Response.json(
      { error: 'Failed to track event' },
      { status: 500 }
    );
  }
}