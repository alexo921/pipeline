// Test script for shift search functionality
// This simulates the shift search logic from the jobs page

// Mock job data with shift tags
const mockJobs = [
  {
    id: 1,
    title: 'Registered Nurse',
    company: 'Hospital A',
    location: 'Hartford, CT',
    tags: [
      { type: 'shift', label: '7AM-3PM' },
      { type: 'employment_type', label: 'Full-Time' },
      { type: 'job_setting', label: 'Hospital' }
    ]
  },
  {
    id: 2,
    title: 'CNA',
    company: 'Nursing Home B',
    location: 'Bridgeport, CT',
    tags: [
      { type: 'shift', label: '3PM-11PM' },
      { type: 'employment_type', label: 'Part-Time' },
      { type: 'job_setting', label: 'Nursing Home' }
    ]
  },
  {
    id: 3,
    title: 'LPN',
    company: 'Home Care C',
    location: 'Stamford, CT',
    tags: [
      { type: 'shift', label: '11PM-7AM' },
      { type: 'employment_type', label: 'Full-Time' },
      { type: 'job_setting', label: 'Home Care' }
    ]
  },
  {
    id: 4,
    title: 'Physical Therapist',
    company: 'Rehab Center D',
    location: 'New Haven, CT',
    tags: [
      { type: 'shift', label: 'Morning' },
      { type: 'employment_type', label: 'Full-Time' },
      { type: 'job_setting', label: 'Rehabilitation Center' }
    ]
  },
  {
    id: 5,
    title: 'Nurse Manager',
    company: 'Hospital E',
    location: 'Waterbury, CT',
    tags: [
      { type: 'shift', label: '9AM-5PM' },
      { type: 'employment_type', label: 'Full-Time' },
      { type: 'job_setting', label: 'Hospital' }
    ]
  },
  {
    id: 6,
    title: 'Caregiver',
    company: 'Home Care F',
    location: 'Norwalk, CT',
    tags: [
      { type: 'shift', label: 'Overnight' },
      { type: 'employment_type', label: 'Part-Time' },
      { type: 'job_setting', label: 'Home Care' }
    ]
  },
  {
    id: 7,
    title: 'RN',
    company: 'Hospital G',
    location: 'Danbury, CT',
    tags: [
      { type: 'shift', label: '7AM-7PM' },
      { type: 'employment_type', label: 'Full-Time' },
      { type: 'job_setting', label: 'Hospital' }
    ]
  },
  {
    id: 8,
    title: 'HHA',
    company: 'Home Care H',
    location: 'New Britain, CT',
    tags: [
      { type: 'shift', label: 'Afternoon' },
      { type: 'employment_type', label: 'Part-Time' },
      { type: 'job_setting', label: 'Home Care' }
    ]
  }
];

