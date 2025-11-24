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
    createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
    moveInDate: (data.moveInDate as Timestamp)?.toDate() || new Date(),
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
    'accommodationHouseType', 'accommodationFurniture', 'accommodationDescription'
  ];

  const allOptionalFields = profile.hasAccommodation === 'have-room' 
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
    location: profileData.location || '',
    university: profileData.university,
    district: profileData.district,
    moveInDate: profileData.moveInDate || new Date(),
    sleepSchedule: profileData.sleepSchedule || 'flexible',
    cleanlinessLevel: profileData.cleanlinessLevel || 'moderate',
    smokingPolicy: profileData.smokingPolicy || 'no-smoking',
    petPolicy: profileData.petPolicy || 'no-pets',
    
    // Optional fields
    sharedSpaceCleaning: profileData.sharedSpaceCleaning,
    noiseLevelPreference: profileData.noiseLevelPreference,
    overnightGuestPolicy: profileData.overnightGuestPolicy,
    partyFrequency: profileData.partyFrequency,
    studyHabits: profileData.studyHabits,
    socialProfile: profileData.socialProfile,
    cookingSkills: profileData.cookingSkills,
    wakeUpTime: profileData.wakeUpTime,
    guestPolicy: profileData.guestPolicy,
    interests: profileData.interests,
    bio: profileData.bio,
    
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
    createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
    moveInDate: (data.moveInDate as Timestamp)?.toDate() || new Date(),
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
}

/**
 * Check if user has completed required fields
 */
export function hasCompletedRequiredFields(profile: Partial<UserProfile>): boolean {
  const required = [
    profile.budgetMin && profile.budgetMin > 0,
    profile.budgetMax && profile.budgetMax > 0,
    profile.location && profile.location.trim() !== '',
    profile.moveInDate,
    profile.sleepSchedule,
    profile.cleanlinessLevel,
    profile.smokingPolicy,
    profile.petPolicy,
    profile.hasAccommodation,
  ];
  
  // Additional required fields for users who have accommodation
  if (profile.hasAccommodation === 'have-room') {
    required.push(
      profile.accommodationLocation && profile.accommodationLocation.trim() !== '',
      profile.accommodationSize,
      profile.accommodationHomeFees && profile.accommodationHomeFees.trim() !== ''
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
      createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
      updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
      moveInDate: (data.moveInDate as Timestamp)?.toDate() || new Date(),
    } as UserProfile);
  });
  
  return profiles;
}
