import { predictiveAnalyticsEngine } from '@/lib/predictive-analytics';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { type, ...data } = body;

    switch (type) {
      case 'user_behavior':
        const userPrediction = await predictiveAnalyticsEngine.predictUserBehavior(data.userId);
        return Response.json(userPrediction);

      case 'market_movement':
        const marketPrediction = await predictiveAnalyticsEngine.predictMarketMovement(
          data.currency,
          data.timeframe
        );
        return Response.json(marketPrediction);

      case 'next_transaction':
        const transactionPrediction = await predictiveAnalyticsEngine.predictNextTransaction(
          data.userId
        );
        return Response.json(transactionPrediction);

      case 'recommendations':
        const recommendations = await predictiveAnalyticsEngine.generatePersonalizedRecommendations(
          data.userId
        );
        return Response.json(recommendations);

      case 'retrain_models':
        const retrainResult = await predictiveAnalyticsEngine.retrainModels();
        return Response.json(retrainResult);

      default:
        return new Response('Invalid prediction type', { status: 400 });
    }
  } catch (error) {
    console.error('Predictive analytics API error:', error);
    return Response.json(
      { error: 'Prediction analysis failed' },
      { status: 500 }
    );
  }
}