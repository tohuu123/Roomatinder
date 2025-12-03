// Profile Service for Firebase operations
import { db } from '@/firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  Timestamp,
  collection,
  query,
  where,
  getDocs 
} from 'firebase/firestore';
import { UserProfile, ProfileFormData } from '@/types/profile';
import { addProfileToChroma } from './actions/chromaActions';

const PROFILES_COLLECTION = 'profiles';

/**
 * Generate a URL-friendly slug from a name or email
 */
export function generateSlug(displayName?: string, email?: string): string {
  const base = displayName || email?.split('@')[0] || 'user';
  
  // Normalize Vietnamese characters and convert to ASCII
  const slug = base
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  
  return slug;
}

/**
 * Check if a slug is already taken
 */
export async function isSlugTaken(slug: string, excludeUserId?: string): Promise<boolean> {
  const profilesRef = collection(db, PROFILES_COLLECTION);
  const q = query(profilesRef, where('slug', '==', slug));
  const snapshot = await getDocs(q);
  
  if (excludeUserId) {
    return snapshot.docs.some(doc => doc.id !== excludeUserId);
  }
  
  return !snapshot.empty;
}

/**
 * Generate a unique slug by appending numbers if needed
 */
export async function generateUniqueSlug(displayName?: string, email?: string, userId?: string): Promise<string> {
  let slug = generateSlug(displayName, email);
  let counter = 1;
  
  while (await isSlugTaken(slug, userId)) {
    slug = `${generateSlug(displayName, email)}-${counter}`;
    counter++;
  }
  
  return slug;
}

/**
 * Get profile by slug
 */
export async function getProfileBySlug(slug: string): Promise<UserProfile | null> {
  const profilesRef = collection(db, PROFILES_COLLECTION);
  const q = query(profilesRef, where('slug', '==', slug));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    return null;
  }
  
  const doc = snapshot.docs[0];
  const data = doc.data();
  
  return {
    ...data,
    userId: doc.id,
  } as UserProfile;
}

// Helper to remove undefined values before sending to Firestore
function cleanForFirestore(obj: Record<string, any>) {
  const out: Record<string, any> = {};
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined) out[k] = v;
  });
  return out;
}

/**
 * Calculate profile completion percentage
 */
export function calculateProfileCompletion(profile: Partial<UserProfile>): number {
  const requiredFields = [
    'budgetMin', 'budgetMax', 'location', 'moveInDate',
    'sleepSchedule', 'cleanlinessLevel', 'smokingPolicy', 'petPolicy', 'hasAccommodation'
  ];
  
  const optionalFields = [
    'sharedSpaceCleaning', 'noiseLevelPreference', 'overnightGuestPolicy',
    'partyFrequency', 'studyHabits', 'socialProfile', 'cookingSkills',
    'wakeUpTime', 'guestPolicy', 'interests', 'bio'
  ];

  // Add accommodation details as optional fields if user has accommodation
  const accommodationFields = [
    'accommodationLocation', 'accommodationSize', 'accommodationHomeFees',
    'accommodationHomeFeesAmount', 'accommodationElectricityFees', 'accommodationWaterFees',
    'accommodationUtilitiesFees', 'accommodationAdditionalFees',
    'accommodationHouseType', 'accommodationFurniture', 'accommodationDescription'
  ];

  const allOptionalFields = profile.accommodationStatus === 'have-room' 
    ? [...optionalFields, ...accommodationFields]
    : optionalFields;

  let completed = 0;
  let total = requiredFields.length + allOptionalFields.length;
  
  // Required fields count (more weight)
  requiredFields.forEach(field => {
    if (profile[field as keyof UserProfile]) completed += 1.5;
  });
  
  // Optional fields count
  allOptionalFields.forEach(field => {
    const value = profile[field as keyof UserProfile];
    if (value && (Array.isArray(value) ? value.length > 0 : true)) {
      completed += 1;
    }
  });
  
  // Adjust total for weighted calculation
  total = requiredFields.length * 1.5 + allOptionalFields.length;
  
  return Math.round((completed / total) * 100);
}

/**
 * Create a new user profile
 */
