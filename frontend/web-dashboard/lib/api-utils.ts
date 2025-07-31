/**
 * Utility function to get the correct API URL for different environments
 * In production: https://api.pipelineworkforce.com/... (no /api prefix needed)
 * In local Docker: http://api:3001/...
 */
export function getApiUrl(endpoint: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  
  // For all environments, just append the endpoint
  // Production API is already at the correct base URL
  return `${baseUrl}${endpoint}`;
} 