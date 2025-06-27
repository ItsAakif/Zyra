import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { 
  ArrowLeft, 
  Shield, 
  Key, 
  Fingerprint, 
  Smartphone,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle
} from 'lucide-react-native';
import { useTheme } from '@/lib/theme';

export default function SecurityPrivacyScreen() {
  const { theme } = useTheme();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [loginNotifications, setLoginNotifications] = useState(true);
  const [transactionAlerts, setTransactionAlerts] = useState(true);
  const [dataEncryption, setDataEncryption] = useState(true);

  const SecurityItem = ({ 
    icon: Icon, 
    title, 
    description, 
    value, 
    onToggle, 
    type = 'toggle',
    status = 'active'
  }: any) => (
    <View style={styles.securityItem}>
      <View style={styles.itemHeader}>
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.surface }]}>
          <Icon size={24} color={status === 'active' ? '#10B981' : theme.colors.textSecondary} />
        </View>
        <View style={styles.itemContent}>
          <Text style={[styles.itemTitle, { color: theme.colors.text }]}>{title}</Text>
          <Text style={[styles.itemDescription, { color: theme.colors.textSecondary }]}>{description}</Text>
        </View>
        {type === 'toggle' && (
          <Switch
            value={value}
            onValueChange={onToggle}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            thumbColor={value ? 'white' : theme.colors.surface}
          />
        )}
        {type === 'button' && (
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.actionButtonText}>Configure</Text>
          </TouchableOpacity>
        )}
        {type === 'status' && (
          <View style={[styles.statusBadge, { backgroundColor: status === 'active' ? '#10B981' : '#F59E0B' }]}>
            <Text style={styles.statusText}>
              {status === 'active' ? 'Active' : 'Inactive'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const handleChangePassword = () => {
    Alert.alert(
      'Change Password',
      'You will be redirected to change your password securely.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: () => Alert.alert('Feature Coming Soon', 'Password change functionality will be available soon.') }
      ]
    );
  };

  const handleSetupTwoFactor = () => {
    if (twoFactorEnabled) {
      Alert.alert(
        'Disable Two-Factor Authentication',
        'This will reduce your account security. Are you sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Disable', 
            style: 'destructive',
            onPress: () => {
              setTwoFactorEnabled(false);
              Alert.alert('Success', 'Two-factor authentication has been disabled.');
            }
          }
        ]
      );
    } else {
      Alert.alert(
        'Enable Two-Factor Authentication',
        'This will add an extra layer of security to your account.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Enable', 
            onPress: () => {
              setTwoFactorEnabled(true);
              Alert.alert('Success', 'Two-factor authentication has been enabled.');
            }
          }
        ]
      );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: theme.colors.surface }]}>
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Security & Privacy</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Account Security */}
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Account Security</Text>
          
          <SecurityItem
            icon={Key}
            title="Password"
            description="Last changed 30 days ago"
            type="button"
            onPress={handleChangePassword}
          />

          <SecurityItem
            icon={Shield}
            title="Two-Factor Authentication"
            description="Extra security layer for your account"
            type="toggle"
            value={twoFactorEnabled}
            onToggle={handleSetupTwoFactor}
            status={twoFactorEnabled ? 'active' : 'inactive'}
          />

          <SecurityItem
            icon={Fingerprint}
            title="Biometric Authentication"
            description="Use fingerprint or face ID to unlock"
            type="toggle"
            value={biometricEnabled}
            onToggle={setBiometricEnabled}
            status={biometricEnabled ? 'active' : 'inactive'}
          />
        </View>

        {/* Notifications */}
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Security Notifications</Text>
          
          <SecurityItem
            icon={Smartphone}
            title="Login Notifications"
            description="Get notified of new device logins"
            type="toggle"
            value={loginNotifications}
            onToggle={setLoginNotifications}
          />

          <SecurityItem
            icon={AlertTriangle}
            title="Transaction Alerts"
            description="Instant alerts for all transactions"
            type="toggle"
            value={transactionAlerts}
            onToggle={setTransactionAlerts}
          />
        </View>

        {/* Privacy Settings */}
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Privacy Settings</Text>
          
          <SecurityItem
            icon={Lock}
            title="Data Encryption"
            description="All personal data is encrypted"
            type="status"
            status="active"
          />

          <SecurityItem
            icon={Eye}
            title="Transaction Privacy"
            description="Control who can see your transactions"
            type="button"
          />
        </View>

        {/* Security Status */}
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Security Status</Text>
          
          <View style={styles.securityScore}>
            <View style={styles.scoreCircle}>
              <Text style={styles.scoreText}>95%</Text>
            </View>
            <View style={styles.scoreInfo}>
              <Text style={[styles.scoreTitle, { color: theme.colors.text }]}>Security Score</Text>
              <Text style={[styles.scoreDescription, { color: theme.colors.textSecondary }]}>
                Your account has excellent security. Keep up the good work!
              </Text>
            </View>
          </View>

          <View style={styles.recommendations}>
            <Text style={[styles.recommendationsTitle, { color: theme.colors.text }]}>Security Recommendations</Text>
            <View style={styles.recommendationItem}>
              <CheckCircle size={16} color="#10B981" />
              <Text style={[styles.recommendationText, { color: theme.colors.textSecondary }]}>Two-factor authentication enabled</Text>
            </View>
            <View style={styles.recommendationItem}>
              <CheckCircle size={16} color="#10B981" />
              <Text style={[styles.recommendationText, { color: theme.colors.textSecondary }]}>Strong password set</Text>
            </View>
            <View style={styles.recommendationItem}>
              <CheckCircle size={16} color="#10B981" />
              <Text style={[styles.recommendationText, { color: theme.colors.textSecondary }]}>Recent security activity reviewed</Text>
            </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    borderRadius: 12,
    padding: 20,
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  securityItem: {
    marginBottom: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'white',
  },
  securityScore: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  scoreInfo: {
    flex: 1,
  },
  scoreTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  scoreDescription: {
    fontSize: 14,
  },
  recommendations: {
    marginTop: 20,
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 14,
    marginLeft: 8,
  },
});
