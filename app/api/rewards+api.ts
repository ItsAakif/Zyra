import { supabase } from '@/lib/supabase';
import { web3Service } from '@/lib/web3';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userWalletAddress, achievementType, transactionAmount, country } = body;

    const rewards = [];

    // Check for NFT rewards based on achievements
    if (achievementType === 'first_payment') {
      const nftReward = {
        name: 'First Payment Pioneer',
        description: 'Completed your first QR payment',
        image_url: 'https://images.pexels.com/photos/844124/pexels-photo-844124.jpeg?auto=compress&cs=tinysrgb&w=400',
        rarity: 'common',
        zyro_value: 10,
      };

      // Store NFT in database
      try {
        const { error } = await supabase
          .from('nft_rewards')
          .insert({
            user_id: userWalletAddress,
            ...nftReward,
            earned_date: new Date().toISOString(),
          });

        if (!error) {
          rewards.push({ type: 'nft', ...nftReward });
        } else {
          console.error('NFT reward database error:', error);
        }
      } catch (error) {
        console.error('NFT reward operation error:', error);
      }
    }

    // Check for volume-based rewards
    if (transactionAmount >= 1000) {
      const nftReward = {
        name: 'Crypto Whale',
        description: 'Completed $1000+ in transactions',
        image_url: 'https://images.pexels.com/photos/730547/pexels-photo-730547.jpeg?auto=compress&cs=tinysrgb&w=400',
        rarity: 'epic',
        zyro_value: 100,
      };

      try {
        const { error } = await supabase
          .from('nft_rewards')
          .insert({
            user_id: userWalletAddress,
            ...nftReward,
            earned_date: new Date().toISOString(),
          });

        if (!error) {
          rewards.push({ type: 'nft', ...nftReward });
        } else {
          console.error('Volume reward database error:', error);
        }
      } catch (error) {
        console.error('Volume reward operation error:', error);
      }
    }

    // Update achievements progress
    try {
      await updateAchievements(userWalletAddress, transactionAmount, country);
    } catch (error) {
      console.error('Achievement update error:', error);
    }

    return Response.json({ rewards });
  } catch (error) {
    console.error('Rewards API error:', error);
    return Response.json(
      { error: 'Failed to process rewards' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userWalletAddress = url.searchParams.get('wallet');

    if (!userWalletAddress) {
      return Response.json(
        { error: 'Wallet address required' },
        { status: 400 }
      );
    }

    // Get user's NFT rewards
    const { data: nfts, error: nftError } = await supabase
      .from('nft_rewards')
      .select('*')
      .eq('user_id', userWalletAddress)
      .order('earned_date', { ascending: false });

    // Get user's achievements
    const { data: achievements, error: achievementError } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', userWalletAddress);

    if (nftError) {
      console.error('NFT query error:', nftError);
    }

    if (achievementError) {
      console.error('Achievement query error:', achievementError);
    }

    return Response.json({ 
      nfts: nfts || [], 
      achievements: achievements || [] 
    });
  } catch (error) {
    console.error('Get rewards error:', error);
    return Response.json(
      { error: 'Failed to fetch rewards' },
      { status: 500 }
    );
  }
}

async function updateAchievements(userWalletAddress: string, transactionAmount: number, country: string) {
  try {
    // Get user's current achievements
    const { data: achievements, error: queryError } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', userWalletAddress);

    if (queryError) {
      console.error('Achievement query error:', queryError);
      return;
    }

    // Update or create achievements
    const achievementUpdates = [
      {
        title: 'Payment Streak',
        description: 'Make payments for 7 consecutive days',
        max_progress: 7,
        reward_amount: 25,
        progress_increment: 1,
      },
      {
        title: 'Volume Master',
        description: 'Complete $5000 in total transactions',
        max_progress: 5000,
        reward_amount: 200,
        progress_increment: transactionAmount,
      },
    ];

    for (const update of achievementUpdates) {
      try {
        const existing = achievements?.find(a => a.title === update.title);
        
        if (existing) {
          const newProgress = Math.min(existing.progress + update.progress_increment, update.max_progress);
          const completed = newProgress >= update.max_progress;

          const { error } = await supabase
            .from('achievements')
            .update({
              progress: newProgress,
              completed,
              completed_date: completed ? new Date().toISOString() : null,
            })
            .eq('id', existing.id);

          if (error) {
            console.error('Achievement update error:', error);
          }
        } else {
          const { error } = await supabase
            .from('achievements')
            .insert({
              user_id: userWalletAddress,
              title: update.title,
              description: update.description,
              progress: update.progress_increment,
              max_progress: update.max_progress,
              reward_amount: update.reward_amount,
              completed: update.progress_increment >= update.max_progress,
              completed_date: update.progress_increment >= update.max_progress ? new Date().toISOString() : null,
            });

          if (error) {
            console.error('Achievement insert error:', error);
          }
        }
      } catch (error) {
        console.error('Achievement operation error:', error);
      }
    }
  } catch (error) {
    console.error('Achievement update error:', error);
  }
}