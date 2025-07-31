/**
 * Utility function to get the correct API URL for different environments
 * In production: https://api.pipelineworkforce.com/api/...
 * In local Docker: http://api:3001/...
 */
export function getApiUrl(endpoint: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  
  // If baseUrl contains 'api.pipelineworkforce.com', it's production
  // and we need to add /api/ prefix
  if (baseUrl?.includes('api.pipelineworkforce.com')) {
    return `${baseUrl}/api${endpoint}`;
  }
  
  // For local Docker environment, just append the endpoint
  return `${baseUrl}${endpoint}`;
} 