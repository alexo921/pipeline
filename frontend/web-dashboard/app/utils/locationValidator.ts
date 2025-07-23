interface CityData {
  id: number;
  state_code: string;
  state_name: string;
  city: string;
  county: string;
  latitude: number;
  longitude: number;
}

interface LocationValidationResult {
  isValid: boolean;
  originalCity: string;
  originalState: string;
  validatedCity: string;
  validatedState: string;
  distance?: number;
  isExactMatch: boolean;
  suggestions?: Array<{
    city: string;
    state: string;
    distance: number;
  }>;
}

class LocationValidator {
  private citiesData: CityData[] = [];
  private citiesByState: Map<string, CityData[]> = new Map();
  private citiesByName: Map<string, CityData[]> = new Map();
  private isLoaded = false;

  /**
   * Load cities data from the CSV file
   */
  async loadCitiesData(): Promise<void> {
    if (this.isLoaded) return;

    try {
      const response = await fetch('/us_cities.csv');
      const csvText = await response.text();
      const lines = csvText.split('\n').slice(1); // Skip header

      this.citiesData = lines
        .filter(line => line.trim())
        .map((line, index) => {
          const [id, state_code, state_name, city, county, latitude, longitude] = line.split(',');
          return {
            id: parseInt(id),
            state_code: state_code.trim(),
            state_name: state_name.trim(),
            city: city.trim(),
            county: county.trim(),
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude)
          };
        });

      // Build indexes for faster lookup
      this.buildIndexes();
      this.isLoaded = true;
    } catch (error) {
      console.error('Failed to load cities data:', error);
      throw new Error('Failed to load cities data');
    }
  }

  /**
   * Build indexes for faster city lookup
   */
  private buildIndexes(): void {
    // Index by state
    this.citiesByState.clear();
    this.citiesByName.clear();

    for (const city of this.citiesData) {
      // Index by state
      if (!this.citiesByState.has(city.state_code)) {
        this.citiesByState.set(city.state_code, []);
      }
      this.citiesByState.get(city.state_code)!.push(city);

      // Index by city name (normalized)
      const normalizedCityName = this.normalizeCityName(city.city);
      if (!this.citiesByName.has(normalizedCityName)) {
        this.citiesByName.set(normalizedCityName, []);
      }
      this.citiesByName.get(normalizedCityName)!.push(city);
    }
  }

  /**
   * Normalize city name for comparison
   */
  private normalizeCityName(cityName: string): string {
    return cityName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Validate city and state, return closest match if exact match not found
   */
  async validateLocation(city: string, state: string): Promise<LocationValidationResult> {
    await this.loadCitiesData();

    const normalizedCity = this.normalizeCityName(city);
    const normalizedState = state.toUpperCase().trim();

    // Check if state exists
    const stateCities = this.citiesByState.get(normalizedState);
    if (!stateCities) {
      return {
        isValid: false,
        originalCity: city,
        originalState: state,
        validatedCity: city,
        validatedState: state,
        isExactMatch: false
      };
    }

    // Look for exact city match in the state
    const exactMatch = stateCities.find(c => 
      this.normalizeCityName(c.city) === normalizedCity
    );

    if (exactMatch) {
      return {
        isValid: true,
        originalCity: city,
        originalState: state,
        validatedCity: exactMatch.city,
        validatedState: exactMatch.state_code,
        isExactMatch: true
      };
    }

    // Find closest city in the state
    const closestCity = this.findClosestCity(normalizedCity, stateCities);
    
    if (closestCity) {
      return {
        isValid: true,
        originalCity: city,
        originalState: state,
        validatedCity: closestCity.city.city,
        validatedState: closestCity.city.state_code,
        distance: closestCity.distance,
        isExactMatch: false,
        suggestions: this.getSuggestions(normalizedCity, stateCities, 5)
      };
    }

    return {
      isValid: false,
      originalCity: city,
      originalState: state,
      validatedCity: city,
      validatedState: state,
      isExactMatch: false
    };
  }

  /**
   * Find the closest city in a given state
   */
  private findClosestCity(targetCity: string, stateCities: CityData[]): { city: CityData; distance: number } | null {
    if (stateCities.length === 0) return null;

    // Use string similarity for cities without coordinates
    let closestCity = stateCities[0];
    let minDistance = this.calculateStringSimilarity(targetCity, this.normalizeCityName(stateCities[0].city));

    for (const city of stateCities) {
      const distance = this.calculateStringSimilarity(targetCity, this.normalizeCityName(city.city));
      if (distance < minDistance) {
        minDistance = distance;
        closestCity = city;
      }
    }

    // If we have coordinates, use geographic distance for cities with similar names
    const similarCities = stateCities.filter(city => 
      this.calculateStringSimilarity(targetCity, this.normalizeCityName(city.city)) < 0.3
    );

    if (similarCities.length > 0) {
      // For now, return the first similar city
      // In a more sophisticated implementation, you could use coordinates
      return {
        city: similarCities[0],
        distance: this.calculateStringSimilarity(targetCity, this.normalizeCityName(similarCities[0].city))
      };
    }

    return {
      city: closestCity,
      distance: minDistance
    };
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
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

  /**
   * Get suggestions for a city name
   */
  private getSuggestions(targetCity: string, stateCities: CityData[], limit: number = 5): Array<{ city: string; state: string; distance: number }> {
    const suggestions = stateCities
      .map(city => ({
        city: city.city,
        state: city.state_code,
        distance: this.calculateStringSimilarity(targetCity, this.normalizeCityName(city.city))
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);

    return suggestions;
  }

  /**
   * Get all cities in a state
   */
  async getCitiesInState(stateCode: string): Promise<CityData[]> {
    await this.loadCitiesData();
    return this.citiesByState.get(stateCode.toUpperCase()) || [];
  }

  /**
   * Get all states
   */
  async getAllStates(): Promise<Array<{ code: string; name: string }>> {
    await this.loadCitiesData();
    const states = new Map<string, string>();
    
    for (const city of this.citiesData) {
      states.set(city.state_code, city.state_name);
    }

    return Array.from(states.entries()).map(([code, name]) => ({ code, name }));
  }

  /**
   * Search cities by name (fuzzy search)
   */
  async searchCities(query: string, limit: number = 10): Promise<CityData[]> {
    await this.loadCitiesData();
    const normalizedQuery = this.normalizeCityName(query);

    const results = this.citiesData
      .map(city => ({
        city,
        similarity: this.calculateStringSimilarity(normalizedQuery, this.normalizeCityName(city.city))
      }))
      .filter(result => result.similarity < 0.5) // Only include reasonably similar matches
      .sort((a, b) => a.similarity - b.similarity)
      .slice(0, limit)
      .map(result => result.city);

    return results;
  }
}

// Export singleton instance
export const locationValidator = new LocationValidator();

// Export types
export type { LocationValidationResult, CityData }; 