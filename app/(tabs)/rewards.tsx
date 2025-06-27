import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
    Alert,
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
    Plus,
    ShoppingCart,
    Eye,
} from 'lucide-react-native';
import { nftMarketplaceService, NFTReward } from '@/lib/nft-marketplace';
import { realWalletService } from '@/lib/real-wallet';
import { settingsService } from '@/lib/settings';
import { router } from 'expo-router';
import { useTheme } from '@/lib/theme';

const { width } = Dimensions.get('window');

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
    const { theme } = useTheme();
    const [selectedTab, setSelectedTab] = useState<'overview' | 'nfts' | 'marketplace' | 'achievements'>('overview');
    const [ownedNFTs, setOwnedNFTs] = useState<NFTReward[]>([]);
    const [marketplaceNFTs, setMarketplaceNFTs] = useState<NFTReward[]>([]);
    const [loading, setLoading] = useState(true);
    const [walletState, setWalletState] = useState(realWalletService.getState());
    const [demoMode, setDemoMode] = useState(settingsService.isDemoMode());

    useEffect(() => {
        const unsubscribeWallet = realWalletService.subscribe(setWalletState);
        const unsubscribeSettings = settingsService.subscribe((settings) => {
            setDemoMode(settings.demoMode);
        });

        return () => {
            unsubscribeWallet();
            unsubscribeSettings();
        };
    }, []);

    const zyroBalance = demoMode ? 1247.89 : (walletState.zyroBalance || 0);
    const totalEarned = demoMode ? 3456.78 : zyroBalance * 1.5;
    const weeklyEarnings = demoMode ? 127.45 : zyroBalance * 0.1;

    useEffect(() => {
        loadNFTData();
    }, [walletState.isConnected, demoMode]);

    const loadNFTData = async () => {
        setLoading(true);
        try {
            const [owned, marketplace] = await Promise.all([
                nftMarketplaceService.getUserNFTs(walletState.address || undefined),
                nftMarketplaceService.getMarketplaceNFTs()
            ]);

            setOwnedNFTs(owned);
            setMarketplaceNFTs(marketplace);
        } catch (error) {
            console.error('Error loading NFT data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNFT = async () => {
        if (!walletState.isConnected) {
            Alert.alert('Wallet Required', 'Please connect your wallet to create NFTs.');
            return;
        }

        Alert.alert(
            'Create Custom NFT',
            'Would you like to create a custom NFT? This will cost 5 ALGO.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Create',
                    onPress: async () => {
                        try {
                            const result = await nftMarketplaceService.createNFT(
                                'Custom Achievement NFT',
                                'A unique NFT created by you',
                                'https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg?auto=compress&cs=tinysrgb&w=400',
                                'rare'
                            );

                            if (result.success) {
                                Alert.alert('Success!', 'Your custom NFT has been created!');
                                loadNFTData(); // Refresh the data
                            } else {
                                Alert.alert('Error', result.error || 'Failed to create NFT');
                            }
                        } catch (error) {
                            Alert.alert('Error', 'Failed to create NFT');
                        }
                    }
                }
            ]
        );
    };

    const handleBuyNFT = async (nft: NFTReward) => {
        if (!nft.price) return;

        Alert.alert(
            'Buy NFT',
            `Buy "${nft.name}" for ${nft.price} ALGO?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Buy',
                    onPress: async () => {
                        try {
                            const result = await nftMarketplaceService.buyNFT(nft.id, nft.price!, 'ALGO');
                            if (result.success) {
                                Alert.alert('Success!', 'NFT purchased successfully!');
                                loadNFTData(); // Refresh the data
                            } else {
                                Alert.alert('Error', result.error || 'Failed to purchase NFT');
                            }
                        } catch (error) {
                            Alert.alert('Error', 'Failed to purchase NFT');
                        }
                    }
                }
            ]
        );
    };

    const [achievements, setAchievements] = useState<Achievement[]>([]);

    useEffect(() => {
        const loadAchievements = async () => {
            try {
                const transactions = await realWalletService.getTransactionHistory();
                const transactionCount = transactions.length;
                const totalVolume = transactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

                if (demoMode) {
                    setAchievements([
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
                    ]);
                } else {
                    setAchievements([
                        {
                            id: '1',
                            title: 'First Transaction',
                            description: 'Complete your first transaction',
                            progress: transactionCount,
                            maxProgress: 1,
                            reward: 10,
                            completed: transactionCount >= 1,
                            icon: '🚀',
                        },
                        {
                            id: '2',
                            title: 'Active User',
                            description: 'Complete 10 transactions',
                            progress: transactionCount,
                            maxProgress: 10,
                            reward: 50,
                            completed: transactionCount >= 10,
                            icon: '🔥',
                        },
                        {
                            id: '3',
                            title: 'Volume Trader',
                            description: 'Complete $100 in total transactions',
                            progress: Math.floor(totalVolume),
                            maxProgress: 100,
                            reward: 100,
                            completed: totalVolume >= 100,
                            icon: '💰',
                        },
                        {
                            id: '4',
                            title: 'Wallet Connected',
                            description: 'Connect your first wallet',
                            progress: walletState.isConnected ? 1 : 0,
                            maxProgress: 1,
                            reward: 5,
                            completed: walletState.isConnected,
                            icon: '🔗',
                        },
                    ]);
                }
            } catch (error) {
                console.error('Error loading achievements:', error);
            }
        };

        loadAchievements();
    }, [walletState, demoMode]);

    const renderMarketplaceNFTItem = (nft: NFTReward) => (
        <TouchableOpacity key={nft.id} style={[styles.nftCard, { backgroundColor: theme.colors.card }]}>
            <Image source={{ uri: nft.image }} style={styles.nftImage} />
            <View style={styles.nftContent}>
                <View style={styles.nftHeader}>
                    <Text style={[styles.nftName, { color: theme.colors.text }]}>{nft.name}</Text>
                    <View style={[styles.rarityBadge, { backgroundColor: getRarityColor(nft.rarity) }]}>
                        <Text style={styles.rarityText}>{nft.rarity.toUpperCase()}</Text>
                    </View>
                </View>
                <Text style={[styles.nftDescription, { color: theme.colors.textSecondary }]}>{nft.description}</Text>
                <View style={styles.nftFooter}>
                    <View style={styles.nftPrice}>
                        <Text style={[styles.priceLabel, { color: theme.colors.textSecondary }]}>Price:</Text>
                        <Text style={[styles.priceValue, { color: theme.colors.text }]}>{nft.price} ALGO</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.buyButton}
                        onPress={() => handleBuyNFT(nft)}
                    >
                        <ShoppingCart size={16} color="white" />
                        <Text style={styles.buyButtonText}>Buy</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );

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
        <TouchableOpacity key={nft.id} style={[styles.nftItem, { backgroundColor: theme.colors.card }]}>
            <Image source={{ uri: nft.image }} style={styles.nftImage} />
            <View style={styles.nftDetails}>
                <View style={styles.nftHeader}>
                    <Text style={[styles.nftName, { color: theme.colors.text }]}>{nft.name}</Text>
                    <View style={[styles.rarityBadge, { backgroundColor: getRarityColor(nft.rarity) + '20' }]}>
                        <Text style={[styles.rarityText, { color: getRarityColor(nft.rarity) }]}>
                            {nft.rarity.toUpperCase()}
                        </Text>
                    </View>
                </View>
                <Text style={[styles.nftDescription, { color: theme.colors.textSecondary }]}>{nft.description}</Text>
                <View style={styles.nftFooter}>
                    <Text style={[styles.nftDate, { color: theme.colors.textSecondary }]}>{nft.earnedDate}</Text>
                    <Text style={styles.nftValue}>{nft.zyroValue} ZYR</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderAchievementItem = (achievement: Achievement) => (
        <TouchableOpacity key={achievement.id} style={[styles.achievementItem, { backgroundColor: theme.colors.card }]}>
            <View style={[styles.achievementIcon, { backgroundColor: theme.colors.surface }]}>
                <Text style={styles.achievementEmoji}>{achievement.icon}</Text>
            </View>
            <View style={styles.achievementDetails}>
                <View style={styles.achievementHeader}>
                    <Text style={[styles.achievementTitle, { color: theme.colors.text }]}>{achievement.title}</Text>
                    {achievement.completed && <Award size={16} color="#10B981" />}
                </View>
                <Text style={[styles.achievementDescription, { color: theme.colors.textSecondary }]}>{achievement.description}</Text>
                <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
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
                    <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
                        {achievement.progress}/{achievement.maxProgress}
                    </Text>
                </View>
                <Text style={styles.achievementReward}>Reward: {achievement.reward} ZYR</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Rewards</Text>
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
                    <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
                        <Gift size={20} color="#8B5CF6" />
                        <Text style={[styles.statCardValue, { color: theme.colors.text }]}>{ownedNFTs.length}</Text>
                        <Text style={[styles.statCardLabel, { color: theme.colors.textSecondary }]}>NFTs Earned</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
                        <Trophy size={20} color="#F59E0B" />
                        <Text style={[styles.statCardValue, { color: theme.colors.text }]}>{achievements.filter(a => a.completed).length}</Text>
                        <Text style={[styles.statCardLabel, { color: theme.colors.textSecondary }]}>Achievements</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
                        <Target size={20} color="#10B981" />
                        <Text style={[styles.statCardValue, { color: theme.colors.text }]}>85%</Text>
                        <Text style={[styles.statCardLabel, { color: theme.colors.textSecondary }]}>Completion</Text>
                    </View>
                </View>

                {/* Tab Navigation */}
                <View style={[styles.tabContainer, { backgroundColor: theme.colors.surface }]}>
                    <TouchableOpacity
                        style={[styles.tab, selectedTab === 'overview' && [styles.activeTab, { backgroundColor: theme.colors.card }]]}
                        onPress={() => setSelectedTab('overview')}
                    >
                        <Text style={[styles.tabText, { color: theme.colors.textSecondary }, selectedTab === 'overview' && [styles.activeTabText, { color: theme.colors.text }]]}>
                            Overview
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, selectedTab === 'nfts' && [styles.activeTab, { backgroundColor: theme.colors.card }]]}
                        onPress={() => setSelectedTab('nfts')}
                    >
                        <Text style={[styles.tabText, { color: theme.colors.textSecondary }, selectedTab === 'nfts' && [styles.activeTabText, { color: theme.colors.text }]]}>
                            NFTs
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, selectedTab === 'marketplace' && [styles.activeTab, { backgroundColor: theme.colors.card }]]}
                        onPress={() => setSelectedTab('marketplace')}
                    >
                        <Text style={[styles.tabText, { color: theme.colors.textSecondary }, selectedTab === 'marketplace' && [styles.activeTabText, { color: theme.colors.text }]]}>
                            Marketplace
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, selectedTab === 'achievements' && [styles.activeTab, { backgroundColor: theme.colors.card }]]}
                        onPress={() => setSelectedTab('achievements')}
                    >
                        <Text style={[styles.tabText, { color: theme.colors.textSecondary }, selectedTab === 'achievements' && [styles.activeTabText, { color: theme.colors.text }]]}>
                            Achievements
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Tab Content */}
                <View style={styles.tabContent}>
                    {selectedTab === 'overview' && (
                        <View>
                            <View style={styles.sectionHeader}>
                                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Recent NFTs</Text>
                                <TouchableOpacity onPress={() => setSelectedTab('nfts')}>
                                    <Text style={styles.seeAllText}>See All</Text>
                                </TouchableOpacity>
                            </View>
                            {ownedNFTs.slice(0, 2).map(renderNFTItem)}

                            <View style={styles.sectionHeader}>
                                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Active Achievements</Text>
                                <TouchableOpacity onPress={() => setSelectedTab('achievements')}>
                                    <Text style={styles.seeAllText}>See All</Text>
                                </TouchableOpacity>
                            </View>
                            {achievements.filter(a => !a.completed).slice(0, 2).map(renderAchievementItem)}
                        </View>
                    )}

                    {selectedTab === 'nfts' && (
                        <View>
                            <View style={styles.nftActions}>
                                <TouchableOpacity style={styles.actionButton} onPress={() => handleCreateNFT()}>
                                    <Plus size={20} color="white" />
                                    <Text style={styles.actionButtonText}>Create NFT</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.actionButton} onPress={() => setSelectedTab('marketplace')}>
                                    <ShoppingCart size={20} color="white" />
                                    <Text style={styles.actionButtonText}>Marketplace</Text>
                                </TouchableOpacity>
                            </View>
                            {ownedNFTs.length > 0 ? (
                                ownedNFTs.map(renderNFTItem)
                            ) : (
                                <View style={styles.emptyState}>
                                    <Gift size={48} color={theme.colors.textSecondary} />
                                    <Text style={[styles.emptyStateTitle, { color: theme.colors.text }]}>No NFTs Yet</Text>
                                    <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
                                        Complete transactions to earn your first NFT rewards!
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}

                    {selectedTab === 'marketplace' && (
                        <View>
                            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>NFT Marketplace</Text>
                            {marketplaceNFTs.length > 0 ? (
                                marketplaceNFTs.map(renderMarketplaceNFTItem)
                            ) : (
                                <View style={styles.emptyState}>
                                    <ShoppingCart size={48} color={theme.colors.textSecondary} />
                                    <Text style={[styles.emptyStateTitle, { color: theme.colors.text }]}>No NFTs Available</Text>
                                    <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
                                        Check back later for new NFTs in the marketplace!
                                    </Text>
                                </View>
                            )}
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
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Redeem Zyros</Text>
                    <View style={styles.redeemOptions}>
                        <TouchableOpacity
                            style={[styles.redeemOption, { backgroundColor: theme.colors.card }]}
                            onPress={() => router.push('/convert-crypto' as any)}
                        >
                            <Coins size={24} color="#8B5CF6" />
                            <View style={styles.redeemOptionContent}>
                                <Text style={[styles.redeemOptionTitle, { color: theme.colors.text }]}>Convert to Crypto</Text>
                                <Text style={[styles.redeemOptionSubtitle, { color: theme.colors.textSecondary }]}>Exchange for ETH, USDC</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.redeemOption, { backgroundColor: theme.colors.card }]}
                            onPress={() => router.push('/(tabs)/profile' as any)}
                        >
                            <Star size={24} color="#F59E0B" />
                            <View style={styles.redeemOptionContent}>
                                <Text style={[styles.redeemOptionTitle, { color: theme.colors.text }]}>Premium Upgrade</Text>
                                <Text style={[styles.redeemOptionSubtitle, { color: theme.colors.textSecondary }]}>Unlock Pro features</Text>
                            </View>
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
        fontFamily: 'SpaceGrotesk-Bold',
        marginTop: 8,
        marginBottom: 4,
    },
    statCardLabel: {
        fontSize: 12,
        fontFamily: 'Inter-Regular',
        textAlign: 'center',
    },
    tabContainer: {
        flexDirection: 'row',
        marginHorizontal: 20,
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '500',
        fontFamily: 'Inter-Medium',
    },
    activeTabText: {
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
        fontFamily: 'Inter-SemiBold',
    },
    seeAllText: {
        fontSize: 14,
        color: '#8B5CF6',
        fontFamily: 'Inter-Medium',
    },
    nftItem: {
        flexDirection: 'row',
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
        fontFamily: 'Inter-SemiBold',
        flex: 1,
    },
    achievementDescription: {
        fontSize: 14,
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
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    progressText: {
        fontSize: 12,
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
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    redeemOptionContent: {
        flex: 1,
        marginLeft: 16,
    },
    redeemOptionTitle: {
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Inter-SemiBold',
        marginBottom: 2,
    },
    redeemOptionSubtitle: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
    },
    nftActions: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#8B5CF6',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: 'white',
        fontFamily: 'Inter-SemiBold',
    },
    nftPrice: {
        alignItems: 'flex-start',
    },
    priceLabel: {
        fontSize: 12,
        fontFamily: 'Inter-Regular',
    },
    priceValue: {
        fontSize: 14,
        fontWeight: '600',
        fontFamily: 'Inter-SemiBold',
    },
    buyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#10B981',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 6,
    },
    buyButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: 'white',
        fontFamily: 'Inter-SemiBold',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyStateTitle: {
        fontSize: 18,
        fontWeight: '600',
        fontFamily: 'Inter-SemiBold',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyStateText: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        textAlign: 'center',
        lineHeight: 20,
    },
    nftCard: {
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        overflow: 'hidden',
    },
    nftContent: {
        padding: 16,
    },
});
