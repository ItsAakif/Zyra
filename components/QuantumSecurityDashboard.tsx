import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Shield, Key, Lock, AlertTriangle, Clock, CheckCircle, RefreshCw } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { quantumCryptographyService } from '@/lib/quantum-cryptography';

interface QuantumThreatAssessment {
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  estimatedTimeToQuantumSupremacy: number;
  recommendedActions: string[];
  currentProtectionLevel: number;
}

interface QuantumKey {
  algorithm: string;
  keySize: { public: number; private: number };
  createdAt: Date;
  expiresAt: Date;
  status: 'ACTIVE' | 'EXPIRING' | 'EXPIRED';
}

export default function QuantumSecurityDashboard() {
  const [threatAssessment, setThreatAssessment] = useState<QuantumThreatAssessment | null>(null);
  const [keys, setKeys] = useState<QuantumKey[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuantumSecurityData();
  }, []);

  const loadQuantumSecurityData = async () => {
    try {
      // In a real implementation, this would call the quantum security service
      const assessment = await quantumCryptographyService.assessQuantumThreat();
      
      // Mock quantum keys
      const mockKeys: QuantumKey[] = [
        {
          algorithm: 'CRYSTALS-Kyber',
          keySize: { public: 1568, private: 3168 },
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          expiresAt: new Date(Date.now() + 335 * 24 * 60 * 60 * 1000),
          status: 'ACTIVE'
        },
        {
          algorithm: 'CRYSTALS-Dilithium',
          keySize: { public: 1952, private: 4864 },
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          expiresAt: new Date(Date.now() + 305 * 24 * 60 * 60 * 1000),
          status: 'ACTIVE'
        },
        {
          algorithm: 'FALCON',
          keySize: { public: 1793, private: 2305 },
          createdAt: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000),
          expiresAt: new Date(Date.now() + 65 * 24 * 60 * 60 * 1000),
          status: 'EXPIRING'
        }
      ];
      
      setThreatAssessment(assessment);
      setKeys(mockKeys);
    } catch (error) {
      console.error('Error loading quantum security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return '#DC2626';
      case 'HIGH': return '#EA580C';
      case 'MEDIUM': return '#D97706';
      case 'LOW': return '#059669';
      default: return '#6B7280';
    }
  };

  const getProtectionLevelColor = (level: number) => {
    if (level >= 80) return '#059669';
    if (level >= 60) return '#10B981';
    if (level >= 40) return '#D97706';
    if (level >= 20) return '#EA580C';
    return '#DC2626';
  };

  const getKeyStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return '#10B981';
      case 'EXPIRING': return '#F59E0B';
      case 'EXPIRED': return '#DC2626';
      default: return '#6B7280';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const generateNewKey = async () => {
    try {
      setLoading(true);
      // In a real implementation, this would call the API to generate a new key
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Add mock new key
      const newKey: QuantumKey = {
        algorithm: 'CRYSTALS-Kyber',
        keySize: { public: 1568, private: 3168 },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        status: 'ACTIVE'
      };
      
      setKeys([newKey, ...keys]);
    } catch (error) {
      console.error('Error generating new key:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Shield size={48} color="#8B5CF6" />
        <Text style={styles.loadingText}>Analyzing quantum security...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Shield size={24} color="#8B5CF6" />
          <Text style={styles.headerTitle}>Quantum Security</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={loadQuantumSecurityData}
        >
          <RefreshCw size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Threat Assessment */}
      {threatAssessment && (
        <LinearGradient
          colors={['#1F2937', '#374151']}
          style={styles.threatCard}
        >
          <View style={styles.threatHeader}>
            <Text style={styles.threatTitle}>Quantum Threat Assessment</Text>
            <View style={[
              styles.threatLevelBadge, 
              { backgroundColor: getThreatLevelColor(threatAssessment.threatLevel) + '30' }
            ]}>
              <Text style={[
                styles.threatLevelText, 
                { color: getThreatLevelColor(threatAssessment.threatLevel) }
              ]}>
                {threatAssessment.threatLevel}
              </Text>
            </View>
          </View>
          
          <View style={styles.threatDetails}>
            <View style={styles.threatDetail}>
              <Clock size={20} color="rgba(255, 255, 255, 0.8)" />
              <View style={styles.threatDetailContent}>
                <Text style={styles.threatDetailLabel}>Time to Quantum Supremacy</Text>
                <Text style={styles.threatDetailValue}>
                  ~{threatAssessment.estimatedTimeToQuantumSupremacy} years
                </Text>
              </View>
            </View>
            
            <View style={styles.threatDetail}>
              <Shield size={20} color="rgba(255, 255, 255, 0.8)" />
              <View style={styles.threatDetailContent}>
                <Text style={styles.threatDetailLabel}>Current Protection Level</Text>
                <View style={styles.protectionLevelContainer}>
                  <View 
                    style={[
                      styles.protectionLevelBar,
                      { width: `${threatAssessment.currentProtectionLevel}%` },
                      { backgroundColor: getProtectionLevelColor(threatAssessment.currentProtectionLevel) }
                    ]}
                  />
                  <Text style={styles.protectionLevelText}>
                    {threatAssessment.currentProtectionLevel}%
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>
      )}

      {/* Recommended Actions */}
      {threatAssessment && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommended Actions</Text>
          
          {threatAssessment.recommendedActions.map((action, index) => (
            <View key={index} style={styles.actionItem}>
              <CheckCircle size={20} color="#8B5CF6" />
              <Text style={styles.actionText}>{action}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Quantum Keys */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quantum-Resistant Keys</Text>
          <TouchableOpacity 
            style={styles.generateButton}
            onPress={generateNewKey}
          >
            <Key size={16} color="white" />
            <Text style={styles.generateButtonText}>Generate</Text>
          </TouchableOpacity>
        </View>
        
        {keys.map((key, index) => (
          <View key={index} style={styles.keyCard}>
            <View style={styles.keyHeader}>
              <Text style={styles.keyAlgorithm}>{key.algorithm}</Text>
              <View style={[
                styles.keyStatusBadge,
                { backgroundColor: getKeyStatusColor(key.status) + '20' }
              ]}>
                <Text style={[
                  styles.keyStatusText,
                  { color: getKeyStatusColor(key.status) }
                ]}>
                  {key.status}
                </Text>
              </View>
            </View>
            
            <View style={styles.keyDetails}>
              <View style={styles.keyDetail}>
                <Text style={styles.keyDetailLabel}>Created</Text>
                <Text style={styles.keyDetailValue}>{formatDate(key.createdAt)}</Text>
              </View>
              
              <View style={styles.keyDetail}>
                <Text style={styles.keyDetailLabel}>Expires</Text>
                <Text style={styles.keyDetailValue}>{formatDate(key.expiresAt)}</Text>
              </View>
              
              <View style={styles.keyDetail}>
                <Text style={styles.keyDetailLabel}>Key Size</Text>
                <Text style={styles.keyDetailValue}>
                  {key.keySize.public}/{key.keySize.private} bits
                </Text>
              </View>
            </View>
            
            <View style={styles.keyActions}>
              <TouchableOpacity style={styles.keyAction}>
                <Lock size={16} color="#6B7280" />
                <Text style={styles.keyActionText}>Encrypt</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.keyAction}>
                <Shield size={16} color="#6B7280" />
                <Text style={styles.keyActionText}>Sign</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.keyAction}>
                <AlertTriangle size={16} color="#6B7280" />
                <Text style={styles.keyActionText}>Revoke</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* Quantum Security Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security Status</Text>
        
        <View style={styles.statusCard}>
          <View style={styles.statusItem}>
            <View style={[styles.statusIndicator, { backgroundColor: '#10B981' }]} />
            <View style={styles.statusContent}>
              <Text style={styles.statusTitle}>Hybrid Encryption</Text>
              <Text style={styles.statusDescription}>
                Classical + quantum-resistant encryption active
              </Text>
            </View>
          </View>
          
          <View style={styles.statusItem}>
            <View style={[styles.statusIndicator, { backgroundColor: '#10B981' }]} />
            <View style={styles.statusContent}>
              <Text style={styles.statusTitle}>Key Management</Text>
              <Text style={styles.statusDescription}>
                Quantum-safe key management system active
              </Text>
            </View>
          </View>
          
          <View style={styles.statusItem}>
            <View style={[styles.statusIndicator, { backgroundColor: '#F59E0B' }]} />
            <View style={styles.statusContent}>
              <Text style={styles.statusTitle}>Legacy Systems</Text>
              <Text style={styles.statusDescription}>
                Some systems still using classical cryptography
              </Text>
            </View>
          </View>
          
          <View style={styles.statusItem}>
            <View style={[styles.statusIndicator, { backgroundColor: '#10B981' }]} />
            <View style={styles.statusContent}>
              <Text style={styles.statusTitle}>Monitoring</Text>
              <Text style={styles.statusDescription}>
                Quantum computing threat monitoring active
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'Inter-Medium',
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  threatCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  threatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  threatTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Inter-SemiBold',
  },
  threatLevelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  threatLevelText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  threatDetails: {
    gap: 16,
  },
  threatDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  threatDetailContent: {
    flex: 1,
  },
  threatDetailLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  threatDetailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Inter-SemiBold',
  },
  protectionLevelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  protectionLevelBar: {
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
  },
  protectionLevelText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
    zIndex: 1,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  generateButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
    fontFamily: 'Inter-Medium',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    gap: 12,
  },
  actionText: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  keyCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  keyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  keyAlgorithm: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
  },
  keyStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  keyStatusText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  keyDetails: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  keyDetail: {
    flex: 1,
  },
  keyDetailLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  keyDetailValue: {
    fontSize: 14,
    color: '#111827',
    fontFamily: 'Inter-Medium',
  },
  keyActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  keyAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  keyActionText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter-Medium',
  },
  statusCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  statusDescription: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
  },
});