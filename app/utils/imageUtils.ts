/**
 * Utility function to get the correct image URL
 * Handles both local development and production URLs
 */
export function getImageUrl(imagePath: string | undefined): string | undefined {
  if (!imagePath) return undefined;

  // If it's already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    // Replace localhost with production URL if needed
    if (imagePath.includes('localhost:5000')) {
      return imagePath.replace('http://localhost:5000', 'https://coopbkend-acfb9cb075e5.herokuapp.com');
    }
    return imagePath;
  }

  // If it's a relative path, prepend the backend URL
  const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://coopbkend-acfb9cb075e5.herokuapp.com';
  return `${backendBaseUrl}/${imagePath.startsWith('/') ? imagePath.slice(1) : imagePath}`;
}