import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Zap,
  Gift,
  Trophy,
  Star,
  Calendar,
  TrendingUp,
  Award,
  Coins,
  Crown,
  Target,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface NFTReward {
  id: string;
  name: string;
  description: string;
  image: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earnedDate: string;
  zyroValue: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  progress: number;
  maxProgress: number;
  reward: number;
  completed: boolean;
  icon: string;
}

export default function RewardsScreen() {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'nfts' | 'achievements'>('overview');
  const [zyroBalance] = useState(1247.89);
  const [totalEarned] = useState(3456.78);
  const [weeklyEarnings] = useState(127.45);

  const nftRewards: NFTReward[] = [
    {
      id: '1',
      name: 'First Payment Pioneer',
      description: 'Completed your first QR payment',
      image: 'https://images.pexels.com/photos/844124/pexels-photo-844124.jpeg?auto=compress&cs=tinysrgb&w=400',
      rarity: 'common',
      earnedDate: '2 days ago',
      zyroValue: 10,
    },
    {
      id: '2',
      name: 'Global Explorer',
      description: 'Made payments in 3 different countries',
      image: 'https://images.pexels.com/photos/1166209/pexels-photo-1166209.jpeg?auto=compress&cs=tinysrgb&w=400',
      rarity: 'rare',
      earnedDate: '1 week ago',
      zyroValue: 50,
    },
    {
      id: '3',
      name: 'Crypto Whale',
      description: 'Completed $1000+ in transactions',
      image: 'https://images.pexels.com/photos/730547/pexels-photo-730547.jpeg?auto=compress&cs=tinysrgb&w=400',
      rarity: 'epic',
      earnedDate: '2 weeks ago',
      zyroValue: 100,
    },
  ];

  const achievements: Achievement[] = [
    {
      id: '1',
      title: 'Payment Streak',
      description: 'Make payments for 7 consecutive days',
      progress: 5,
      maxProgress: 7,
      reward: 25,
      completed: false,
      icon: '🔥',
    },
    {
      id: '2',
      title: 'Country Collector',
      description: 'Make payments in 10 different countries',
      progress: 6,
      maxProgress: 10,
      reward: 100,
      completed: false,
      icon: '🌍',
    },
    {
      id: '3',
      title: 'Volume Master',
      description: 'Complete $5000 in total transactions',
      progress: 3456,
      maxProgress: 5000,
      reward: 200,
      completed: false,
      icon: '💰',
    },
    {
      id: '4',
      title: 'Early Adopter',
      description: 'Join Zyra in the first month',
      progress: 1,
      maxProgress: 1,
      reward: 50,
      completed: true,
      icon: '⭐',
    },
  ];

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return '#6B7280';
      case 'rare': return '#3B82F6';
      case 'epic': return '#8B5CF6';
      case 'legendary': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const renderNFTItem = (nft: NFTReward) => (
    <TouchableOpacity key={nft.id} style={styles.nftItem}>
      <Image source={{ uri: nft.image }} style={styles.nftImage} />
      <View style={styles.nftDetails}>
        <View style={styles.nftHeader}>
          <Text style={styles.nftName}>{nft.name}</Text>
          <View style={[styles.rarityBadge, { backgroundColor: getRarityColor(nft.rarity) + '20' }]}>
            <Text style={[styles.rarityText, { color: getRarityColor(nft.rarity) }]}>
              {nft.rarity.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={styles.nftDescription}>{nft.description}</Text>
        <View style={styles.nftFooter}>
          <Text style={styles.nftDate}>{nft.earnedDate}</Text>
          <Text style={styles.nftValue}>{nft.zyroValue} ZYR</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderAchievementItem = (achievement: Achievement) => (
    <TouchableOpacity key={achievement.id} style={styles.achievementItem}>
      <View style={styles.achievementIcon}>
        <Text style={styles.achievementEmoji}>{achievement.icon}</Text>
      </View>
      <View style={styles.achievementDetails}>
        <View style={styles.achievementHeader}>
          <Text style={styles.achievementTitle}>{achievement.title}</Text>
          {achievement.completed && <Award size={16} color="#10B981" />}
        </View>
        <Text style={styles.achievementDescription}>{achievement.description}</Text>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${(achievement.progress / achievement.maxProgress) * 100}%`,
                  backgroundColor: achievement.completed ? '#10B981' : '#8B5CF6'
                }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {achievement.progress}/{achievement.maxProgress}
          </Text>
        </View>
        <Text style={styles.achievementReward}>Reward: {achievement.reward} ZYR</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Rewards</Text>
          <TouchableOpacity style={styles.leaderboardButton}>
            <Crown size={20} color="#F59E0B" />
          </TouchableOpacity>
        </View>

        {/* Zyro Balance Card */}
        <LinearGradient
          colors={['#8B5CF6', '#EC4899']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          <View style={styles.balanceHeader}>
            <Zap size={24} color="white" />
            <Text style={styles.balanceTitle}>Zyro Balance</Text>
          </View>
          <Text style={styles.balanceAmount}>{zyroBalance.toLocaleString()} ZYR</Text>
          <View style={styles.balanceStats}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total Earned</Text>
              <Text style={styles.statValue}>{totalEarned.toLocaleString()} ZYR</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>This Week</Text>
              <Text style={styles.statValue}>{weeklyEarnings.toLocaleString()} ZYR</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <View style={styles.statCard}>
            <Gift size={20} color="#8B5CF6" />
            <Text style={styles.statCardValue}>{nftRewards.length}</Text>
            <Text style={styles.statCardLabel}>NFTs Earned</Text>
          </View>
          <View style={styles.statCard}>
            <Trophy size={20} color="#F59E0B" />
            <Text style={styles.statCardValue}>{achievements.filter(a => a.completed).length}</Text>
            <Text style={styles.statCardLabel}>Achievements</Text>
          </View>
          <View style={styles.statCard}>
            <Target size={20} color="#10B981" />
            <Text style={styles.statCardValue}>85%</Text>
            <Text style={styles.statCardLabel}>Completion</Text>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'overview' && styles.activeTab]}
            onPress={() => setSelectedTab('overview')}
          >
            <Text style={[styles.tabText, selectedTab === 'overview' && styles.activeTabText]}>
              Overview
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'nfts' && styles.activeTab]}
            onPress={() => setSelectedTab('nfts')}
          >
            <Text style={[styles.tabText, selectedTab === 'nfts' && styles.activeTabText]}>
              NFTs
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'achievements' && styles.activeTab]}
            onPress={() => setSelectedTab('achievements')}
          >
            <Text style={[styles.tabText, selectedTab === 'achievements' && styles.activeTabText]}>
              Achievements
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {selectedTab === 'overview' && (
            <View>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent NFTs</Text>
                <TouchableOpacity onPress={() => setSelectedTab('nfts')}>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>
              {nftRewards.slice(0, 2).map(renderNFTItem)}

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Active Achievements</Text>
                <TouchableOpacity onPress={() => setSelectedTab('achievements')}>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>
              {achievements.filter(a => !a.completed).slice(0, 2).map(renderAchievementItem)}
            </View>
          )}

          {selectedTab === 'nfts' && (
            <View>
              {nftRewards.map(renderNFTItem)}
            </View>
          )}

          {selectedTab === 'achievements' && (
            <View>
              {achievements.map(renderAchievementItem)}
            </View>
          )}
        </View>

        {/* Redeem Section */}
        <View style={styles.redeemSection}>
          <Text style={styles.sectionTitle}>Redeem Zyros</Text>
          <View style={styles.redeemOptions}>
            <TouchableOpacity style={styles.redeemOption}>
              <Coins size={24} color="#8B5CF6" />
              <Text style={styles.redeemOptionTitle}>Convert to Crypto</Text>
              <Text style={styles.redeemOptionSubtitle}>Exchange for ETH, USDC</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.redeemOption}>
              <Star size={24} color="#F59E0B" />
              <Text style={styles.redeemOptionTitle}>Premium Upgrade</Text>
              <Text style={styles.redeemOptionSubtitle}>Unlock Pro features</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'SpaceGrotesk-Bold',
  },
  leaderboardButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  balanceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Inter-SemiBold',
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: 'white',
    fontFamily: 'SpaceGrotesk-Bold',
    marginBottom: 20,
  },
  balanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Inter-SemiBold',
  },
  quickStats: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statCardValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'SpaceGrotesk-Bold',
    marginTop: 8,
    marginBottom: 4,
  },
  statCardLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: 'Inter-Medium',
  },
  activeTabText: {
    color: '#111827',
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  tabContent: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
  },
  seeAllText: {
    fontSize: 14,
    color: '#8B5CF6',
    fontFamily: 'Inter-Medium',
  },
  nftItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  nftImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 16,
  },
  nftDetails: {
    flex: 1,
  },
  nftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nftName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
    flex: 1,
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  nftDescription: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
  },
  nftFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nftDate: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
  },
  nftValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B5CF6',
    fontFamily: 'Inter-SemiBold',
  },
  achievementItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  achievementIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  achievementEmoji: {
    fontSize: 20,
  },
  achievementDetails: {
    flex: 1,
  },
  achievementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
    flex: 1,
  },
  achievementDescription: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
    marginBottom: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter-Medium',
    minWidth: 40,
  },
  achievementReward: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B5CF6',
    fontFamily: 'Inter-SemiBold',
  },
  redeemSection: {
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 24,
  },
  redeemOptions: {
    gap: 12,
  },
  redeemOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  redeemOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
    marginLeft: 16,
    flex: 1,
  },
  redeemOptionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
    marginLeft: 16,
  },
});