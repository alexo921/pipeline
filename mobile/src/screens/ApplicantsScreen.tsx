import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ApplicantsScreen = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedApplicant, setSelectedApplicant] = useState<any>(null);

  const demoApplicants = [
    {
      id: 1,
      name: "Marvin Grant",
      role: "Registered Nurse",
      experience: "5+ years experience",
      location: "New Haven, CT",
      status: "Applied",
      appliedDate: "2 days ago",
      matchScore: 94,
      candidateTags: ["High Retention Score", "Strong Culture Fit", "Close Commute"],
      isMatched: false
    },
    {
      id: 2,
      name: "Sarah Johnson",
      role: "Registered Nurse", 
      experience: "5+ years experience",
      location: "New Haven, CT",
      status: "Applied",
      appliedDate: "1 day ago",
      matchScore: 87,
      candidateTags: ["Shift Preference Match", "Pay Alignment", "Moderate Retention Score"],
      isMatched: true
    },
    {
      id: 3,
      name: "Michael Chen",
      role: "Registered Nurse",
      experience: "5+ years experience", 
      location: "New Haven, CT",
      status: "Applied",
      appliedDate: "3 days ago",
      matchScore: 92,
      candidateTags: ["Flexible Commute", "Positive Historical Performance", "Commute Risk"],
      isMatched: false
    },
    {
      id: 4,
      name: "Emily Rodriguez",
      role: "Registered Nurse",
      experience: "5+ years experience",
      location: "New Haven, CT", 
      status: "Applied",
      appliedDate: "4 days ago",
      matchScore: 89,
      candidateTags: ["High Retention Score", "Limited Shift Flexibility", "Unproven Setting"],
      isMatched: true
    }
  ];

  const tagCategories = {
    positive: {
      name: "Positive Match Tags",
      color: "bg-green-100 text-green-800 border-green-200",
      tags: ["High Retention Score", "Strong Culture Fit", "Close Commute", "Shift Preference Match", "Pay Alignment", "Flexible Commute", "Positive Historical Performance"]
    },
    watch: {
      name: "Watch Tags",
      color: "bg-yellow-100 text-yellow-800 border-yellow-200",
      tags: ["Moderate Retention Score", "Commute Risk", "Limited Shift Flexibility", "Unproven Setting", "Partial Intake Completed"]
    },
    risk: {
      name: "Risk Tags",
      color: "bg-red-100 text-red-800 border-red-200",
      tags: ["High Churn Risk", "Job Hopper Signal", "Long Commute", "No-Show History", "Low Responsiveness", "Negative Behavioral Signals"]
    }
  };

  const categorizeCandidateTags = (candidateTags: string[]) => {
    const categorizedTags: { category: string; tags: string[]; color: string }[] = [];
    
    Object.entries(tagCategories).forEach(([key, category]) => {
      const matchingTags = candidateTags.filter(tag => category.tags.includes(tag));
      if (matchingTags.length > 0) {
        categorizedTags.push({
          category: category.name,
          tags: matchingTags,
          color: category.color
        });
      }
    });
    
    return categorizedTags;
  };

  const filteredApplicants = demoApplicants.filter(applicant => {
    if (searchTerm) {
      const matchesSearch = applicant.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           applicant.role.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           applicant.location.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;
    }
    
    if (selectedFilter === 'matched') {
      return applicant.isMatched === true;
    } else if (selectedFilter === 'unmatched') {
      return applicant.isMatched === false;
    }
    
    return true;
  });

  const getTagStyle = (tag: string) => {
    if (tagCategories.positive.tags.includes(tag)) {
      return styles.positiveTag;
    } else if (tagCategories.watch.tags.includes(tag)) {
      return styles.watchTag;
    } else {
      return styles.riskTag;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Hiring Engine</Text>
        <Text style={styles.subtitle}>Registered Nurse I • St. Mary's Health Center</Text>
        <Text style={styles.applicantCount}>You have <Text style={styles.highlight}>15</Text> new applicants</Text>
      </View>

      {/* Search and Filters */}
      <View style={styles.controlsContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#7691A4" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search applicants..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholderTextColor="#7691A4"
          />
        </View>
        
        <View style={styles.filterContainer}>
          {['all', 'matched', 'unmatched'].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                selectedFilter === filter && styles.filterButtonActive
              ]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text style={[
                styles.filterText,
                selectedFilter === filter && styles.filterTextActive
              ]}>
                {filter === 'all' ? 'All' : filter === 'matched' ? 'Matched' : 'Unmatched'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.content}>
        {/* Applicants List */}
        <ScrollView style={styles.applicantsList} showsVerticalScrollIndicator={false}>
          {filteredApplicants.map((applicant) => (
            <TouchableOpacity 
              key={applicant.id} 
              style={[
                styles.applicantCard,
                selectedApplicant?.id === applicant.id && styles.applicantCardSelected
              ]}
              onPress={() => setSelectedApplicant(applicant)}
            >
              <View style={styles.applicantHeader}>
                <View style={styles.applicantInfo}>
                  <Text style={styles.applicantName}>{applicant.name}</Text>
                  <Text style={styles.applicantRole}>{applicant.experience}</Text>
                  <Text style={styles.applicantLocation}>{applicant.location}</Text>
                </View>
                
                {applicant.isMatched && (
                  <View style={styles.matchedBadge}>
                    <Text style={styles.matchedText}>Matched</Text>
                    <Ionicons name="checkmark-circle" size={16} color="#2466D0" />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Selected Applicant Details */}
        {selectedApplicant && (
          <View style={styles.detailsPanel}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.detailsHeader}>
                <View style={styles.detailsInfo}>
                  <Text style={styles.detailsName}>{selectedApplicant.name}</Text>
                  {selectedApplicant.isMatched && (
                    <View style={styles.detailsMatchedBadge}>
                      <Text style={styles.detailsMatchedText}>Matched</Text>
                      <Ionicons name="checkmark-circle" size={16} color="#2466D0" />
                    </View>
                  )}
                </View>
              </View>
              
              <Text style={styles.detailsRole}>{selectedApplicant.experience}</Text>
              <Text style={styles.detailsLocation}>{selectedApplicant.location}</Text>
              
              <View style={styles.divider} />
              
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Pip Summary</Text>
                <Text style={styles.sectionContent}>
                  Community Focused. Care Driven. Join Something Health, where your future is as promising as the care we provide. Our commitment to each other, our patients, and our community is more than a mission.
                </Text>
              </View>
              
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Experience</Text>
                <View style={styles.experienceList}>
                  <Text style={styles.experienceItem}>• Registered Nurse | St. Mary's | 3yrs</Text>
                  <Text style={styles.experienceItem}>• Registered Nurse | St. Mary's | 3yrs</Text>
                  <Text style={styles.experienceItem}>• Registered Nurse | St. Mary's | 3yrs</Text>
                </View>
              </View>
              
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Candidate Tags</Text>
                <View style={styles.tagsContainer}>
                  {selectedApplicant.candidateTags.map((tag: string, index: number) => (
                    <View key={index} style={[styles.tag, getTagStyle(tag)]}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  );
};

const PIPELINE_BLUE = '#2466D0';
const PIPELINE_DARK = '#01253F';
const PIPELINE_GRAY = '#7691A4';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F4F4',
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: PIPELINE_DARK,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: PIPELINE_GRAY,
    marginBottom: 4,
  },
  applicantCount: {
    fontSize: 16,
    color: PIPELINE_GRAY,
  },
  highlight: {
    color: PIPELINE_BLUE,
    fontWeight: 'bold',
  },
  controlsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: PIPELINE_DARK,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filterButtonActive: {
    backgroundColor: PIPELINE_BLUE,
  },
  filterText: {
    fontSize: 14,
    color: PIPELINE_GRAY,
    fontWeight: '600',
  },
  filterTextActive: {
    color: 'white',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 16,
  },
  applicantsList: {
    flex: 1,
    maxWidth: '50%',
  },
  applicantCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  applicantCardSelected: {
    borderColor: PIPELINE_BLUE,
    shadowColor: PIPELINE_BLUE,
    shadowOpacity: 0.3,
  },
  applicantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  applicantInfo: {
    flex: 1,
  },
  applicantName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PIPELINE_DARK,
    marginBottom: 4,
  },
  applicantRole: {
    fontSize: 14,
    fontWeight: 'bold',
    color: PIPELINE_DARK,
    marginBottom: 4,
  },
  applicantLocation: {
    fontSize: 14,
    color: PIPELINE_GRAY,
  },
  matchedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  matchedText: {
    fontSize: 12,
    color: PIPELINE_GRAY,
    fontWeight: '600',
  },
  detailsPanel: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  detailsInfo: {
    flex: 1,
  },
  detailsName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: PIPELINE_DARK,
    marginBottom: 8,
  },
  detailsMatchedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
    alignSelf: 'flex-start',
  },
  detailsMatchedText: {
    fontSize: 12,
    color: PIPELINE_GRAY,
    fontWeight: '600',
  },
  detailsRole: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PIPELINE_DARK,
    marginBottom: 4,
  },
  detailsLocation: {
    fontSize: 16,
    color: PIPELINE_GRAY,
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PIPELINE_GRAY,
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 16,
    color: PIPELINE_DARK,
    lineHeight: 24,
  },
  experienceList: {
    gap: 8,
  },
  experienceItem: {
    fontSize: 16,
    color: PIPELINE_DARK,
    marginBottom: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },
  positiveTag: {
    backgroundColor: '#D1FAE5',
    borderColor: '#A7F3D0',
  },
  watchTag: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  riskTag: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ApplicantsScreen;
