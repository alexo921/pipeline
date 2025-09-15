import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Analytics'>;

const mockKPIs = [
  { id: 'kpi1', label: 'Retention Forecast', value: '78%' },
  { id: 'kpi2', label: 'No-Show Risk Flags', value: '12' },
  { id: 'kpi3', label: 'Turnover Cost Avoided', value: '$24k' },
];

const mockInsights = [
  { id: 'i1', title: 'Rehab unit forecast dropped 12pts', action: 'Escalate to Supervisor' },
  { id: 'i2', title: 'Pulse participation down 18% in Nights', action: 'Trigger Pulse Reminder' },
];

export default function AnalyticsScreen({ navigation }: Props) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.kpiHeaderRow}>
        <Text style={styles.sectionTitle}>KPIs</Text>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('ActionCenter')}>
          <Text style={styles.actionBtnText}>Action Center →</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.kpiGrid}>
        {mockKPIs.map((kpi) => (
          <View key={kpi.id} style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>{kpi.label}</Text>
            <Text style={styles.kpiValue}>{kpi.value}</Text>
          </View>
        ))}
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Insight Feed</Text>
      <View style={styles.insightList}>
        {mockInsights.map((insight) => (
          <View key={insight.id} style={styles.insightCard}>
            <Text style={styles.insightTitle}>{insight.title}</Text>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('ActionCenter')}>
              <Text style={styles.secondaryBtnText}>{insight.action}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const PIPELINE_BLUE = '#2466D0';

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#F5F7FA',
  },
  kpiHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
  },
  actionBtn: {
    backgroundColor: PIPELINE_BLUE,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12 as unknown as number,
  },
  kpiCard: {
    width: '48%',
    aspectRatio: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 12,
  },
  kpiLabel: {
    fontSize: 12,
    color: '#334155',
  },
  kpiValue: {
    marginTop: 8,
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
  },
  insightList: {
    marginTop: 8,
    gap: 12 as unknown as number,
  },
  insightCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 12,
  },
  insightTitle: {
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 8,
  },
  secondaryBtn: {
    backgroundColor: '#E9F1FF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  secondaryBtnText: {
    color: PIPELINE_BLUE,
    fontWeight: '600',
  },
});


