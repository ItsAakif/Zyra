export interface NFTAsset {
  id: string;
  tokenId: string;
  name: string;
  description: string;
  image: string;
  creator: string;
  owner: string;
  price?: number;
  currency: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  attributes: NFTAttribute[];
  metadata: any;
  algorandAssetId?: number;
  isForSale: boolean;
  createdAt: Date;
  lastSalePrice?: number;
  royaltyPercentage: number;
}

export interface NFTAttribute {
  trait_type: string;
  value: string | number;
  display_type?: 'boost_number' | 'boost_percentage' | 'number' | 'date';
}

export interface NFTCollection {
  id: string;
  name: string;
  description: string;
  image: string;
  creator: string;
  totalSupply: number;
  floorPrice: number;
  volume24h: number;
  assets: NFTAsset[];
}

export interface MarketplaceListing {
  id: string;
  nftId: string;
  seller: string;
  price: number;
  currency: string;
  expiresAt: Date;
  status: 'active' | 'sold' | 'cancelled' | 'expired';
  createdAt: Date;
}

export interface NFTTransaction {
  id: string;
  nftId: string;
  from: string;
  to: string;
  price: number;
  currency: string;
  transactionHash: string;
  timestamp: Date;
  type: 'mint' | 'transfer' | 'sale';
}

export class NFTMarketplaceService {
  private algorandService: any;
  private ipfsService: IPFSService;

  constructor() {
    this.ipfsService = new IPFSService();
  }

  async createNFT(
    creator: string,
    metadata: {
      name: string;
      description: string;
      image: File | string;
      attributes: NFTAttribute[];
      royaltyPercentage: number;
    }
  ): Promise<{ success: boolean; nftId?: string; error?: string }> {
    try {
      // Upload image to IPFS
      const imageUrl = await this.ipfsService.uploadFile(metadata.image);
      
      // Create metadata object
      const nftMetadata = {
        name: metadata.name,
        description: metadata.description,
        image: imageUrl,
        attributes: metadata.attributes,
        creator,
        created_at: new Date().toISOString(),
        royalty_percentage: metadata.royaltyPercentage,
      };

      // Upload metadata to IPFS
      const metadataUrl = await this.ipfsService.uploadJSON(nftMetadata);

      // Create Algorand ASA (Algorand Standard Asset)
      const assetResult = await this.createAlgorandNFT({
        name: metadata.name,
        unitName: this.generateUnitName(metadata.name),
        url: metadataUrl,
        creator,
        total: 1, // NFT is unique
        decimals: 0,
        defaultFrozen: false,
        manager: creator,
        reserve: creator,
        freeze: undefined,
        clawback: undefined,
      });

      if (!assetResult.success) {
        return {
          success: false,
          error: assetResult.error,
        };
      }

      // Store NFT in database
      const nftId = await this.storeNFTInDatabase({
        tokenId: assetResult.assetId!.toString(),
        name: metadata.name,
        description: metadata.description,
        image: imageUrl,
        creator,
        owner: creator,
        currency: 'ALGO',
        rarity: this.calculateRarity(metadata.attributes),
        attributes: metadata.attributes,
        metadata: nftMetadata,
        algorandAssetId: assetResult.assetId,
        isForSale: false,
        royaltyPercentage: metadata.royaltyPercentage,
      });

      return {
        success: true,
        nftId,
      };
    } catch (error) {
      console.error('NFT creation error:', error);
      return {
        success: false,
        error: 'Failed to create NFT',
      };
    }
  }

