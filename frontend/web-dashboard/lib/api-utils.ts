/**
 * Utility function to get the correct API URL for different environments
 * In production: https://api.pipelineworkforce.com/... (no /api prefix needed)
 * In local Docker: http://localhost:3001/api/... (backend has global /api prefix)
 */
export function getApiUrl(endpoint: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  
  // For local Docker development, the backend has a global /api prefix
  // So we need to add /api before the endpoint
  if (process.env.NODE_ENV === 'development' && baseUrl?.includes('localhost')) {
    return `${baseUrl}/api${endpoint}`;
  }
  
  // For production, just append the endpoint
  return `${baseUrl}${endpoint}`;
} 