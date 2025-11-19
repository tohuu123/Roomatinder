// Avatar Helper Functions

/**
 * Get the default avatar image
 */
export function getDefaultAvatar(): string {
  // Use SVG for better compatibility
  return '/avatar-default.svg';
}

/**
 * Get user's avatar URL with fallback to default
 */
export function getUserAvatar(photoURL?: string | null, identifier?: string): string {
  // If user has uploaded a photo, use it
  if (photoURL && photoURL.trim() !== '') {
    return photoURL;
  }
  
  // Return default avatar for all users without custom photo
  return getDefaultAvatar();
}
