/**
 * Utility function to get the correct API URL for different environments
 * The backend always uses /api prefix, so we need to add it in all environments
 */
export function getApiUrl(endpoint: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  
  // Always add /api prefix since the backend uses global /api prefix
  return `${baseUrl}/api${endpoint}`;
} 