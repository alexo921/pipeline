import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const JobsScreen = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All Locations');

  const demoJobs = [
    {
      id: 1,
      title: 'Registered Nurse I',
      company: 'St. Mary\'s Health Center',
      location: 'New Haven, CT',
      salary: '$75,000 - $85,000',
      type: 'Full-time',
      posted: '2 days ago',
      applicants: 15,
      matchScore: 94
    },
    {
      id: 2,
      title: 'Senior Registered Nurse',
      company: 'St. Mary\'s Health Center',
      location: 'New Haven, CT',
      salary: '$85,000 - $95,000',
      type: 'Full-time',
      posted: '1 day ago',
      applicants: 8,
      matchScore: 87
    },
    {
      id: 3,
      title: 'ICU Registered Nurse',
      company: 'St. Mary\'s Health Center',
      location: 'New Haven, CT',
      salary: '$80,000 - $90,000',
      type: 'Full-time',
      posted: '3 days ago',
      applicants: 6,
      matchScore: 92
    },
    {
      id: 4,
      title: 'Emergency Room Nurse',
      company: 'St. Mary\'s Health Center',
      location: 'New Haven, CT',
      salary: '$78,000 - $88,000',
      type: 'Full-time',
      posted: '4 days ago',
      applicants: 9,
      matchScore: 89
    }
  ];

  const filteredJobs = demoJobs.filter(job => 
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Find Your Next Role</Text>
        <Text style={styles.subtitle}>Discover opportunities that match your skills and preferences</Text>
      </View>

      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#7691A4" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search jobs..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholderTextColor="#7691A4"
          />
        </View>
        
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter" size={20} color="#2466D0" />
          <Text style={styles.filterText}>Filter</Text>
        </TouchableOpacity>
      </View>

      {/* Job Cards */}
      <View style={styles.jobsContainer}>
        {filteredJobs.map((job) => (
          <TouchableOpacity key={job.id} style={styles.jobCard}>
            <View style={styles.jobHeader}>
              <View style={styles.jobInfo}>
                <Text style={styles.jobTitle}>{job.title}</Text>
                <Text style={styles.companyName}>{job.company}</Text>
                <View style={styles.locationContainer}>
                  <Ionicons name="location-outline" size={16} color="#7691A4" />
                  <Text style={styles.location}>{job.location}</Text>
                </View>
              </View>
              <View style={styles.matchBadge}>
                <Text style={styles.matchScore}>{job.matchScore}%</Text>
                <Text style={styles.matchLabel}>Match</Text>
              </View>
            </View>
            
            <View style={styles.jobDetails}>
              <View style={styles.detailRow}>
                <Ionicons name="cash-outline" size={16} color="#7691A4" />
                <Text style={styles.detailText}>{job.salary}</Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="time-outline" size={16} color="#7691A4" />
                <Text style={styles.detailText}>{job.type}</Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="people-outline" size={16} color="#7691A4" />
                <Text style={styles.detailText}>{job.applicants} applicants</Text>
              </View>
            </View>
            
            <View style={styles.jobFooter}>
              <Text style={styles.postedDate}>Posted {job.posted}</Text>
              <TouchableOpacity style={styles.applyButton}>
                <Text style={styles.applyButtonText}>Apply Now</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
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
    fontSize: 28,
    fontWeight: 'bold',
    color: PIPELINE_DARK,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: PIPELINE_GRAY,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
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
  filterButton: {
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
    gap: 8,
  },
  filterText: {
    fontSize: 16,
    color: PIPELINE_BLUE,
    fontWeight: '600',
  },
  jobsContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  jobCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  jobInfo: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: PIPELINE_DARK,
    marginBottom: 4,
  },
  companyName: {
    fontSize: 16,
    color: PIPELINE_GRAY,
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    fontSize: 14,
    color: PIPELINE_GRAY,
  },
  matchBadge: {
    backgroundColor: '#E9F1FF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  matchScore: {
    fontSize: 18,
    fontWeight: 'bold',
    color: PIPELINE_BLUE,
  },
  matchLabel: {
    fontSize: 12,
    color: PIPELINE_BLUE,
  },
  jobDetails: {
    marginBottom: 16,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: PIPELINE_GRAY,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postedDate: {
    fontSize: 14,
    color: PIPELINE_GRAY,
  },
  applyButton: {
    backgroundColor: PIPELINE_BLUE,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  applyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default JobsScreen;
