// Avatar Helper Functions

/**
 * Get the default avatar image
 */
export function getDefaultAvatar(): string {
  return '/avatarDefault.png';
}

/**
 * Get user's avatar URL with fallback to default
 */
export function getUserAvatar(photoURL?: string | null, identifier?: string): string {
  if (photoURL) {
    return photoURL;
  }
  
  // Return default avatar for all users without custom photo
  return getDefaultAvatar();
}
