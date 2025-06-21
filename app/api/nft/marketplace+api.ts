import { nftMarketplaceService } from '@/lib/nft-marketplace';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const minPrice = url.searchParams.get('minPrice');
    const maxPrice = url.searchParams.get('maxPrice');
    const rarity = url.searchParams.get('rarity');
    const sortBy = url.searchParams.get('sortBy') as 'price' | 'created' | 'popularity';
    const sortOrder = url.searchParams.get('sortOrder') as 'asc' | 'desc';

    const filters = {
      category: category || undefined,
      priceRange: minPrice && maxPrice ? { min: Number(minPrice), max: Number(maxPrice) } : undefined,
      rarity: rarity || undefined,
      sortBy: sortBy || 'created',
      sortOrder: sortOrder || 'desc',
    };

    const nfts = await nftMarketplaceService.getMarketplaceNFTs(filters);
    
    return Response.json({ nfts });
  } catch (error) {
    console.error('NFT marketplace API error:', error);
    return Response.json(
      { error: 'Failed to fetch marketplace NFTs' },
      { status: 500 }
    );
  }
}