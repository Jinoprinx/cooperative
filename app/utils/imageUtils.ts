/**
 * Utility function to get the correct image URL
 * Handles both local development and production URLs
 */
export function getImageUrl(imagePath: string | undefined): string | undefined {
  if (!imagePath) return undefined;

  // If it's already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    // If the frontend is communicating with a different backend in production vs local,
    // we should respect the NEXT_PUBLIC_API_URL, but for now, just return the exact URL provided by the backend.
    return imagePath;
  }

  // If it's a relative path, prepend the backend URL
  const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://coopbkend-acfb9cb075e5.herokuapp.com';
  return `${backendBaseUrl}/${imagePath.startsWith('/') ? imagePath.slice(1) : imagePath}`;
}