import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { Camera, Upload, CheckCircle, AlertCircle, User, FileText } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { productionKYCService } from '@/lib/kyc-production';

interface KYCFlowProps {
  userId: string;
  onComplete: (result: any) => void;
}

export default function KYCFlow({ userId, onComplete }: KYCFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [kycData, setKycData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);

  const steps = [
    { id: 'personal', title: 'Personal Information', icon: User },
    { id: 'documents', title: 'Document Upload', icon: FileText },
    { id: 'biometric', title: 'Biometric Verification', icon: Camera },
    { id: 'review', title: 'Review & Submit', icon: CheckCircle },
  ];

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await submitKYC();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const submitKYC = async () => {
    setIsLoading(true);
    try {
      const result = await productionKYCService.startKYCVerification(userId);
      onComplete(result);
    } catch (error) {
      Alert.alert('Error', 'KYC submission failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderPersonalInfoStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Personal Information</Text>
      <Text style={styles.stepDescription}>
        Please provide your personal details for identity verification.
      </Text>
      
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Required Information:</Text>
        <Text style={styles.infoItem}>• Full legal name</Text>
        <Text style={styles.infoItem}>• Date of birth</Text>
        <Text style={styles.infoItem}>• Address</Text>
        <Text style={styles.infoItem}>• Phone number</Text>
      </View>
    </View>
  );

  const renderDocumentStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Document Upload</Text>
      <Text style={styles.stepDescription}>
        Upload a clear photo of your government-issued ID.
      </Text>

      <View style={styles.documentOptions}>
        <TouchableOpacity style={styles.documentOption}>
          <Upload size={24} color="#8B5CF6" />
          <Text style={styles.documentOptionText}>Passport</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.documentOption}>
          <Upload size={24} color="#8B5CF6" />
          <Text style={styles.documentOptionText}>Driver's License</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.documentOption}>
          <Upload size={24} color="#8B5CF6" />
          <Text style={styles.documentOptionText}>National ID</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tipsCard}>
        <Text style={styles.tipsTitle}>Photo Tips:</Text>
        <Text style={styles.tipItem}>• Ensure good lighting</Text>
        <Text style={styles.tipItem}>• Keep document flat</Text>
        <Text style={styles.tipItem}>• Avoid glare and shadows</Text>
        <Text style={styles.tipItem}>• Include all corners</Text>
      </View>
    </View>
  );

  const renderBiometricStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Biometric Verification</Text>
      <Text style={styles.stepDescription}>
        Take a selfie to verify your identity matches your documents.
      </Text>

      <TouchableOpacity style={styles.biometricButton}>
        <Camera size={32} color="#8B5CF6" />
        <Text style={styles.biometricButtonText}>Take Selfie</Text>
      </TouchableOpacity>

      <View style={styles.securityNote}>
        <AlertCircle size={16} color="#F59E0B" />
        <Text style={styles.securityText}>
          Your biometric data is encrypted and stored securely
        </Text>
      </View>
    </View>
  );

  const renderReviewStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Review & Submit</Text>
      <Text style={styles.stepDescription}>
        Please review your information before submitting.
      </Text>

      <View style={styles.reviewCard}>
        <View style={styles.reviewItem}>
          <CheckCircle size={20} color="#10B981" />
          <Text style={styles.reviewText}>Personal information provided</Text>
        </View>
        
        <View style={styles.reviewItem}>
          <CheckCircle size={20} color="#10B981" />
          <Text style={styles.reviewText}>Identity document uploaded</Text>
        </View>
        
        <View style={styles.reviewItem}>
          <CheckCircle size={20} color="#10B981" />
          <Text style={styles.reviewText}>Biometric verification completed</Text>
        </View>
      </View>

      <View style={styles.processingNote}>
        <Text style={styles.processingText}>
          Verification typically takes 1-2 business days. You'll receive an email once complete.
        </Text>
      </View>
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderPersonalInfoStep();
      case 1:
        return renderDocumentStep();
      case 2:
        return renderBiometricStep();
      case 3:
        return renderReviewStep();
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          
          return (
            <View key={step.id} style={styles.progressStep}>
              <View style={[
                styles.progressIcon,
                isActive && styles.progressIconActive,
                isCompleted && styles.progressIconCompleted,
              ]}>
                <StepIcon 
                  size={16} 
                  color={isActive || isCompleted ? 'white' : '#6B7280'} 
                />
              </View>
              <Text style={[
                styles.progressLabel,
                isActive && styles.progressLabelActive,
              ]}>
                {step.title}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Step Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderStepContent()}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.navigation}>
        {currentStep > 0 && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[styles.nextButton, isLoading && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={isLoading}
        >
          <LinearGradient
            colors={['#8B5CF6', '#EC4899']}
            style={styles.nextButtonGradient}
          >
            <Text style={styles.nextButtonText}>
              {isLoading ? 'Submitting...' : currentStep === steps.length - 1 ? 'Submit' : 'Next'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  progressStep: {
    alignItems: 'center',
    flex: 1,
  },
  progressIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressIconActive: {
    backgroundColor: '#8B5CF6',
  },
  progressIconCompleted: {
    backgroundColor: '#10B981',
  },
  progressLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  progressLabelActive: {
    color: '#8B5CF6',
    fontFamily: 'Inter-SemiBold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepContent: {
    paddingVertical: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'SpaceGrotesk-Bold',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
    lineHeight: 24,
    marginBottom: 24,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
  },
  infoItem: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
  },
  documentOptions: {
    marginBottom: 24,
  },
  documentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  documentOptionText: {
    fontSize: 16,
    color: '#111827',
    fontFamily: 'Inter-Medium',
    marginLeft: 12,
  },
  tipsCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0369A1',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  tipItem: {
    fontSize: 12,
    color: '#0369A1',
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  biometricButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  biometricButtonText: {
    fontSize: 16,
    color: '#8B5CF6',
    fontFamily: 'Inter-SemiBold',
    marginTop: 12,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  securityText: {
    fontSize: 12,
    color: '#92400E',
    fontFamily: 'Inter-Regular',
    flex: 1,
  },
  reviewCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  reviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  reviewText: {
    fontSize: 14,
    color: '#111827',
    fontFamily: 'Inter-Medium',
  },
  processingNote: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 16,
  },
  processingText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  navigation: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  backButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: 'Inter-SemiBold',
  },
  nextButton: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  nextButtonDisabled: {
    opacity: 0.6,
  },
  nextButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Inter-SemiBold',
  },
});