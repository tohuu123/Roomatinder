// Profile Type Definitions for Roomatinder

export interface UserProfile {
  // User Basic Info
  userId: string;
  email: string;
  photoURL?: string;
  nickname?: string;
  displayName?: string;
  slug?: string; // URL-friendly username or normalized full name
  isStudentVerified?: boolean; // Student verification status
  createdAt: Date;
  updatedAt: Date;
  
  // -------------------- General Info <First Part> --------------------
  
  // *photoURL
  // *Display Name
  gender?: 'male' | 'female';
  birthYear?: number;
  accommodationStatus?: 'looking' | 'have-room';
  
  // -------------------- Personal Information <Second Part> --------------------
  
  // Basic Info

  hometown?: string;
  // *email
  university?: string;
  bio?: string;

  // Lifestyle Preferences

  sleepSchedule?: 'early-bird' | 'night-owl' | 'flexible';
  cleanlinessLevel?: 'very-clean' | 'clean' | 'moderate' | 'relaxed';
  noiseLevel?: 'very-quiet' | 'quiet' | 'moderate' | 'lively';
  cookingSkills?: 'no' | 'basic' | 'intermediate' | 'advanced';
  guestPolicy?: 'never' | 'rarely' | 'sometimes' | 'often' | 'very-flexible';
  smokingPolicy?: 'no-smoking' | 'outdoor-only' | 'smoking-ok';
  petPolicy?: 'no-pets' | 'pets-ok' | 'have-pets';
  petType?: string; // Type of pet owned (if any)

  // Interests
  interests?: string[];

  // -------------------- Accommodation Preferences  <Third Part> --------------------

  // General Preferences
  districts?: string[]; // Preferred districts || accommodation districts
  accommodationType?: string[]; // e.g., apartment, house, studio
  accommodationSize?: string[]; // e.g., 1-bedroom, 2-bedrooms
  numberOfRoomates?: number; // Preferred number of roommates
  accommodationServices?: string[]; // e.g., wifi, parking, furnished
  liveWithLandlord?: 'yes' | 'no' | '';

  // Looking For Preferences
  budgetMin?: number;
  budgetMax?: number;

  // Having Accommodation Details
  accommodationFee?: number; // Monthly rent
  accommodationElectricityFee?: number;
  accommodationWaterFee?: number;
  accommodationServiceFee?: number;
  accommodationOtherFees?: string;

  accommodationServiceDescription?: string;
  roomImages?: string[]; // Array of room image URLs

  // -------------------- System Values --------------------

  // Profile Completion Percentage
  profileCompletion: number;
  
  // Visibility setting - whether user can be found by others
  isVisible?: boolean; // Default true if not set
  
  // Last action timestamp - updated when user likes/passes or creates a post
  last_action?: Date;
  
  // List of user IDs that this user has liked
  likedUsers?: string[];

  // List of user IDs that this user has disliked/unliked
  passedUsers?: string[];
  
  // List of user IDs that have liked this user
  likedBy?: string[];
  
  // List of matched user IDs (mutual likes)
  matches?: string[];

  // -------------------- Verification (Persona) --------------------
  
  // Identity verification using Persona
  verification?: {
    inquiryId?: string; // Persona inquiry ID
    status?: 'pending' | 'completed' | 'approved' | 'declined' | 'failed';
    isVerified?: boolean; // true if approved
    completedAt?: string; // ISO date string
    approvedAt?: string; // ISO date string
    declinedAt?: string; // ISO date string
    failedAt?: string; // ISO date string
  };
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

export const COOKING_SKILLS_OPTIONS = [
  { value: 'no', label: "Can't Cook" },
  { value: 'basic', label: 'Basic' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

export const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];

export const ACCOMMODATION_STATUS_OPTIONS = [
  { value: 'looking', label: 'Looking for accommodation' },
  { value: 'have-room', label: 'I have a room/place to share' },
];

export const ACCOMMODATION_SIZE_OPTIONS = [
  '1 Bedroom',
  '2 Bedrooms',
  '3 Bedrooms',
  '4 Bedrooms+',
  'House',
];

export const WITH_LANDLORD_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

// Common accommodation types
export const ACCOMMODATION_TYPE_OPTIONS = [
  'Apartment',
  'House',
  'Shared House',
];

// Common accommodation services
export const ACCOMMODATION_SERVICE_OPTIONS = [
  'WiFi',
  'Parking',
  'Furnished',
  'Air Conditioning',
  'Washing Machine',
  'Kitchen',
  'Elevator',
  'Fingerprint Access',
  'Password Access',
  'Security',
  'Balcony',
  'Gym',
  'Swimming Pool',
];

// Districts in HCMC
export const HCMC_DISTRICTS = [
  'District 1', 'District 2', 'District 3', 'District 4', 'District 5',
  'District 6', 'District 7', 'District 8', 'District 9', 'District 10',
  'District 11', 'District 12', 'Binh Thanh', 'Tan Binh', 'Tan Phu',
  'Phu Nhuan', 'Go Vap', 'Binh Tan', 'Thu Duc', 'Cu Chi', 'Hoc Mon',
  'Binh Chanh', 'Nha Be', 'Can Gio',
];

// Popular interests/hobbies tags
export const COMMON_INTERESTS = [
  'Reading', 'Movies', 'Music', 'Gaming', 'Sports',
  'Cooking', 'Travel', 'Photography', 'Drawing', 'Writing',
  'Yoga', 'Gym', 'Swimming', 'Running', 'Cycling',
  'Coffee', 'Tea', 'Gardening', 'Pets',
];
