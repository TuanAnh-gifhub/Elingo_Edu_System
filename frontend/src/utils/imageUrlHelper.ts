// Image URL Helper - Normalize image URLs

/**
 * Normalize image URL to ensure it's a valid URL
 * @param url - Image URL to normalize
 * @returns Normalized URL string
 */
export const normalizeImageUrl = (url: string | null | undefined): string => {
  if (!url) {
    return '';
  }

  // If URL is already a full URL (starts with http:// or https://), return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // If URL is a data URL (base64), return as is
  if (url.startsWith('data:')) {
    return url;
  }

  // If URL starts with /, it's a relative path
  if (url.startsWith('/')) {
    // TODO: Add base URL from environment variable if needed
    return url;
  }

  // Otherwise, assume it's a relative path and prepend /
  return `/${url}`;
};
