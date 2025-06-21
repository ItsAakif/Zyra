import { nftMarketplaceService } from '@/lib/nft-marketplace';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { creator, metadata } = body;

    if (!creator || !metadata) {
      return new Response('Missing required fields', { status: 400 });
    }

    const result = await nftMarketplaceService.createNFT(creator, metadata);
    
    return Response.json(result);
  } catch (error) {
    console.error('NFT creation API error:', error);
    return Response.json(
      { success: false, error: 'NFT creation failed' },
      { status: 500 }
    );
  }
}