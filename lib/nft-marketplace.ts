import { realWalletService } from './real-wallet';
import { algorandService } from './algorand';

export interface NFTReward {
  id: string;
  name: string;
  description: string;
  image: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earnedDate: string;
  zyroValue: number;
  transactionId?: string;
  creator?: string;
  isOwned: boolean;
  price?: number;
}

export interface NFTMarketplaceListing {
  id: string;
  nftId: string;
  seller: string;
  price: number;
  currency: 'ALGO' | 'ZYR';
  listedAt: string;
  status: 'active' | 'sold' | 'cancelled';
}

class NFTMarketplaceService {
  private nftTemplates: Omit<NFTReward, 'id' | 'earnedDate' | 'isOwned' | 'transactionId'>[] = [
    {
      name: 'First Payment Pioneer',
      description: 'Completed your first QR payment',
      image: 'https://images.pexels.com/photos/844124/pexels-photo-844124.jpeg?auto=compress&cs=tinysrgb&w=400',
      rarity: 'common',
      zyroValue: 10,
      creator: 'Zyra Protocol'
    },
    {
      name: 'Global Explorer',
      description: 'Made payments in 3 different countries',
      image: 'https://images.pexels.com/photos/1166209/pexels-photo-1166209.jpeg?auto=compress&cs=tinysrgb&w=400',
      rarity: 'rare',
      zyroValue: 50,
      creator: 'Zyra Protocol'
    },
    {
      name: 'Crypto Whale',
      description: 'Completed $1000+ in transactions',
      image: 'https://images.pexels.com/photos/730547/pexels-photo-730547.jpeg?auto=compress&cs=tinysrgb&w=400',
      rarity: 'epic',
      zyroValue: 100,
      creator: 'Zyra Protocol'
    },
    {
      name: 'Speed Demon',
      description: 'Completed 10 transactions in one day',
      image: 'https://images.pexels.com/photos/355948/pexels-photo-355948.jpeg?auto=compress&cs=tinysrgb&w=400',
      rarity: 'rare',
      zyroValue: 75,
      creator: 'Zyra Protocol'
    },
    {
      name: 'Loyalty Master',
      description: 'Used Zyra for 30 consecutive days',
      image: 'https://images.pexels.com/photos/1509428/pexels-photo-1509428.jpeg?auto=compress&cs=tinysrgb&w=400',
      rarity: 'legendary',
      zyroValue: 200,
      creator: 'Zyra Protocol'
    },
    {
      name: 'Network Builder',
      description: 'Referred 5 friends to Zyra',
      image: 'https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg?auto=compress&cs=tinysrgb&w=400',
      rarity: 'epic',
      zyroValue: 150,
      creator: 'Zyra Protocol'
    }
  ];

  private marketplaceListings: NFTMarketplaceListing[] = [
    {
      id: 'listing-1',
      nftId: 'marketplace-nft-1',
      seller: 'CREATOR1ABCDEFGHIJKLMNOPQRSTUVWXYZ234567890ABCDEF',
      price: 5.0,
      currency: 'ALGO',
      listedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active'
    },
    {
      id: 'listing-2', 
      nftId: 'marketplace-nft-2',
      seller: 'CREATOR2ABCDEFGHIJKLMNOPQRSTUVWXYZ234567890ABCDEF',
      price: 25.0,
      currency: 'ZYR',
      listedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active'
    }
  ];

  async getUserNFTs(walletAddress?: string): Promise<NFTReward[]> {
    const walletState = realWalletService.getState();
    
    if (!walletState.isConnected) {
      return [];
    }

    try {
      // Get NFTs earned through transactions
      const earnedNFTs = await realWalletService.getEarnedNFTRewards();
      
      // Convert to NFTReward format
      const userNFTs: NFTReward[] = earnedNFTs.map(nft => ({
        id: nft.id,
        name: nft.name,
        description: nft.description,
        image: nft.image,
        rarity: nft.rarity,
        earnedDate: this.getRelativeTime(new Date(nft.earnedDate).getTime()),
        zyroValue: nft.zyroValue,
        isOwned: true,
        transactionId: nft.transactionId,
        creator: 'Zyra Protocol'
      }));

      // If no earned NFTs yet, show demo data for new users
      if (userNFTs.length === 0) {
        const transactionHistory = await realWalletService.getTransactionHistory();
        
        if (transactionHistory.length >= 1) {
          userNFTs.push({
            ...this.nftTemplates[0],
            id: 'earned-first-payment',
            earnedDate: this.getRelativeTime(Date.now() - 24 * 60 * 60 * 1000),
            isOwned: true,
            transactionId: transactionHistory[0]?.id
          });
        }
      }

      return userNFTs;
    } catch (error) {
      console.error('Error getting user NFTs:', error);
      
      // Return demo NFTs for presentation
      return this.nftTemplates.slice(0, 1).map((template, index) => ({
        ...template,
        id: `demo-nft-${index}`,
        earnedDate: this.getRelativeTime(Date.now() - (index + 1) * 24 * 60 * 60 * 1000),
        isOwned: true
      }));
    }
  }

  async getMarketplaceNFTs(): Promise<NFTReward[]> {
    // Return NFTs available for purchase in the marketplace
    const marketplaceNFTs = this.nftTemplates.slice(3).map((template, index) => ({
      ...template,
      id: `marketplace-nft-${index + 1}`,
      earnedDate: 'Available for purchase',
      isOwned: false,
      price: template.zyroValue * 0.5 // Price is 50% of ZYR value in ALGO
    }));

    return marketplaceNFTs;
  }

