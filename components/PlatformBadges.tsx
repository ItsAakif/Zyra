import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Linking } from 'react-native';
import { useTheme } from '@/lib/theme';

interface PlatformBadgesProps {
  style?: object;
}

export default function PlatformBadges({ style }: PlatformBadgesProps) {
  const { theme } = useTheme();

  const openBoltNew = () => {
    Linking.openURL('https://bolt.new/');
  };

  return (
    <View style={[styles.badgeContainer, style]}>
      {/* Algorand Badge */}
      <View style={[styles.badge, { backgroundColor: theme.colors.card }]}>
        <Image 
          source={theme.isDark 
            ? require('@/assets/images/algorand_logo_mark_white.png')
            : require('@/assets/images/algorand_logo_mark_black.png')
          }
          style={styles.algorandBadge}
          resizeMode="contain"
        />
      </View>
      
      {/* Bolt.new Badge */}
      <TouchableOpacity 
        style={[styles.badge, { backgroundColor: theme.colors.card }]}
        onPress={openBoltNew}
        activeOpacity={0.8}
      >
        <Image 
          source={theme.isDark 
            ? require('@/assets/images/white_circle_360x360.png')
            : require('@/assets/images/black_circle_360x360.png')
          }
          style={styles.boltBadge}
          resizeMode="contain"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  badgeContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  algorandBadge: {
    width: 24,
    height: 24,
  },
  boltBadge: {
    width: 32,
    height: 32,
  },
});
