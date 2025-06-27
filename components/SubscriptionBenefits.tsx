import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown, TrendingUp, Zap, X } from 'lucide-react-native';
import { subscriptionService, SubscriptionState } from '../lib/subscription';

interface SubscriptionBenefitsProps {
  onUpgrade?: () => void;
  onDismiss?: () => void;
}

export default function SubscriptionBenefits({ onUpgrade, onDismiss }: SubscriptionBenefitsProps) {
  const [subscriptionState, setSubscriptionState] = useState<SubscriptionState>(
    subscriptionService.getState()
  );

  useEffect(() => {
    const unsubscribe = subscriptionService.subscribe(setSubscriptionState);
    return unsubscribe;
  }, []);

  // Don't show if user is already subscribed
  if (subscriptionState.isSubscribed) {
    return null;
  }

  return (
    <LinearGradient
      colors={['#8B5CF6', '#7C3AED']}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Crown size={24} color="white" />
          </View>
          <Text style={styles.title}>Unlock Premium Benefits</Text>
          {onDismiss && (
            <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
              <X size={20} color="rgba(255, 255, 255, 0.8)" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.benefits}>
          <View style={styles.benefitItem}>
            <TrendingUp size={16} color="white" />
            <Text style={styles.benefitText}>Up to 3x Zyro rewards</Text>
          </View>
          <View style={styles.benefitItem}>
            <Zap size={16} color="white" />
            <Text style={styles.benefitText}>25% lower fees</Text>
          </View>
        </View>

        {onUpgrade && (
          <TouchableOpacity style={styles.upgradeButton} onPress={onUpgrade}>
            <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: 20,
    marginBottom: 24,
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  closeButton: {
    padding: 4,
  },
  benefits: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  benefitText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 8,
  },
  upgradeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
