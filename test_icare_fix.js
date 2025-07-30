// Test script to verify Icare job data processing
const fs = require('fs');
const path = require('path');

// Mock the functions from the React components
const stateNameToCode = {
  'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR', 'california': 'CA',
  'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE', 'florida': 'FL', 'georgia': 'GA',
  'hawaii': 'HI', 'idaho': 'ID', 'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA',
  'kansas': 'KS', 'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
  'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS', 'missouri': 'MO',
  'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
  'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH',
  'oklahoma': 'OK', 'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT', 'vermont': 'VT',
  'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV', 'wisconsin': 'WI', 'wyoming': 'WY'
};

// Updated extractCityState function
const extractCityState = (location) => {
  if (!location || typeof location !== 'string') return { cityState: null, stateOnly: null };
  
  // First, try to extract city/state from the original location without aggressive cleaning
  // This preserves good location data like "171 Main St East Windsor, Connecticut, 06088 United States"
  
  // Try to match: ... City, ST ... (with optional ZIP and country)
  const cityStateMatch = location.match(/([A-Za-z .'-]+),\s*([A-Z]{2})(?:\s*,?\s*\d{5}(?:-\d{4})?\s*,?\s*(?:United States|USA|US)?)?$/i);
  if (cityStateMatch) {
    return { 
      cityState: `${cityStateMatch[1].trim()}, ${cityStateMatch[2].trim()}`,
      stateOnly: null
    };
  }
  
  // Try to match: ... City, State ... (with optional ZIP and country)
  const cityFullStateMatch = location.match(/([A-Za-z .'-]+),\s*([A-Za-z\s]+)(?:\s*,?\s*\d{5}(?:-\d{4})?\s*,?\s*(?:United States|USA|US)?)?$/i);
  if (cityFullStateMatch) {
    const city = cityFullStateMatch[1].trim();
    const fullState = cityFullStateMatch[2].trim();
    const stateCode = stateNameToCode[fullState.toLowerCase()];
    if (stateCode) {
      return { 
        cityState: `${city}, ${stateCode}`,
        stateOnly: null
      };
    }
  }
  
  // If the above didn't work, try a more flexible pattern that looks for city, state anywhere in the string
  const flexibleCityStateMatch = location.match(/([A-Za-z .'-]+),\s*([A-Z]{2})/);
  if (flexibleCityStateMatch) {
    return { 
      cityState: `${flexibleCityStateMatch[1].trim()}, ${flexibleCityStateMatch[2].trim()}`,
      stateOnly: null
    };
  }
  
  const flexibleCityFullStateMatch = location.match(/([A-Za-z .'-]+),\s*([A-Za-z\s]+)/);
  if (flexibleCityFullStateMatch) {
    const city = flexibleCityFullStateMatch[1].trim();
    const fullState = flexibleCityFullStateMatch[2].trim();
    const stateCode = stateNameToCode[fullState.toLowerCase()];
    if (stateCode) {
      return { 
        cityState: `${city}, ${stateCode}`,
        stateOnly: null
      };
    }
  }
  
  // If we still haven't found a good pattern, apply the original aggressive cleaning
  // Clean the location string - remove common unwanted patterns
  let cleanLocation = location
    .replace(/\d{5}(-\d{4})?/g, '') // Remove ZIP codes
    .replace(/\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Place|Pl|Court|Ct|Way|Terrace|Ter)/gi, '') // Remove street addresses
    .replace(/\b(?:United States|USA|US)\b/gi, '') // Remove country names
    .replace(/,\s*,/g, ',') // Remove double commas
    .replace(/^\s*,\s*|\s*,\s*$/g, '') // Remove leading/trailing commas
    .trim();
  
  // Try to match: ... City, ST ...
  const cleanCityStateMatch = cleanLocation.match(/([A-Za-z .'-]+),\s*([A-Z]{2})(?:\s|,|$)/);
  if (cleanCityStateMatch) {
    return { 
      cityState: `${cleanCityStateMatch[1].trim()}, ${cleanCityStateMatch[2].trim()}`,
      stateOnly: null
    };
  }
  
  // Try to match: ... City, State ...
  const cleanCityFullStateMatch = cleanLocation.match(/([A-Za-z .'-]+),\s*([A-Za-z\s]+)(?:\s|,|$)/);
  if (cleanCityFullStateMatch) {
    const city = cleanCityFullStateMatch[1].trim();
    const fullState = cleanCityFullStateMatch[2].trim();
    const stateCode = stateNameToCode[fullState.toLowerCase()];
    if (stateCode) {
      return { 
        cityState: `${city}, ${stateCode}`,
        stateOnly: null
      };
    }
  }
  
  // Try to extract just state if no city, state pattern found
  const stateMatch = cleanLocation.match(/\b([A-Z]{2})\b/);
  if (stateMatch) {
    return { cityState: null, stateOnly: stateMatch[1] };
  }
  
  // Try to match full state names and convert to codes
  const locationLower = cleanLocation.toLowerCase().trim();
  for (const [stateName, stateCode] of Object.entries(stateNameToCode)) {
    if (locationLower === stateName || locationLower.includes(stateName)) {
      return { cityState: null, stateOnly: stateCode };
    }
  }
  
  // If we have a long location string, try to extract just the last part as city
  if (cleanLocation.length > 30) {
    const parts = cleanLocation.split(',').map(part => part.trim()).filter(part => part.length > 0);
    if (parts.length >= 2) {
      const lastPart = parts[parts.length - 1];
      const secondLastPart = parts[parts.length - 2];
      
      // Check if last part is a state code
      if (/^[A-Z]{2}$/i.test(lastPart)) {
        return { cityState: `${secondLastPart}, ${lastPart.toUpperCase()}`, stateOnly: null };
      }
      
      // Check if last part is a full state name
      const stateCode = stateNameToCode[lastPart.toLowerCase()];
      if (stateCode) {
        return { cityState: `${secondLastPart}, ${stateCode}`, stateOnly: null };
      }
    }
  }
  
  return { cityState: null, stateOnly: null };
};

// Updated parseFacilityFromCompany function
const parseFacilityFromCompany = (company, description, location) => {
  if (!company) return '';
  
  const companyLower = company.toLowerCase();
  const descriptionLower = description.toLowerCase();
  const locationLower = (typeof location === 'string' ? location : '').toLowerCase();
  
  // Multi-site parent companies and their facility patterns
  const parentCompanyPatterns = {
    'icare health network': {
      patterns: [
        // Touchpoints facilities
        /touchpoints at chestnut/gi,
        /touchpoints at bloomfield/gi,
        /touchpoints at manchester/gi,
        /touchpoints at farmington/gi,
        /touchpoints at newington/gi,
        /touchpoints at waterbury/gi,
        /touchpoints at torrington/gi,
        /touchpoints at southport/gi,
        /touchpoints at new haven/gi,
        /touchpoints at west haven/gi,
        /touchpoints at waterbury center/gi,
        /touchpoints at torrington center/gi,
        /touchpoints at southport center/gi,
        /touchpoints at new haven center/gi,
        /touchpoints at west haven center/gi,
        
        // Trinity Hill facilities
        /trinity hill care/gi,
        /trinity hill care center/gi,
        /trinity hill/gi,
        
        // Westside facilities
        /westside care center/gi,
        /westside/gi,
        
        // MissionCare facilities
        /missioncare at holyoke/gi,
        /missioncare/gi,
        
        // Parkville facilities
        /parkville care center/gi,
        /parkville/gi,
        
        // Silver Springs facilities
        /silver springs care center/gi,
        /silver springs/gi,
        
        // Other specific Icare facilities
        /60 west/gi,
        /60 west st/gi,
        /60 west street/gi,
        
        // General Icare patterns
        /icare health network/gi,
        /icare/gi
      ],
      fallback: 'iCare Health Network'
    }
  };
  
  // Check if this is a known parent company
  for (const [parentCompany, config] of Object.entries(parentCompanyPatterns)) {
    if (companyLower.includes(parentCompany)) {
      // Look for facility patterns in description and location
      for (const pattern of config.patterns) {
        const match = descriptionLower.match(pattern) || locationLower.match(pattern);
        if (match) {
          // For patterns with capture groups, use the first capture group
          let facilityName = match[0];
          if (match[1]) {
            facilityName = match[1];
          }
          
          // Clean up the facility name
          facilityName = facilityName.trim();
          facilityName = facilityName.replace(/\s+/g, ' '); // Remove extra spaces
          
          // Proper capitalization
          facilityName = facilityName.replace(/\b\w/g, l => l.toUpperCase());
          
          // Validate it's not too short or too long
          if (facilityName.length >= 3 && facilityName.length <= 100) {
            return facilityName;
          }
        }
      }
      
      // If no specific facility found, return the fallback
      return config.fallback;
    }
  }
  
  // If not a known parent company, return the original company name
  return company;
};

// Test data from Icare jobs
const testJobs = [
  {
    title: "Business Office Manager",
    company: "Touchpoints at Chestnut",
    location: "171 Main St East Windsor, Connecticut, 06088 United States",
    description: "Touchpoints at Chestnut, a small home-like facility, is looking for a full-time Business Office Manager."
  },
  {
    title: "Business Office Manager",
    company: "Trinity Hill Care",
    location: "151 Hillside Avenue Hartford, Connecticut, 06106 United States",
    description: "Trinity Hill Care Center is seeking a Business Office Manager with longterm care billing experience."
  },
  {
    title: "Security Specialist",
    company: "Westside Care Center",
    location: "349 Bidwell St, Manchester, CT 06040, USA",
    description: "The primary role of the Security Specialist is to implement the facility's security program."
  },
  {
    title: "Vice President of Human Resources",
    company: "iCare Health Network",
    location: "341 Bidwell St Manchester, Connecticut, 06040 United States",
    description: "iCare Health Network offers a variety of career and volunteer opportunities."
  },
  {
    title: "Dietary Assistant",
    company: "Westside Care Center",
    location: "349 Bidwell St, Manchester, CT 06040, USA",
    description: "The primary role of the Dietary Assistant is to clean food preparation areas and dishes."
  },
  {
    title: "Licensed Practical Nurse (LPN) FREE HEALTH INSURANCE",
    company: "60 West",
    location: "60 West St, Rocky Hill, CT 06067, USA",
    description: "Find a home with iCare, not an agency. Licensed Practical Nurse (LPN)."
  }
];

console.log('Testing Icare job data processing...\n');

testJobs.forEach((job, index) => {
  console.log(`Job ${index + 1}: ${job.title}`);
  console.log(`Original Company: ${job.company}`);
  console.log(`Original Location: ${job.location}`);
  
  // Test location extraction
  const locationResult = extractCityState(job.location);
  console.log(`Extracted Location: ${locationResult.cityState || locationResult.stateOnly || 'None'}`);
  
  // Test company parsing
  const companyResult = parseFacilityFromCompany(job.company, job.description, job.location);
  console.log(`Parsed Company: ${companyResult}`);
  
  console.log('---');
});

console.log('\nTest completed!'); 