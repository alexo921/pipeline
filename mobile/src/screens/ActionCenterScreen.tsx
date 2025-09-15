import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

export default function ActionCenterScreen() {
  const actions = [
    { id: 'a1', title: 'Send Targeted Pulse', subtitle: 'Night Shift CNAs - Rehab' },
    { id: 'a2', title: 'Trigger Candidate Reminder', subtitle: 'Intake completion pending (12)' },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Action Center</Text>
      {actions.map((a) => (
        <View key={a.id} style={styles.card}>
          <Text style={styles.title}>{a.title}</Text>
          <Text style={styles.subtitle}>{a.subtitle}</Text>
          <View style={{ height: 8 }} />
          <TouchableOpacity style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Open</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const PIPELINE_BLUE = '#2466D0';

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#F5F7FA',
  },
  header: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    color: '#334155',
    marginTop: 4,
  },
  primaryBtn: {
    backgroundColor: PIPELINE_BLUE,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
});


