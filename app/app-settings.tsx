import React, { useState, useEffect } from 'react';
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
  Settings, 
  Bell, 
  Shield, 
  Smartphone,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  Database,
  Wifi,
  Battery
} from 'lucide-react-native';
import { settingsService } from '@/lib/settings';
import { useTheme } from '@/lib/theme';

export default function AppSettingsScreen() {
  const { theme } = useTheme();
  const [settings, setSettings] = useState(settingsService.getSettings());
  
  useEffect(() => {
    const unsubscribe = settingsService.subscribe(setSettings);
    return unsubscribe;
  }, []);

  const handleToggleSetting = async (key: string, value: boolean) => {
    await settingsService.updateSetting(key as any, value);
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear temporary files and may improve app performance. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: () => {
            // Simulate cache clearing
            setTimeout(() => {
              Alert.alert('Success', 'Cache cleared successfully!');
            }, 1000);
          }
        }
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'This will export your transaction history and settings to a file.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Export', 
          onPress: () => Alert.alert('Export Started', 'Your data export will be ready shortly.')
        }
      ]
    );
  };

  const handleResetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'This will reset all app settings to default values. Your wallet and transactions will not be affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: async () => {
            // Reset to defaults
            await settingsService.updateSetting('demoMode', false);
            await settingsService.updateSetting('debugMode', false);
            await settingsService.updateSetting('notifications', true);
            Alert.alert('Success', 'Settings reset to defaults.');
          }
        }
      ]
    );
  };

  const SettingItem = ({ 
    icon: Icon, 
    title, 
    description, 
    type = 'toggle',
    value, 
    onToggle,
    onPress,
    destructive = false
  }: any) => (
    <View style={styles.settingItem}>
      <View style={styles.settingHeader}>
        <View style={[
          styles.iconContainer, 
          { backgroundColor: destructive ? '#FEF2F2' : theme.colors.primarySurface }
        ]}>
          <Icon size={20} color={destructive ? '#EF4444' : theme.colors.primary} />
        </View>
        <View style={styles.settingContent}>
          <Text style={[styles.settingTitle, { color: destructive ? '#EF4444' : theme.colors.text }]}>{title}</Text>
          <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>{description}</Text>
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
          <TouchableOpacity 
            style={[
              styles.actionButton, 
              { backgroundColor: destructive ? '#EF4444' : theme.colors.primary }
            ]}
            onPress={onPress}
          >
            <Text style={styles.actionButtonText}>
              {destructive ? 'Delete' : 'Action'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: theme.colors.surface }]}>
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>App Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* General Settings */}
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>General</Text>
          
          <SettingItem
            icon={Bell}
            title="Push Notifications"
            description="Receive notifications for transactions and updates"
            type="toggle"
            value={settings.notifications}
            onToggle={(value: boolean) => handleToggleSetting('notifications', value)}
          />

          <SettingItem
            icon={Smartphone}
            title="Auto-Lock"
            description="Automatically lock app when inactive"
            type="toggle"
            value={true}
            onToggle={() => Alert.alert('Feature Coming Soon', 'Auto-lock settings will be available soon.')}
          />

          <SettingItem
            icon={Wifi}
            title="Background Sync"
            description="Sync data when app is in background"
            type="toggle"
            value={true}
            onToggle={() => Alert.alert('Feature Coming Soon', 'Background sync settings will be available soon.')}
          />
        </View>

        {/* Developer Settings */}
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Developer</Text>
          
          <SettingItem
            icon={Settings}
            title="Demo Mode"
            description="Enable demo mode for presentations"
            type="toggle"
            value={settings.demoMode}
            onToggle={(value: boolean) => handleToggleSetting('demoMode', value)}
          />

          <SettingItem
            icon={Database}
            title="Debug Mode"
            description="Show detailed logs and debug information"
            type="toggle"
            value={settings.debugMode}
            onToggle={(value: boolean) => handleToggleSetting('debugMode', value)}
          />

          <SettingItem
            icon={Shield}
            title="Real Payments"
            description="Enable real blockchain transactions"
            type="toggle"
            value={settings.enableRealPayments}
            onToggle={(value: boolean) => handleToggleSetting('enableRealPayments', value)}
          />
        </View>

        {/* Data & Storage */}
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Data & Storage</Text>
          
          <SettingItem
            icon={RefreshCw}
            title="Clear Cache"
            description="Clear temporary files (25.4 MB)"
            type="button"
            onPress={handleClearCache}
          />

          <SettingItem
            icon={Upload}
            title="Export Data"
            description="Export your transaction history and settings"
            type="button"
            onPress={handleExportData}
          />

          <SettingItem
            icon={Download}
            title="Import Data"
            description="Import data from a backup file"
            type="button"
            onPress={() => Alert.alert('Feature Coming Soon', 'Data import will be available soon.')}
          />
        </View>

        {/* Dangerous Actions */}
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Reset & Privacy</Text>
          
          <SettingItem
            icon={RefreshCw}
            title="Reset Settings"
            description="Reset all app settings to defaults"
            type="button"
            onPress={handleResetSettings}
            destructive={true}
          />

          <SettingItem
            icon={Trash2}
            title="Clear All Data"
            description="Delete all local data (wallet keys will be lost!)"
            type="button"
            onPress={() => Alert.alert(
              'Dangerous Action',
              'This will permanently delete all your local data including wallet keys. This action cannot be undone!',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Delete All', 
                  style: 'destructive',
                  onPress: () => Alert.alert('Feature Disabled', 'This dangerous action is disabled for safety.')
                }
              ]
            )}
            destructive={true}
          />
        </View>

        {/* App Information */}
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>App Information</Text>
          
          <View style={styles.infoGrid}>
            <View style={[styles.infoItem, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Version</Text>
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>1.0.0</Text>
            </View>
            <View style={[styles.infoItem, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Build</Text>
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>2024.03.001</Text>
            </View>
            <View style={[styles.infoItem, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Storage Used</Text>
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>128 MB</Text>
            </View>
            <View style={[styles.infoItem, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Cache Size</Text>
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>25.4 MB</Text>
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
  settingItem: {
    marginBottom: 16,
  },
  settingHeader: {
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
  destructiveIcon: {
    backgroundColor: '#FEF2F2',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  destructiveText: {
    color: '#EF4444',
  },
  settingDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#8B5CF6',
    borderRadius: 6,
  },
  destructiveButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
  },
  destructiveButtonText: {
    color: 'white',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  infoItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
});
