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
    'displayName', 'gender', 'birthYear', 'hometown', 'university',
    'sleepSchedule', 'cleanlinessLevel', 'noiseLevel', 'cookingSkills', 'guestPolicy', 'smokingPolicy', 'petPolicy',
    'accommodationStatus', 'accommodationSize', 'accommodationType', 'numberOfRoomates',
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
  const updates: any = {};
  
  // Initialize last_action to current date if it doesn't exist
  if (!data.last_action) {
    updates.last_action = serverTimestamp();
  }
  
  // DISABLED: Auto-hiding inactive profiles
  // This was causing all profiles to be hidden when fetched
  // TODO: Implement this as a separate background job instead of on every fetch
  /*
  else {
    // Check if last_action was 7 days ago or more
    const lastActionDate = data.last_action?.toDate ? data.last_action.toDate() : new Date(data.last_action);
    const currentDate = new Date();
    const daysDifference = Math.floor((currentDate.getTime() - lastActionDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // If inactive for 7+ days, set isVisible to false
    if (daysDifference >= 7 && data.isVisible !== false) {
      updates.isVisible = false;
      console.log(`[ProfileService] User ${userId} inactive for ${daysDifference} days, setting isVisible to false`);
    }
  }
  */
  
  // Apply updates if any
  if (Object.keys(updates).length > 0) {
    await updateDoc(profileRef, updates);
  }
  
  return {
    ...data,
    ...updates,
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
 * Relaxed version - only check truly essential fields for matching
 */
export function hasCompletedRequiredFields(profile: Partial<UserProfile>): boolean {
  // Check essential fields
  if (!profile.displayName || profile.displayName.trim() === '') return false;
  if (!profile.gender) return false;
  if (!profile.accommodationStatus) return false;
  
  // Must have at least one lifestyle preference for matching
  if (!profile.cleanlinessLevel && !profile.sleepSchedule && !profile.noiseLevel) return false;
  
  // Must have districts for location-based matching
  if (!profile.districts || profile.districts.length === 0) return false;
  
  // If have-room, must have accommodation fee
  if (profile.accommodationStatus === 'have-room') {
    if (profile.accommodationFee === undefined || profile.accommodationFee === null) return false;
  }
  
  return true;
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
    const currentProfile = await getProfile(currentUserId);
    const likedProfile = await getProfile(likedUserId);

    if (!currentProfile || !likedProfile) {
      return { success: false, isMatch: false };
    }

    const currentRef = doc(db, PROFILES_COLLECTION, currentUserId);
    const likedRef = doc(db, PROFILES_COLLECTION, likedUserId);

    // --- ALWAYS add to currentUser.likedUsers ---
    const newLikedUsers = new Set(currentProfile.likedUsers || []);
    newLikedUsers.add(likedUserId);

    // --- ALWAYS add to likedUser.likedBy ---
    const newLikedBy = new Set(likedProfile.likedBy || []);
    newLikedBy.add(currentUserId);

    // --- MATCH happens if likedUser previously liked currentUser ---
    const isMatch = (likedProfile.likedUsers || []).includes(currentUserId);

    console.log('[ProfileService] 🔍 Checking for match...');
    console.log('[ProfileService] Current user:', currentUserId);
    console.log('[ProfileService] Liked user:', likedUserId);
    console.log('[ProfileService] Liked user\'s likedUsers:', likedProfile.likedUsers);
    console.log('[ProfileService] Is match?', isMatch);

    // Update current user
    await updateDoc(currentRef, {
      likedUsers: Array.from(newLikedUsers),
      passedUsers: (currentProfile.passedUsers || []).filter(id => id !== likedUserId),
      ...(isMatch && {
        matches: [...(currentProfile.matches || []), likedUserId]
      }),
      updatedAt: serverTimestamp(),
      last_action: serverTimestamp(),
    });

    console.log('[ProfileService] ✅ Updated current user:', currentUserId);
    if (isMatch) {
      console.log('[ProfileService] ✅ Added', likedUserId, 'to current user\'s matches');
    }

    // Update liked user
    await updateDoc(likedRef, {
      likedBy: Array.from(newLikedBy),
      ...(isMatch && {
        matches: [...(likedProfile.matches || []), currentUserId]
      }),
      updatedAt: serverTimestamp(),
    });

    console.log('[ProfileService] ✅ Updated liked user:', likedUserId);
    if (isMatch) {
      console.log('[ProfileService] ✅ Added', currentUserId, 'to liked user\'s matches');
      console.log('[ProfileService] 🎉 MATCH COMPLETE! Both users\' profiles updated');
    }

    return { success: true, isMatch };
  } catch (error) {
    console.error("Error liking user:", error);
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
 * Mark a user as passed (swiped left)
 */
export async function passUser(
  currentUserId: string,
  passedUserId: string
): Promise<boolean> {
  try {
    const currentProfile = await getProfile(currentUserId);
    
    if (!currentProfile) {
      return false;
    }
    
    // Add to current user's passedUsers
    const updatedPassedUsers = [...(currentProfile.passedUsers || []), passedUserId];
    
    // Update current user's profile
    const currentUserRef = doc(db, PROFILES_COLLECTION, currentUserId);
    await updateDoc(currentUserRef, {
      passedUsers: updatedPassedUsers,
      updatedAt: serverTimestamp(),
      last_action: serverTimestamp(),
    });
    
    return true;
  } catch (error) {
    console.error('Error passing user:', error);
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

  const matchedSet = new Set(profile.matches || []);
  
  for (const likedId of profile.likedUsers) {
    if (matchedSet.has(likedId)) continue;

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

export async function getPassedProfiles(userId: string): Promise<UserProfile[]> {
  const profileRef = doc(db, PROFILES_COLLECTION, userId);
  const profileSnap = await getDoc(profileRef);

  if (!profileSnap.exists()) return [];

  const data = profileSnap.data();
  const passedIds: string[] = data.passedUsers || [];

  if (passedIds.length === 0) return [];

  const profiles: UserProfile[] = [];

  for (const id of passedIds) {
    const pRef = doc(db, PROFILES_COLLECTION, id);
    const pSnap = await getDoc(pRef);

    if (pSnap.exists()) {
      profiles.push({
        ...pSnap.data(),
        userId: id,
      } as UserProfile);
    }
  }

  return profiles;
}

export async function removeAllPassedUsers(userId: string): Promise<boolean> {
  try {
    const userRef = doc(db, PROFILES_COLLECTION, userId);
    await updateDoc(userRef, {
      passedUsers: [],
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error("Error deleting passed users:", error);
    return false;
  }
}