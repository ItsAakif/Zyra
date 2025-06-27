import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { 
  ArrowLeft, 
  Shield, 
  CheckCircle, 
  Upload, 
  Camera,
  FileText,
  User,
  MapPin,
  AlertCircle,
  Clock
} from 'lucide-react-native';
import { useTheme } from '@/lib/theme';

export default function KYCVerificationScreen() {
  const { theme } = useTheme();
  const [verificationStatus] = useState({
    identity: 'completed',
    address: 'completed',
    selfie: 'completed',
    background: 'completed'
  });

  const VerificationStep = ({ 
    icon: Icon, 
    title, 
    description, 
    status, 
    onPress 
  }: any) => {
    const getStatusColor = () => {
      switch (status) {
        case 'completed': return '#10B981';
        case 'pending': return '#F59E0B';
        case 'failed': return '#EF4444';
        default: return '#6B7280';
      }
    };

    const getStatusIcon = () => {
      switch (status) {
        case 'completed': return <CheckCircle size={20} color="#10B981" />;
        case 'pending': return <Clock size={20} color="#F59E0B" />;
        case 'failed': return <AlertCircle size={20} color="#EF4444" />;
        default: return <AlertCircle size={20} color="#6B7280" />;
      }
    };

    const getStatusText = () => {
      switch (status) {
        case 'completed': return 'Verified';
        case 'pending': return 'Under Review';
        case 'failed': return 'Action Required';
        default: return 'Not Started';
      }
    };

    return (
      <TouchableOpacity style={styles.verificationStep} onPress={onPress}>
        <View style={styles.stepHeader}>
          <View style={[styles.stepIcon, { backgroundColor: getStatusColor() + '20' }]}>
            <Icon size={24} color={getStatusColor()} />
          </View>
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: theme.colors.text }]}>{title}</Text>
            <Text style={[styles.stepDescription, { color: theme.colors.textSecondary }]}>{description}</Text>
          </View>
          <View style={styles.stepStatus}>
            {getStatusIcon()}
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusText()}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const verificationSteps = [
    {
      icon: User,
      title: 'Identity Verification',
      description: 'Government-issued ID document',
      status: verificationStatus.identity,
      onPress: () => showVerificationDetails('identity')
    },
    {
      icon: MapPin,
      title: 'Address Verification',
      description: 'Proof of residence document',
      status: verificationStatus.address,
      onPress: () => showVerificationDetails('address')
    },
    {
      icon: Camera,
      title: 'Selfie Verification',
      description: 'Take a selfie for identity confirmation',
      status: verificationStatus.selfie,
      onPress: () => showVerificationDetails('selfie')
    },
    {
      icon: Shield,
      title: 'Background Check',
      description: 'Automated security screening',
      status: verificationStatus.background,
      onPress: () => showVerificationDetails('background')
    }
  ];

  const showVerificationDetails = (type: string) => {
    const details = {
      identity: {
        title: 'Identity Verification',
        content: 'Status: ✅ Verified\n\nDocument Type: Passport\nDocument Number: ████████\nVerification Date: March 15, 2024\nExpiry Date: June 2029'
      },
      address: {
        title: 'Address Verification',
        content: 'Status: ✅ Verified\n\nDocument Type: Utility Bill\nAddress: ████████████\nVerification Date: March 15, 2024\nDocument Date: February 2024'
      },
      selfie: {
        title: 'Selfie Verification',
        content: 'Status: ✅ Verified\n\nSelfie Match: 98.5%\nVerification Date: March 15, 2024\nLiveness Check: Passed\nFace Match: Confirmed'
      },
      background: {
        title: 'Background Check',
        content: 'Status: ✅ Verified\n\nSanctions Check: Clear\nPEP Check: Clear\nAdverse Media: Clear\nVerification Date: March 15, 2024'
      }
    };

    const detail = details[type as keyof typeof details];
    Alert.alert(detail.title, detail.content);
  };

  const handleReupload = (type: string) => {
    Alert.alert(
      'Re-upload Document',
      `Would you like to upload a new ${type} document?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Camera', 
          onPress: () => Alert.alert('Camera', 'Camera functionality coming soon!')
        },
        { 
          text: 'Gallery', 
          onPress: () => Alert.alert('Gallery', 'Gallery functionality coming soon!')
        }
      ]
    );
  };

  const getOverallStatus = () => {
    const statuses = Object.values(verificationStatus);
    if (statuses.every(status => status === 'completed')) {
      return { text: 'Fully Verified', color: '#10B981', icon: CheckCircle };
    } else if (statuses.some(status => status === 'pending')) {
      return { text: 'Under Review', color: '#F59E0B', icon: Clock };
    } else if (statuses.some(status => status === 'failed')) {
      return { text: 'Action Required', color: '#EF4444', icon: AlertCircle };
    } else {
      return { text: 'Not Started', color: '#6B7280', icon: AlertCircle };
    }
  };

  const overallStatus = getOverallStatus();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: theme.colors.surface }]}>
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>KYC Verification</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Overall Status */}
        <View style={[styles.statusCard, { backgroundColor: overallStatus.color + '10' }]}>
          <View style={styles.statusHeader}>
            <overallStatus.icon size={32} color={overallStatus.color} />
            <View style={styles.statusInfo}>
              <Text style={[styles.statusTitle, { color: theme.colors.text }]}>Verification Status</Text>
              <Text style={[styles.statusText, { color: overallStatus.color }]}>
                {overallStatus.text}
              </Text>
            </View>
          </View>
          <Text style={[styles.statusDescription, { color: theme.colors.textSecondary }]}>
            Your account has been fully verified and meets all compliance requirements.
          </Text>
        </View>

        {/* Benefits */}
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Verification Benefits</Text>
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <CheckCircle size={16} color="#10B981" />
              <Text style={[styles.benefitText, { color: theme.colors.textSecondary }]}>Higher transaction limits</Text>
            </View>
            <View style={styles.benefitItem}>
              <CheckCircle size={16} color="#10B981" />
              <Text style={[styles.benefitText, { color: theme.colors.textSecondary }]}>Access to premium features</Text>
            </View>
            <View style={styles.benefitItem}>
              <CheckCircle size={16} color="#10B981" />
              <Text style={[styles.benefitText, { color: theme.colors.textSecondary }]}>Enhanced security protection</Text>
            </View>
            <View style={styles.benefitItem}>
              <CheckCircle size={16} color="#10B981" />
              <Text style={[styles.benefitText, { color: theme.colors.textSecondary }]}>Priority customer support</Text>
            </View>
          </View>
        </View>

        {/* Verification Steps */}
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Verification Steps</Text>
          {verificationSteps.map((step, index) => (
            <VerificationStep
              key={index}
              icon={step.icon}
              title={step.title}
              description={step.description}
              status={step.status}
              onPress={step.onPress}
            />
          ))}
        </View>

        {/* Document Management */}
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Document Management</Text>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.colors.surface }]}
            onPress={() => handleReupload('identity')}
          >
            <Upload size={20} color={theme.colors.primary} />
            <Text style={[styles.actionButtonText, { color: theme.colors.primary }]}>Re-upload Identity Document</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.colors.surface }]}
            onPress={() => handleReupload('address')}
          >
            <Upload size={20} color={theme.colors.primary} />
            <Text style={[styles.actionButtonText, { color: theme.colors.primary }]}>Re-upload Address Proof</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.colors.surface }]}
            onPress={() => Alert.alert('Download', 'Document download functionality coming soon!')}
          >
            <FileText size={20} color={theme.colors.primary} />
            <Text style={[styles.actionButtonText, { color: theme.colors.primary }]}>Download Verification Report</Text>
          </TouchableOpacity>
        </View>

        {/* Compliance Information */}
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Compliance Information</Text>
          <View style={styles.complianceInfo}>
            <Text style={[styles.complianceText, { color: theme.colors.textSecondary }]}>
              Your personal information is processed in accordance with applicable 
              data protection laws and our Privacy Policy. All documents are 
              encrypted and stored securely.
            </Text>
            <Text style={[styles.complianceText, { color: theme.colors.textSecondary }]}>
              Verification is required to comply with Anti-Money Laundering (AML) 
              and Know Your Customer (KYC) regulations.
            </Text>
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
  statusCard: {
    borderRadius: 12,
    padding: 20,
    marginVertical: 10,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusInfo: {
    marginLeft: 12,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusDescription: {
    fontSize: 14,
    lineHeight: 20,
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
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitText: {
    fontSize: 14,
    marginLeft: 8,
  },
  verificationStep: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 16,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
  },
  stepStatus: {
    alignItems: 'center',
    gap: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  complianceInfo: {
    gap: 12,
  },
  complianceText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