  async listNFTForSale(
    nftId: string,
    seller: string,
    price: number,
    currency: string = 'ALGO',
    duration: number = 30 // days
  ): Promise<{ success: boolean; listingId?: string; error?: string }> {
    try {
      // Verify ownership
      const nft = await this.getNFT(nftId);
      if (!nft || nft.owner !== seller) {
        return {
          success: false,
          error: 'You do not own this NFT',
        };
      }

      // Create marketplace listing
      const listing: MarketplaceListing = {
        id: `listing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        nftId,
        seller,
        price,
        currency,
        expiresAt: new Date(Date.now() + duration * 24 * 60 * 60 * 1000),
        status: 'active',
        createdAt: new Date(),
      };

      // Store listing in database
      await this.storeListing(listing);

      // Update NFT status
      await this.updateNFTSaleStatus(nftId, true, price, currency);

      return {
        success: true,
        listingId: listing.id,
      };
    } catch (error) {
      console.error('NFT listing error:', error);
      return {
        success: false,
        error: 'Failed to list NFT',
      };
    }
  }

  async buyNFT(
    listingId: string,
    buyer: string
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      // Get listing
      const listing = await this.getListing(listingId);
      if (!listing || listing.status !== 'active') {
        return {
          success: false,
          error: 'Listing not available',
        };
      }

      // Check if listing has expired
      if (listing.expiresAt < new Date()) {
        await this.updateListingStatus(listingId, 'expired');
        return {
          success: false,
          error: 'Listing has expired',
        };
      }

      // Get NFT details
      const nft = await this.getNFT(listing.nftId);
      if (!nft) {
        return {
          success: false,
          error: 'NFT not found',
        };
      }

      // Process payment
      const paymentResult = await this.processNFTPayment(
        buyer,
        listing.seller,
        listing.price,
        listing.currency,
        nft.royaltyPercentage,
        nft.creator
      );

      if (!paymentResult.success) {
        return {
          success: false,
          error: paymentResult.error,
        };
      }

      // Transfer NFT ownership
      const transferResult = await this.transferNFTOwnership(
        nft.algorandAssetId!,
        listing.seller,
        buyer
      );

      if (!transferResult.success) {
        return {
          success: false,
          error: transferResult.error,
        };
      }

      // Update database records
      await Promise.all([
        this.updateNFTOwner(listing.nftId, buyer),
        this.updateNFTSaleStatus(listing.nftId, false),
        this.updateListingStatus(listingId, 'sold'),
        this.recordNFTTransaction({
          nftId: listing.nftId,
          from: listing.seller,
          to: buyer,
          price: listing.price,
          currency: listing.currency,
          transactionHash: transferResult.transactionHash!,
          type: 'sale',
        }),
      ]);

      return {
        success: true,
        transactionId: transferResult.transactionHash,
      };
    } catch (error) {
      console.error('NFT purchase error:', error);
      return {
        success: false,
        error: 'Failed to purchase NFT',
      };
    }
  }

  async getMarketplaceNFTs(
    filters?: {
      category?: string;
      priceRange?: { min: number; max: number };
      rarity?: string;
      sortBy?: 'price' | 'created' | 'popularity';
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<NFTAsset[]> {
    try {
      // Implementation to fetch marketplace NFTs with filters
      return [];
    } catch (error) {
      console.error('Error fetching marketplace NFTs:', error);
      return [];
    }
  }

  async getUserNFTs(userId: string): Promise<NFTAsset[]> {
    try {
      // Implementation to fetch user's NFTs
      return [];
    } catch (error) {
      console.error('Error fetching user NFTs:', error);
      return [];
    }
  }

  async getNFTHistory(nftId: string): Promise<NFTTransaction[]> {
    try {
      // Implementation to fetch NFT transaction history
      return [];
    } catch (error) {
      console.error('Error fetching NFT history:', error);
      return [];
    }
  }

  async getCollections(): Promise<NFTCollection[]> {
    try {
      // Implementation to fetch NFT collections
      return [];
    } catch (error) {
      console.error('Error fetching collections:', error);
      return [];
    }
  }

  private async createAlgorandNFT(params: any): Promise<{ success: boolean; assetId?: number; error?: string }> {
    try {
      // Implementation for creating Algorand ASA
      return {
        success: true,
        assetId: Math.floor(Math.random() * 1000000), // Mock asset ID
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create Algorand asset',
      };
    }
  }

  private async transferNFTOwnership(
    assetId: number,
    from: string,
    to: string
  ): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    try {
      // Implementation for transferring Algorand ASA
      return {
        success: true,
        transactionHash: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to transfer NFT',
      };
    }
  }

  private async processNFTPayment(
    buyer: string,
    seller: string,
    price: number,
    currency: string,
    royaltyPercentage: number,
    creator: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Calculate royalty
      const royaltyAmount = (price * royaltyPercentage) / 100;
      const sellerAmount = price - royaltyAmount;

      // Process payments (implementation would handle actual transfers)
      // 1. Transfer royalty to creator
      // 2. Transfer remaining amount to seller
      // 3. Transfer NFT to buyer

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: 'Payment processing failed',
      };
    }
  }

  private generateUnitName(name: string): string {
    return name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8).toUpperCase();
  }

  private calculateRarity(attributes: NFTAttribute[]): 'common' | 'rare' | 'epic' | 'legendary' {
    // Implementation for rarity calculation based on attributes
    const rarityScore = attributes.length * Math.random();
    
    if (rarityScore > 0.9) return 'legendary';
    if (rarityScore > 0.7) return 'epic';
    if (rarityScore > 0.4) return 'rare';
    return 'common';
  }

  private async storeNFTInDatabase(nft: Partial<NFTAsset>): Promise<string> {
    // Implementation to store NFT in database
    return `nft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async storeListing(listing: MarketplaceListing): Promise<void> {
    // Implementation to store listing in database
  }

  private async getNFT(nftId: string): Promise<NFTAsset | null> {
    // Implementation to get NFT from database
    return null;
  }

  private async getListing(listingId: string): Promise<MarketplaceListing | null> {
    // Implementation to get listing from database
    return null;
  }

  private async updateNFTSaleStatus(nftId: string, isForSale: boolean, price?: number, currency?: string): Promise<void> {
    // Implementation to update NFT sale status
  }

  private async updateNFTOwner(nftId: string, newOwner: string): Promise<void> {
    // Implementation to update NFT owner
  }

  private async updateListingStatus(listingId: string, status: string): Promise<void> {
    // Implementation to update listing status
  }

  private async recordNFTTransaction(transaction: Omit<NFTTransaction, 'id' | 'timestamp'>): Promise<void> {
    // Implementation to record NFT transaction
  }
}

class IPFSService {
  private pinataApiKey: string;
  private pinataSecretKey: string;

  constructor() {
    this.pinataApiKey = process.env.EXPO_PUBLIC_PINATA_API_KEY || '';
    this.pinataSecretKey = process.env.EXPO_PUBLIC_PINATA_SECRET_KEY || '';
  }

  async uploadFile(file: File | string): Promise<string> {
    try {
      if (typeof file === 'string') {
        // If it's already a URL, return it
        return file;
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'pinata_api_key': this.pinataApiKey,
          'pinata_secret_api_key': this.pinataSecretKey,
        },
        body: formData,
      });

      const result = await response.json();
      return `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`;
    } catch (error) {
      console.error('IPFS file upload error:', error);
      throw error;
    }
  }

  async uploadJSON(data: any): Promise<string> {
    try {
      const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'pinata_api_key': this.pinataApiKey,
          'pinata_secret_api_key': this.pinataSecretKey,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      return `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`;
    } catch (error) {
      console.error('IPFS JSON upload error:', error);
      throw error;
    }
  }
}

export const nftMarketplaceService = new NFTMarketplaceService();