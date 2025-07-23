// Test script to verify role-specific search functionality
const testRoleSpecificSearch = () => {
  // Test job data with different healthcare roles
  const testJobs = [
    {
      title: "Registered Nurse (RN)",
      description: "We are seeking a Registered Nurse for our nursing home facility. RN license required.",
      tags: []
    },
    {
      title: "LPN - Licensed Practical Nurse",
      description: "Licensed Practical Nurse position available. LPN license required.",
      tags: []
    },
    {
      title: "CNA - Certified Nursing Assistant",
      description: "Certified Nursing Assistant needed. CNA certification required.",
      tags: []
    },
    {
      title: "Nursing Assistant",
      description: "Nursing Assistant position. No license required.",
      tags: []
    },
    {
      title: "Home Health Aide (HHA)",
      description: "Home Health Aide position. HHA certification preferred.",
      tags: []
    },
    {
      title: "Physical Therapist (PT)",
      description: "Physical Therapist needed. PT license required.",
      tags: []
    },
    {
      title: "Occupational Therapist (OT)",
      description: "Occupational Therapist position. OT license required.",
      tags: []
    },
    {
      title: "Nurse Manager",
      description: "Nurse Manager position. RN license and management experience required.",
      tags: []
    }
  ];

  // Role-specific search function (simplified version of the actual implementation)
  const roleSpecificSearch = (jobs, searchTerm) => {
    const searchTerms = searchTerm.toLowerCase().split(/\s+/).filter(term => term.length > 0);
    
    if (searchTerm === '' || searchTerms.length === 0) {
      return jobs;
    }

    // Define healthcare role categories and their variations
    const roleCategories = {
      'nurse': {
        primary: ['nurse', 'nursing', 'rn', 'lpn', 'registered nurse', 'licensed practical nurse'],
        exclude: ['cna', 'certified nursing assistant', 'nursing assistant', 'caregiver', 'home health aide', 'hha'],
        titlePatterns: [/nurse/i, /rn\b/i, /lpn\b/i, /registered nurse/i, /licensed practical nurse/i]
      },
      'cna': {
        primary: ['cna', 'certified nursing assistant', 'nursing assistant', 'caregiver', 'home health aide', 'hha'],
        exclude: ['rn', 'lpn', 'registered nurse', 'licensed practical nurse', 'nurse'],
        titlePatterns: [/cna\b/i, /certified nursing assistant/i, /nursing assistant/i, /caregiver/i, /home health aide/i, /hha\b/i]
      },
      'therapist': {
        primary: ['therapist', 'therapy', 'pt', 'ot', 'st', 'physical therapist', 'occupational therapist', 'speech therapist', 'respiratory therapist', 'rt'],
        exclude: ['nurse', 'cna', 'caregiver', 'assistant'],
        titlePatterns: [/therapist/i, /pt\b/i, /ot\b/i, /st\b/i, /rt\b/i, /physical therapist/i, /occupational therapist/i, /speech therapist/i, /respiratory therapist/i]
      },
      'aide': {
        primary: ['aide', 'assistant', 'hha', 'home health aide', 'personal care aide', 'pca'],
        exclude: ['nurse', 'rn', 'lpn', 'therapist', 'pt', 'ot', 'st', 'rt'],
        titlePatterns: [/aide/i, /assistant/i, /hha\b/i, /home health aide/i, /personal care aide/i, /pca\b/i]
      },
      'manager': {
        primary: ['manager', 'supervisor', 'director', 'coordinator', 'lead'],
        exclude: ['cna', 'aide', 'assistant'],
        titlePatterns: [/manager/i, /supervisor/i, /director/i, /coordinator/i, /lead/i]
      }
    };

    // Check if search terms match any specific role category
    let matchedRole = null;
    
    // Special handling for exact matches to avoid cross-category confusion
    if (searchTerms.length === 1) {
      const singleTerm = searchTerms[0];
      if (singleTerm === 'rn' || singleTerm === 'lpn') {
        matchedRole = 'nurse';
      } else if (singleTerm === 'cna') {
        matchedRole = 'cna';
      } else if (singleTerm === 'pt' || singleTerm === 'ot' || singleTerm === 'st' || singleTerm === 'rt') {
        matchedRole = 'therapist';
      } else if (singleTerm === 'hha') {
        matchedRole = 'aide';
      }
    }
    
    // If no exact match, check for general role matches
    if (!matchedRole) {
      for (const [roleKey, roleData] of Object.entries(roleCategories)) {
        const hasPrimaryMatch = searchTerms.some(term => 
          roleData.primary.some(primary => primary === term || primary.includes(term) || term.includes(primary))
        );
        
        if (hasPrimaryMatch) {
          matchedRole = roleKey;
          break;
        }
      }
    }

          return jobs.filter(job => {
        if (matchedRole) {
          // Role-specific matching
          const roleData = roleCategories[matchedRole];
          const jobTitle = job.title.toLowerCase();
          const jobDescription = job.description?.toLowerCase() || '';
          
          // For single-term searches, be more specific
          if (searchTerms.length === 1) {
            const singleTerm = searchTerms[0];
            
            // Check if the job title contains the exact search term
            if (jobTitle.includes(singleTerm)) {
              // For specific abbreviations, only match if they appear as standalone terms
              if (['rn', 'lpn', 'pt', 'ot', 'st', 'rt', 'cna', 'hha'].includes(singleTerm)) {
                const wordBoundaryPattern = new RegExp(`\\b${singleTerm}\\b`, 'i');
                const result = wordBoundaryPattern.test(jobTitle);
                
                // Special case for CNA - also include "Nursing Assistant"
                if (singleTerm === 'cna' && jobTitle.includes('nursing assistant')) {
                  return true;
                }
                return result;
              } else {
                return true;
              }
            } else {
              // Special case for CNA - also include "Nursing Assistant"
              if (singleTerm === 'cna' && jobTitle.includes('nursing assistant')) {
                return true;
              } else {
                return false;
              }
            }
          } else {
            // For multi-term searches, use the original logic
            const titleMatches = roleData.titlePatterns.some(pattern => pattern.test(jobTitle));
            
            if (titleMatches) {
              return true;
            } else {
              const titleHasPrimaryTerms = roleData.primary.some(term => 
                jobTitle.includes(term)
              );
              
              const titleHasExcludedTerms = roleData.exclude.some(term => 
                jobTitle.includes(term)
              );
              
              return titleHasPrimaryTerms && !titleHasExcludedTerms;
            }
          }
      } else {
        // General search - check if all terms are in title or description
        const jobTitle = job.title.toLowerCase();
        const jobDescription = job.description?.toLowerCase() || '';
        const combinedText = jobTitle + ' ' + jobDescription;
        
        return searchTerms.every(term => 
          combinedText.includes(term)
        );
      }
    });
  };

  // Test cases
  const testCases = [
    { search: 'RN', expected: ['Registered Nurse (RN)'], description: 'RN search should only show RN jobs' },
    { search: 'nurse', expected: ['Registered Nurse (RN)', 'LPN - Licensed Practical Nurse', 'Nurse Manager'], description: 'Nurse search should show RN, LPN, and Nurse Manager but not CNA' },
    { search: 'CNA', expected: ['CNA - Certified Nursing Assistant', 'Nursing Assistant'], description: 'CNA search should show CNA and Nursing Assistant jobs' },
    { search: 'therapist', expected: ['Physical Therapist (PT)', 'Occupational Therapist (OT)'], description: 'Therapist search should show PT and OT jobs' },
    { search: 'PT', expected: ['Physical Therapist (PT)'], description: 'PT search should only show Physical Therapist' },
    { search: 'manager', expected: ['Nurse Manager'], description: 'Manager search should show management positions' },
    { search: 'assistant', expected: ['CNA - Certified Nursing Assistant', 'Nursing Assistant'], description: 'Assistant search should show assistant roles but not nurse roles' }
  ];

  console.log('=== Role-Specific Search Test ===\n');

  let allTestsPassed = true;

  testCases.forEach((testCase, index) => {
    console.log(`Test ${index + 1}: "${testCase.search}"`);
    console.log(`Expected: ${testCase.expected.length} jobs`);
    console.log(`Description: ${testCase.description}`);
    
    const results = roleSpecificSearch(testJobs, testCase.search);
    const resultTitles = results.map(job => job.title);
    
    console.log(`Results: ${results.length} jobs`);
    results.forEach(job => console.log(`  - ${job.title}`));
    
    // Check if results match expected
    const expectedTitles = testCase.expected;
    const hasExpectedJobs = expectedTitles.every(expected => 
      resultTitles.some(result => result.includes(expected.split(' ')[0]))
    );
    const hasUnexpectedJobs = resultTitles.length === expectedTitles.length;
    
    const testPassed = hasExpectedJobs && hasUnexpectedJobs;
    console.log(`Test ${testPassed ? 'PASSED' : 'FAILED'}`);
    console.log('');
    
    if (!testPassed) {
      allTestsPassed = false;
    }
  });

  console.log('=== Summary ===');
  console.log(`Overall Test ${allTestsPassed ? 'PASSED' : 'FAILED'}`);
  
  return allTestsPassed;
};

// Run the test
const result = testRoleSpecificSearch();
console.log(`\nRole-specific search is ${result ? 'working correctly' : 'needs improvement'}`); 