// Shift search logic (simplified version)
function searchJobsByShift(jobs, searchTerm) {
  const searchTerms = searchTerm.toLowerCase().split(/\s+/).filter(term => term.length > 0);
  
  if (searchTerm === '') return jobs;
  
  return jobs.filter(job => {
    // Check if search terms match shift patterns
    const shiftMatches = searchTerms.some(term => {
      // Define shift patterns and their variations
      const shiftPatterns = {
        // Time-based patterns
        '7am-3pm': ['7am-3pm', '7am to 3pm', '7:00am-3:00pm', '7:00am to 3:00pm', '7am-3pm', '7am to 3pm'],
        '3pm-11pm': ['3pm-11pm', '3pm to 11pm', '3:00pm-11:00pm', '3:00pm to 11:00pm', '3pm-11pm', '3pm to 11pm'],
        '11pm-7am': ['11pm-7am', '11pm to 7am', '11:00pm-7:00am', '11:00pm to 7:00am', '11pm-7am', '11pm to 7am'],
        '6am-2pm': ['6am-2pm', '6am to 2pm', '6:00am-2:00pm', '6:00am to 2:00pm', '6am-2pm', '6am to 2pm'],
        '2pm-10pm': ['2pm-10pm', '2pm to 10pm', '2:00pm-10:00pm', '2:00pm to 10:00pm', '2pm-10pm', '2pm to 10pm'],
        '10pm-6am': ['10pm-6am', '10pm to 6am', '10:00pm-6:00am', '10:00pm to 6:00am', '10pm-6am', '10pm to 6am'],
        '8am-4pm': ['8am-4pm', '8am to 4pm', '8:00am-4:00pm', '8:00am to 4:00pm', '8am-4pm', '8am to 4pm'],
        '4pm-12am': ['4pm-12am', '4pm to 12am', '4:00pm-12:00am', '4:00pm to 12:00am', '4pm-12am', '4pm to 12am'],
        '12am-8am': ['12am-8am', '12am to 8am', '12:00am-8:00am', '12:00am to 8:00am', '12am-8am', '12am to 8am'],
        '9am-5pm': ['9am-5pm', '9am to 5pm', '9:00am-5:00pm', '9:00am to 5:00pm', '9am-5pm', '9am to 5pm'],
        '5pm-1am': ['5pm-1am', '5pm to 1am', '5:00pm-1:00am', '5:00pm to 1:00am', '5pm-1am', '5pm to 1am'],
        '1am-9am': ['1am-9am', '1am to 9am', '1:00am-9:00am', '1:00am to 9:00am', '1am-9am', '1am to 9am'],
        '7am-7pm': ['7am-7pm', '7am to 7pm', '7:00am-7:00pm', '7:00am to 7:00pm', '7am-7pm', '7am to 7pm'],
        '7pm-7am': ['7pm-7am', '7pm to 7am', '7:00pm-7:00am', '7:00pm to 7:00am', '7pm-7am', '7pm to 7am'],
        '6am-6pm': ['6am-6pm', '6am to 6pm', '6:00am-6:00pm', '6:00am to 6:00pm', '6am-6pm', '6am to 6pm'],
        '6pm-6am': ['6pm-6am', '6pm to 6am', '6:00pm-6:00am', '6:00pm to 6:00am', '6pm-6am', '6pm to 6am'],
        '8am-8pm': ['8am-8pm', '8am to 8pm', '8:00am-8:00pm', '8:00am to 8:00pm', '8am-8pm', '8am to 8pm'],
        '8pm-8am': ['8pm-8am', '8pm to 8am', '8:00pm-8:00am', '8:00pm to 8:00am', '8pm-8am', '8pm to 8am'],
        
        // General shift terms
        'morning': ['morning', 'day', 'day shift', 'am', 'early'],
        'afternoon': ['afternoon', 'pm', 'mid'],
        'evening': ['evening', 'night', 'late'],
        'night': ['night', 'overnight', 'graveyard', 'late night', 'night shift'],
        'overnight': ['overnight', 'night', 'graveyard', 'late night', 'night shift', '11pm-7am', '10pm-6am', '12am-8am'],
        
        // Duration-based patterns
        '12 hour': ['12 hour', '12-hour', '12hr', '12 hr', 'twelve hour', 'twelve-hour'],
        '8 hour': ['8 hour', '8-hour', '8hr', '8 hr', 'eight hour', 'eight-hour'],
        '10 hour': ['10 hour', '10-hour', '10hr', '10 hr', 'ten hour', 'ten-hour'],
        '16 hour': ['16 hour', '16-hour', '16hr', '16 hr', 'sixteen hour', 'sixteen-hour']
      };

      // Check if the term matches any shift pattern
      for (const [patternKey, variations] of Object.entries(shiftPatterns)) {
        // Check if the search term matches this pattern
        const termMatchesPattern = variations.some(variation => 
          term === variation.toLowerCase() || 
          term.includes(variation.toLowerCase()) || 
          variation.toLowerCase().includes(term)
        );
        
        if (termMatchesPattern) {
          // Check if job has matching shift tags
          const jobTags = job.tags || [];
          const hasMatchingShift = jobTags.some(tag => {
            if (tag.type !== 'shift') return false;
            
            const tagLabel = tag.label.toLowerCase();
            
            // For time-based patterns, check for exact or close matches
            if (patternKey.includes('am') || patternKey.includes('pm') || patternKey.includes('a') || patternKey.includes('p')) {
              return variations.some(variation => tagLabel.includes(variation.toLowerCase()));
            }
            
            // For general terms, check for exact matches
            if (patternKey === 'morning') {
              return tagLabel === 'morning' || tagLabel.includes('7am-3pm') || tagLabel.includes('6am-2pm') || tagLabel.includes('8am-4pm') || tagLabel.includes('9am-5pm');
            }
            if (patternKey === 'afternoon') {
              return tagLabel === 'afternoon' || tagLabel.includes('3pm-11pm') || tagLabel.includes('2pm-10pm') || tagLabel.includes('4pm-12am');
            }
            if (patternKey === 'evening') {
              return tagLabel === 'evening' || tagLabel.includes('5pm-1am') || tagLabel.includes('4pm-12am');
            }
            if (patternKey === 'night') {
              return tagLabel === 'night' || tagLabel === 'night shift';
            }
            if (patternKey === 'overnight') {
              return tagLabel === 'overnight' || tagLabel === 'graveyard' || tagLabel.includes('11pm-7am') || tagLabel.includes('10pm-6am') || tagLabel.includes('12am-8am');
            }
            
            // For duration patterns, check for exact matches
            if (patternKey.includes('hour')) {
              return variations.some(variation => tagLabel.includes(variation.toLowerCase()));
            }
            
            return false;
          });
          
          if (hasMatchingShift) {
            return true;
          }
        }
      }
      
      return false;
    });

    return shiftMatches;
  });
}

