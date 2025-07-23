// Simple test for location validation functionality
// This simulates the location validation logic

function calculateStringSimilarity(str1, str2) {
  const matrix = [];
  const len1 = str1.length;
  const len2 = str2.length;

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + 1
        );
      }
    }
  }

  const maxLen = Math.max(len1, len2);
  return maxLen === 0 ? 0 : matrix[len1][len2] / maxLen;
}

function normalizeCityName(cityName) {
  return cityName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

// Test cases
const testCases = [
  { input: 'Hartford', state: 'CT', expected: 'Hartford' },
  { input: 'Hartfrd', state: 'CT', expected: 'Hartford' }, // Typo
  { input: 'New York', state: 'NY', expected: 'New York' },
  { input: 'Nw York', state: 'NY', expected: 'New York' }, // Typo
  { input: 'Boston', state: 'MA', expected: 'Boston' },
  { input: 'Bston', state: 'MA', expected: 'Boston' }, // Typo
  { input: 'Bridgeport', state: 'CT', expected: 'Bridgeport' },
  { input: 'Bridgeprt', state: 'CT', expected: 'Bridgeport' }, // Typo
];

// Mock cities data for Connecticut
const ctCities = [
  'Hartford', 'Bridgeport', 'Stamford', 'New Haven', 'Waterbury', 
  'Norwalk', 'Danbury', 'New Britain', 'Bristol', 'Meriden',
  'West Haven', 'Milford', 'Middletown', 'Norwich', 'Shelton'
];

console.log('Testing location validation logic...\n');

testCases.forEach((testCase, index) => {
  const normalizedInput = normalizeCityName(testCase.input);
  
  // Find the most similar city
  let bestMatch = ctCities[0];
  let bestSimilarity = calculateStringSimilarity(normalizedInput, normalizeCityName(ctCities[0]));
  
  ctCities.forEach(city => {
    const similarity = calculateStringSimilarity(normalizedInput, normalizeCityName(city));
    if (similarity < bestSimilarity) {
      bestSimilarity = similarity;
      bestMatch = city;
    }
  });
  
  const isExactMatch = normalizedInput === normalizeCityName(testCase.expected);
  const isCloseMatch = bestSimilarity < 0.3; // 70% similarity threshold
  
  console.log(`Test ${index + 1}:`);
  console.log(`  Input: "${testCase.input}", State: ${testCase.state}`);
  console.log(`  Expected: "${testCase.expected}"`);
  console.log(`  Found: "${bestMatch}" (similarity: ${(1 - bestSimilarity).toFixed(2)})`);
  console.log(`  Exact match: ${isExactMatch}`);
  console.log(`  Close match: ${isCloseMatch}`);
  console.log(`  Result: ${isExactMatch || isCloseMatch ? 'PASS' : 'FAIL'}`);
  console.log('');
});

console.log('Location validation test completed!'); 