export async function createProfile(
  userId: string,
  email: string,
  profileData: Partial<ProfileFormData>
): Promise<UserProfile> {
  const profileRef = doc(db, PROFILES_COLLECTION, userId);
  
  // Generate unique slug
  const slug = await generateUniqueSlug(profileData.displayName, email, userId);
  
  const newProfile: UserProfile = {
    userId,
    email,
    displayName: profileData.displayName,
    photoURL: profileData.photoURL,
    slug,
    
    // Required fields
    budgetMin: profileData.budgetMin || 0,
    budgetMax: profileData.budgetMax || 0,
    university: profileData.university,
    sleepSchedule: profileData.sleepSchedule || 'flexible',
    cleanlinessLevel: profileData.cleanlinessLevel || 'moderate',
    smokingPolicy: profileData.smokingPolicy || 'no-smoking',
    petPolicy: profileData.petPolicy || 'no-pets',
    
    // Optional fields
    cookingSkills: profileData.cookingSkills,
    guestPolicy: profileData.guestPolicy,
    interests: profileData.interests,
    bio: profileData.bio,
    
    // Matching fields
    likedUsers: [],
    likedBy: [],
    matches: [],
    
    createdAt: new Date(),
    updatedAt: new Date(),
    profileCompletion: 0,
  };
  
  newProfile.profileCompletion = calculateProfileCompletion(newProfile);

  const toSave = cleanForFirestore(newProfile);

  await setDoc(profileRef, {
    ...toSave,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  
  // Add profile to ChromaDB for vector-based search
  await addProfileToChroma(newProfile);
  
  return newProfile;
}

/**
 * Get user profile by ID
 */
export async function getProfile(userId: string): Promise<UserProfile | null> {
  const profileRef = doc(db, PROFILES_COLLECTION, userId);
  const profileSnap = await getDoc(profileRef);
  
  if (!profileSnap.exists()) {
    return null;
  }
  
  const data = profileSnap.data();
  
  return {
    ...data,
    userId,
  } as UserProfile;
}

/**
 * Update user profile
 */
export async function updateProfile(
  userId: string,
  updates: Partial<ProfileFormData>
): Promise<void> {
  const profileRef = doc(db, PROFILES_COLLECTION, userId);
  
  // Get current profile to calculate completion
  const currentProfile = await getProfile(userId);
  if (!currentProfile) {
    throw new Error('Profile not found');
  }
  
  // If displayName is being updated, regenerate slug
  let slug = currentProfile.slug;
  if (updates.displayName && updates.displayName !== currentProfile.displayName) {
    slug = await generateUniqueSlug(updates.displayName, currentProfile.email, userId);
  }
  
  const updatedProfile = { ...currentProfile, ...updates, slug };
  const profileCompletion = calculateProfileCompletion(updatedProfile);
  const toUpdate = cleanForFirestore({
    ...updates,
    slug,
    profileCompletion,
    updatedAt: serverTimestamp(),
  });

  await updateDoc(profileRef, toUpdate);
  
  // Update profile in ChromaDB for vector-based search
  await addProfileToChroma({ ...updatedProfile, profileCompletion });
}

/**
 * Check if user has completed required fields
 */
export function hasCompletedRequiredFields(profile: Partial<UserProfile>): boolean {
  const required = [
    profile.budgetMin && profile.budgetMin > 0,
    profile.budgetMax && profile.budgetMax > 0,
    profile.sleepSchedule,
    profile.cleanlinessLevel,
    profile.smokingPolicy,
    profile.petPolicy,
    profile.accommodationStatus,
  ];
  
  // Additional required fields for users who are looking for accommodation
  if (profile.accommodationStatus === 'looking') {
    required.push(
      profile.districts && profile.districts.length > 0
    );
  }
  
  // Additional required fields for users who have accommodation
  if (profile.accommodationStatus === 'have-room') {
    required.push(
      !!(profile.accommodationAddress && profile.accommodationAddress.trim() !== ''),
      !!profile.accommodationSize,
      !!(profile.accommodationFee !== undefined && profile.accommodationFee !== null)
    );
  }
  
  return required.every(field => !!field);
}

/**
 * Get all profiles for swipe view (excluding current user)
 */
export async function getAllProfiles(excludeUserId?: string): Promise<UserProfile[]> {
  const profilesRef = collection(db, PROFILES_COLLECTION);
  const snapshot = await getDocs(profilesRef);
  
  const profiles: UserProfile[] = [];
  
  snapshot.forEach((doc) => {
    // Exclude current user from results
    if (doc.id === excludeUserId) {
      return;
    }
    
    const data = doc.data();
    profiles.push({
      ...data,
      userId: doc.id,
    } as UserProfile);
  });
  
  return profiles;
}

/**
 * Like a user profile
 * If the other user has already liked this user, create a match
 */
export async function likeUser(
  currentUserId: string,
  likedUserId: string
): Promise<{ success: boolean; isMatch: boolean }> {
  try {
    // Get both profiles
    const currentProfile = await getProfile(currentUserId);
    const likedProfile = await getProfile(likedUserId);
    
    if (!currentProfile || !likedProfile) {
      return { success: false, isMatch: false };
    }
    
    // Check if already liked
    const alreadyLiked = currentProfile.likedUsers?.includes(likedUserId);
    if (alreadyLiked) {
      return { success: true, isMatch: false };
    }
    
    // Add to current user's likedUsers
    const updatedLikedUsers = [...(currentProfile.likedUsers || []), likedUserId];
    
    // Add current user to liked user's likedBy
    const updatedLikedBy = [...(likedProfile.likedBy || []), currentUserId];
    
    // Check if it's a match (the other user has already liked this user)
    const isMatch = likedProfile.likedUsers?.includes(currentUserId) || false;
    
    // Update current user's profile
    const currentUserRef = doc(db, PROFILES_COLLECTION, currentUserId);
    await updateDoc(currentUserRef, {
      likedUsers: updatedLikedUsers,
      ...(isMatch && {
        matches: [...(currentProfile.matches || []), likedUserId]
      }),
      updatedAt: serverTimestamp(),
    });
    
    // Update liked user's profile
    const likedUserRef = doc(db, PROFILES_COLLECTION, likedUserId);
    await updateDoc(likedUserRef, {
      likedBy: updatedLikedBy,
      ...(isMatch && {
        matches: [...(likedProfile.matches || []), currentUserId]
      }),
      updatedAt: serverTimestamp(),
    });
    
    return { success: true, isMatch };
  } catch (error) {
    console.error('Error liking user:', error);
    return { success: false, isMatch: false };
  }
}

/**
 * Unlike a user profile
 */
export async function unlikeUser(
  currentUserId: string,
  unlikedUserId: string
): Promise<boolean> {
  try {
    const currentProfile = await getProfile(currentUserId);
    const unlikedProfile = await getProfile(unlikedUserId);
    
    if (!currentProfile || !unlikedProfile) {
      return false;
    }
    
    // Remove from current user's likedUsers
    const updatedLikedUsers = (currentProfile.likedUsers || []).filter(
      id => id !== unlikedUserId
    );
    
    // Remove from unliked user's likedBy
    const updatedLikedBy = (unlikedProfile.likedBy || []).filter(
      id => id !== currentUserId
    );
    
    // Remove from matches if they were matched
    const wasMatch = currentProfile.matches?.includes(unlikedUserId);
    
    // Update current user's profile
    const currentUserRef = doc(db, PROFILES_COLLECTION, currentUserId);
    await updateDoc(currentUserRef, {
      likedUsers: updatedLikedUsers,
      ...(wasMatch && {
        matches: (currentProfile.matches || []).filter(id => id !== unlikedUserId)
      }),
      updatedAt: serverTimestamp(),
    });
    
    // Update unliked user's profile
    const unlikedUserRef = doc(db, PROFILES_COLLECTION, unlikedUserId);
    await updateDoc(unlikedUserRef, {
      likedBy: updatedLikedBy,
      ...(wasMatch && {
        matches: (unlikedProfile.matches || []).filter(id => id !== currentUserId)
      }),
      updatedAt: serverTimestamp(),
    });
    
    return true;
  } catch (error) {
    console.error('Error unliking user:', error);
    return false;
  }
}

/**
 * Get all matched profiles for a user
 */
export async function getMatches(userId: string): Promise<UserProfile[]> {
  const profile = await getProfile(userId);
  if (!profile || !profile.matches || profile.matches.length === 0) {
    return [];
  }
  
  const matches: UserProfile[] = [];
  
  for (const matchId of profile.matches) {
    const matchProfile = await getProfile(matchId);
    if (matchProfile) {
      matches.push(matchProfile);
    }
  }
  
  return matches;
}

/**
 * Get all profiles that the user has liked
 */
export async function getLikedProfiles(userId: string): Promise<UserProfile[]> {
  const profile = await getProfile(userId);
  if (!profile || !profile.likedUsers || profile.likedUsers.length === 0) {
    return [];
  }
  
  const likedProfiles: UserProfile[] = [];
  
  for (const likedId of profile.likedUsers) {
    const likedProfile = await getProfile(likedId);
    if (likedProfile) {
      likedProfiles.push(likedProfile);
    }
  }
  
  return likedProfiles;
}

/**
 * Get all profiles that have liked the user
 */
export async function getLikedByProfiles(userId: string): Promise<UserProfile[]> {
  const profile = await getProfile(userId);
  if (!profile || !profile.likedBy || profile.likedBy.length === 0) {
    return [];
  }
  
  const likedByProfiles: UserProfile[] = [];
  
  for (const likedById of profile.likedBy) {
    const likedByProfile = await getProfile(likedById);
    if (likedByProfile) {
      likedByProfiles.push(likedByProfile);
    }
  }
  
  return likedByProfiles;
}