// Test cases
const testCases = [
  { searchTerm: '7am-3pm', expectedCount: 1, description: 'Exact time match' },
  { searchTerm: 'morning', expectedCount: 2, description: 'General morning term' },
  { searchTerm: 'afternoon', expectedCount: 1, description: 'General afternoon term' },
  { searchTerm: 'night', expectedCount: 2, description: 'Night shifts' },
  { searchTerm: 'overnight', expectedCount: 2, description: 'Overnight shifts' },
  { searchTerm: '11pm-7am', expectedCount: 1, description: 'Night time range' },
  { searchTerm: '3pm-11pm', expectedCount: 1, description: 'Afternoon time range' },
  { searchTerm: '9am-5pm', expectedCount: 1, description: 'Business hours' },
  { searchTerm: '7am-7pm', expectedCount: 1, description: '12-hour day shift' },
  { searchTerm: '12 hour', expectedCount: 1, description: 'Duration-based search' },
  { searchTerm: 'day', expectedCount: 2, description: 'Day shift variations' },
  { searchTerm: 'evening', expectedCount: 0, description: 'No evening shifts in test data' }
];

console.log('Testing shift search functionality...\n');

testCases.forEach((testCase, index) => {
  const results = searchJobsByShift(mockJobs, testCase.searchTerm);
  
  console.log(`Test ${index + 1}: "${testCase.searchTerm}"`);
  console.log(`  Description: ${testCase.description}`);
  console.log(`  Expected: ${testCase.expectedCount} jobs`);
  console.log(`  Found: ${results.length} jobs`);
  
  if (results.length > 0) {
    console.log(`  Jobs found:`);
    results.forEach(job => {
      const shiftTags = job.tags.filter(tag => tag.type === 'shift').map(tag => tag.label);
      console.log(`    - ${job.title} at ${job.company} (${shiftTags.join(', ')})`);
    });
  }
  
  const passed = results.length === testCase.expectedCount;
  console.log(`  Result: ${passed ? 'PASS' : 'FAIL'}`);
  console.log('');
});

console.log('Shift search test completed!'); 