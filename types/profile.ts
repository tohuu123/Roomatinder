// Profile Type Definitions for Roomatinder

export interface UserProfile {
  // User Basic Info
  userId: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  slug?: string; // URL-friendly username or normalized full name
  createdAt: Date;
  updatedAt: Date;

  // === REQUIRED FIELDS (Minimum Viable Profile) ===
  
  // Gender
  gender?: 'male' | 'female' | 'other';
  
  // Budget Range (VND per month)
  budgetMin: number;
  budgetMax: number;

  // Location / University
  location: string;
  university?: string;
  district?: string;

  // Move-in Date
  moveInDate: Date;

  // Sleep Schedule
  sleepSchedule: 'early-bird' | 'night-owl' | 'flexible';

  // Cleanliness Level
  cleanlinessLevel: 'very-clean' | 'clean' | 'moderate' | 'relaxed';

  // Smoking Policy
  smokingPolicy: 'no-smoking' | 'smoking-ok' | 'outdoor-only';

  // Pet Policy
  petPolicy: 'no-pets' | 'pets-ok' | 'have-pets';

  // === OPTIONAL FIELDS (Highly Recommended) ===
  
  // Shared Space Cleaning
  sharedSpaceCleaning?: 'daily' | 'weekly' | 'bi-weekly' | 'monthly' | 'as-needed';

  // Noise Level Preference
  noiseLevelPreference?: 'very-quiet' | 'quiet' | 'moderate' | 'lively';

  // Overnight Guest Policy
  overnightGuestPolicy?: 'never' | 'rarely' | 'sometimes' | 'often' | 'very-flexible';

  // Alcohol / Party Frequency
  partyFrequency?: 'never' | 'rarely' | 'monthly' | 'weekly' | 'often';

  // Study Habits
  studyHabits?: 'library' | 'home-quiet' | 'home-music' | 'flexible' | 'group-study';

  // Social Profile
  socialProfile?: 'introvert' | 'ambivert' | 'extrovert';

  // Cooking Skills
  cookingSkills?: 'no' | 'basic' | 'intermediate' | 'advanced';

  // Wake-up Time
  wakeUpTime?: string; // Format: "HH:mm"

  // Guest Policy (general)
  guestPolicy?: 'rarely' | 'sometimes' | 'often' | 'very-open';

  // === AI/LLM FIELDS (Text-Based) ===
  
  // Personal Interests & Hobbies (tags)
  interests?: string[];

  // Self Description / Bio
  bio?: string;

  // Profile Completion Percentage
  profileCompletion: number;
}

// Helper type for form fields
export type ProfileFormData = Omit<UserProfile, 'userId' | 'email' | 'createdAt' | 'updatedAt' | 'profileCompletion'>;

// Options for select fields
export const SLEEP_SCHEDULE_OPTIONS = [
  { value: 'early-bird', label: 'Early Bird (Sleep early, wake early)' },
  { value: 'night-owl', label: 'Night Owl (Sleep late, wake late)' },
  { value: 'flexible', label: 'Flexible' },
];

export const CLEANLINESS_OPTIONS = [
  { value: 'very-clean', label: 'Very Tidy' },
  { value: 'clean', label: 'Tidy' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'relaxed', label: 'Relaxed' },
];

export const SMOKING_OPTIONS = [
  { value: 'no-smoking', label: 'No Smoking' },
  { value: 'outdoor-only', label: 'Outdoor Only' },
  { value: 'smoking-ok', label: 'Smoking OK' },
];

export const PET_OPTIONS = [
  { value: 'no-pets', label: 'No Pets' },
  { value: 'pets-ok', label: 'Pets Allowed' },
  { value: 'have-pets', label: 'Have Pets' },
];

export const SHARED_CLEANING_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'bi-weekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'as-needed', label: 'As Needed' },
];

export const NOISE_LEVEL_OPTIONS = [
  { value: 'very-quiet', label: 'Very Quiet' },
  { value: 'quiet', label: 'Quiet' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'lively', label: 'Lively' },
];

export const GUEST_POLICY_OPTIONS = [
  { value: 'never', label: 'Never' },
  { value: 'rarely', label: 'Rarely' },
  { value: 'sometimes', label: 'Sometimes' },
  { value: 'often', label: 'Often' },
  { value: 'very-flexible', label: 'Very Flexible' },
];

export const PARTY_FREQUENCY_OPTIONS = [
  { value: 'never', label: 'Never' },
  { value: 'rarely', label: 'Rarely' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'often', label: 'Often' },
];

export const STUDY_HABITS_OPTIONS = [
  { value: 'library', label: 'Study at Library' },
  { value: 'home-quiet', label: 'Study at Home (Quiet)' },
  { value: 'home-music', label: 'Study at Home (With Music)' },
  { value: 'group-study', label: 'Group Study' },
  { value: 'flexible', label: 'Flexible' },
];

export const SOCIAL_PROFILE_OPTIONS = [
  { value: 'introvert', label: 'Introvert' },
  { value: 'ambivert', label: 'Ambivert' },
  { value: 'extrovert', label: 'Extrovert' },
];

export const COOKING_SKILLS_OPTIONS = [
  { value: 'no', label: "Can't Cook" },
  { value: 'basic', label: 'Basic' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

export const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

// Popular interests/hobbies tags
export const COMMON_INTERESTS = [
  'Reading', 'Movies', 'Music', 'Gaming', 'Sports',
  'Cooking', 'Travel', 'Photography', 'Drawing', 'Writing',
  'Yoga', 'Gym', 'Swimming', 'Running', 'Cycling',
  'Coffee', 'Tea', 'Gardening', 'Pets', 'Music',
];