  async createNFT(
    name: string,
    description: string,
    imageUrl: string,
    rarity: 'common' | 'rare' | 'epic' | 'legendary'
  ): Promise<{ success: boolean; nftId?: string; error?: string }> {
    const walletState = realWalletService.getState();
    
    if (!walletState.isConnected || !walletState.account) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      // Create real Algorand Standard Asset (ASA) for NFT
      const nftAssetId = await this.mintRealNFT(
        walletState.account,
        name,
        description,
        imageUrl,
        rarity
      );
      
      console.log(`🎨 Real NFT Created: ${name} (Asset ID: ${nftAssetId})`);
      
      return { success: true, nftId: nftAssetId.toString() };
    } catch (error) {
      console.error('Error creating real NFT:', error);
      return { success: false, error: 'Failed to create NFT on blockchain' };
    }
  }

  private async mintRealNFT(
    creatorAccount: any,
    name: string,
    description: string,
    imageUrl: string,
    rarity: string
  ): Promise<number> {
    const { algorandService } = await import('./algorand');
    
    try {
      // Create Algorand Standard Asset (ASA) for NFT
      const assetMetadata = {
        name: name,
        unitName: name.substring(0, 8).toUpperCase(),
        description: description,
        url: imageUrl,
        metadataHash: undefined, // In production, this would be IPFS hash
        total: 1, // NFT = unique asset
        decimals: 0,
        defaultFrozen: false,
        manager: creatorAccount.address,
        reserve: creatorAccount.address,
        freeze: undefined,
        clawback: undefined,
      };

      // Create the ASA transaction
      const params = await algorandService.algodClient.getTransactionParams().do();
      
      const algosdk = await import('algosdk');
      const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
        from: creatorAccount.address,
        suggestedParams: params,
        ...assetMetadata,
      });

      // Sign and submit transaction
      const signedTxn = txn.signTxn(creatorAccount.privateKey);
      const { txId } = await algorandService.algodClient.sendRawTransaction(signedTxn).do();
      
      // Wait for confirmation
      const result = await algorandService.waitForConfirmation(txId);
      const assetId = result['asset-index'];
      
      console.log(`✅ Real NFT minted on Algorand: Asset ID ${assetId}`);
      return assetId;
      
    } catch (error) {
      console.error('❌ Error minting real NFT:', error);
      throw error;
    }
  }

  async buyNFT(nftId: string, price: number, currency: 'ALGO' | 'ZYR'): Promise<{
    success: boolean;
    transactionId?: string;
    error?: string;
  }> {
    const walletState = realWalletService.getState();
    
    if (!walletState.isConnected || !walletState.account) {
      return { success: false, error: 'Wallet not connected' };
    }

    const balance = currency === 'ALGO' ? walletState.algoBalance : walletState.zyroBalance;
    
    if (balance < price) {
      return { success: false, error: `Insufficient ${currency} balance` };
    }

    try {
      // In a real implementation, this would execute a marketplace smart contract
      console.log(`💰 Buying NFT ${nftId} for ${price} ${currency}`);
      
      // Simulate transaction
      const transactionId = `nft-purchase-${Date.now()}`;
      
      // Simulate blockchain delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return { success: true, transactionId };
    } catch (error) {
      console.error('Error buying NFT:', error);
      return { success: false, error: 'Failed to purchase NFT' };
    }
  }

  async sellNFT(nftId: string, price: number, currency: 'ALGO' | 'ZYR'): Promise<{
    success: boolean;
    listingId?: string;
    error?: string;
  }> {
    const walletState = realWalletService.getState();
    
    if (!walletState.isConnected) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      const listingId = `listing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      console.log(`🏪 Listing NFT ${nftId} for ${price} ${currency}`);
      
      // Add to marketplace listings
      this.marketplaceListings.push({
        id: listingId,
        nftId,
        seller: walletState.address!,
        price,
        currency,
        listedAt: new Date().toISOString(),
        status: 'active'
      });
      
      return { success: true, listingId };
    } catch (error) {
      console.error('Error listing NFT:', error);
      return { success: false, error: 'Failed to list NFT' };
    }
  }

  async getMarketplaceListings(): Promise<NFTMarketplaceListing[]> {
    return this.marketplaceListings.filter(listing => listing.status === 'active');
  }

  private getRelativeTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    
    if (days === 0) return 'Today';
    if (days === 1) return '1 day ago';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  }

  // Connect rewards to real blockchain transactions
  async checkForNewRewards(walletAddress: string): Promise<NFTReward[]> {
    try {
      const transactionHistory = await realWalletService.getTransactionHistory();
      const newRewards: NFTReward[] = [];

      // Check transaction milestones for automatic NFT rewards
      const transactionCount = transactionHistory.length;
      const totalVolume = transactionHistory.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

      // Milestone rewards
      if (transactionCount === 1) {
        newRewards.push({
          ...this.nftTemplates[0],
          id: `reward-first-tx-${Date.now()}`,
          earnedDate: 'Just earned',
          isOwned: true,
          transactionId: transactionHistory[0].id
        });
      }

      if (transactionCount >= 10) {
        newRewards.push({
          ...this.nftTemplates[3],
          id: `reward-speed-demon-${Date.now()}`,
          earnedDate: 'Just earned',
          isOwned: true
        });
      }

      if (totalVolume >= 1000) {
        newRewards.push({
          ...this.nftTemplates[2],
          id: `reward-whale-${Date.now()}`,
          earnedDate: 'Just earned',
          isOwned: true
        });
      }

      return newRewards;
    } catch (error) {
      console.error('Error checking for new rewards:', error);
      return [];
    }
  }
}

export const nftMarketplaceService = new NFTMarketplaceService();
