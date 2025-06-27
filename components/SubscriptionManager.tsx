import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  X, 
  Check, 
  Crown, 
  Zap, 
  Star,
  Shield,
  TrendingUp,
  Loader
} from 'lucide-react-native';
import { subscriptionService, SubscriptionPlan, SubscriptionState } from '../lib/subscription';

interface SubscriptionManagerProps {
  visible: boolean;
  onClose: () => void;
}

export default function SubscriptionManager({ visible, onClose }: SubscriptionManagerProps) {
  const [subscriptionState, setSubscriptionState] = useState<SubscriptionState>(
    subscriptionService.getState()
  );
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  useEffect(() => {
    const unsubscribe = subscriptionService.subscribe(setSubscriptionState);
    return unsubscribe;
  }, []);

  const handlePurchase = async (plan: SubscriptionPlan) => {
    try {
      // Use demo purchase for development
      const success = await subscriptionService.purchaseDemo(plan.id);
      
      if (success) {
        Alert.alert(
          'Subscription Activated!',
          `Welcome to ${plan.name}! Your benefits are now active.`,
          [{ text: 'OK', onPress: onClose }]
        );
      }
    } catch (error) {
      Alert.alert('Purchase Failed', 'Please try again later.');
    }
  };

  const handleRestore = async () => {
    const success = await subscriptionService.restorePurchases();
    if (success) {
      Alert.alert('Success', 'Purchases restored successfully!');
    } else {
      Alert.alert('No Purchases Found', 'No previous purchases to restore.');
    }
  };

  const handleCancel = async () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your subscription? You will lose all premium benefits.',
      [
        { text: 'Keep Subscription', style: 'cancel' },
        { 
          text: 'Cancel', 
          style: 'destructive',
          onPress: async () => {
            await subscriptionService.cancelSubscription();
            Alert.alert('Subscription Cancelled', 'Your subscription has been cancelled.');
          }
        }
      ]
    );
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'zyra_basic': return <Zap size={24} color="#F59E0B" />;
      case 'zyra_pro': return <Crown size={24} color="#8B5CF6" />;
      case 'zyra_enterprise': return <Shield size={24} color="#10B981" />;
      default: return <Star size={24} color="#6B7280" />;
    }
  };

  const getPlanGradient = (planId: string): [string, string] => {
    switch (planId) {
      case 'zyra_basic': return ['#F59E0B', '#F97316'];
      case 'zyra_pro': return ['#8B5CF6', '#7C3AED'];
      case 'zyra_enterprise': return ['#10B981', '#059669'];
      default: return ['#6B7280', '#4B5563'];
    }
  };

  const plans = subscriptionService.getAvailablePlans();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Subscription Plans</Text>
          <TouchableOpacity onPress={onClose}>
            <X size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Current Subscription Status */}
          {subscriptionState.isSubscribed && subscriptionState.activePlan && (
            <View style={styles.currentPlanCard}>
              <LinearGradient
                colors={getPlanGradient(subscriptionState.activePlan.id)}
                style={styles.currentPlanGradient}
              >
                <View style={styles.currentPlanHeader}>
                  {getPlanIcon(subscriptionState.activePlan.id)}
                  <Text style={styles.currentPlanTitle}>
                    Current: {subscriptionState.activePlan.name}
                  </Text>
                </View>
                <Text style={styles.currentPlanExpiry}>
                  {subscriptionState.expirationDate && 
                    `Expires: ${subscriptionState.expirationDate.toLocaleDateString()}`
                  }
                </Text>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={handleCancel}
                >
                  <Text style={styles.cancelButtonText}>Cancel Subscription</Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          )}

          {/* Benefits Overview */}
          <View style={styles.benefitsCard}>
            <Text style={styles.benefitsTitle}>Subscription Benefits</Text>
            <View style={styles.benefitsList}>
              <View style={styles.benefitItem}>
                <TrendingUp size={20} color="#10B981" />
                <Text style={styles.benefitText}>Higher Zyro reward multipliers</Text>
              </View>
              <View style={styles.benefitItem}>
                <Zap size={20} color="#F59E0B" />
                <Text style={styles.benefitText}>Lower cross-border fees</Text>
              </View>
              <View style={styles.benefitItem}>
                <Star size={20} color="#8B5CF6" />
                <Text style={styles.benefitText}>Advanced voice AI features</Text>
              </View>
            </View>
          </View>

          {/* Available Plans */}
          <Text style={styles.plansTitle}>Choose Your Plan</Text>
          
          {plans.map((plan) => (
            <View key={plan.id} style={styles.planCard}>
              {plan.isPopular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>Most Popular</Text>
                </View>
              )}
              
              <LinearGradient
                colors={getPlanGradient(plan.id)}
                style={styles.planHeader}
              >
                <View style={styles.planHeaderContent}>
                  {getPlanIcon(plan.id)}
                  <View style={styles.planTitleContainer}>
                    <Text style={styles.planName}>{plan.name}</Text>
                    <Text style={styles.planDescription}>{plan.description}</Text>
                  </View>
                  <Text style={styles.planPrice}>
                    {plan.price}
                    <Text style={styles.planPeriod}>/{plan.period}</Text>
                  </Text>
                </View>
              </LinearGradient>

              <View style={styles.planFeatures}>
                {plan.features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <Check size={16} color="#10B981" />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.subscribeButton,
                  subscriptionState.activePlan?.id === plan.id && styles.currentPlanButton
                ]}
                onPress={() => handlePurchase(plan)}
                disabled={subscriptionState.isLoading || subscriptionState.activePlan?.id === plan.id}
              >
                {subscriptionState.isLoading ? (
                  <Loader size={20} color="white" />
                ) : (
                  <Text style={styles.subscribeButtonText}>
                    {subscriptionState.activePlan?.id === plan.id ? 'Current Plan' : 'Subscribe'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          ))}

          {/* Restore Purchases */}
          <TouchableOpacity style={styles.restoreButton} onPress={handleRestore}>
            <Text style={styles.restoreButtonText}>Restore Purchases</Text>
          </TouchableOpacity>

          {/* Terms */}
          <Text style={styles.termsText}>
            Subscriptions auto-renew unless cancelled. Cancel anytime in your account settings.
          </Text>
        </ScrollView>
      </View>
    </Modal>
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
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  currentPlanCard: {
    marginVertical: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  currentPlanGradient: {
    padding: 20,
  },
  currentPlanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  currentPlanTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginLeft: 12,
  },
  currentPlanExpiry: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 16,
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  benefitsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
  },
  plansTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  planCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  popularBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  planHeader: {
    padding: 20,
  },
  planHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  planName: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
  },
  planDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
  },
  planPeriod: {
    fontSize: 16,
    fontWeight: '400',
  },
  planFeatures: {
    padding: 20,
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
  },
  subscribeButton: {
    backgroundColor: '#8B5CF6',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  currentPlanButton: {
    backgroundColor: '#6B7280',
  },
  subscribeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  restoreButton: {
    alignItems: 'center',
    marginVertical: 20,
  },
  restoreButtonText: {
    color: '#8B5CF6',
    fontSize: 16,
    fontWeight: '500',
  },
  termsText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 18,
  },
});
