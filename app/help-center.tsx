import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { 
  ArrowLeft, 
  HelpCircle, 
  MessageCircle, 
  Mail, 
  Phone,
  Search,
  ChevronRight,
  ExternalLink,
  Book,
  Video,
  FileText
} from 'lucide-react-native';
import { useTheme } from '@/lib/theme';

export default function HelpCenterScreen() {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const faqItems = [
    {
      question: "How do I create a wallet?",
      answer: "To create a wallet, go to the Wallet tab and tap 'Connect Test Wallet'. Your wallet will be created instantly using the Algorand blockchain with a unique 58-character address."
    },
    {
      question: "How do I send payments?",
      answer: "Use the QR Scanner tab to scan any payment QR code (UPI, PIX, PayNow, Alipay, etc.). Enter the amount and confirm. Your payment will be processed through the Algorand blockchain."
    },
    {
      question: "What are Zyro rewards?",
      answer: "Zyro tokens are earned for every payment you make. The reward amount depends on your subscription tier: Free (1x), Basic (1.5x), Pro (2x), Enterprise (3x)."
    },
    {
      question: "How do voice commands work?",
      answer: "Tap the microphone button on any screen and say commands like 'check balance', 'send 5 algos', or 'scan QR code'. The AI will process your request and execute the action."
    },
    {
      question: "Is my data secure?",
      answer: "Yes! Your wallet keys are stored securely on your device using encrypted storage. All transactions are recorded on the Algorand blockchain for transparency and security."
    },
    {
      question: "How do I upgrade my subscription?",
      answer: "Go to Profile → Subscription to see available plans. Choose Basic ($4.99), Pro ($14.99), or Enterprise ($49.99) for enhanced rewards and features."
    },
    {
      question: "What blockchains do you support?",
      answer: "Currently we support Algorand testnet for development and will launch on Algorand mainnet. Future updates will add Ethereum, Polygon, and other networks."
    },
    {
      question: "How do I get testnet funds?",
      answer: "Visit the Algorand testnet dispenser at https://dispenser.testnet.aws.algodev.network/ and enter your wallet address to receive free testnet ALGO for development."
    }
  ];

  const quickActions = [
    {
      title: "Contact Support",
      description: "Get help from our support team",
      icon: MessageCircle,
      action: () => handleContactSupport()
    },
    {
      title: "Email Support",
      description: "Send us an email",
      icon: Mail,
      action: () => Linking.openURL('mailto:support@zyra.app')
    },
    {
      title: "User Guide",
      description: "Complete app documentation",
      icon: Book,
      action: () => Alert.alert('User Guide', 'Comprehensive documentation coming soon!')
    },
    {
      title: "Video Tutorials",
      description: "Watch how-to videos",
      icon: Video,
      action: () => Alert.alert('Video Tutorials', 'Tutorial videos coming soon!')
    }
  ];

  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'How would you like to contact our support team?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Email', onPress: () => Linking.openURL('mailto:support@zyra.app') },
        { text: 'Chat', onPress: () => Alert.alert('Live Chat', 'Live chat support coming soon!') }
      ]
    );
  };

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  const filteredFAQs = faqItems.filter(item =>
    item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: theme.colors.surface }]}>
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Help Center</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Search */}
        <View style={[styles.searchContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Search size={20} color={theme.colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholder="Search for help..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={theme.colors.textSecondary}
          />
        </View>

        {/* Quick Actions */}
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.quickActionCard, { backgroundColor: theme.colors.surface }]}
                onPress={action.action}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: theme.colors.primarySurface }]}>
                  <action.icon size={24} color={theme.colors.primary} />
                </View>
                <Text style={[styles.quickActionTitle, { color: theme.colors.text }]}>{action.title}</Text>
                <Text style={[styles.quickActionDescription, { color: theme.colors.textSecondary }]}>{action.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* FAQ */}
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Frequently Asked Questions</Text>
          {filteredFAQs.map((faq, index) => (
            <TouchableOpacity
              key={index}
              style={styles.faqItem}
              onPress={() => toggleFAQ(index)}
            >
              <View style={styles.faqHeader}>
                <HelpCircle size={20} color={theme.colors.primary} />
                <Text style={[styles.faqQuestion, { color: theme.colors.text }]}>{faq.question}</Text>
                <ChevronRight 
                  size={20} 
                  color={theme.colors.textSecondary} 
                  style={[
                    styles.chevron,
                    expandedFAQ === index && styles.chevronExpanded
                  ]} 
                />
              </View>
              {expandedFAQ === index && (
                <Text style={[styles.faqAnswer, { color: theme.colors.textSecondary }]}>{faq.answer}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Contact Information */}
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Contact Information</Text>
          
          <View style={styles.contactCard}>
            <View style={styles.contactHeader}>
              <Mail size={24} color={theme.colors.primary} />
              <View style={styles.contactInfo}>
                <Text style={[styles.contactTitle, { color: theme.colors.text }]}>Email Support</Text>
                <Text style={[styles.contactDescription, { color: theme.colors.textSecondary }]}>Get help via email</Text>
              </View>
              <TouchableOpacity 
                style={[styles.contactButton, { backgroundColor: theme.colors.primarySurface }]}
                onPress={() => Linking.openURL('mailto:support@zyra.app')}
              >
                <ExternalLink size={16} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.contactDetail, { color: theme.colors.primary }]}>support@zyra.app</Text>
          </View>

          <View style={styles.contactCard}>
            <View style={styles.contactHeader}>
              <MessageCircle size={24} color={theme.colors.primary} />
              <View style={styles.contactInfo}>
                <Text style={[styles.contactTitle, { color: theme.colors.text }]}>Live Chat</Text>
                <Text style={[styles.contactDescription, { color: theme.colors.textSecondary }]}>Chat with our team</Text>
              </View>
              <TouchableOpacity 
                style={[styles.contactButton, { backgroundColor: theme.colors.primarySurface }]}
                onPress={() => Alert.alert('Live Chat', 'Live chat support coming soon!')}
              >
                <ExternalLink size={16} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.contactDetail, { color: theme.colors.primary }]}>Available 24/7</Text>
          </View>

          <View style={styles.contactCard}>
            <View style={styles.contactHeader}>
              <Phone size={24} color={theme.colors.primary} />
              <View style={styles.contactInfo}>
                <Text style={[styles.contactTitle, { color: theme.colors.text }]}>Phone Support</Text>
                <Text style={[styles.contactDescription, { color: theme.colors.textSecondary }]}>Call our support line</Text>
              </View>
              <TouchableOpacity 
                style={[styles.contactButton, { backgroundColor: theme.colors.primarySurface }]}
                onPress={() => Linking.openURL('tel:+1-800-ZYRA-HELP')}
              >
                <ExternalLink size={16} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.contactDetail, { color: theme.colors.primary }]}>+1 (800) ZYRA-HELP</Text>
          </View>
        </View>

        {/* App Information */}
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>App Information</Text>
          <View style={styles.appInfo}>
            <Text style={[styles.appInfoText, { color: theme.colors.textSecondary }]}>Version: 1.0.0</Text>
            <Text style={[styles.appInfoText, { color: theme.colors.textSecondary }]}>Build: 2024.03.001</Text>
            <Text style={[styles.appInfoText, { color: theme.colors.textSecondary }]}>Blockchain: Algorand Testnet</Text>
            <Text style={[styles.appInfoText, { color: theme.colors.textSecondary }]}>Last Updated: March 2024</Text>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginVertical: 10,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
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
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  quickActionDescription: {
    fontSize: 12,
    textAlign: 'center',
  },
  faqItem: {
    borderBottomWidth: 1,
    paddingVertical: 16,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  faqQuestion: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  chevron: {
    transform: [{ rotate: '0deg' }],
  },
  chevronExpanded: {
    transform: [{ rotate: '90deg' }],
  },
  faqAnswer: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
    marginLeft: 32,
  },
  contactCard: {
    borderBottomWidth: 1,
    paddingVertical: 16,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactInfo: {
    flex: 1,
    marginLeft: 12,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  contactDescription: {
    fontSize: 14,
  },
  contactButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactDetail: {
    fontSize: 14,
    marginLeft: 36,
  },
  appInfo: {
    gap: 8,
  },
  appInfoText: {
    fontSize: 14,
  },
});
