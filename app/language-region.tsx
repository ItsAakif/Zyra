import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { 
  ArrowLeft, 
  Globe, 
  DollarSign, 
  Clock, 
  Calendar,
  CheckCircle
} from 'lucide-react-native';
import { settingsService } from '@/lib/settings';
import { useTheme } from '@/lib/theme';

export default function LanguageRegionScreen() {
  const { theme } = useTheme();
  const [selectedLanguage, setSelectedLanguage] = useState('English (US)');
  const [selectedRegion, setSelectedRegion] = useState('United States');
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [selectedTimeZone, setSelectedTimeZone] = useState('PST (UTC-8)');
  const [selectedDateFormat, setSelectedDateFormat] = useState('MM/DD/YYYY');

  const languages = [
    'English (US)',
    'English (UK)',
    'Spanish (ES)',
    'French (FR)',
    'German (DE)',
    'Italian (IT)',
    'Portuguese (BR)',
    'Japanese (JP)',
    'Korean (KR)',
    'Chinese (CN)'
  ];

  const regions = [
    'United States',
    'United Kingdom',
    'Canada',
    'Australia',
    'Germany',
    'France',
    'Spain',
    'Italy',
    'Brazil',
    'Japan',
    'South Korea',
    'Singapore',
    'India'
  ];

  const currencies = [
    'USD - US Dollar',
    'EUR - Euro',
    'GBP - British Pound',
    'CAD - Canadian Dollar',
    'AUD - Australian Dollar',
    'JPY - Japanese Yen',
    'KRW - Korean Won',
    'SGD - Singapore Dollar',
    'INR - Indian Rupee',
    'BRL - Brazilian Real'
  ];

  const timeZones = [
    'PST (UTC-8)',
    'EST (UTC-5)',
    'GMT (UTC+0)',
    'CET (UTC+1)',
    'JST (UTC+9)',
    'KST (UTC+9)',
    'SGT (UTC+8)',
    'IST (UTC+5:30)',
    'BRT (UTC-3)'
  ];

  const dateFormats = [
    'MM/DD/YYYY',
    'DD/MM/YYYY',
    'YYYY-MM-DD',
    'DD MMM YYYY',
    'MMM DD, YYYY'
  ];

  const handleSave = async () => {
    try {
      // Save preferences to settings service
      await settingsService.updateSetting('defaultCurrency', selectedCurrency.split(' - ')[0]);
      
      Alert.alert(
        'Settings Saved',
        'Your language and region preferences have been updated successfully.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    }
  };

  const SettingSection = ({ title, icon: Icon, children }: any) => (
    <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
      <View style={styles.sectionHeader}>
        <Icon size={20} color={theme.colors.primary} />
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{title}</Text>
      </View>
      {children}
    </View>
  );

  const OptionsList = ({ options, selected, onSelect }: any) => (
    <View style={styles.optionsList}>
      {options.map((option: string, index: number) => (
        <TouchableOpacity
        key={index}
        style={[
        styles.optionItem,
        { 
            backgroundColor: theme.colors.surface, 
            borderColor: theme.colors.border 
            },
          selected === option && { 
          backgroundColor: theme.colors.primarySurface, 
          borderColor: theme.colors.primary 
          }
        ]}
        onPress={() => onSelect(option)}
        >
        <Text style={[
          { color: theme.colors.textSecondary },
            selected === option && { color: theme.colors.primary, fontWeight: '500' }
            ]}>
              {option}
            </Text>
            {selected === option && (
              <CheckCircle size={20} color={theme.colors.primary} />
            )}
          </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: theme.colors.surface }]}>
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Language & Region</Text>
        <TouchableOpacity onPress={handleSave} style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <SettingSection title="Language" icon={Globe}>
          <OptionsList
            options={languages}
            selected={selectedLanguage}
            onSelect={setSelectedLanguage}
          />
        </SettingSection>

        <SettingSection title="Region" icon={Globe}>
          <OptionsList
            options={regions}
            selected={selectedRegion}
            onSelect={setSelectedRegion}
          />
        </SettingSection>

        <SettingSection title="Currency" icon={DollarSign}>
          <OptionsList
            options={currencies}
            selected={selectedCurrency}
            onSelect={setSelectedCurrency}
          />
        </SettingSection>

        <SettingSection title="Time Zone" icon={Clock}>
          <OptionsList
            options={timeZones}
            selected={selectedTimeZone}
            onSelect={setSelectedTimeZone}
          />
        </SettingSection>

        <SettingSection title="Date Format" icon={Calendar}>
          <OptionsList
            options={dateFormats}
            selected={selectedDateFormat}
            onSelect={setSelectedDateFormat}
          />
        </SettingSection>

        <View style={[styles.infoCard, { backgroundColor: theme.colors.primarySurface }]}>
          <Text style={[styles.infoTitle, { color: theme.colors.primary }]}>Regional Settings</Text>
          <Text style={[styles.infoText, { color: theme.colors.primary }]}>
            These settings affect how dates, times, numbers, and currency are displayed throughout the app. 
            Some changes may require restarting the app to take full effect.
          </Text>
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
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  optionsList: {
    gap: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  selectedOption: {
    backgroundColor: '#EEF2FF',
    borderColor: '#8B5CF6',
  },
  optionText: {
    fontSize: 16,
    color: '#374151',
  },
  selectedOptionText: {
    color: '#8B5CF6',
    fontWeight: '500',
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
