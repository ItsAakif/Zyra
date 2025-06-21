import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { Globe, TrendingUp, Calendar, DollarSign, Target, ChevronDown, ChevronUp, Check, MapPin } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { globalExpansionService } from '@/lib/global-expansion';

interface ExpansionStrategy {
  targetCountries: string[];
  phases: ExpansionPhase[];
  timeline: {
    start: Date;
    milestones: { date: Date; description: string }[];
    estimatedCompletion: Date;
  };
  budget: {
    total: number;
    breakdown: { category: string; amount: number }[];
    currency: string;
  };
  risks: {
    description: string;
    impact: 'LOW' | 'MEDIUM' | 'HIGH';
    probability: 'LOW' | 'MEDIUM' | 'HIGH';
    mitigation: string;
  }[];
  kpis: {
    name: string;
    target: number;
    unit: string;
    timeframe: string;
  }[];
}

interface ExpansionPhase {
  id: string;
  name: string;
  countries: string[];
  startDate: Date;
  endDate: Date;
  objectives: string[];
  keyDeliverables: string[];
  resourceRequirements: {
    personnel: { role: string; count: number }[];
    technology: string[];
    partners: string[];
    budget: number;
  };
}

export default function GlobalExpansionPlanner() {
  const [selectedCountries, setSelectedCountries] = useState<string[]>(['IN', 'BR', 'NG']);
  const [businessModel, setBusinessModel] = useState<string>('payment_platform');
  const [budget, setBudget] = useState<string>('1000000');
  const [timeline, setTimeline] = useState<string>('18');
  const [priorities, setPriorities] = useState<string[]>(['market_size', 'digital_adoption', 'growth_potential']);
  const [expansionStrategy, setExpansionStrategy] = useState<ExpansionStrategy | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    phases: true,
    timeline: false,
    budget: false,
    risks: false,
    kpis: false
  });

  const availableCountries = [
    { code: 'IN', name: 'India' },
    { code: 'BR', name: 'Brazil' },
    { code: 'NG', name: 'Nigeria' },
    { code: 'ID', name: 'Indonesia' },
    { code: 'MX', name: 'Mexico' },
    { code: 'PH', name: 'Philippines' },
    { code: 'EG', name: 'Egypt' },
    { code: 'VN', name: 'Vietnam' },
    { code: 'TH', name: 'Thailand' },
    { code: 'ZA', name: 'South Africa' }
  ];

  const availablePriorities = [
    { id: 'market_size', name: 'Market Size' },
    { id: 'digital_adoption', name: 'Digital Adoption' },
    { id: 'regulatory_ease', name: 'Regulatory Ease' },
    { id: 'competition', name: 'Low Competition' },
    { id: 'growth_potential', name: 'Growth Potential' }
  ];

  const toggleCountry = (code: string) => {
    if (selectedCountries.includes(code)) {
      setSelectedCountries(selectedCountries.filter(c => c !== code));
    } else {
      setSelectedCountries([...selectedCountries, code]);
    }
  };

  const togglePriority = (id: string) => {
    if (priorities.includes(id)) {
      setPriorities(priorities.filter(p => p !== id));
    } else {
      setPriorities([...priorities, id]);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section]
    });
  };

  const generateStrategy = async () => {
    if (selectedCountries.length === 0) {
      alert('Please select at least one target country');
      return;
    }

    try {
      setLoading(true);
      
      // In a real implementation, this would call the API
      const strategy = await globalExpansionService.generateExpansionStrategy(
        selectedCountries,
        businessModel,
        parseFloat(budget),
        parseInt(timeline),
        priorities
      );
      
      setExpansionStrategy(strategy);
    } catch (error) {
      console.error('Error generating expansion strategy:', error);
      alert('Failed to generate expansion strategy');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'HIGH': return '#EF4444';
      case 'MEDIUM': return '#F59E0B';
      case 'LOW': return '#10B981';
      default: return '#6B7280';
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Globe size={24} color="#8B5CF6" />
          <Text style={styles.headerTitle}>Global Expansion Planner</Text>
        </View>
      </View>

      {!expansionStrategy ? (
        <>
          {/* Strategy Configuration */}
          <View style={styles.configSection}>
            <Text style={styles.configTitle}>Target Countries</Text>
            <View style={styles.countryGrid}>
              {availableCountries.map((country) => (
                <TouchableOpacity
                  key={country.code}
                  style={[
                    styles.countryButton,
                    selectedCountries.includes(country.code) && styles.countryButtonSelected
                  ]}
                  onPress={() => toggleCountry(country.code)}
                >
                  <Text
                    style={[
                      styles.countryButtonText,
                      selectedCountries.includes(country.code) && styles.countryButtonTextSelected
                    ]}
                  >
                    {country.name}
                  </Text>
                  {selectedCountries.includes(country.code) && (
                    <Check size={16} color="white" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.configTitle}>Business Model</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={businessModel}
                onChangeText={setBusinessModel}
                placeholder="e.g., payment_platform"
              />
            </View>

            <Text style={styles.configTitle}>Budget (USD)</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={budget}
                onChangeText={setBudget}
                keyboardType="numeric"
                placeholder="e.g., 1000000"
              />
            </View>

            <Text style={styles.configTitle}>Timeline (months)</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={timeline}
                onChangeText={setTimeline}
                keyboardType="numeric"
                placeholder="e.g., 18"
              />
            </View>

            <Text style={styles.configTitle}>Business Priorities</Text>
            <View style={styles.priorityGrid}>
              {availablePriorities.map((priority) => (
                <TouchableOpacity
                  key={priority.id}
                  style={[
                    styles.priorityButton,
                    priorities.includes(priority.id) && styles.priorityButtonSelected
                  ]}
                  onPress={() => togglePriority(priority.id)}
                >
                  <Text
                    style={[
                      styles.priorityButtonText,
                      priorities.includes(priority.id) && styles.priorityButtonTextSelected
                    ]}
                  >
                    {priority.name}
                  </Text>
                  {priorities.includes(priority.id) && (
                    <Check size={16} color="white" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.generateButton}
              onPress={generateStrategy}
              disabled={loading}
            >
              <LinearGradient
                colors={['#8B5CF6', '#EC4899']}
                style={styles.generateButtonGradient}
              >
                <Text style={styles.generateButtonText}>
                  {loading ? 'Generating...' : 'Generate Expansion Strategy'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          {/* Strategy Overview */}
          <LinearGradient
            colors={['#1F2937', '#374151']}
            style={styles.strategyCard}
          >
            <View style={styles.strategyHeader}>
              <Text style={styles.strategyTitle}>Expansion Strategy</Text>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={() => setExpansionStrategy(null)}
              >
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.strategyDetails}>
              <View style={styles.strategyDetail}>
                <Globe size={20} color="rgba(255, 255, 255, 0.8)" />
                <View style={styles.strategyDetailContent}>
                  <Text style={styles.strategyDetailLabel}>Target Markets</Text>
                  <Text style={styles.strategyDetailValue}>
                    {expansionStrategy.targetCountries.length} countries
                  </Text>
                </View>
              </View>
              
              <View style={styles.strategyDetail}>
                <Calendar size={20} color="rgba(255, 255, 255, 0.8)" />
                <View style={styles.strategyDetailContent}>
                  <Text style={styles.strategyDetailLabel}>Timeline</Text>
                  <Text style={styles.strategyDetailValue}>
                    {formatDate(expansionStrategy.timeline.start)} - {formatDate(expansionStrategy.timeline.estimatedCompletion)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.strategyDetail}>
                <DollarSign size={20} color="rgba(255, 255, 255, 0.8)" />
                <View style={styles.strategyDetailContent}>
                  <Text style={styles.strategyDetailLabel}>Total Budget</Text>
                  <Text style={styles.strategyDetailValue}>
                    {formatCurrency(expansionStrategy.budget.total)}
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>

          {/* Expansion Phases */}
          <View style={styles.section}>
            <TouchableOpacity 
              style={styles.sectionHeader}
              onPress={() => toggleSection('phases')}
            >
              <Text style={styles.sectionTitle}>Expansion Phases</Text>
              {expandedSections.phases ? (
                <ChevronUp size={20} color="#6B7280" />
              ) : (
                <ChevronDown size={20} color="#6B7280" />
              )}
            </TouchableOpacity>
            
            {expandedSections.phases && (
              <View style={styles.sectionContent}>
                {expansionStrategy.phases.map((phase, index) => (
                  <View key={phase.id} style={styles.phaseCard}>
                    <View style={styles.phaseHeader}>
                      <Text style={styles.phaseName}>{phase.name}</Text>
                      <View style={styles.phaseDates}>
                        <Text style={styles.phaseDate}>
                          {formatDate(phase.startDate)} - {formatDate(phase.endDate)}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.phaseCountries}>
                      {phase.countries.map((country) => (
                        <View key={country} style={styles.countryTag}>
                          <MapPin size={12} color="#8B5CF6" />
                          <Text style={styles.countryTagText}>
                            {availableCountries.find(c => c.code === country)?.name || country}
                          </Text>
                        </View>
                      ))}
                    </View>
                    
                    <Text style={styles.phaseSubtitle}>Objectives</Text>
                    {phase.objectives.map((objective, objIndex) => (
                      <View key={objIndex} style={styles.phaseListItem}>
                        <Target size={16} color="#8B5CF6" />
                        <Text style={styles.phaseListItemText}>{objective}</Text>
                      </View>
                    ))}
                    
                    <Text style={styles.phaseSubtitle}>Key Deliverables</Text>
                    {phase.keyDeliverables.map((deliverable, delIndex) => (
                      <View key={delIndex} style={styles.phaseListItem}>
                        <Check size={16} color="#10B981" />
                        <Text style={styles.phaseListItemText}>{deliverable}</Text>
                      </View>
                    ))}
                    
                    <View style={styles.phaseBudget}>
                      <Text style={styles.phaseBudgetLabel}>Phase Budget:</Text>
                      <Text style={styles.phaseBudgetValue}>
                        {formatCurrency(phase.resourceRequirements.budget)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Timeline */}
          <View style={styles.section}>
            <TouchableOpacity 
              style={styles.sectionHeader}
              onPress={() => toggleSection('timeline')}
            >
              <Text style={styles.sectionTitle}>Timeline & Milestones</Text>
              {expandedSections.timeline ? (
                <ChevronUp size={20} color="#6B7280" />
              ) : (
                <ChevronDown size={20} color="#6B7280" />
              )}
            </TouchableOpacity>
            
            {expandedSections.timeline && (
              <View style={styles.sectionContent}>
                <View style={styles.timeline}>
                  {expansionStrategy.timeline.milestones.map((milestone, index) => (
                    <View key={index}>
                      <View style={styles.timelineItem}>
                        <View style={styles.timelineIconContainer}>
                          <Calendar size={20} color="#8B5CF6" />
                        </View>
                        <View style={styles.timelineContent}>
                          <Text style={styles.timelineDate}>{formatDate(milestone.date)}</Text>
                          <Text style={styles.timelineDescription}>{milestone.description}</Text>
                        </View>
                      </View>
                      {index < expansionStrategy.timeline.milestones.length - 1 && (
                        <View style={styles.timelineConnector} />
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Budget */}
          <View style={styles.section}>
            <TouchableOpacity 
              style={styles.sectionHeader}
              onPress={() => toggleSection('budget')}
            >
              <Text style={styles.sectionTitle}>Budget Allocation</Text>
              {expandedSections.budget ? (
                <ChevronUp size={20} color="#6B7280" />
              ) : (
                <ChevronDown size={20} color="#6B7280" />
              )}
            </TouchableOpacity>
            
            {expandedSections.budget && (
              <View style={styles.sectionContent}>
                {expansionStrategy.budget.breakdown.map((item, index) => (
                  <View key={index} style={styles.budgetItem}>
                    <View style={styles.budgetItemContent}>
                      <Text style={styles.budgetItemCategory}>{item.category}</Text>
                      <Text style={styles.budgetItemAmount}>{formatCurrency(item.amount)}</Text>
                    </View>
                    <View style={styles.budgetBar}>
                      <View 
                        style={[
                          styles.budgetBarFill,
                          { width: `${(item.amount / expansionStrategy.budget.total) * 100}%` }
                        ]} 
                      />
                    </View>
                  </View>
                ))}
                
                <View style={styles.budgetTotal}>
                  <Text style={styles.budgetTotalLabel}>Total Budget:</Text>
                  <Text style={styles.budgetTotalValue}>
                    {formatCurrency(expansionStrategy.budget.total)}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Risks */}
          <View style={styles.section}>
            <TouchableOpacity 
              style={styles.sectionHeader}
              onPress={() => toggleSection('risks')}
            >
              <Text style={styles.sectionTitle}>Risks & Mitigation</Text>
              {expandedSections.risks ? (
                <ChevronUp size={20} color="#6B7280" />
              ) : (
                <ChevronDown size={20} color="#6B7280" />
              )}
            </TouchableOpacity>
            
            {expandedSections.risks && (
              <View style={styles.sectionContent}>
                {expansionStrategy.risks.map((risk, index) => (
                  <View key={index} style={styles.riskCard}>
                    <View style={styles.riskHeader}>
                      <Text style={styles.riskDescription}>{risk.description}</Text>
                      <View style={styles.riskLabels}>
                        <View style={[
                          styles.riskLabel,
                          { backgroundColor: getImpactColor(risk.impact) + '20' }
                        ]}>
                          <Text style={[
                            styles.riskLabelText,
                            { color: getImpactColor(risk.impact) }
                          ]}>
                            {risk.impact}
                          </Text>
                        </View>
                        
                        <View style={[
                          styles.riskLabel,
                          { backgroundColor: getImpactColor(risk.probability) + '20' }
                        ]}>
                          <Text style={[
                            styles.riskLabelText,
                            { color: getImpactColor(risk.probability) }
                          ]}>
                            {risk.probability}
                          </Text>
                        </View>
                      </View>
                    </View>
                    
                    <Text style={styles.riskMitigationLabel}>Mitigation:</Text>
                    <Text style={styles.riskMitigation}>{risk.mitigation}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* KPIs */}
          <View style={styles.section}>
            <TouchableOpacity 
              style={styles.sectionHeader}
              onPress={() => toggleSection('kpis')}
            >
              <Text style={styles.sectionTitle}>Key Performance Indicators</Text>
              {expandedSections.kpis ? (
                <ChevronUp size={20} color="#6B7280" />
              ) : (
                <ChevronDown size={20} color="#6B7280" />
              )}
            </TouchableOpacity>
            
            {expandedSections.kpis && (
              <View style={styles.sectionContent}>
                {expansionStrategy.kpis.map((kpi, index) => (
                  <View key={index} style={styles.kpiCard}>
                    <View style={styles.kpiHeader}>
                      <Text style={styles.kpiName}>{kpi.name}</Text>
                      <Text style={styles.kpiTimeframe}>{kpi.timeframe}</Text>
                    </View>
                    
                    <View style={styles.kpiTarget}>
                      <TrendingUp size={16} color="#8B5CF6" />
                      <Text style={styles.kpiTargetText}>
                        Target: {kpi.target.toLocaleString()} {kpi.unit}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </>
      )}
    </ScrollView>
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
  configSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  configTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
    marginTop: 16,
  },
  countryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  countryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    gap: 8,
  },
  countryButtonSelected: {
    backgroundColor: '#8B5CF6',
  },
  countryButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter-Medium',
  },
  countryButtonTextSelected: {
    color: 'white',
  },
  inputContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
  },
  input: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    fontFamily: 'Inter-Regular',
  },
  priorityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  priorityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    gap: 8,
  },
  priorityButtonSelected: {
    backgroundColor: '#8B5CF6',
  },
  priorityButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter-Medium',
  },
  priorityButtonTextSelected: {
    color: 'white',
  },
  generateButton: {
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 8,
  },
  generateButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Inter-SemiBold',
  },
  strategyCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  strategyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  strategyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Inter-SemiBold',
  },
  resetButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  resetButtonText: {
    fontSize: 14,
    color: 'white',
    fontFamily: 'Inter-Medium',
  },
  strategyDetails: {
    gap: 16,
  },
  strategyDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  strategyDetailContent: {
    flex: 1,
  },
  strategyDetailLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  strategyDetailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Inter-SemiBold',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    overflow: 'hidden',
    paddingHorizontal: 16,
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
  phaseCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  phaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  phaseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
  },
  phaseDates: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  phaseDate: {
    fontSize: 12,
    color: '#4B5563',
    fontFamily: 'Inter-Medium',
  },
  phaseCountries: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  countryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  countryTagText: {
    fontSize: 12,
    color: '#8B5CF6',
    fontFamily: 'Inter-Medium',
  },
  phaseSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    fontFamily: 'Inter-SemiBold',
    marginTop: 12,
    marginBottom: 8,
  },
  phaseListItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 6,
    gap: 8,
  },
  phaseListItemText: {
    fontSize: 14,
    color: '#111827',
    fontFamily: 'Inter-Regular',
    flex: 1,
  },
  phaseBudget: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  phaseBudgetLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
    fontFamily: 'Inter-Medium',
  },
  phaseBudgetValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
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
  timelineDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  timelineDescription: {
    fontSize: 14,
    color: '#4B5563',
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  timelineConnector: {
    width: 2,
    height: 24,
    backgroundColor: '#E5E7EB',
    marginLeft: 18,
  },
  budgetItem: {
    marginBottom: 16,
  },
  budgetItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  budgetItemCategory: {
    fontSize: 14,
    color: '#111827',
    fontFamily: 'Inter-Medium',
  },
  budgetItemAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
  },
  budgetBar: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  budgetBarFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 4,
  },
  budgetTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  budgetTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
  },
  budgetTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Inter-Bold',
  },
  riskCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  riskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  riskDescription: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
    flex: 1,
    marginRight: 8,
  },
  riskLabels: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 4,
  },
  riskLabel: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  riskLabelText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  riskMitigationLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: 'Inter-Medium',
    marginBottom: 4,
  },
  riskMitigation: {
    fontSize: 14,
    color: '#4B5563',
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  kpiCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  kpiName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter-SemiBold',
  },
  kpiTimeframe: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter-Medium',
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  kpiTarget: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  kpiTargetText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
    fontFamily: 'Inter-Medium',
  },
});