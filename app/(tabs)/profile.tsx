import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  User,
  Settings,
  Shield,
  Bell,
  Moon,
  Sun,
  Globe,
  CreditCard,
  HelpCircle,
  LogOut,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Crown,
  Mic,
  Eye,
  EyeOff,
  X,
} from 'lucide-react-native';
import SubscriptionManager from '@/components/SubscriptionManager';
import WalletDebug from '@/components/WalletDebug';
import { subscriptionService } from '@/lib/subscription';
import { settingsService } from '@/lib/settings';
import { authService, AuthState } from '@/lib/auth';
import { realWalletService } from '@/lib/real-wallet';
import { nftMarketplaceService } from '@/lib/nft-marketplace';
import { useTheme } from '@/lib/theme';

export default function ProfileScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [voiceAssistant, setVoiceAssistant] = useState(true);
  const [kycVerified] = useState(true);
  const [showSubscriptionManager, setShowSubscriptionManager] = useState(false);
  const [showWalletDebug, setShowWalletDebug] = useState(false);
  const [demoMode, setDemoMode] = useState(settingsService.isDemoMode());
  const [userProfile, setUserProfile] = useState<AuthState>(authService.getAuthState());
  const [walletState, setWalletState] = useState(realWalletService.getState());
  const [profileStats, setProfileStats] = useState([
    { label: 'Total Transactions', value: '0' },
    { label: 'Countries Visited', value: '0' },
    { label: 'Zyros Earned', value: '0' },
    { label: 'NFTs Collected', value: '0' },
  ]);
  const subscriptionState = subscriptionService.getState();

  useEffect(() => {
    const unsubscribeSettings = settingsService.subscribe((settings) => {
      setDemoMode(settings.demoMode);
    });
    
    const unsubscribeAuth = authService.subscribe((authState: AuthState) => {
      setUserProfile(authState);
    });

    const unsubscribeWallet = realWalletService.subscribe(setWalletState);

    return () => {
      unsubscribeSettings();
      unsubscribeAuth();
      unsubscribeWallet();
    };
  }, []);

  useEffect(() => {
    const loadProfileStats = async () => {
      try {
        const transactions = await realWalletService.getTransactionHistory();
        const nfts = await nftMarketplaceService.getUserNFTs(walletState.address || undefined);
        
        if (demoMode) {
          setProfileStats([
            { label: 'Total Transactions', value: '247' },
            { label: 'Countries Visited', value: '12' },
            { label: 'Zyros Earned', value: '3,456' },
            { label: 'NFTs Collected', value: '18' },
          ]);
        } else {
          setProfileStats([
            { label: 'Total Transactions', value: transactions.length.toString() },
            { label: 'Countries Visited', value: Math.min(transactions.length, 12).toString() },
            { label: 'Zyros Earned', value: Math.floor(walletState.zyroBalance || 0).toLocaleString() },
            { label: 'NFTs Collected', value: nfts.length.toString() },
          ]);
        }
      } catch (error) {
        console.error('Error loading profile stats:', error);
      }
    };

    loadProfileStats();
  }, [walletState, demoMode]);

  // Handler functions for menu items
  const handlePersonalInfo = () => {
    router.push('/personal-info');
  };

  const handleSecurityPrivacy = () => {
    router.push('/security-privacy' as any);
  };

  const handleKYCVerification = () => {
    router.push('/kyc-verification' as any);
  };

  const handleSubscription = () => {
    setShowSubscriptionManager(true);
  };

  const handleLanguageRegion = () => {
    router.push('/language-region' as any);
  };

  const handleHelpCenter = () => {
    router.push('/help-center' as any);
  };

  const handleAppSettings = () => {
    router.push('/app-settings' as any);
  };

  const menuSections = [
    {
      title: 'Account',
      items: [
        { icon: User, label: 'Personal Information', onPress: handlePersonalInfo },
        { icon: Shield, label: 'Security & Privacy', onPress: handleSecurityPrivacy },
        { icon: CheckCircle, label: 'KYC Verification', onPress: handleKYCVerification, verified: kycVerified },
        { icon: Crown, label: 'Subscription', onPress: () => setShowSubscriptionManager(true), badge: subscriptionState.activePlan?.name || 'Free' },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { 
          icon: Bell, 
          label: 'Notifications', 
          toggle: true, 
          value: notifications, 
          onToggle: setNotifications 
        },
        { 
          icon: isDark ? Moon : Sun, 
          label: 'Dark Mode', 
          toggle: true, 
          value: isDark, 
          onToggle: async (value: boolean) => {
            toggleTheme();
            Alert.alert(
              value ? 'Dark Mode Enabled' : 'Light Mode Enabled',
              'Theme preference saved successfully!'
            );
          }
        },

        { 
          icon: Mic, 
          label: 'Voice Assistant', 
          toggle: true, 
          value: voiceAssistant, 
          onToggle: setVoiceAssistant 
        },
        { icon: Globe, label: 'Language & Region', onPress: handleLanguageRegion },
      ],
    },
    {
      title: 'Developer',
      items: [
        { 
          icon: Settings, 
          label: 'Demo Mode', 
          toggle: true, 
          value: demoMode, 
          onToggle: async (value: boolean) => {
            await settingsService.updateSetting('demoMode', value);
            Alert.alert(
              value ? 'Demo Mode Enabled' : 'Production Mode Enabled',
              value 
                ? 'Perfect for hackathon presentations with smooth mock data'
                : 'Real blockchain transactions and live data enabled'
            );
          }
        },
        { icon: CreditCard, label: 'Wallet Debug', onPress: () => setShowWalletDebug(true) },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: HelpCircle, label: 'Help Center', onPress: handleHelpCenter },
        { icon: Settings, label: 'App Settings', onPress: handleAppSettings },
      ],
    },
  ];

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: () => {} },
      ]
    );
  };

  const dynamicStyles = StyleSheet.create({
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    menuItemIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    menuItemLabel: {
      fontSize: 16,
      color: theme.colors.text,
      fontFamily: 'Inter-Medium',
      flex: 1,
    },
    badge: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      marginRight: 8,
    },
    badgeText: {
      fontSize: 10,
      fontWeight: '600',
      color: 'white',
      fontFamily: 'Inter-SemiBold',
    },
    menuItems: {
      backgroundColor: theme.colors.card,
      marginHorizontal: 20,
      borderRadius: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    statItem: {
      flex: 1,
      minWidth: '45%',
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      padding: 16,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    statValue: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.text,
      fontFamily: 'SpaceGrotesk-Bold',
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontFamily: 'Inter-Regular',
      textAlign: 'center',
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      fontFamily: 'Inter-SemiBold',
      paddingHorizontal: 20,
      marginBottom: 12,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.colors.text,
      fontFamily: 'SpaceGrotesk-Bold',
    },
    settingsButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.card,
      marginHorizontal: 20,
      borderRadius: 12,
      paddingVertical: 16,
      marginBottom: 24,
      gap: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    versionText: {
      fontSize: 12,
      color: theme.colors.textTertiary,
      fontFamily: 'Inter-Regular',
      textAlign: 'center',
      marginBottom: 24,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.card,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.text,
    },
  });

  const renderMenuItem = (item: any) => (
    <TouchableOpacity
      key={item.label}
      style={dynamicStyles.menuItem}
      onPress={item.onPress}
    >
      <View style={styles.menuItemLeft}>
        <View style={dynamicStyles.menuItemIcon}>
          <item.icon size={20} color={theme.colors.textSecondary} />
        </View>
        <Text style={dynamicStyles.menuItemLabel}>{item.label}</Text>
      </View>
      <View style={styles.menuItemRight}>
        {item.verified && (
          <CheckCircle size={16} color="#10B981" style={{ marginRight: 8 }} />
        )}
        {item.badge && (
          <View style={dynamicStyles.badge}>
            <Text style={dynamicStyles.badgeText}>{item.badge}</Text>
          </View>
        )}
        {item.toggle ? (
          <Switch
            value={item.value}
            onValueChange={item.onToggle}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            thumbColor={item.value ? 'white' : theme.colors.surface}
          />
        ) : (
          <ChevronRight size={16} color={theme.colors.textTertiary} />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={dynamicStyles.headerTitle}>Profile</Text>
          <TouchableOpacity style={dynamicStyles.settingsButton}>
            <Settings size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <LinearGradient
          colors={isDark ? ['#1F2937', '#374151'] : [theme.colors.primary, theme.colors.primary + 'CC']}
          style={styles.profileCard}
        >
          <View style={styles.profileInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {userProfile.user?.email?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <View style={styles.profileDetails}>
              <Text style={styles.profileName}>
                {userProfile.user?.full_name || userProfile.user?.email?.split('@')[0] || 'User'}
              </Text>
              <Text style={styles.profileEmail}>
                {userProfile.user?.email || 'user@example.com'}
              </Text>
              <View style={styles.verificationBadge}>
                <CheckCircle size={14} color="#10B981" />
                <Text style={styles.verificationText}>Verified</Text>
              </View>
            </View>
          </View>
          
          {subscriptionState.isSubscribed && subscriptionState.activePlan && (
            <View style={styles.subscriptionBadge}>
              <Crown size={16} color="#F59E0B" />
              <Text style={styles.subscriptionText}>{subscriptionState.activePlan.name}</Text>
            </View>
          )}
        </LinearGradient>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {profileStats.map((stat, index) => (
            <View key={index} style={dynamicStyles.statItem}>
              <Text style={dynamicStyles.statValue}>{stat.value}</Text>
              <Text style={dynamicStyles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Menu Sections */}
        {menuSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.menuSection}>
            <Text style={dynamicStyles.sectionTitle}>{section.title}</Text>
            <View style={dynamicStyles.menuItems}>
              {section.items.map(renderMenuItem)}
            </View>
          </View>
        ))}



        {/* Logout Button */}
        <TouchableOpacity style={dynamicStyles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* App Version */}
        <Text style={dynamicStyles.versionText}>Zyra v1.0.0</Text>
      </ScrollView>
      
      {/* Subscription Manager Modal */}
      <SubscriptionManager 
        visible={showSubscriptionManager}
        onClose={() => setShowSubscriptionManager(false)}
      />
      
      {/* Wallet Debug Modal */}
      <Modal
        visible={showWalletDebug}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowWalletDebug(false)}
      >
        <View style={dynamicStyles.modalContainer}>
          <View style={dynamicStyles.modalHeader}>
            <Text style={dynamicStyles.modalTitle}>Wallet Debug</Text>
            <TouchableOpacity onPress={() => setShowWalletDebug(false)}>
              <X size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <WalletDebug />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  profileCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    fontFamily: 'SpaceGrotesk-Bold',
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    fontFamily: 'SpaceGrotesk-Bold',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verificationText: {
    fontSize: 12,
    color: '#10B981',
    fontFamily: 'Inter-Medium',
  },
  subscriptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 6,
  },
  subscriptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
    fontFamily: 'Inter-SemiBold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 32,
  },
  menuSection: {
    marginBottom: 24,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    fontFamily: 'Inter-SemiBold',
  },
});
