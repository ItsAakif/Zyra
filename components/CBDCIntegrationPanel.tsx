import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Coins, Globe, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, Calendar, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { emergingTechnologyService } from '@/lib/emerging-tech';

interface CBDCDetails {
  country: string;
  cbdcName: string;
  status: 'RESEARCH' | 'PILOT' | 'LAUNCHED';
  accessModel: string;
  features: {
    programmability: boolean;
    offlineCapability: boolean;
    crossBorderSupport: boolean;
    privacyFeatures: string[];
  };
  integrationRequirements: string[];
  useCases: string[];
  limitations: string[];
  timeline: {
    pilotDate?: Date;
    launchDate?: Date;
    fullAdoptionEstimate?: Date;
  };
}

interface ReadinessAssessment {
  readinessScore: number;
  integrationComplexity: 'LOW' | 'MEDIUM' | 'HIGH';
  timeToMarket: number;
  requiredCapabilities: string[];
  regulatoryConsiderations: string[];
  competitiveAdvantage: string[];
}

export default function CBDCIntegrationPanel() {
  const [selectedCountry, setSelectedCountry] = useState<string>('CN');
  const [cbdcDetails, setCbdcDetails] = useState<CBDCDetails | null>(null);
  const [readinessAssessment, setReadinessAssessment] = useState<ReadinessAssessment | null>(null);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    features: true,
    requirements: false,
    useCases: false,
    timeline: false,
    readiness: false
  });
  const [loading, setLoading] = useState(true);

  const countries = [
    { code: 'CN', name: 'China - Digital Yuan' },
    { code: 'EU', name: 'EU - Digital Euro' },
    { code: 'US', name: 'US - Digital Dollar' },
    { code: 'NG', name: 'Nigeria - eNaira' }
  ];

  useEffect(() => {
    loadCBDCData(selectedCountry);
  }, [selectedCountry]);

  const loadCBDCData = async (countryCode: string) => {
    try {
      setLoading(true);
      
      // Load CBDC details
      const details = await emergingTechnologyService.getCBDCIntegration(countryCode);
      setCbdcDetails(details);
      
      // Load readiness assessment
      const assessment = await emergingTechnologyService.assessCBDCReadiness(countryCode);
      setReadinessAssessment(assessment);
    } catch (error) {
      console.error('Error loading CBDC data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section]
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'LAUNCHED': return '#10B981';
      case 'PILOT': return '#F59E0B';
      case 'RESEARCH': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'LOW': return '#10B981';
      case 'MEDIUM': return '#F59E0B';
      case 'HIGH': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const formatDate = (date?: Date) => {
    if (!date) return 'N/A';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    });
  };

  if (loading || !cbdcDetails) {
    return (
      <View style={styles.loadingContainer}>
        <Coins size={48} color="#8B5CF6" />
        <Text style={styles.loadingText}>Loading CBDC data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Coins size={24} color="#8B5CF6" />
          <Text style={styles.headerTitle}>CBDC Integration</Text>
        </View>
      </View>

      {/* Country Selector */}
      <View style={styles.countrySelector}>
        {countries.map((country) => (
          <TouchableOpacity
            key={country.code}
            style={[
              styles.countryButton,
              selectedCountry === country.code && styles.countryButtonActive
            ]}
            onPress={() => setSelectedCountry(country.code)}
          >
            <Text
              style={[
                styles.countryButtonText,
                selectedCountry === country.code && styles.countryButtonTextActive
              ]}
            >
              {country.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* CBDC Overview */}
      <LinearGradient
        colors={['#1F2937', '#374151']}
        style={styles.overviewCard}
      >
        <View style={styles.overviewHeader}>
          <Text style={styles.overviewTitle}>{cbdcDetails.cbdcName}</Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(cbdcDetails.status) + '30' }
          ]}>
            <Text style={[
              styles.statusText,
              { color: getStatusColor(cbdcDetails.status) }
            ]}>
              {cbdcDetails.status}
            </Text>
          </View>
        </View>
        
        <View style={styles.overviewDetails}>
          <View style={styles.overviewDetail}>
            <Text style={styles.overviewLabel}>Access Model</Text>
            <Text style={styles.overviewValue}>{cbdcDetails.accessModel}</Text>
          </View>
          
          <View style={styles.overviewDetail}>
            <Text style={styles.overviewLabel}>Launch Date</Text>
            <Text style={styles.overviewValue}>{formatDate(cbdcDetails.timeline.launchDate)}</Text>
          </View>
          
          {readinessAssessment && (
            <View style={styles.overviewDetail}>
              <Text style={styles.overviewLabel}>Readiness Score</Text>
              <Text style={styles.overviewValue}>{(readinessAssessment.readinessScore * 100).toFixed(0)}%</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      {/* Features Section */}
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.sectionHeader}
          onPress={() => toggleSection('features')}
        >
          <Text style={styles.sectionTitle}>Features & Capabilities</Text>
          {expandedSections.features ? (
            <ChevronUp size={20} color="#6B7280" />
          ) : (
            <ChevronDown size={20} color="#6B7280" />
          )}
        </TouchableOpacity>
        
        {expandedSections.features && (
          <View style={styles.sectionContent}>
            <View style={styles.featureGrid}>
              <View style={styles.featureItem}>
                <View style={[
                  styles.featureIcon,
                  { backgroundColor: cbdcDetails.features.programmability ? '#DCFCE7' : '#F3F4F6' }
                ]}>
                  {cbdcDetails.features.programmability ? (
                    <CheckCircle size={16} color="#10B981" />
                  ) : (
                    <AlertTriangle size={16} color="#6B7280" />
                  )}
                </View>
                <Text style={styles.featureText}>Programmability</Text>
              </View>
              
              <View style={styles.featureItem}>
                <View style={[
                  styles.featureIcon,
                  { backgroundColor: cbdcDetails.features.offlineCapability ? '#DCFCE7' : '#F3F4F6' }
                ]}>
                  {cbdcDetails.features.offlineCapability ? (
                    <CheckCircle size={16} color="#10B981" />
                  ) : (
                    <AlertTriangle size={16} color="#6B7280" />
                  )}
                </View>
                <Text style={styles.featureText}>Offline Capability</Text>
              </View>
              
              <View style={styles.featureItem}>
                <View style={[
                  styles.featureIcon,
                  { backgroundColor: cbdcDetails.features.crossBorderSupport ? '#DCFCE7' : '#F3F4F6' }
                ]}>
                  {cbdcDetails.features.crossBorderSupport ? (
                    <CheckCircle size={16} color="#10B981" />
                  ) : (
                    <AlertTriangle size={16} color="#6B7280" />
                  )}
                </View>
                <Text style={styles.featureText}>Cross-Border</Text>
              </View>
            </View>
            
            <Text style={styles.subSectionTitle}>Privacy Features</Text>
            {cbdcDetails.features.privacyFeatures.map((feature, index) => (
              <View key={index} style={styles.listItem}>
                <CheckCircle size={16} color="#8B5CF6" />
                <Text style={styles.listItemText}>{feature}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Integration Requirements */}
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.sectionHeader}
          onPress={() => toggleSection('requirements')}
        >
          <Text style={styles.sectionTitle}>Integration Requirements</Text>
          {expandedSections.requirements ? (
            <ChevronUp size={20} color="#6B7280" />
          ) : (
            <ChevronDown size={20} color="#6B7280" />
          )}
        </TouchableOpacity>
        
        {expandedSections.requirements && (
          <View style={styles.sectionContent}>
            {cbdcDetails.integrationRequirements.map((requirement, index) => (
              <View key={index} style={styles.listItem}>
                <ArrowRight size={16} color="#8B5CF6" />
                <Text style={styles.listItemText}>{requirement}</Text>
              </View>
            ))}
            
            {readinessAssessment && (
              <>
                <Text style={styles.subSectionTitle}>Required Capabilities</Text>
                {readinessAssessment.requiredCapabilities.map((capability, index) => (
                  <View key={index} style={styles.listItem}>
                    <CheckCircle size={16} color="#10B981" />
                    <Text style={styles.listItemText}>{capability}</Text>
                  </View>
                ))}
              </>
            )}
          </View>
        )}
      </View>

      {/* Use Cases */}
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.sectionHeader}
          onPress={() => toggleSection('useCases')}
        >
          <Text style={styles.sectionTitle}>Use Cases</Text>
          {expandedSections.useCases ? (
            <ChevronUp size={20} color="#6B7280" />
          ) : (
            <ChevronDown size={20} color="#6B7280" />
          )}
        </TouchableOpacity>
        
        {expandedSections.useCases && (
          <View style={styles.sectionContent}>
            <View style={styles.useCaseGrid}>
              {cbdcDetails.useCases.map((useCase, index) => (
                <View key={index} style={styles.useCaseItem}>
                  <Text style={styles.useCaseText}>{useCase}</Text>
                </View>
              ))}
            </View>
            
            <Text style={styles.subSectionTitle}>Limitations</Text>
            {cbdcDetails.limitations.map((limitation, index) => (
              <View key={index} style={styles.listItem}>
                <AlertTriangle size={16} color="#F59E0B" />
                <Text style={styles.listItemText}>{limitation}</Text>
              </View>
            ))}
            
            {readinessAssessment && (
              <>
                <Text style={styles.subSectionTitle}>Competitive Advantages</Text>
                {readinessAssessment.competitiveAdvantage.map((advantage, index) => (
                  <View key={index} style={styles.listItem}>
                    <CheckCircle size={16} color="#10B981" />
                    <Text style={styles.listItemText}>{advantage}</Text>
                  </View>
                ))}
              </>
            )}
          </View>
        )}
      </View>

      {/* Timeline */}
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.sectionHeader}
          onPress={() => toggleSection('timeline')}
        >
          <Text style={styles.sectionTitle}>Timeline</Text>
          {expandedSections.timeline ? (
            <ChevronUp size={20} color="#6B7280" />
          ) : (
            <ChevronDown size={20} color="#6B7280" />
          )}
        </TouchableOpacity>
        
        {expandedSections.timeline && (
          <View style={styles.sectionContent}>
            <View style={styles.timeline}>
              <View style={styles.timelineItem}>
                <View style={styles.timelineIconContainer}>
                  <Calendar size={20} color="#8B5CF6" />
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>Pilot Date</Text>
                  <Text style={styles.timelineDate}>{formatDate(cbdcDetails.timeline.pilotDate)}</Text>
                </View>
              </View>
              
              <View style={styles.timelineConnector} />
              
              <View style={styles.timelineItem}>
                <View style={styles.timelineIconContainer}>
                  <Calendar size={20} color="#8B5CF6" />
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>Launch Date</Text>
                  <Text style={styles.timelineDate}>{formatDate(cbdcDetails.timeline.launchDate)}</Text>
                </View>
              </View>
              
              <View style={styles.timelineConnector} />
              
              <View style={styles.timelineItem}>
                <View style={styles.timelineIconContainer}>
                  <Calendar size={20} color="#8B5CF6" />
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>Full Adoption</Text>
                  <Text style={styles.timelineDate}>{formatDate(cbdcDetails.timeline.fullAdoptionEstimate)}</Text>
                </View>
              </View>
            </View>
            
            {readinessAssessment && (
              <View style={styles.timeToMarketCard}>
                <Text style={styles.timeToMarketLabel}>Estimated Time to Market</Text>
                <Text style={styles.timeToMarketValue}>{readinessAssessment.timeToMarket} months</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Readiness Assessment */}
      {readinessAssessment && (
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.sectionHeader}
            onPress={() => toggleSection('readiness')}
          >
            <Text style={styles.sectionTitle}>Readiness Assessment</Text>
            {expandedSections.readiness ? (
              <ChevronUp size={20} color="#6B7280" />
            ) : (
              <ChevronDown size={20} color="#6B7280" />
            )}
          </TouchableOpacity>
          
          {expandedSections.readiness && (
            <View style={styles.sectionContent}>
              <View style={styles.readinessCard}>
                <View style={styles.readinessHeader}>
                  <Text style={styles.readinessTitle}>Integration Complexity</Text>
                  <View style={[
                    styles.complexityBadge,
                    { backgroundColor: getComplexityColor(readinessAssessment.integrationComplexity) + '20' }
                  ]}>
                    <Text style={[
                      styles.complexityText,
                      { color: getComplexityColor(readinessAssessment.integrationComplexity) }
                    ]}>
                      {readinessAssessment.integrationComplexity}
                    </Text>
                  </View>
                </View>
                
                <Text style={styles.readinessDescription}>
                  Based on the current state of {cbdcDetails.cbdcName}, integration complexity is rated as {readinessAssessment.integrationComplexity.toLowerCase()}.
                </Text>
              </View>
              
              <Text style={styles.subSectionTitle}>Regulatory Considerations</Text>
              {readinessAssessment.regulatoryConsiderations.map((consideration, index) => (
                <View key={index} style={styles.listItem}>
                  <Globe size={16} color="#3B82F6" />
                  <Text style={styles.listItemText}>{consideration}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
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
  countrySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 20,
  },
  countryButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginBottom: 8,
  },
  countryButtonActive: {
    backgroundColor: '#8B5CF6',
  },
  countryButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter-Medium',
  },
  countryButtonTextActive: {
    color: 'white',
  },
  overviewCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Inter-SemiBold',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  overviewDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  overviewDetail: {
    width: '50%',
    marginBottom: 12,
  },
  overviewLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  overviewValue: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Inter-SemiBold',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
  },
  sectionContent: {
    paddingBottom: 16,
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    fontFamily: 'Inter-SemiBold',
    marginTop: 16,
    marginBottom: 8,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    gap: 8,
    flex: 1,
    minWidth: '45%',
  },
  featureIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 14,
    color: '#111827',
    fontFamily: 'Inter-Medium',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  listItemText: {
    fontSize: 14,
    color: '#111827',
    fontFamily: 'Inter-Regular',
    flex: 1,
  },
  useCaseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  useCaseItem: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 4,
  },
  useCaseText: {
    fontSize: 14,
    color: '#4B5563',
    fontFamily: 'Inter-Medium',
  },
  timeline: {
    marginVertical: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  timelineContent: {
    flex: 1,
    paddingVertical: 8,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  timelineDate: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
  },
  timelineConnector: {
    width: 2,
    height: 24,
    backgroundColor: '#E5E7EB',
    marginLeft: 18,
  },
  timeToMarketCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  timeToMarketLabel: {
    fontSize: 14,
    color: '#4B5563',
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  timeToMarketValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
  },
  readinessCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  readinessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  readinessTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
  },
  complexityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  complexityText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  readinessDescription: {
    fontSize: 14,
    color: '#4B5563',
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
});