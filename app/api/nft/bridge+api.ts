import { crossChainNFTService } from '@/lib/cross-chain-nft';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'bridge_nft':
        const bridgeResult = await crossChainNFTService.bridgeNFT(
          data.nftId,
          data.fromChain,
          data.toChain,
          data.userAddress,
          data.bridgeProvider
        );
        return Response.json(bridgeResult);

      case 'bridge_status':
        const status = await crossChainNFTService.getBridgeStatus(data.bridgeTransactionId);
        return Response.json(status);

      case 'supported_bridges':
        const bridges = await crossChainNFTService.getSupportedBridges(
          data.fromChain,
          data.toChain
        );
        return Response.json({ bridges });

      case 'create_collection':
        const collectionResult = await crossChainNFTService.createCrossChainCollection(
          data.collectionData
        );
        return Response.json(collectionResult);

      default:
        return new Response('Invalid action', { status: 400 });
    }
  } catch (error) {
    console.error('Cross-chain NFT API error:', error);
    return Response.json(
      { error: 'Cross-chain operation failed' },
      { status: 500 }
    );
  }
}