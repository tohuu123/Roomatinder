"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { getProfile, likeUser, passUser, hasCompletedRequiredFields } from "@/lib/profileService";
import { queryMatchingProfile } from "@/lib/chromaService";
import { createChat } from "@/lib/chatService";
import { UserProfile, HCMC_DISTRICTS } from "@/types/profile";
import { auth } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getUserAvatar } from "@/lib/avatarHelper";
import { useRouter } from "next/navigation";
import { createChatFromMatch, checkChatExists } from "@/lib/utils/matchHelper";
import { useUserChats } from "@/lib/hooks/useChat";
import { GreenHomeBackground } from "@/components/magicui/green-home-background";
import MapEmbed from "@/app/components/MapEmbed";
import { GoogleGenerativeAI } from "@google/generative-ai";


// Helper function to format field labels in English
function formatLabel(value: string): string {
  const translations: { [key: string]: string } = {
    'early-bird': 'Early Bird',
    'night-owl': 'Night Owl',
    'flexible': 'Flexible',
    'very-clean': 'Very Clean',
    'clean': 'Clean',
    'moderate': 'Moderate',
    'relaxed': 'Relaxed',
    'no-smoking': 'No Smoking',
    'smoking-ok': 'Smoking Allowed',
    'outdoor-only': 'Outdoor Only',
    'no-pets': 'No Pets',
    'pets-ok': 'Pets Allowed',
    'have-pets': 'Have Pets',
    'daily': 'Daily',
    'weekly': 'Weekly',
    'bi-weekly': 'Bi-weekly',
    'monthly': 'Monthly',
    'as-needed': 'As Needed',
    'very-quiet': 'Very Quiet',
    'quiet': 'Quiet',
    'lively': 'Lively',
    'never': 'Never',
    'rarely': 'Rarely',
    'sometimes': 'Sometimes',
    'often': 'Often',
    'very-flexible': 'Very Flexible',
    'library': 'Library',
    'home-quiet': 'Home (Quiet)',
    'home-music': 'Home (With Music)',
    'group-study': 'Group Study',
    'introvert': 'Introvert',
    'ambivert': 'Ambivert',
    'extrovert': 'Extrovert',
    'no': 'No',
    'basic': 'Basic',
    'intermediate': 'Intermediate',
    'advanced': 'Advanced',
  };
  return translations[value] || value;
}

// Helper function to format date in English
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }).format(date);
}

// Helper function to generate compatibility analysis using Gemini
async function generateCompatibilityAnalysis(
  currentUser: UserProfile,
  otherUser: UserProfile
): Promise<string> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      console.error('Gemini API key not found');
      return 'AI analysis unavailable. Please configure API key.';
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const prompt = `You are a roommate compatibility analyzer. Analyze the compatibility between you (the user) and this potential roommate.

Your Profile:
- Sleep Schedule: ${currentUser.sleepSchedule || 'Not specified'}
- Cleanliness: ${currentUser.cleanlinessLevel || 'Not specified'}
- Noise Level: ${currentUser.noiseLevel || 'Not specified'}
- Smoking Policy: ${currentUser.smokingPolicy || 'Not specified'}
- Guest Policy: ${currentUser.guestPolicy || 'Not specified'}
- Cooking Skills: ${currentUser.cookingSkills || 'Not specified'}
- Interests: ${currentUser.interests?.join(', ') || 'Not specified'}
- Accommodation: ${currentUser.accommodationStatus || 'Not specified'}

Their Profile:
- Sleep Schedule: ${otherUser.sleepSchedule || 'Not specified'}
- Cleanliness: ${otherUser.cleanlinessLevel || 'Not specified'}
- Noise Level: ${otherUser.noiseLevel || 'Not specified'}
- Smoking Policy: ${otherUser.smokingPolicy || 'Not specified'}
- Guest Policy: ${otherUser.guestPolicy || 'Not specified'}
- Cooking Skills: ${otherUser.cookingSkills || 'Not specified'}
- Interests: ${otherUser.interests?.join(', ') || 'Not specified'}
- Accommodation: ${otherUser.accommodationStatus || 'Not specified'}

Must ALWAYS put "**asterisks**" around important keywords and compatibility points to highlight them. 
Write short paragraphs for easy reading and easy understanding (simple words), avoid long sentences.

Write a structured analysis in 3 paragraphs (Write in no more than 3 sentences each) addressing "you and him/her":

**Paragraph 1 - Compatibility Strengths**: Describe what matches well between you two - the positive aspects that would make living together harmonious.

**Paragraph 2 - Potential Challenges**: Address what might cause trouble or conflict - areas where your preferences don't align.

**Paragraph 3 - Conclusion**: Provide an overall compatibility assessment and recommendation.

Only talk about important parts that impact living together.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating Gemini analysis:', error);
    return 'Unable to generate AI analysis at this time. Please try again later.';
  }
}

export default function HomePage() {
  const router = useRouter();
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingNext, setLoadingNext] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [seenUserIds, setSeenUserIds] = useState<string[]>([]);
  const [noMoreProfiles, setNoMoreProfiles] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [currentX, setCurrentX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState<UserProfile | null>(null);
  const [creatingChat, setCreatingChat] = useState<string | null>(null);
  const [fetchingProfile, setFetchingProfile] = useState(false);
  const [profileQueue, setProfileQueue] = useState<UserProfile[]>([]);
  const [showMap, setShowMap] = useState(false);
  const [showRoomPhotos, setShowRoomPhotos] = useState(false);
  const [initialBatchLoaded, setInitialBatchLoaded] = useState(false);
  const [isPreloading, setIsPreloading] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showMatchingInfo, setShowMatchingInfo] = useState(false);
  const [profileSimilarities, setProfileSimilarities] = useState<Record<string, number>>({});
  const [geminiAnalysis, setGeminiAnalysis] = useState<Record<string, string>>({});
  const [loadingGeminiAnalysis, setLoadingGeminiAnalysis] = useState<Record<string, boolean>>({});
  const [filterPreferences, setFilterPreferences] = useState({
    showHaveRoom: true,
    showLooking: true,
    showSmoking: true,
    showNonSmoking: true,
    showEarlyBird: true,
    showNightOwl: true,
    showFlexible: true,
    showQuiet: true,
    showModerate: true,
    showLoud: true,
    showNoGuests: true,
    showOccasionalGuests: true,
    showFrequentGuests: true,
    showVeryClean: true,
    showClean: true,
    showModerateClean: true,
    showRelaxed: true,
    selectedDistricts: [] as string[],
    minFee: null as number | null,
    maxFee: null as number | null,
  });
  const [tempFilters, setTempFilters] = useState(filterPreferences);

  // Get user's chats to check existing conversations
  const { chats } = useUserChats(currentUserId);

  // Build ChromaDB metadata filter from filter preferences
  const buildChromaFilter = (userProfile?: UserProfile | null): Record<string, any> | undefined => {
    const profile = userProfile || currentUserProfile;
    const conditions: any[] = [];

    // Hard filter: Same gender only (CRITICAL - must have profile)
    if (profile?.gender) {
      conditions.push({ gender: { "$eq": profile.gender } });
      console.log('[ChromaFilter] Adding gender filter:', profile.gender);
    } else {
      console.warn('[ChromaFilter] ⚠️ WARNING: No profile.gender - gender filter NOT applied!');
    }

    // Hard filter: Exclude have-room + have-room matches (CRITICAL)
    if (profile?.accommodationStatus === 'have-room') {
      conditions.push({ accommodationStatus: { "$ne": 'have-room' } });
      console.log('[ChromaFilter] Adding have-room exclusion filter');
    } else if (profile?.accommodationStatus) {
      console.log('[ChromaFilter] User is looking, no have-room exclusion needed');
    } else {
      console.warn('[ChromaFilter] ⚠️ WARNING: No accommodationStatus - have-room filter NOT applied!');
    }

    // Accommodation status filters
    const accommodationStatuses: string[] = [];
    if (filterPreferences.showHaveRoom) accommodationStatuses.push('have-room');
    if (filterPreferences.showLooking) accommodationStatuses.push('looking');
    
    console.log('[ChromaFilter] Accommodation filter preferences:', {
      showHaveRoom: filterPreferences.showHaveRoom,
      showLooking: filterPreferences.showLooking,
      statuses: accommodationStatuses
    });
    
    if (accommodationStatuses.length > 0 && accommodationStatuses.length < 2) {
      conditions.push({ accommodationStatus: { "$in": accommodationStatuses } });
      console.log('[ChromaFilter] Adding accommodation status filter:', accommodationStatuses);
    } else if (accommodationStatuses.length === 2) {
      console.log('[ChromaFilter] Both accommodation statuses selected, no filter added (show all)');
    } else {
      console.log('[ChromaFilter] No accommodation status selected - no results will match!');
    }

    // Smoking policy filters
    const smokingPolicies: string[] = [];
    if (filterPreferences.showSmoking) smokingPolicies.push('smoking-ok');
    if (filterPreferences.showNonSmoking) smokingPolicies.push('no-smoking', 'outdoor-only');
    if (smokingPolicies.length > 0 && smokingPolicies.length < 3) {
      conditions.push({ smokingPolicy: { "$in": smokingPolicies } });
    }

    // Sleep schedule filters
    const sleepSchedules: string[] = [];
    if (filterPreferences.showEarlyBird) sleepSchedules.push('early-bird');
    if (filterPreferences.showNightOwl) sleepSchedules.push('night-owl');
    if (filterPreferences.showFlexible) sleepSchedules.push('flexible');
    if (sleepSchedules.length > 0 && sleepSchedules.length < 3) {
      conditions.push({ sleepSchedule: { "$in": sleepSchedules } });
    }

    // Noise level filters
    const noiseLevels: string[] = [];
    if (filterPreferences.showQuiet) noiseLevels.push('quiet', 'very-quiet');
    if (filterPreferences.showModerate) noiseLevels.push('moderate');
    if (filterPreferences.showLoud) noiseLevels.push('lively');
    if (noiseLevels.length > 0 && noiseLevels.length < 4) {
      conditions.push({ noiseLevel: { "$in": noiseLevels } });
    }

    // Cleanliness level filters
    const cleanlinessLevels: string[] = [];
    if (filterPreferences.showVeryClean) cleanlinessLevels.push('very-clean');
    if (filterPreferences.showClean) cleanlinessLevels.push('clean');
    if (filterPreferences.showModerateClean) cleanlinessLevels.push('moderate');
    if (filterPreferences.showRelaxed) cleanlinessLevels.push('relaxed');
    
    console.log('[ChromaFilter] Cleanliness filter preferences:', {
      showVeryClean: filterPreferences.showVeryClean,
      showClean: filterPreferences.showClean,
      showModerateClean: filterPreferences.showModerateClean,
      showRelaxed: filterPreferences.showRelaxed,
      levels: cleanlinessLevels
    });
    
    if (cleanlinessLevels.length > 0 && cleanlinessLevels.length < 4) {
      conditions.push({ cleanlinessLevel: { "$in": cleanlinessLevels } });
      console.log('[ChromaFilter] Adding cleanliness filter:', cleanlinessLevels);
    } else if (cleanlinessLevels.length === 4) {
      console.log('[ChromaFilter] All cleanliness levels selected, no filter added (show all)');
    } else {
      console.log('[ChromaFilter] No cleanliness level selected - no results will match!');
    }

    // Guest policy filters
    const guestPolicies: string[] = [];
    if (filterPreferences.showNoGuests) guestPolicies.push('never', 'rarely');
    if (filterPreferences.showOccasionalGuests) guestPolicies.push('sometimes');
    if (filterPreferences.showFrequentGuests) guestPolicies.push('often', 'very-flexible');
    if (guestPolicies.length > 0 && guestPolicies.length < 5) {
      conditions.push({ guestPolicy: { "$in": guestPolicies } });
    }

    // Return combined filter or undefined if no conditions
    console.log('[ChromaFilter] ========== FINAL FILTER ==========');
    console.log('[ChromaFilter] Total conditions:', conditions.length);
    console.log('[ChromaFilter] Conditions:', JSON.stringify(conditions, null, 2));
    
    if (conditions.length === 0) {
      console.log('[ChromaFilter] No conditions - returning undefined (show all)');
      return undefined;
    }
    if (conditions.length === 1) {
      console.log('[ChromaFilter] Single condition - returning:', JSON.stringify(conditions[0]));
      return conditions[0];
    }
    
    const finalFilter = { "$and": conditions };
    console.log('[ChromaFilter] Multiple conditions - returning $and:', JSON.stringify(finalFilter, null, 2));
    console.log('[ChromaFilter] ====================================');
    return finalFilter;
  };

  const fetchProfileBatch = async (
    userId: string,
    excludeIds: string[],
    batchSize = 1 // Always fetch 3 profiles at a time
  ): Promise<{ profiles: UserProfile[], queriedIds: string[] }> => {
    console.log(`[Fetch] Starting fetchProfileBatch for user ${userId}, batchSize=${batchSize}, excludeIds=${excludeIds.length}`);
    const newProfiles: UserProfile[] = [];
    const currentUserProfile = await getProfile(userId);
    
    if (!currentUserProfile) {
      console.warn("[Fetch] Current user profile not found. Cannot fetch profiles.");
      return { profiles: [], queriedIds: [] };
    }
    
    // CRITICAL: Verify user profile has required fields for hard filters
    if (!currentUserProfile.gender) {
      console.error("[Fetch] ❌ CRITICAL: Current user has no gender! Hard filter will fail!");
    }
    if (!currentUserProfile.accommodationStatus) {
      console.error("[Fetch] ❌ CRITICAL: Current user has no accommodationStatus! Hard filter will fail!");
    }
    
    console.log("[Fetch] Current user profile loaded:", {
      userId: currentUserProfile.userId,
      gender: currentUserProfile.gender,
      accommodationStatus: currentUserProfile.accommodationStatus
    });

    // Build comprehensive exclude list: self + already seen + liked + passed
    const comprehensiveExcludeIds = [
      userId,
      ...excludeIds,
      ...(currentUserProfile.likedUsers || []),
      ...(currentUserProfile.passedUsers || [])
    ];

    // Remove duplicates
    const uniqueExcludeIds = Array.from(new Set(comprehensiveExcludeIds));
    
    console.log(`[Fetch] Fetching ${batchSize} profiles, excluding ${uniqueExcludeIds.length} IDs`);
    console.log(`[Fetch] Liked users:`, currentUserProfile.likedUsers?.length || 0);
    console.log(`[Fetch] Passed users:`, currentUserProfile.passedUsers?.length || 0);
    console.log(`[Fetch] First 10 excluded IDs:`, uniqueExcludeIds.slice(0, 10));
    console.log(`[Fetch] Current filters:`, filterPreferences);
    
    // Build ChromaDB metadata filter using the fetched currentUserProfile (not state)
    const chromaFilter = buildChromaFilter(currentUserProfile);
    console.log('[Fetch] ChromaDB filter:', JSON.stringify(chromaFilter, null, 2));
    
    let attempts = 0;
    const maxAttempts = batchSize * 10; // Increased for safety
    const queriedIds = new Set<string>(); // Track all IDs we've queried, even if filtered out

    while (newProfiles.length < batchSize && attempts < maxAttempts) {
      attempts++;
      
      // Pass current exclude list + all fetched IDs in this batch + all queried IDs
      // Deduplicate to avoid issues with ChromaDB $nin filter
      const currentExcludeList = Array.from(new Set([
        ...uniqueExcludeIds,
        ...newProfiles.map(p => p.userId),
        ...Array.from(queriedIds)
      ]));
      
      const result = await queryMatchingProfile(userId, currentExcludeList, chromaFilter);

      if (!result?.userId) {
        console.log("[Fetch] No more profiles from ChromaDB");
        break;
      }

      const matchedId = result.userId;
      
      // CRITICAL: Skip if this ID was already queried (ChromaDB $nin filter sometimes fails)
      if (queriedIds.has(matchedId)) {
        console.warn(`[Fetch] Skipping already queried ID: ${matchedId}`);
        continue;
      }
      
      // Add to queried IDs immediately to prevent re-querying
      queriedIds.add(matchedId);
      
      // Safety check: Verify ID is not in exclude list (ChromaDB filter should have handled this)
      if (currentExcludeList.includes(matchedId)) {
        console.error(`[Fetch] ❌ ERROR: ChromaDB returned excluded ID ${matchedId}.`);
        console.error(`[Fetch] Is in likedUsers:`, currentUserProfile.likedUsers?.includes(matchedId));
        console.error(`[Fetch] Is in passedUsers:`, currentUserProfile.passedUsers?.includes(matchedId));
        console.error(`[Fetch] Skipping this profile.`);
        continue;
      }
      
      // Additional safety check: Verify not in liked or passed arrays
      if (currentUserProfile.likedUsers?.includes(matchedId) || currentUserProfile.passedUsers?.includes(matchedId)) {
        console.error(`[Fetch] ❌ CRITICAL: Profile ${matchedId} is in liked/passed but ChromaDB returned it!`);
        console.error(`[Fetch] In likedUsers:`, currentUserProfile.likedUsers?.includes(matchedId));
        console.error(`[Fetch] In passedUsers:`, currentUserProfile.passedUsers?.includes(matchedId));
        continue;
      }

      // Load profile details from Firebase
      const prof = await getProfile(matchedId);
      if (!prof) {
        console.log("[Fetch] ❌ Profile not found in Firebase:", matchedId);
        continue;
      }

      // Skip ADMIN profiles
      if (prof.displayName?.toUpperCase() === "ADMIN" || prof.nickname?.toUpperCase() === "ADMIN") {
        console.log("[Fetch] ❌ Skipping ADMIN profile:", matchedId);
        continue;
      }

      // Skip invisible profiles (users who don't want to be found)
      if (prof.isVisible === false) {
        console.log("[Fetch] ❌ Skipping invisible profile:", matchedId);
        continue;
      }

      // Skip profiles that haven't completed required fields
      const isComplete = hasCompletedRequiredFields(prof);
      if (!isComplete) {
        console.log("[Fetch] ❌ Profile incomplete, skipping:", matchedId, {
          hasGender: !!prof.gender,
          hasAccommodationStatus: !!prof.accommodationStatus,
          hasDistricts: !!(prof.districts && prof.districts.length > 0),
          displayName: prof.displayName || prof.nickname
        });
        continue;
      }

      // Store similarity score for this profile
      setProfileSimilarities(prev => ({ ...prev, [matchedId]: result.similarity }));

      // Check if this profile is already in the batch or seen before (extra safety)
      if (newProfiles.some(p => p.userId === prof.userId)) {
        console.log("[Fetch] Duplicate profile in batch detected, skipping:", matchedId);
        continue;
      }
      
      // Additional check: verify not already in exclude list or seen IDs
      if (excludeIds.includes(prof.userId) || uniqueExcludeIds.includes(prof.userId)) {
        console.log("[Fetch] Profile in exclude list, skipping:", matchedId);
        continue;
      }

      // Check if profile passes district and fee filter (complex checks not handled by ChromaDB)
      if (!passesDistrictAndFeeFilter(prof)) {
        console.log(`[Fetch] Profile filtered out by district/fee: ${matchedId}`, {
          districts: prof.districts,
          fee: prof.accommodationFee,
          selectedDistricts: filterPreferences.selectedDistricts,
          minFee: filterPreferences.minFee,
          maxFee: filterPreferences.maxFee
        });
        continue;
      }

      console.log("[Fetch] Added profile to batch:", matchedId, `(${newProfiles.length + 1}/${batchSize})`);
      newProfiles.push(prof);
    }

    console.log(`[Fetch] Batch complete: ${newProfiles.length} profiles fetched in ${attempts} attempts`);
    console.log(`[Fetch] Queried ${queriedIds.size} profiles total, ${newProfiles.length} passed filters`);
    console.log(`[Fetch] Filtered out: ${queriedIds.size - newProfiles.length} profiles`);
    
    // If we hit max attempts and got 0 profiles, log it clearly
    if (newProfiles.length === 0 && attempts >= maxAttempts) {
      console.warn(`[Fetch] Exhausted max attempts (${maxAttempts}) without finding matching profiles`);
      console.warn(`[Fetch] All ${queriedIds.size} queried profiles were filtered out`);
    }
    
    return {
      profiles: newProfiles,
      queriedIds: Array.from(queriedIds)
    };
  };

  // Simplified filter for district and fee (complex array/range checks not supported by ChromaDB)
  const passesDistrictAndFeeFilter = (profile: UserProfile, filtersToUse = filterPreferences): boolean => {
    
    // Accommodation status filter
    if (profile.accommodationStatus) {
      const allowedStatuses: string[] = [];
      if (filtersToUse.showHaveRoom) allowedStatuses.push('have-room');
      if (filtersToUse.showLooking) allowedStatuses.push('looking');
      
      // If at least one status is selected (not both), check if profile matches
      if (allowedStatuses.length > 0 && allowedStatuses.length < 2) {
        if (!allowedStatuses.includes(profile.accommodationStatus)) {
          console.log(`[Filter Accommodation] ❌ Filtering out ${profile.userId} - accommodation status "${profile.accommodationStatus}" not in allowed: ${allowedStatuses.join(', ')}`);
          return false;
        }
      }
    }

    // District filters (apply when specific districts are selected for either have-room or looking profiles)
    if (filtersToUse.selectedDistricts.length > 0 && profile.districts && profile.districts.length > 0) {
      console.log(`[Filter District] Checking profile ${profile.userId} (${profile.accommodationStatus})`);
      console.log(`[Filter District] Profile districts:`, profile.districts);
      console.log(`[Filter District] Selected filters:`, filtersToUse.selectedDistricts);
      
      // Normalize district name to handle both "District X" and "Quận X" formats
      const normalizeDistrict = (district: string): string => {
        return district.toLowerCase().trim()
          .replace(/^district\s*/i, '')
          .replace(/^quận\s*/i, '')
          .replace(/^qu[aậ]n\s*/i, '')
          .trim();
      };
      
      // Check if any of the profile's districts match any of the selected filters
      const hasMatchingDistrict = profile.districts.some(profileDistrict => {
        const normalizedProfile = normalizeDistrict(profileDistrict);
        
        return filtersToUse.selectedDistricts.some(filterDistrict => {
          const normalizedFilter = normalizeDistrict(filterDistrict);
          
          // Compare normalized values (e.g., "1" === "1" or "binh thanh" === "binh thanh")
          const match = normalizedProfile === normalizedFilter;
          console.log(`[Filter District] Comparing "${profileDistrict}" (normalized: "${normalizedProfile}") === "${filterDistrict}" (normalized: "${normalizedFilter}") = ${match}`);
          return match;
        });
      });
      
      console.log(`[Filter District] Has match: ${hasMatchingDistrict}`);
      
      if (!hasMatchingDistrict) {
        console.log(`[Filter District] ❌ Filtering out ${profile.userId} - no matching district`);
        return false;
      }
    }

    // Fee range filters (only when have-room filter is active AND fee range is set)
    if (filtersToUse.showHaveRoom && profile.accommodationStatus === 'have-room') {
      if (profile.accommodationFee) {
        if (filtersToUse.minFee !== null && profile.accommodationFee < filtersToUse.minFee) {
          return false;
        }
        if (filtersToUse.maxFee !== null && profile.accommodationFee > filtersToUse.maxFee) {
          return false;
        }
      } else {
        // If fee filters are set but profile has no fee, exclude it
        if (filtersToUse.minFee !== null || filtersToUse.maxFee !== null) {
          return false;
        }
      }
    }

    // Cleanliness level filters
    if (profile.cleanlinessLevel) {
      const allowedLevels: string[] = [];
      if (filtersToUse.showVeryClean) allowedLevels.push('very-clean');
      if (filtersToUse.showClean) allowedLevels.push('clean');
      if (filtersToUse.showModerateClean) allowedLevels.push('moderate');
      if (filtersToUse.showRelaxed) allowedLevels.push('relaxed');
      
      // If at least one cleanliness level is selected (not all), check if profile matches
      if (allowedLevels.length > 0 && allowedLevels.length < 4) {
        if (!allowedLevels.includes(profile.cleanlinessLevel)) {
          console.log(`[Filter Cleanliness] ❌ Filtering out ${profile.userId} - cleanliness "${profile.cleanlinessLevel}" not in allowed: ${allowedLevels.join(', ')}`);
          return false;
        }
      }
    }

    // Smoking policy filters
    if (profile.smokingPolicy) {
      const allowedPolicies: string[] = [];
      if (filtersToUse.showSmoking) allowedPolicies.push('smoking-ok');
      if (filtersToUse.showNonSmoking) allowedPolicies.push('no-smoking', 'outdoor-only');
      
      if (allowedPolicies.length > 0 && allowedPolicies.length < 3) {
        if (!allowedPolicies.includes(profile.smokingPolicy)) {
          console.log(`[Filter Smoking] ❌ Filtering out ${profile.userId} - smoking policy "${profile.smokingPolicy}" not in allowed: ${allowedPolicies.join(', ')}`);
          return false;
        }
      }
    }

    // Sleep schedule filters
    if (profile.sleepSchedule) {
      const allowedSleep: string[] = [];
      if (filtersToUse.showEarlyBird) allowedSleep.push('early-bird');
      if (filtersToUse.showNightOwl) allowedSleep.push('night-owl');
      if (filtersToUse.showFlexible) allowedSleep.push('flexible');
      
      if (allowedSleep.length > 0 && allowedSleep.length < 3) {
        if (!allowedSleep.includes(profile.sleepSchedule)) {
          console.log(`[Filter Sleep] ❌ Filtering out ${profile.userId} - sleep "${profile.sleepSchedule}" not in allowed: ${allowedSleep.join(', ')}`);
          return false;
        }
      }
    }

    // Noise level filters
    if (profile.noiseLevel) {
      const allowedNoise: string[] = [];
      if (filtersToUse.showQuiet) allowedNoise.push('quiet', 'very-quiet');
      if (filtersToUse.showModerate) allowedNoise.push('moderate');
      if (filtersToUse.showLoud) allowedNoise.push('lively');
      
      if (allowedNoise.length > 0 && allowedNoise.length < 4) {
        if (!allowedNoise.includes(profile.noiseLevel)) {
          console.log(`[Filter Noise] ❌ Filtering out ${profile.userId} - noise "${profile.noiseLevel}" not in allowed: ${allowedNoise.join(', ')}`);
          return false;
        }
      }
    }

    // Guest policy filters
    if (!filtersToUse.showNoGuests && (profile.guestPolicy === 'never' || profile.guestPolicy === 'rarely')) {
      return false;
    }
    if (!filtersToUse.showOccasionalGuests && (profile.guestPolicy === 'sometimes')) {
      return false;
    }
    if (!filtersToUse.showFrequentGuests && (profile.guestPolicy === 'often' || profile.guestPolicy === 'very-flexible')) {
      return false;
    }

    return true;
  };

  // Function to load the next matching profile
  const loadNextProfile = async () => {    
    // Use a loop to avoid stack overflow from recursion
    while (profileQueue.length > 0) {
      console.log(`[Load] Using queued profile (${profileQueue.length} remaining)`);
      const next = profileQueue[0];
      const remainingQueue = profileQueue.slice(1);
      
      // Validate profile against current filters before showing
      if (!passesDistrictAndFeeFilter(next)) {
        console.log(`[Load] ❌ Profile ${next.userId} doesn't pass district/fee filters, skipping...`);
        setProfileQueue(remainingQueue);
        setSeenUserIds(prev => Array.from(new Set([...prev, next.userId])));
        // Continue to next profile in queue
        continue;
      }
      
      // Found a valid profile!
      setProfileQueue(remainingQueue);
      setCurrentProfile(next);
      setNoMoreProfiles(false); // Reset no more profiles flag when we have a profile
      
      // Update seenUserIds immediately with current profile to prevent it from being fetched again
      setSeenUserIds(prev => Array.from(new Set([...prev, next.userId])));
      
      // Preload more profiles when queue drops below 2 (and not already preloading)
      if (remainingQueue.length < 2 && currentUserId && !isPreloading) {
        setIsPreloading(true);
        
        // Build comprehensive exclude list using up-to-date values
        setSeenUserIds(currentSeenIds => {
          const queueIds = remainingQueue.map(p => p.userId);
          const allExcludeIds = Array.from(new Set([...currentSeenIds, next.userId, ...queueIds]));
          
          console.log(`[Load] Preloading with ${allExcludeIds.length} excluded IDs (${currentSeenIds.length} seen + ${queueIds.length} queued + 1 current)`);
          
          // Trigger preload with complete exclude list
          fetchProfileBatch(currentUserId, allExcludeIds, 1).then(result => {
            if (result.profiles.length > 0) {
              console.log(`[Load] Preloaded ${result.profiles.length} profile(s):`, result.profiles.map(p => p.userId));
              
              setProfileQueue(prevQueue => {
                // Get all existing IDs from current queue
                const existingIds = new Set([...prevQueue.map(p => p.userId), next.userId]);
                
                // Filter out any duplicates
                const newProfiles = result.profiles.filter(p => {
                  if (existingIds.has(p.userId)) {
                    console.warn(`[Load] DUPLICATE DETECTED: ${p.userId} already in queue or current, skipping`);
                    return false;
                  }
                  return true;
                });
                
                if (newProfiles.length < result.profiles.length) {
                  console.error(`[Load] Filtered out ${result.profiles.length - newProfiles.length} duplicate(s) from preload batch`);
                }
                
                return [...prevQueue, ...newProfiles];
              });
              
              setSeenUserIds(prevSeen => {
                const combined = [...prevSeen, ...result.profiles.map(p => p.userId), ...result.queriedIds];
                return Array.from(new Set(combined));
              });
            } else {
              console.log("[Load] No more profiles to preload");
              // Still add queried IDs even if no profiles matched filters
              if (result.queriedIds.length > 0) {
                setSeenUserIds(prevSeen => {
                  const combined = [...prevSeen, ...result.queriedIds];
                  return Array.from(new Set(combined));
                });
              }
            }
            setIsPreloading(false);
          }).catch(error => {
            console.error("[Load] Error preloading profiles:", error);
            setIsPreloading(false);
          });
          
          // Return current state (don't modify it here, just use it)
          return currentSeenIds;
        });
      }
      return; // Exit after successfully loading a profile
    }
    
    // If we get here, the while loop exhausted the queue without finding a valid profile
    console.log("[Load] All queued profiles were filtered out, fetching new batch...");

    
    if (!currentUserId) {
      console.log("[Load] No currentUserId");
      setNoMoreProfiles(true);
      setCurrentProfile(null);
      return;
    }

    const result = await fetchProfileBatch(currentUserId, seenUserIds, 3);

    if (result.profiles.length === 0) {
      console.log("[Load] No more profiles available - setting noMoreProfiles to true");
      setNoMoreProfiles(true);
      setCurrentProfile(null);
      // Add queried IDs even if no profiles matched
      if (result.queriedIds.length > 0) {
        setSeenUserIds(prev => {
          const combined = [...prev, ...result.queriedIds];
          return Array.from(new Set(combined));
        });
      }
      return;
    }

    // Load first profile, queue the rest (filter validation already done in fetchProfileBatch)
    console.log(`[Load] Loaded ${result.profiles.length} new profiles`);
    
    // Filter all profiles through validation before queueing
    const validProfiles = result.profiles.filter(p => {
      const passes = passesDistrictAndFeeFilter(p);
      if (!passes) {
        console.log(`[Load] ❌ Profile ${p.userId} doesn't pass client-side filters, excluding from batch`);
        setSeenUserIds(prev => Array.from(new Set([...prev, p.userId])));
      }
      return passes;
    });
    
    if (validProfiles.length > 0) {
      setCurrentProfile(validProfiles[0]);
      setProfileQueue(validProfiles.slice(1));
      setNoMoreProfiles(false); // Reset flag when we have profiles
    } else {
      console.log(`[Load] ⚠️ All ${result.profiles.length} profiles filtered out, no valid profiles to show`);
      setNoMoreProfiles(true);
      setCurrentProfile(null);
    }
    
    setSeenUserIds(prev => {
      const combined = [...prev, ...result.profiles.map(p => p.userId), ...result.queriedIds];
      return Array.from(new Set(combined));
    });
  };

  const Tag = ({
    label,
    icon,
    color,
    tooltip,
  }: {
    label: string;
    icon: string;
    color: string; // "blue" | "red" | "green" | etc.
    tooltip: string;
  }) => {
    const COLOR_MAP: Record<string, string> = {
      blue: "bg-blue-600/80 border-blue-400/50",
      red: "bg-red-600/80 border-red-400/50",
      purple: "bg-purple-600/80 border-purple-400/50",
      green: "bg-green-600/80 border-green-400/50",
      yellow: "bg-yellow-600/80 border-yellow-400/50",
      gray: "bg-gray-600/80 border-gray-400/50",
      emerald: "bg-emerald-600/80 border-emerald-400/50",
    };

    return (
      <div className="tooltip tooltip-left" data-tip={tooltip}>
        <div
          className={`text-sm font-medium px-2 py-1 rounded-full backdrop-blur-sm border flex items-center gap-1 cursor-default ${COLOR_MAP[color]}`}
        >
          <Icon icon={icon} className="w-4 h-4" />
          {label}
        </div>
      </div>
    );
  };

  // Load first profile on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log("[Auth] Logged in as:", user.uid);
        setCurrentUserId(user.uid);
        
        // Reset filters to default on every page load
        const defaultFilters = {
          showHaveRoom: true,
          showLooking: true,
          showSmoking: true,
          showNonSmoking: true,
          showEarlyBird: true,
          showNightOwl: true,
          showFlexible: true,
          showQuiet: true,
          showModerate: true,
          showLoud: true,
          showNoGuests: true,
          showOccasionalGuests: true,
          showFrequentGuests: true,
          showVeryClean: true,
          showClean: true,
          showModerateClean: true,
          showRelaxed: true,
          selectedDistricts: [] as string[],
          minFee: null as number | null,
          maxFee: null as number | null,
        };
        setFilterPreferences(defaultFilters);
        setTempFilters(defaultFilters);
        
        // Clear all seen profiles on page load
        setSeenUserIds([]);
        setProfileQueue([]);
        setCurrentProfile(null);
        setNoMoreProfiles(false);
        setProfileSimilarities({});
        
        // Reset initial batch loaded to allow fresh fetch
        setInitialBatchLoaded(false);

        const myProfile = await getProfile(user.uid);
        setCurrentUserProfile(myProfile);

        if (!myProfile) {
          console.warn("[Auth] User has no profile in Firebase. Please complete registration.");
          // Redirect to profile setup if needed
          // router.push('/register');
        }
      } else {
        console.log("[Auth] Not logged in");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Load initial profile when userId is available
  useEffect(() => {
    if (!currentUserId || initialBatchLoaded) {
      console.log("[Init] Skipping init - currentUserId:", !!currentUserId, "initialBatchLoaded:", initialBatchLoaded);
      return;
    }

    // Add a small delay on first load to ensure Firebase is fully initialized
    const timeoutId = setTimeout(async () => {
      const init = async () => {
        try {
          console.log("[Init] Fetching initial batch of profiles...");

          const result = await fetchProfileBatch(currentUserId, [], 3);

          if (result.profiles.length === 0) {
            console.log("[Init] No profiles found");
            setNoMoreProfiles(true);
            setLoading(false);
            setInitialBatchLoaded(true);
            return;
          }

          console.log(`[Init] Loaded ${result.profiles.length} initial profiles`);
          
          // Filter all profiles through validation before queueing
          const validProfiles = result.profiles.filter(p => {
            const passes = passesDistrictAndFeeFilter(p);
            if (!passes) {
              console.log(`[Init] ❌ Profile ${p.userId} doesn't pass client-side filters, excluding from batch`);
            }
            return passes;
          });
          
          if (validProfiles.length > 0) {
            setCurrentProfile(validProfiles[0]);
            setProfileQueue(validProfiles.slice(1));
          } else {
            console.log(`[Init] ⚠️ All ${result.profiles.length} profiles filtered out, no valid profiles to show`);
            setNoMoreProfiles(true);
            setCurrentProfile(null);
          }
          
          const combined = [...result.profiles.map(p => p.userId), ...result.queriedIds];
          setSeenUserIds(Array.from(new Set(combined)));

          setInitialBatchLoaded(true);
          setLoading(false);
        } catch (error) {
          console.error("[Init] Error fetching initial profiles:", error);
          setLoading(false);
          setInitialBatchLoaded(true);
          setNoMoreProfiles(true);
        }
      };

      init();
    }, 100); // Small delay to ensure everything is ready

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, initialBatchLoaded]);

  // Apply filters function
  const applyFilters = () => {
    console.log('[Filter] 🎯 Applying new filters...');
    console.log('[Filter] 📝 New filter preferences:', tempFilters);
    
    // Immediately reset everything
    console.log('[Filter] 🔄 Resetting profile queue and current profile...');
    setCurrentProfile(null);
    setProfileQueue([]);
    setSeenUserIds([]); // Reset to allow re-seeing profiles with new filters
    setNoMoreProfiles(false);
    setLoadingNext(true);
    
    // Apply the new filters (this will trigger the useEffect)
    setFilterPreferences(tempFilters);
    setShowFilterPanel(false);
    
    // Force fetch new profiles with new filters
    if (currentUserId) {
      console.log('[Filter] 📥 Fetching new profiles with updated filters...');
      fetchProfileBatch(currentUserId, [], 3).then(result => {
        if (result.profiles.length > 0) {
          console.log(`[Filter] ✅ Loaded ${result.profiles.length} new profiles`);
          
          // Filter all profiles through validation before queueing (use tempFilters since state hasn't updated yet)
          const validProfiles = result.profiles.filter(p => {
            const passes = passesDistrictAndFeeFilter(p, tempFilters);
            if (!passes) {
              console.log(`[Filter] ❌ Profile ${p.userId} doesn't pass client-side filters, excluding from batch`);
            }
            return passes;
          });
          
          if (validProfiles.length > 0) {
            setCurrentProfile(validProfiles[0]);
            setProfileQueue(validProfiles.slice(1));
          } else {
            console.log(`[Filter] ⚠️ All ${result.profiles.length} profiles filtered out, no valid profiles to show`);
            setNoMoreProfiles(true);
            setCurrentProfile(null);
          }
          setSeenUserIds(prev => {
            const combined = [...prev, ...result.profiles.map(p => p.userId), ...result.queriedIds];
            return Array.from(new Set(combined));
          });
          setNoMoreProfiles(false);
        } else {
          console.log('[Filter] ⚠️ No profiles match new filters');
          setNoMoreProfiles(true);
          if (result.queriedIds.length > 0) {
            setSeenUserIds(prev => {
              const combined = [...prev, ...result.queriedIds];
              return Array.from(new Set(combined));
            });
          }
        }
        setLoadingNext(false);
      }).catch(error => {
        console.error('[Filter] ❌ Error loading profiles:', error);
        setLoadingNext(false);
        setNoMoreProfiles(true);
      });
    }
  };

  // Reload profiles when filter preferences change
  useEffect(() => {
    // Don't run on initial mount or if user not loaded yet
    if (!currentUserId || !initialBatchLoaded || !currentUserProfile) {
      console.log("[Filter] Skipping filter effect - not ready yet", {
        currentUserId: !!currentUserId,
        initialBatchLoaded,
        currentUserProfile: !!currentUserProfile
      });
      return;
    }

    console.log("[Filter] Filter preferences changed, checking current profile...");

    // Check if current profile still passes the new filters (district and fee only, rest handled by ChromaDB)
    if (currentProfile) {
      const stillPasses = passesDistrictAndFeeFilter(currentProfile);
      console.log(`[Filter] Current profile ${currentProfile.userId} passes new filters: ${stillPasses}`);
      
      if (stillPasses) {
        console.log(`[Filter] ✅ Current profile ${currentProfile.userId} still passes new filters, keeping it`);
        
        // Keep current profile, but filter the queue
        const filteredQueue = profileQueue.filter(p => passesDistrictAndFeeFilter(p));
        console.log(`[Filter] Filtered queue: ${profileQueue.length} → ${filteredQueue.length} profiles`);
        setProfileQueue(filteredQueue);
        
        // If queue is too small, preload more
        if (filteredQueue.length < 2 && !isPreloading) {
          console.log("[Filter] Queue too small after filtering, preloading more...");
          setIsPreloading(true);
          const queueIds = filteredQueue.map(p => p.userId);
          const allExcludeIds = [...seenUserIds, currentProfile.userId, ...queueIds];
          
          fetchProfileBatch(currentUserId, allExcludeIds, 2).then(result => {
            if (result.profiles.length > 0) {
              setProfileQueue(prev => [...prev, ...result.profiles]);
              setSeenUserIds(prevSeen => {
                const combined = [...prevSeen, ...result.profiles.map(p => p.userId), ...result.queriedIds];
                return Array.from(new Set(combined));
              });
            }
            setIsPreloading(false);
          }).catch(error => {
            console.error("[Filter] Error preloading after filter change:", error);
            setIsPreloading(false);
          });
        }
        
        return;
      }
    }
    
    console.log("[Filter] ❌ Current profile doesn't pass new filters, clearing and reloading...");

    // Show loading UI and reset no more profiles flag
    setLoadingNext(true);
    setNoMoreProfiles(false);

    // Clear everything - profile queue, current profile, and seen IDs
    setProfileQueue([]);
    setCurrentProfile(null);
    setIsPreloading(false);
    
    // Reset seenUserIds to allow re-fetching profiles with new filters
    // Note: Liked and passed profiles will still be excluded by fetchProfileBatch
    setSeenUserIds([]);

    // Fetch completely new batch based on new filters
    fetchProfileBatch(currentUserId, [], 3).then(result => {
      if (result.profiles.length > 0) {
        console.log(`[Filter] Loaded ${result.profiles.length} new profiles after filter change`);
        
        // Filter all profiles through validation before queueing
        const validProfiles = result.profiles.filter(p => {
          const passes = passesDistrictAndFeeFilter(p);
          if (!passes) {
            console.log(`[Filter] ❌ Profile ${p.userId} doesn't pass client-side filters, excluding from batch`);
          }
          return passes;
        });
        
        if (validProfiles.length > 0) {
          setCurrentProfile(validProfiles[0]);
          setProfileQueue(validProfiles.slice(1));
        } else {
          console.log(`[Filter] ⚠️ All ${result.profiles.length} profiles filtered out, no valid profiles to show`);
          setNoMoreProfiles(true);
          setCurrentProfile(null);
        }
        setSeenUserIds(prev => {
          const combined = [...prev, ...result.profiles.map(p => p.userId), ...result.queriedIds];
          return Array.from(new Set(combined));
        });
        setNoMoreProfiles(false);
      } else {
        console.log("[Filter] No profiles match new filters");
        setNoMoreProfiles(true);
        if (result.queriedIds.length > 0) {
          setSeenUserIds(prev => {
            const combined = [...prev, ...result.queriedIds];
            return Array.from(new Set(combined));
          });
        }
      }
      // Hide loading UI
      setLoadingNext(false);
    }).catch(error => {
      console.error("[Filter] Error loading profiles after filter change:", error);
      setLoadingNext(false);
      setNoMoreProfiles(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterPreferences, currentUserId, initialBatchLoaded]);


  const handleSwipe = async (direction: 'left' | 'right') => {
    if (isAnimating || !currentProfile || !currentUserId) return;

    setIsAnimating(true);
    setSwipeDirection(direction);

    const swipedUserId = currentProfile.userId;

    // Background: Save interaction (non-blocking)
    if (direction === 'right') {
      console.log('[Swipe] ❤️ Liking:', swipedUserId);
      likeUser(currentUserId, swipedUserId).then(async result => {
        if (result?.success && result?.isMatch) {
          console.log('[Swipe] 🎉 Match!');
          setMatchedProfile(currentProfile);
          setShowMatchModal(true);
          
          // Automatically create chat for the match
          try {
            const chatId = await createChat(currentUserId, {
              type: 'individual',
              participants: [currentUserId, swipedUserId]
            });
            console.log('[Swipe] ✅ Chat created automatically:', chatId);
          } catch (error) {
            console.error('[Swipe] Error creating chat:', error);
          }
        }
      }).catch(error => {
        console.error('[Swipe] Error in likeUser:', error);
      });
    } else {
      console.log('[Swipe] 👎 Passing:', swipedUserId);
      passUser(currentUserId, swipedUserId);
    }

    // Animation + instant load next profile
    setTimeout(async () => {
      setSwipeDirection(null);
      setIsAnimating(false);
      setLoadingNext(true);

      // Load next (instant from queue if available)
      await loadNextProfile();
      setLoadingNext(false);
      
      // Trigger preload if queue is low after loading next profile
      if (profileQueue.length <= 2 && currentUserId && !isPreloading) {
        setIsPreloading(true);
        fetchProfileBatch(currentUserId, seenUserIds, 1).then(result => {
          if (result.profiles.length > 0) {
            console.log(`[Swipe] Preloaded ${result.profiles.length} profiles after swipe`);
            setProfileQueue(prev => [...prev, ...result.profiles]);
            setSeenUserIds(prev => {
              const combined = [...prev, ...result.profiles.map(p => p.userId), ...result.queriedIds];
              return Array.from(new Set(combined));
            });
          } else if (result.queriedIds.length > 0) {
            // Add queried IDs even if no profiles matched
            setSeenUserIds(prev => {
              const combined = [...prev, ...result.queriedIds];
              return Array.from(new Set(combined));
            });
          }
          setIsPreloading(false);
        }).catch(error => {
          console.error("[Swipe] Error preloading profiles:", error);
          setIsPreloading(false);
        });
      }
    }, 300);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (!isDragging && !isAnimating && Math.abs(currentX) < 10) {
      setShowDetailModal(true);
    }
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
  };

  const handleStartChat = async (matchedUserId: string) => {
    if (!currentUserId) {
      console.log('No currentUserId');
      return;
    }
  
    console.log('Starting chat with:', matchedUserId);
    console.log('Current user:', currentUserId);
    console.log('Available chats:', chats);

    setCreatingChat(matchedUserId);

    try {
      // Check if chat already exists
      const existingChatId = checkChatExists(currentUserId, matchedUserId, chats);
      
      if (existingChatId) {
        console.log('Found existing chat:', existingChatId);
        // Navigate to existing chat
        router.push(`/chatroom?chatId=${existingChatId}`);
        return;
      }
      
      console.log('Creating new chat...');
      // Create new chat
      const chatId = await createChatFromMatch(currentUserId, matchedUserId);
      
      if (chatId) {
        console.log('Chat created successfully:', chatId);
        router.push(`/chatroom?chatId=${chatId}`);
      } else {
        console.log('Chat creation returned null');
        alert('Could not create conversation. Please try again.');
      }
    } catch (error: any) {
      console.error('Error starting chat:', error);
      const errorMessage = error?.message || 'An unknown error occurred';
      alert(`Error: ${errorMessage}`);
    } finally {
      setCreatingChat(null);
    }
  };

  const getSharedInterests = (profileA: UserProfile | null, profileB: UserProfile | null): string[] => {
    if (!profileA?.interests || !profileB?.interests) return [];
    return profileA.interests.filter((i) => profileB.interests!.includes(i));
  };

  if (loading) {
    return (
      <GreenHomeBackground>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <span className="loading loading-dots loading-lg text-green-600"></span>

          <p className="mt-4 text-gray-700 font-semibold">
            Searching for profiles that match you...
          </p>
        </div>
      </GreenHomeBackground>
    );
  }

  // Show fetching UI when loading next profile (after swipe, filter change, etc.)
  if (loadingNext || (isAnimating && !currentProfile)) {
    return (
      <GreenHomeBackground>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <span className="loading loading-spinner loading-lg text-green-600"></span>
          <p className="mt-4 text-gray-600 font-semibold">Fetching profile...</p>
        </div>
      </GreenHomeBackground>
    );
  }

  // Show "no more profiles" only when not loading and truly no profiles
  if (noMoreProfiles && !loading && !loadingNext && !isPreloading) {
    return (
      <GreenHomeBackground>
        <div className="max-w-2xl mx-auto p-4">
          <div className="relative flex items-center justify-center min-h-screen">
            {/* Filter Button - positioned on the left */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowFilterPanel(!showFilterPanel);
              }}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-16 bg-white hover:bg-gray-50 text-gray-700 shadow-lg p-3 rounded-full transition z-10"
            >
              <Icon icon="mdi:filter-variant" className="w-6 h-6" />
            </button>

            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4 text-[#4a6b5a]">No more profiles!</h2>
              <p className="text-[#6b9b7f] text-sm mb-6">Try adjusting your filters or explore other ways to connect</p>
              
              {/* Action Buttons */}
              <div className="flex flex-col gap-3 mt-6">
                <button
                  onClick={() => router.push('/people')}
                  className="btn btn-primary gap-2"
                >
                  <Icon icon="mdi:account-group" className="w-5 h-5" />
                  View People you liked/passed
                </button>
                <button
                  onClick={() => router.push('/post')}
                  className="btn btn-outline btn-primary gap-2"
                >
                  <Icon icon="mdi:post" className="w-5 h-5" />
                  Try Creating a Post
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Sidebar Panel */}
        {showFilterPanel && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-start z-50"
            onClick={() => {
              setShowFilterPanel(false);
              setTempFilters(filterPreferences);
            }}
          >
            <div 
              className="bg-white h-full w-96 shadow-2xl overflow-y-auto p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Filters</h2>
                <button
                  onClick={() => {
                    setShowFilterPanel(false);
                    setTempFilters(filterPreferences);
                  }}
                  className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition"
                >
                  <Icon icon="mdi:close" className="text-xl" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Accommodation Status */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                    <Icon icon="mdi:home" className="mr-2 text-green-600" />
                    Accommodation Status
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Have Room</span>
                      <button
                        onClick={() => {
                          const newShowHaveRoom = !tempFilters.showHaveRoom;
                          setTempFilters(prev => ({ 
                            ...prev, 
                            showHaveRoom: newShowHaveRoom,
                            selectedDistricts: (newShowHaveRoom || prev.showLooking) ? prev.selectedDistricts : [],
                            minFee: newShowHaveRoom ? prev.minFee : null,
                            maxFee: newShowHaveRoom ? prev.maxFee : null,
                          }));
                        }}
                        className={`btn btn-xs ${tempFilters.showHaveRoom ? 'btn-success' : 'btn-error'}`}
                      >
                        {tempFilters.showHaveRoom ? '✓' : '×'}
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Looking for Room</span>
                      <button
                        onClick={() => {
                          const newShowLooking = !tempFilters.showLooking;
                          setTempFilters(prev => ({
                            ...prev,
                            showLooking: newShowLooking,
                            selectedDistricts: (newShowLooking || prev.showHaveRoom) ? prev.selectedDistricts : [],
                          }));
                        }}
                        className={`btn btn-xs ${tempFilters.showLooking ? 'btn-success' : 'btn-error'}`}
                      >
                        {tempFilters.showLooking ? '✓' : '×'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Districts */}
                {(tempFilters.showHaveRoom || tempFilters.showLooking) && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                      <Icon icon="mdi:map-marker" className="mr-2 text-[#6b9b7f]" />
                      Districts (Only Show)
                      <span className="ml-2 text-xs text-gray-500">
                        (Have:{tempFilters.showHaveRoom ? 'Y' : 'N'} Looking:{tempFilters.showLooking ? 'Y' : 'N'})
                      </span>
                    </h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                      {HCMC_DISTRICTS.map(district => (
                        <label key={district} className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={tempFilters.selectedDistricts.includes(district)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setTempFilters(prev => ({ ...prev, selectedDistricts: [...prev.selectedDistricts, district] }));
                              } else {
                                setTempFilters(prev => ({ ...prev, selectedDistricts: prev.selectedDistricts.filter(d => d !== district) }));
                              }
                            }}
                            className="checkbox checkbox-primary checkbox-sm mr-2"
                          />
                          <span className="text-sm text-gray-600">{district}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Monthly Fee Range */}
                {tempFilters.showHaveRoom && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                      <Icon icon="mdi:cash" className="mr-2 text-yellow-600" />
                      Monthly Fee Range (VND)
                    </h3>
                    <div className="space-y-3">
                      <label className="form-control">
                        <span className="label text-xs text-gray-600">Minimum Fee</span>
                        <input
                          type="number"
                          placeholder="e.g., 2000000"
                          value={tempFilters.minFee || ''}
                          onChange={(e) => setTempFilters(prev => ({ ...prev, minFee: e.target.value ? Number(e.target.value) : null }))}
                          className="input input-bordered input-sm w-full text-gray-700"
                        />
                      </label>
                      <label className="form-control">
                        <span className="label text-xs text-gray-600">Maximum Fee</span>
                        <input
                          type="number"
                          placeholder="e.g., 5000000"
                          value={tempFilters.maxFee || ''}
                          onChange={(e) => setTempFilters(prev => ({ ...prev, maxFee: e.target.value ? Number(e.target.value) : null }))}
                          className="input input-bordered input-sm w-full text-gray-700"
                        />
                      </label>
                    </div>
                  </div>
                )}

                {/* Cleanliness Level */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                    <Icon icon="mdi:spray-bottle" className="mr-2 text-cyan-600" />
                    Cleanliness Level
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Very Clean</span>
                      <button
                        onClick={() => setTempFilters(prev => ({ ...prev, showVeryClean: !prev.showVeryClean }))}
                        className={`btn btn-xs ${tempFilters.showVeryClean ? 'btn-success' : 'btn-error'}`}
                      >
                        {tempFilters.showVeryClean ? '✓' : '×'}
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Clean</span>
                      <button
                        onClick={() => setTempFilters(prev => ({ ...prev, showClean: !prev.showClean }))}
                        className={`btn btn-xs ${tempFilters.showClean ? 'btn-success' : 'btn-error'}`}
                      >
                        {tempFilters.showClean ? '✓' : '×'}
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Moderate</span>
                      <button
                        onClick={() => setTempFilters(prev => ({ ...prev, showModerateClean: !prev.showModerateClean }))}
                        className={`btn btn-xs ${tempFilters.showModerateClean ? 'btn-success' : 'btn-error'}`}
                      >
                        {tempFilters.showModerateClean ? '✓' : '×'}
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Relaxed</span>
                      <button
                        onClick={() => setTempFilters(prev => ({ ...prev, showRelaxed: !prev.showRelaxed }))}
                        className={`btn btn-xs ${tempFilters.showRelaxed ? 'btn-success' : 'btn-error'}`}
                      >
                        {tempFilters.showRelaxed ? '✓' : '×'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Smoking Policy */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                    <Icon icon="mdi:smoking" className="mr-2 text-[#6b9b7f]" />
                    Smoking Policy
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Smokers</span>
                      <button
                        onClick={() => setTempFilters(prev => ({ ...prev, showSmoking: !prev.showSmoking }))}
                        className={`btn btn-xs ${tempFilters.showSmoking ? 'btn-success' : 'btn-error'}`}
                      >
                        {tempFilters.showSmoking ? '✓' : '×'}
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Non-Smokers</span>
                      <button
                        onClick={() => setTempFilters(prev => ({ ...prev, showNonSmoking: !prev.showNonSmoking }))}
                        className={`btn btn-xs ${tempFilters.showNonSmoking ? 'btn-success' : 'btn-error'}`}
                      >
                        {tempFilters.showNonSmoking ? '✓' : '×'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sleep Schedule */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                    <Icon icon="mdi:sleep" className="mr-2 text-indigo-600" />
                    Sleep Schedule
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Early Birds</span>
                      <button
                        onClick={() => setTempFilters(prev => ({ ...prev, showEarlyBird: !prev.showEarlyBird }))}
                        className={`btn btn-xs ${tempFilters.showEarlyBird ? 'btn-success' : 'btn-error'}`}
                      >
                        {tempFilters.showEarlyBird ? '✓' : '×'}
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Night Owls</span>
                      <button
                        onClick={() => setTempFilters(prev => ({ ...prev, showNightOwl: !prev.showNightOwl }))}
                        className={`btn btn-xs ${tempFilters.showNightOwl ? 'btn-success' : 'btn-error'}`}
                      >
                        {tempFilters.showNightOwl ? '✓' : '×'}
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Flexible</span>
                      <button
                        onClick={() => setTempFilters(prev => ({ ...prev, showFlexible: !prev.showFlexible }))}
                        className={`btn btn-xs ${tempFilters.showFlexible ? 'btn-success' : 'btn-error'}`}
                      >
                        {tempFilters.showFlexible ? '✓' : '×'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Noise Level */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                    <Icon icon="mdi:volume-high" className="mr-2 text-[#6b9b7f]" />
                    Noise Level
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Quiet</span>
                      <button
                        onClick={() => setTempFilters(prev => ({ ...prev, showQuiet: !prev.showQuiet }))}
                        className={`btn btn-xs ${tempFilters.showQuiet ? 'btn-success' : 'btn-error'}`}
                      >
                        {tempFilters.showQuiet ? '✓' : '×'}
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Moderate</span>
                      <button
                        onClick={() => setTempFilters(prev => ({ ...prev, showModerate: !prev.showModerate }))}
                        className={`btn btn-xs ${tempFilters.showModerate ? 'btn-success' : 'btn-error'}`}
                      >
                        {tempFilters.showModerate ? '✓' : '×'}
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Loud</span>
                      <button
                        onClick={() => setTempFilters(prev => ({ ...prev, showLoud: !prev.showLoud }))}
                        className={`btn btn-xs ${tempFilters.showLoud ? 'btn-success' : 'btn-error'}`}
                      >
                        {tempFilters.showLoud ? '✓' : '×'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Guest Policy */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                    <Icon icon="mdi:account-group" className="mr-2 text-[#6b9b7f]" />
                    Guest Policy
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">No Guests</span>
                      <button
                        onClick={() => setTempFilters(prev => ({ ...prev, showNoGuests: !prev.showNoGuests }))}
                        className={`btn btn-xs ${tempFilters.showNoGuests ? 'btn-success' : 'btn-error'}`}
                      >
                        {tempFilters.showNoGuests ? '✓' : '×'}
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Occasional Guests</span>
                      <button
                        onClick={() => setTempFilters(prev => ({ ...prev, showOccasionalGuests: !prev.showOccasionalGuests }))}
                        className={`btn btn-xs ${tempFilters.showOccasionalGuests ? 'btn-success' : 'btn-error'}`}
                      >
                        {tempFilters.showOccasionalGuests ? '✓' : '×'}
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Frequent Guests</span>
                      <button
                        onClick={() => setTempFilters(prev => ({ ...prev, showFrequentGuests: !prev.showFrequentGuests }))}
                        className={`btn btn-xs ${tempFilters.showFrequentGuests ? 'btn-success' : 'btn-error'}`}
                      >
                        {tempFilters.showFrequentGuests ? '✓' : '×'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={() => {
                      setTempFilters({
                        showHaveRoom: true,
                        showLooking: true,
                        showSmoking: true,
                        showNonSmoking: true,
                        showEarlyBird: true,
                        showNightOwl: true,
                        showFlexible: true,
                        showQuiet: true,
                        showModerate: true,
                        showLoud: true,
                        showNoGuests: true,
                        showOccasionalGuests: true,
                        showFrequentGuests: true,
                        showVeryClean: true,
                        showClean: true,
                        showModerateClean: true,
                        showRelaxed: true,
                        selectedDistricts: [],
                        minFee: null,
                        maxFee: null,
                      });
                    }}
                    className="btn btn-outline btn-error flex-1"
                  >
                    <Icon icon="mdi:filter-off" className="mr-2" />
                    Clear
                  </button>
                  <button
                    onClick={applyFilters}
                    className="btn btn-primary flex-1"
                  >
                    <Icon icon="mdi:check" className="mr-2" />
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </GreenHomeBackground>
    );
  }

  // If no currentProfile at this point, show loading
  if (!currentProfile) {
    return (
      <GreenHomeBackground>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <span className="loading loading-spinner loading-lg text-green-600"></span>
          <p className="mt-4 text-gray-600 font-semibold">Loading...</p>
        </div>
      </GreenHomeBackground>
    );
  }

  const profileImage = getUserAvatar(currentProfile.photoURL, currentProfile.email || currentProfile.userId);

  return (
    <GreenHomeBackground>
      <div className="max-w-2xl mx-auto p-4">
        {/* Card Container */}
        {fetchingProfile ? (
          <div className="flex flex-col items-center justify-center h-[750px]">
            <span className="loading loading-spinner loading-lg"></span>
            <p className="mt-4 text-[#4a6b5a] font-semibold">Fetching profile...</p>
          </div>
        ) : (
          <div className="relative h-[750px] mb-6">
            {/* Filter Button - positioned on the left */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowFilterPanel(!showFilterPanel);
              }}
              className="absolute -left-20 top-1/2 -translate-y-1/2 bg-white hover:bg-gray-50 text-gray-700 shadow-lg p-3 rounded-full transition z-20"
            >
              <Icon icon="mdi:filter-variant" className="w-6 h-6" />
            </button>

            {/* Matching Info Button - positioned on the right */}
            <div className="absolute -right-20 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMatchingInfo(!showMatchingInfo);
                }}
                className="bg-white hover:bg-gray-50 text-gray-700 shadow-lg p-3 rounded-full transition"
              >
                <Icon icon="mdi:information" className="w-6 h-6" />
              </button>
              <span className="text-xs text-gray-600 font-medium text-center whitespace-nowrap">
                Try AI Preview
              </span>
            </div>

            <div
              ref={cardRef}
              className={`absolute left-0 right-0 top-0 bg-white rounded-3xl shadow-2xl overflow-hidden cursor-pointer transition-transform duration-300 hover:scale-105 ${
                swipeDirection === 'left' ? 'transform -translate-x-full rotate-12' :
                swipeDirection === 'right' ? 'transform translate-x-full -rotate-12' : ''
              }`}
              style={{
                transform: isDragging ? `translateX(${currentX}px) rotate(${currentX / 10}deg)` : undefined,
              }}
              onClick={handleCardClick}
            >
              {/* Profile Image */}
              <div className="h-72 relative">
                <Image
                  src={profileImage}
                  alt={currentProfile.displayName || currentProfile.email}
                  fill
                  className="object-cover"
                  unoptimized
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>

                {/* Map Marker Button (Bo ttom Right) */}
                {currentProfile.accommodationStatus === "have-room" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); 
                      setShowMap(true);
                    }}
                    className="absolute bottom-4 right-4 bg-white/90 hover:bg-white text-emerald-600 shadow-lg p-3 rounded-full transition"
                    >
                    <Icon icon="mdi:map-marker" className="w-6 h-6" />
                  </button>
                )}


                {/* Profile tags */}
                <div className="absolute top-4 right-4 text-white text-outline-sm">
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    {/* Verified Student */}
                    {currentProfile.isStudentVerified && (
                      <div>
                        <Tag
                          label="Verified Student"
                          icon="mdi:school"
                          color="blue"
                          tooltip="This user is a verified student."
                        />
                      </div>
                    )}

                    {/* Hot match (Profile has more than 3 matches) */}
                    {currentProfile.matches && currentProfile.matches?.length > 3 && (
                      <div>
                        <Tag
                          label="Hot Match"
                          icon="mdi:fire"
                          color="red"
                          tooltip="This user has more than 3 matches!"
                        />
                      </div>
                    )}

                    {/* Hot like (Profile has more than 5 people liked) */}
                    {currentProfile.likedBy && currentProfile.likedBy.length > 5 && (
                      <div>
                        <Tag
                          label="Popular"
                          icon="mdi:thumb-up-multiple"
                          color="purple"
                          tooltip="This user is liked by more than 5 people!"
                        />
                      </div>
                    )}

                    {/* Interest Match (Profile shares more than 3 interests) */}
                    {currentProfile && currentUserProfile && getSharedInterests(currentProfile, currentUserProfile).length >= 3 && (
                      <div>
                        <Tag
                          label="Interest Match"
                          icon="mdi:heart-multiple"
                          color="green"
                          tooltip={`You share interests: ${getSharedInterests(currentProfile, currentUserProfile).join(', ')}`}
                        />
                      </div>
                    )}

                    {/* Compatibility Score from ChromaDB */}
                    {currentProfile && profileSimilarities[currentProfile.userId] !== undefined && (
                      <div>
                        {profileSimilarities[currentProfile.userId] >= 80 ? (
                          <Tag
                            label="High Compatibility"
                            icon="mdi:star"
                            color="green"
                            tooltip={`Compatibility score: ${profileSimilarities[currentProfile.userId].toFixed(1)}%`}
                          />
                        ) : profileSimilarities[currentProfile.userId] >= 50 ? (
                          <Tag
                            label="Medium Compatibility"
                            icon="mdi:star-half-full"
                            color="yellow"
                            tooltip={`Compatibility score: ${profileSimilarities[currentProfile.userId].toFixed(1)}%`}
                          />
                        ) : (
                          <Tag
                            label="Low Compatibility"
                            icon="mdi:star-outline"
                            color="gray"
                            tooltip={`Compatibility score: ${profileSimilarities[currentProfile.userId].toFixed(1)}%`}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="absolute bottom-4 left-4 text-white text-outline-sm">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-2xl font-bold">
                      {currentProfile.displayName}
                    </h2>
                    {currentProfile.nickname && (
                      <span className="text-xs px-2 py-1 rounded-full font-medium bg-[#a0d4a0]/80 backdrop-blur-sm border border-[#6b9b7f]/50">
                        &quot;{currentProfile.nickname}&quot;
                      </span>
                    )}
                    

                    {/* Hometown*/}
                    {currentProfile.hometown && (
                      <span className="w-full text-sm text-white/90 -mt-2.5">
                        {currentProfile.hometown}
                      </span>
                    )}

                    {/* Birth Year */}
                    {currentProfile.birthYear && (
                      <span className="w-full text-sm text-white/90 -mt-2.5">
                        {currentProfile.birthYear}
                      </span>
                    )}
        
                  </div>
                </div>

              </div>

              {/* Profile Info */}
              <div className="p-6 space-y-4">

                {currentProfile.interests && currentProfile.interests.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Interests</h3>
                    <div className="flex flex-wrap gap-2">
                      {currentProfile.interests.map((interest, index) => (
                        <span
                          key={index}
                          className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Lifestyle Preferences */}
                <div className = "p-0 space-y-0">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Lifestyle Preferences</h3>
                  </div>
                </div>
                  
                <div className="grid grid-cols-3 gap-4 text-sm">
                  {/* Sleep Schedule */}
                  {currentProfile.sleepSchedule && (
                    <div className="flex items-center">
                      <Icon icon="mdi:sleep" className="mr-2 text-base text-[#6b9b7f]" />
                      <span className="text-gray-700"><strong>Sleep:</strong> {formatLabel(currentProfile.sleepSchedule)}</span>
                    </div>
                  )}

                  {/* Cleanliness Level */}
                  {currentProfile.cleanlinessLevel && (
                    <div className="flex items-center">
                      <Icon icon="mdi:broom" className="mr-2 text-base text-[#6b9b7f]" />
                      <span className="text-gray-700"><strong>Cleanliness:</strong> {formatLabel(currentProfile.cleanlinessLevel)}</span>
                    </div>
                  )}

                  {/* Noise Level */}
                  {currentProfile.noiseLevel && (
                    <div className="flex items-center">
                      <Icon icon="mdi:volume-high" className="mr-2 text-base text-yellow-500" />
                      <span className="text-gray-700"><strong>Noise:</strong> {formatLabel(currentProfile.noiseLevel)}</span>
                    </div>
                  )}

                  {/* Smoking Policy */}
                  {currentProfile.smokingPolicy && (
                    <div className="flex items-center">
                      <Icon icon="mdi:smoking-off" className="mr-2 text-base text-[#6b9b7f]" />
                      <span className="text-gray-700"><strong>Smoking:</strong> {formatLabel(currentProfile.smokingPolicy)}</span>
                    </div>
                  )}

                  {/* Cooking Skills */}
                  {currentProfile.cookingSkills && (
                    <div className="flex items-center">
                      <Icon icon="mdi:chef-hat" className="mr-2 text-base text-[#6b9b7f]" />
                      <span className="text-gray-700"><strong>Cooking Skills:</strong> {formatLabel(currentProfile.cookingSkills)}</span>
                    </div>
                  )}

                  {/* Guest Policy */}
                  {currentProfile.guestPolicy && (
                    <div className="flex items-center">
                      <Icon icon="mdi:account-multiple" className="mr-2 text-base text-green-500" />
                      <span className="text-gray-700"><strong>Guests:</strong> {formatLabel(currentProfile.guestPolicy)}</span>
                    </div>
                  )}

                </div>
                
                {/* Accommodation Details */}
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-gray-800">Accommodation Status:</h3>

                  <p className="rounded-full bg-[#6b9b7f] text-white px-3 py-1 text-sm font-semibold shadow-md">
                    {formatLabel(
                      currentProfile.accommodationStatus === 'have-room'
                        ? 'Has Room'
                        : 'Looking'
                    )}
                  </p>

                  {/* Room Photos Button - Next to Accommodation Status */}
                  {currentProfile.accommodationStatus === 'have-room' && currentProfile.roomImages && currentProfile.roomImages.length > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowRoomPhotos(true);
                      }}
                      className="btn btn-sm btn-outline gap-2"
                    >
                      <Icon icon="mdi:image-multiple" className="w-5 h-5" />
                      View Room Photos ({currentProfile.roomImages.length})
                    </button>
                  )}
                </div>
                
                {/* Have Room Details*/}
                {currentProfile.accommodationStatus === 'have-room' && (
                  <div>
                    <div className={`mt-2 space-y-2`}>
                      {(currentProfile.districts) && (
                        <div className="flex items-center">
                          <Icon icon="mdi:map-marker" className="mr-2 text-base text-[#6b9b7f]" />
                          <span className="text-gray-700">
                            <strong>Address:</strong>{" "}
                            {Array.isArray(currentProfile.districts)
                              ? currentProfile.districts.join(", ")            
                              : currentProfile.districts || "No address provided"}  
                          </span>
                        </div>
                      )}

                      {currentProfile.accommodationFee && (
                        <div className="flex items-center">
                          <Icon icon="mdi:currency-usd" className="mr-2 text-base text-[#6b9b7f]" />
                          <span className="text-gray-700"><strong>Monthly Fee:</strong> {currentProfile.accommodationFee} Million VND/month</span>
                        </div>
                      )}
                    </div>

                  {currentProfile.accommodationServices &&
                    currentProfile.accommodationServices.length > 0 && (
                      <div className="mt-2">
                        <div className="flex items-center mb-1">
                          <Icon icon="mdi:tools" className="mr-2 text-base text-[#6b9b7f]" />
                          <span className="text-gray-700">
                            <strong>Services:</strong>
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {currentProfile.accommodationServices.map((service, index) => (
                            <span
                              key={index}
                              className="bg-green-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-medium"
                            >
                              {service}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Looking For Details*/}
                {currentProfile.accommodationStatus === 'looking' && (
                  <div>
                    {/* Looking For Details */}
                    <div className="mt-2 space-y-2">
                      {currentProfile.budgetMin !== undefined &&
                        currentProfile.budgetMax !== undefined && (
                          <div className="flex items-center">
                            <Icon icon="mdi:cash-multiple" className="mr-2 text-base text-green-500" />
                            <span className="text-gray-700">
                              <strong>Budget:</strong> {currentProfile.budgetMin} - {currentProfile.budgetMax} Million VND/month
                            </span>
                          </div>
                        )}
                    </div>

                    <div className="mt-2">
                      {currentProfile.districts && currentProfile.districts.length > 0 && (
                        <div>                    
                          <div className="flex items-center mb-1">
                            <Icon icon="mdi:map" className="mr-2 text-base text-green-500" />
                            <span className="text-gray-700"> <strong>Preferred Districts:</strong></span>
                          </div>
                        
                          <div className="flex flex-wrap gap-2">
                            {currentProfile.districts.map((district, index) => (
                              <span
                                key={index}
                                className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium"
                              >
                                {district}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>
            </div>
            {/* Swipe Indicators */}
            {isDragging && (
              <>
                <div className={`absolute top-20 left-4 p-4 rounded-full ${currentX > 50 ? 'bg-green-500 opacity-100' : 'bg-gray-300 opacity-50'} transition-all`}>
                  <Icon icon="mdi:like" className="text-white text-2xl" />
                </div>
                <div className={`absolute top-20 right-4 p-4 rounded-full ${currentX < -50 ? 'bg-[#6b9b7f] opacity-100' : 'bg-gray-300 opacity-50'} transition-all`}>
                  <Icon icon="mdi:close" className="text-white text-2xl" />
                </div>
              </>
            )}

            {/* Action Buttons - Positioned on left and right sides of card */}
            {/* Pass Button - Left Side */}
            <button
              onClick={() => handleSwipe('left')}
              disabled={isAnimating}
              className="absolute -left-20 top-1/2 -translate-y-1/2 bg-red-500 hover:bg-red-600 text-white shadow-lg p-4 rounded-full transition disabled:opacity-50 z-20"
            >
              <Icon icon="mdi:close" className="w-6 h-6" />
            </button>
            
            {/* Like Button - Right Side */}
            <button
              onClick={() => handleSwipe('right')}
              disabled={isAnimating}
              className="absolute -right-20 top-1/2 -translate-y-1/2 bg-green-500 hover:bg-green-600 text-white shadow-lg p-4 rounded-full transition disabled:opacity-50 z-20"
            >
              <Icon icon="mdi:like" className="w-6 h-6" />
            </button>
          </div>
        )}

      {/* Matching Info Panel */}
      {showMatchingInfo && currentProfile && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-end z-50"
          onClick={() => setShowMatchingInfo(false)}
        >
          <div 
            className="bg-white h-full w-96 shadow-2xl overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Matching Info</h2>
              <button
                onClick={() => setShowMatchingInfo(false)}
                className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition"
              >
                <Icon icon="mdi:close" className="text-xl" />
              </button>
            </div>

            {/* Compatibility Score */}
            {profileSimilarities[currentProfile.userId] !== undefined && (
              <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
                <h3 className="text-lg font-semibold text-gray-700 mb-2 flex items-center">
                  <Icon icon="mdi:star" className="mr-2 text-yellow-500" />
                  Compatibility Score
                </h3>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600 mb-1">
                    {profileSimilarities[currentProfile.userId].toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">
                    {profileSimilarities[currentProfile.userId] >= 80 ? 'High Match!' :
                     profileSimilarities[currentProfile.userId] >= 50 ? 'Good Match' :
                     'Potential Match'}
                  </div>
                </div>
              </div>
            )}

            {/* AI Compatibility Analysis */}
            {currentUserProfile && (
              <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                  <Icon icon="mdi:brain" className="mr-2 text-purple-500" />
                  AI Compatibility Analysis
                </h3>
                {loadingGeminiAnalysis[currentProfile.userId] ? (
                  <div className="flex items-center justify-center py-4">
                    <span className="loading loading-spinner loading-sm mr-2"></span>
                    <span className="text-sm text-gray-600">Analyzing compatibility...</span>
                  </div>
                ) : geminiAnalysis[currentProfile.userId] ? (
                  <div className="max-h-96 overflow-y-auto pr-2 text-sm text-gray-700 leading-relaxed space-y-3">
                    {geminiAnalysis[currentProfile.userId].split('\n\n').map((paragraph, index) => (
                      <p key={index} className="whitespace-pre-wrap">
                        {paragraph.split(/(\*\*.*?\*\*)/).map((part, i) => {
                          if (part.startsWith('**') && part.endsWith('**')) {
                            return <strong key={i} className="text-purple-700 font-semibold">{part.slice(2, -2)}</strong>;
                          }
                          return part;
                        })}
                      </p>
                    ))}
                  </div>
                ) : (
                  <button
                    onClick={async () => {
                      setLoadingGeminiAnalysis(prev => ({ ...prev, [currentProfile.userId]: true }));
                      const analysis = await generateCompatibilityAnalysis(currentUserProfile, currentProfile);
                      setGeminiAnalysis(prev => ({ ...prev, [currentProfile.userId]: analysis }));
                      setLoadingGeminiAnalysis(prev => ({ ...prev, [currentProfile.userId]: false }));
                    }}
                    className="btn btn-sm btn-outline btn-primary w-full"
                  >
                    <Icon icon="mdi:sparkles" className="mr-2" />
                    Generate AI Analysis
                  </button>
                )}
              </div>
            )}

            {/* Shared Interests */}
            {currentUserProfile && getSharedInterests(currentProfile, currentUserProfile).length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                  <Icon icon="mdi:heart-multiple" className="mr-2 text-[#6b9b7f]" />
                  Shared Interests ({getSharedInterests(currentProfile, currentUserProfile).length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {getSharedInterests(currentProfile, currentUserProfile).map((interest, index) => (
                    <span
                      key={index}
                      className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Lifestyle Compatibility */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                <Icon icon="mdi:account-check" className="mr-2 text-[#6b9b7f]" />
                Lifestyle Comparison
              </h3>
              <div className="space-y-3">
                {/* Sleep Schedule */}
                {currentProfile.sleepSchedule && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Icon icon="mdi:sleep" className="mr-2 text-purple-500" />
                      <span className="text-sm font-semibold text-gray-700">Sleep Schedule</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex flex-col">
                        <span className="text-gray-500">You</span>
                        <span className={`font-medium px-2 py-1 rounded ${
                          !currentUserProfile?.sleepSchedule ? 'text-gray-400 bg-gray-200' :
                          currentUserProfile.sleepSchedule === currentProfile.sleepSchedule ? 'text-green-700 bg-green-100' :
                          'text-orange-700 bg-orange-100'
                        }`}>
                          {currentUserProfile?.sleepSchedule ? formatLabel(currentUserProfile.sleepSchedule) : 'Not set'}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-500">Them</span>
                        <span className={`font-medium px-2 py-1 rounded ${
                          currentUserProfile?.sleepSchedule === currentProfile.sleepSchedule ? 'text-green-700 bg-green-100' :
                          !currentUserProfile?.sleepSchedule ? 'text-blue-700 bg-blue-100' :
                          'text-orange-700 bg-orange-100'
                        }`}>
                          {formatLabel(currentProfile.sleepSchedule)}
                        </span>
                      </div>
                    </div>
                    {currentUserProfile?.sleepSchedule === currentProfile.sleepSchedule && (
                      <div className="mt-2 flex items-center text-green-600 text-xs">
                        <Icon icon="mdi:check-circle" className="mr-1" />
                        <span>Perfect Match!</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Cleanliness */}
                {currentProfile.cleanlinessLevel && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Icon icon="mdi:broom" className="mr-2 text-blue-500" />
                      <span className="text-sm font-semibold text-gray-700">Cleanliness</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex flex-col">
                        <span className="text-gray-500">You</span>
                        <span className={`font-medium px-2 py-1 rounded ${
                          !currentUserProfile?.cleanlinessLevel ? 'text-gray-400 bg-gray-200' :
                          currentUserProfile.cleanlinessLevel === currentProfile.cleanlinessLevel ? 'text-green-700 bg-green-100' :
                          'text-orange-700 bg-orange-100'
                        }`}>
                          {currentUserProfile?.cleanlinessLevel ? formatLabel(currentUserProfile.cleanlinessLevel) : 'Not set'}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-500">Them</span>
                        <span className={`font-medium px-2 py-1 rounded ${
                          currentUserProfile?.cleanlinessLevel === currentProfile.cleanlinessLevel ? 'text-green-700 bg-green-100' :
                          !currentUserProfile?.cleanlinessLevel ? 'text-blue-700 bg-blue-100' :
                          'text-orange-700 bg-orange-100'
                        }`}>
                          {formatLabel(currentProfile.cleanlinessLevel)}
                        </span>
                      </div>
                    </div>
                    {currentUserProfile?.cleanlinessLevel === currentProfile.cleanlinessLevel && (
                      <div className="mt-2 flex items-center text-green-600 text-xs">
                        <Icon icon="mdi:check-circle" className="mr-1" />
                        <span>Perfect Match!</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Smoking Policy */}
                {currentProfile.smokingPolicy && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Icon icon="mdi:smoking-off" className="mr-2 text-red-500" />
                      <span className="text-sm font-semibold text-gray-700">Smoking</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex flex-col">
                        <span className="text-gray-500">You</span>
                        <span className={`font-medium px-2 py-1 rounded ${
                          !currentUserProfile?.smokingPolicy ? 'text-gray-400 bg-gray-200' :
                          currentUserProfile.smokingPolicy === currentProfile.smokingPolicy ? 'text-green-700 bg-green-100' :
                          'text-orange-700 bg-orange-100'
                        }`}>
                          {currentUserProfile?.smokingPolicy ? formatLabel(currentUserProfile.smokingPolicy) : 'Not set'}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-500">Them</span>
                        <span className={`font-medium px-2 py-1 rounded ${
                          currentUserProfile?.smokingPolicy === currentProfile.smokingPolicy ? 'text-green-700 bg-green-100' :
                          !currentUserProfile?.smokingPolicy ? 'text-blue-700 bg-blue-100' :
                          'text-orange-700 bg-orange-100'
                        }`}>
                          {formatLabel(currentProfile.smokingPolicy)}
                        </span>
                      </div>
                    </div>
                    {currentUserProfile?.smokingPolicy === currentProfile.smokingPolicy && (
                      <div className="mt-2 flex items-center text-green-600 text-xs">
                        <Icon icon="mdi:check-circle" className="mr-1" />
                        <span>Perfect Match!</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Noise Level */}
                {currentProfile.noiseLevel && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Icon icon="mdi:volume-high" className="mr-2 text-yellow-500" />
                      <span className="text-sm font-semibold text-gray-700">Noise Level</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex flex-col">
                        <span className="text-gray-500">You</span>
                        <span className={`font-medium px-2 py-1 rounded ${
                          !currentUserProfile?.noiseLevel ? 'text-gray-400 bg-gray-200' :
                          currentUserProfile.noiseLevel === currentProfile.noiseLevel ? 'text-green-700 bg-green-100' :
                          'text-orange-700 bg-orange-100'
                        }`}>
                          {currentUserProfile?.noiseLevel ? formatLabel(currentUserProfile.noiseLevel) : 'Not set'}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-500">Them</span>
                        <span className={`font-medium px-2 py-1 rounded ${
                          currentUserProfile?.noiseLevel === currentProfile.noiseLevel ? 'text-green-700 bg-green-100' :
                          !currentUserProfile?.noiseLevel ? 'text-blue-700 bg-blue-100' :
                          'text-orange-700 bg-orange-100'
                        }`}>
                          {formatLabel(currentProfile.noiseLevel)}
                        </span>
                      </div>
                    </div>
                    {currentUserProfile?.noiseLevel === currentProfile.noiseLevel && (
                      <div className="mt-2 flex items-center text-green-600 text-xs">
                        <Icon icon="mdi:check-circle" className="mr-1" />
                        <span>Perfect Match!</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Guest Policy */}
                {currentProfile.guestPolicy && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Icon icon="mdi:account-multiple" className="mr-2 text-green-500" />
                      <span className="text-sm font-semibold text-gray-700">Guest Policy</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex flex-col">
                        <span className="text-gray-500">You</span>
                        <span className={`font-medium px-2 py-1 rounded ${
                          !currentUserProfile?.guestPolicy ? 'text-gray-400 bg-gray-200' :
                          currentUserProfile.guestPolicy === currentProfile.guestPolicy ? 'text-green-700 bg-green-100' :
                          'text-orange-700 bg-orange-100'
                        }`}>
                          {currentUserProfile?.guestPolicy ? formatLabel(currentUserProfile.guestPolicy) : 'Not set'}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-500">Them</span>
                        <span className={`font-medium px-2 py-1 rounded ${
                          currentUserProfile?.guestPolicy === currentProfile.guestPolicy ? 'text-green-700 bg-green-100' :
                          !currentUserProfile?.guestPolicy ? 'text-blue-700 bg-blue-100' :
                          'text-orange-700 bg-orange-100'
                        }`}>
                          {formatLabel(currentProfile.guestPolicy)}
                        </span>
                      </div>
                    </div>
                    {currentUserProfile?.guestPolicy === currentProfile.guestPolicy && (
                      <div className="mt-2 flex items-center text-green-600 text-xs">
                        <Icon icon="mdi:check-circle" className="mr-1" />
                        <span>Perfect Match!</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Cooking Skills */}
                {currentProfile.cookingSkills && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Icon icon="mdi:chef-hat" className="mr-2 text-orange-500" />
                      <span className="text-sm font-semibold text-gray-700">Cooking Skills</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex flex-col">
                        <span className="text-gray-500">You</span>
                        <span className={`font-medium px-2 py-1 rounded ${
                          !currentUserProfile?.cookingSkills ? 'text-gray-400 bg-gray-200' :
                          currentUserProfile.cookingSkills === currentProfile.cookingSkills ? 'text-green-700 bg-green-100' :
                          'text-orange-700 bg-orange-100'
                        }`}>
                          {currentUserProfile?.cookingSkills ? formatLabel(currentUserProfile.cookingSkills) : 'Not set'}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-500">Them</span>
                        <span className={`font-medium px-2 py-1 rounded ${
                          currentUserProfile?.cookingSkills === currentProfile.cookingSkills ? 'text-green-700 bg-green-100' :
                          !currentUserProfile?.cookingSkills ? 'text-blue-700 bg-blue-100' :
                          'text-orange-700 bg-orange-100'
                        }`}>
                          {formatLabel(currentProfile.cookingSkills)}
                        </span>
                      </div>
                    </div>
                    {currentUserProfile?.cookingSkills === currentProfile.cookingSkills && (
                      <div className="mt-2 flex items-center text-green-600 text-xs">
                        <Icon icon="mdi:check-circle" className="mr-1" />
                        <span>Perfect Match!</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>        
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-6"
          onClick={closeDetailModal}
        >
          <div 
            className="bg-white rounded-3xl max-w-2xl mx-auto w-full max-h-[95vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 space-y-6">
              <Image
                src={profileImage}
                alt={currentProfile.displayName || currentProfile.email}
                width={512}
                height={512}
                className="object-top rounded-t-2xl block mx-auto"
                unoptimized
              />
              <button
                onClick={closeDetailModal}
                className="absolute top-4 right-4 w-10 h-10 bg-black bg-opacity-60 rounded-full flex items-center justify-center text-white hover:bg-opacity-80 transition-all"
              >
                <Icon icon="mdi:close" className="text-xl" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Profile Name */}
              <div className="text-center mb-4">
                <h2 className="text-2xl font-bold mb-1 text-gray-800">
                  {currentProfile.displayName || currentProfile.email.split('@')[0]}
                </h2>
              </div>
              
              {/* Bio Section */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                  <Icon icon="mdi:account-circle" className="mr-2 text-xl text-blue-600" />
                  About
                </h3>
                <p className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed break-words">
                  {currentProfile.bio || "No bio available"}
                </p>
              </div>

              {/* Interests Section */}
              {currentProfile.interests && currentProfile.interests.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                    <Icon icon="mdi:star" className="mr-2 text-xl text-green-600" />
                    Interests
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {currentProfile.interests.map((interest, index) => (
                      <span
                        key={index}
                        className="bg-gradient-to-r from-green-100 to-emerald-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium border border-green-200 shadow-sm"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Basic Details Section */}
              <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                  <Icon icon="mdi:information" className="mr-2 text-xl text-yellow-600" />
                  Basic Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {currentProfile.birthYear && (
                    <div className="flex items-center">
                      <Icon icon="mdi:cake" className="mr-2 text-base text-yellow-500" />
                      <span className="text-gray-700"><strong>Birth Year:</strong> {currentProfile.birthYear}</span>
                    </div>
                  )}
                  {currentProfile.hometown && (
                    <div className="flex items-center">
                      <Icon icon="mdi:home-city" className="mr-2 text-base text-yellow-500" />
                      <span className="text-gray-700"><strong>Hometown:</strong> {currentProfile.hometown}</span>
                    </div>
                  )}
                  {currentProfile.university && (
                    <div className="flex items-center">
                      <Icon icon="mdi:school" className="mr-2 text-base text-yellow-500" />
                      <span className="text-gray-700"><strong>University:</strong> {currentProfile.university}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Lifestyle Section */}
              <div className="bg-gray-50 p-4 rounded-xl">
                <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                  <Icon icon="mdi:home-heart" className="mr-2 text-xl text-gray-600" />
                  Lifestyle
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center">
                    <Icon icon="mdi:broom" className="mr-2 text-base text-blue-500" />
                    <span className="text-gray-700"><strong>Cleanliness:</strong> {formatLabel(currentProfile.cleanlinessLevel ?? 'Not Provided')}</span>
                  </div>
                  <div className="flex items-center">
                    <Icon icon="mdi:sleep" className="mr-2 text-base text-purple-500" />
                    <span className="text-gray-700"><strong>Sleep Schedule:</strong> {formatLabel(currentProfile.sleepSchedule ?? 'Not Provided')}</span>
                  </div>
                  {currentProfile.noiseLevel && (
                    <div className="flex items-center">
                      <Icon icon="mdi:volume-high" className="mr-2 text-base text-yellow-500" />
                      <span className="text-gray-700"><strong>Noise Level:</strong> {formatLabel(currentProfile.noiseLevel ?? 'Not Provided')}</span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <Icon icon="mdi:smoking-off" className="mr-2 text-base text-red-500" />
                    <span className="text-gray-700"><strong>Smoking:</strong> {formatLabel(currentProfile.smokingPolicy ?? 'Not Provided')}</span>
                  </div>
                  <div className="flex items-center">
                    <Icon icon="mdi:chef-hat" className="mr-2 text-base text-orange-500" />
                    <span className="text-gray-700"><strong>Cooking Skills:</strong> {formatLabel(currentProfile.cookingSkills ?? 'Not Provided')}</span>
                  </div>
                  <div className="flex items-center">
                    <Icon icon="mdi:paw" className="mr-2 text-base text-orange-500" />
                    <span className="text-gray-700"><strong>Pets:</strong> {formatLabel(currentProfile.petPolicy ?? 'Not Provided')}</span>
                    { currentProfile.petPolicy === 'have-pets' && currentProfile.petType && (
                      <span className="ml-2 text-gray-500 italic">({currentProfile.petType})</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Accommodation Information Section */}
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                  <Icon icon="mdi:home-city" className="mr-2 text-xl text-emerald-600" />

                  <span className="mr-3">Accommodation Information</span>

                  {currentProfile.accommodationStatus === 'have-room' ? (
                    <span className="inline-block bg-emerald-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-md">
                      Has Room
                    </span>
                  ) : (
                    <span className="inline-block bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-md">
                      Looking for Accommodation
                    </span>
                  )}
                </h3>

                <div className="text-sm space-y-3">
                  {currentProfile.accommodationStatus === 'have-room' ? (
                    <>
                      {/* Have Room Details */}
                      {(currentProfile.districts) && (
                        <div className="flex items-center">
                          <Icon icon="mdi:map-marker" className="mr-2 text-base text-emerald-500" />
                          <span className="text-gray-700">
                            <strong>Address:</strong>{" "}
                            {Array.isArray(currentProfile.districts)
                              ? currentProfile.districts.join(", ")     
                              : currentProfile.districts || "No address"}
                          </span>
                        </div>
                      )}
                      {currentProfile.accommodationType && (
                        <div className="flex items-center">
                          <Icon icon="mdi:home-outline" className="mr-2 text-base text-emerald-500" />
                          <span className="text-gray-700"><strong>Type:</strong> {currentProfile.accommodationType}</span>
                        </div>
                      )}
                      {currentProfile.accommodationSize && (
                        <div className="flex items-center">
                          <Icon icon="mdi:ruler-square" className="mr-2 text-base text-emerald-500" />
                          <span className="text-gray-700"><strong>Size:</strong> {currentProfile.accommodationSize}</span>
                        </div>
                      )}
                      {currentProfile.numberOfRoomates && (
                        <div className="flex items-center">
                          <Icon icon="mdi:account-group" className="mr-2 text-base text-emerald-500" />
                          <span className="text-gray-700"><strong>Number of Roommates:</strong> {currentProfile.numberOfRoomates}</span>
                        </div>
                      )}
                      {currentProfile.liveWithLandlord !== undefined && (
                        <div className="flex items-center">
                          <Icon icon="mdi:home-account" className="mr-2 text-base text-emerald-500" />
                          <span className="text-gray-700"><strong>Live with Landlord:</strong> {currentProfile.liveWithLandlord ? 'Yes' : 'No'}</span>
                        </div>
                      )}

                      {/* Accommodation Fees */}
                      <div className="mt-2 font-bold text-gray-800">Fees breakdown: </div>
                      <div className="grid grid-cols-2 gap-4 mt-2 text-gray-700">
                          {currentProfile.accommodationFee && (
                            <div className="flex items-center">
                              <Icon icon="mdi:currency-usd" className="mr-2 text-base text-emerald-500" />
                              <span className="text-gray-700"><strong>Monthly Fee:</strong> {currentProfile.accommodationFee} Million VND/month</span>
                            </div>
                          )}
                          {currentProfile.accommodationElectricityFee && (
                            <div className="flex items-center">
                              <Icon icon="mdi:flash" className="mr-2 text-base text-emerald-500" />
                              <span className="text-gray-700"><strong>Electricity Fee:</strong> {currentProfile.accommodationElectricityFee}  VND/month</span>
                            </div>
                          )}
                          {currentProfile.accommodationWaterFee && (
                            <div className="flex items-center">
                              <Icon icon="mdi:water" className="mr-2 text-base text-emerald-500" />
                              <span className="text-gray-700"><strong>Water Fee:</strong> {currentProfile.accommodationWaterFee}  VND/month</span>
                            </div>
                          )}
                      </div>
                      {currentProfile.accommodationOtherFees && (
                        <div className="flex items-center mt-2">
                          <Icon icon="mdi:receipt-text" className="mr-2 text-base text-emerald-500" />
                          <span className="text-gray-700"><strong>Other Fees:</strong> {currentProfile.accommodationOtherFees}</span>
                        </div>
                      )}
                      {currentProfile.accommodationServices &&
                        currentProfile.accommodationServices.length > 0 && (
                          <div>
                            <div className="flex items-center mb-1">
                              <Icon icon="mdi:tools" className="mr-2 text-base text-emerald-500" />
                              <span className="text-gray-700">
                                <strong>Services:</strong>
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {currentProfile.accommodationServices.map((service, index) => (
                                <span
                                  key={index}
                                  className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-medium"
                                >
                                  {service}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                    </>
                  ) : ( 
                    <>
                      {/* Looking For Room Details */}
                      {currentProfile.budgetMin !== undefined &&
                        currentProfile.budgetMax !== undefined && (
                          <div className="flex items-center">
                            <Icon icon="mdi:cash-multiple" className="mr-2 text-base text-emerald-500" />
                            <span className="text-gray-700">
                              <strong>Budget:</strong> {currentProfile.budgetMin} - {currentProfile.budgetMax} Million VND/month
                            </span>
                          </div>
                        )}
                      { currentProfile.numberOfRoomates && (
                        <div className="flex items-center">
                          <Icon icon="mdi:account-group" className="mr-2 text-base text-emerald-500" />
                          <span className="text-gray-700"><strong>Roommate Preference:</strong> {currentProfile.numberOfRoomates} person(s)</span>
                        </div>
                      )}  
                      {currentProfile.liveWithLandlord !== undefined && (
                        <div className="flex items-center">
                          <Icon icon="mdi:home-lock" className="mr-2 text-base text-emerald-500" />
                          <span className="text-gray-700"><strong>Live with Landlord:</strong> {currentProfile.liveWithLandlord ? 'Yes' : 'No'}</span>
                        </div>
                      )}
                      {currentProfile.districts && currentProfile.districts.length > 0 && (
                        <div>
                          <div className="flex items-center mb-1">
                            <Icon icon="mdi:map" className="mr-2 text-base text-emerald-500" />
                            <span className="text-gray-700"> <strong>Preferred Districts:</strong></span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {currentProfile.districts.map((district, index) => (
                              <span
                                key={index}
                                className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-medium"
                              >
                                {district}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      { currentProfile.accommodationType && (
                        <div>
                          <div className="flex items-center mb-1">
                            <Icon icon="mdi:tools" className="mr-2 text-base text-emerald-500" />
                            <span className="text-gray-700">
                              <strong>Preferred Accommodation Type:</strong>
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {currentProfile.accommodationType.map((service, index) => (
                              <span
                                key={index}
                                className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-medium"
                              >
                                {service}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      { currentProfile.accommodationSize && (
                        <div>
                          <div className="flex items-center mb-1">
                            <Icon icon="mdi:tools" className="mr-2 text-base text-emerald-500" />
                            <span className="text-gray-700">
                              <strong>Preferred Accommodation Size:</strong>
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {currentProfile.accommodationSize.map((size, index) => (
                              <span
                                key={index}
                                className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-medium"
                              >
                                {size}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      { currentProfile.accommodationServices && (
                        <div>
                          <div className="flex items-center mb-1">
                            <Icon icon="mdi:tools" className="mr-2 text-base text-emerald-500" />
                            <span className="text-gray-700">
                              <strong>Desired Services:</strong>
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {currentProfile.accommodationServices.map((service, index) => (
                              <span
                                key={index}
                                className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-medium"
                              >
                                {service}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons in Modal */}
              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => {
                    closeDetailModal();
                    handleSwipe('left');
                  }}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
                >
                  <Icon icon="mdi:close-circle" className="text-lg" />
                  Pass
                </button>
                <button
                  onClick={() => {
                    closeDetailModal();
                    handleSwipe('right');
                  }}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
                >
                  <Icon icon="mdi:thumb-up-outline" className="text-lg" />
                  Like
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Match Modal */}
      {showMatchModal && matchedProfile && (
        <div 
          className="fixed inset-0 bg-gradient-to-br from-green-500/90 to-emerald-500/90 flex items-center justify-center z-50 p-6"
          onClick={() => setShowMatchModal(false)}
        >
          <div 
            className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl text-center animate-bounce"
            onClick={(e) => e.stopPropagation()}
            ref={(el) => {
              if (!el) return;

              // Stop after 1~2 bounces.
              // Tailwind bounce = ~1s per cycle → stop after 1500ms (~2 bounces)
              setTimeout(() => {
                el.classList.remove("animate-bounce");
              }, 1500); 
            }}
          >
            {/* Match Icon */}
            <div className="mb-6">
              <Icon icon="mdi:home" className="text-8xl text-green-500 mx-auto animate-pulse" />
            </div>

            {/* Match Title */}
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              It&apos;s a Match!
            </h2>
            <p className="text-gray-600 mb-6">
              You and <span className="font-bold text-green-600">{matchedProfile.displayName || matchedProfile.email}</span> have liked each other!
            </p>

            {/* Profile Preview */}
            <div className="flex justify-center gap-4 mb-6">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-green-500 shadow-lg">
                <Image
                  src={getUserAvatar(matchedProfile.photoURL, matchedProfile.email || matchedProfile.userId)}
                  alt={matchedProfile.displayName || 'User'}
                  width={96}
                  height={96}
                  className="object-cover"
                  unoptimized
                />
              </div>
            </div>

            {/* Action Buttons */}
           <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  handleStartChat(matchedProfile.userId);
                }}
                className="btn btn-primary btn-lg w-full"
                disabled={creatingChat === matchedProfile.userId}
              >
                {creatingChat === matchedProfile.userId ? (
                  <>
                    <span className="loading loading-spinner mr-2"></span>
                    Starting Chat...
                  </>
                ) : (
                  <>
                    <Icon icon="mdi:chat" className="mr-2" />
                    Start Chat
                  </>
                )}
              </button>

              <button
                onClick={() => setShowMatchModal(false)}
                className="btn btn-lg w-full"
                disabled={creatingChat === matchedProfile.userId}
              >
                Continue Swiping
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Map Modal */}
      {showMap && currentProfile.accommodationStatus == "have-room" && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowMap(false)}
        >
          <div
            className="bg-white p-4 rounded-xl shadow-xl max-w-5xl w-full relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowMap(false)}
              className="absolute top-3 right-3 text-gray-600 hover:text-black"
            >
              <Icon icon="mdi:close" className="w-10 h-10" />
            </button>
            <MapEmbed
              location={
                Array.isArray(currentProfile.districts)
                  ? currentProfile.districts.join(", ")
                  : currentProfile.districts || "Ho Chi Minh"
              }
            />
          </div>
        </div>
      )}

      {/* Room Photos Modal */}
      {showRoomPhotos && currentProfile && currentProfile.roomImages && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setShowRoomPhotos(false)}
        >
          <div
            className="bg-white p-6 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowRoomPhotos(false)}
              className="absolute top-3 right-3 text-gray-600 hover:text-black z-10"
            >
              <Icon icon="mdi:close" className="w-8 h-8" />
            </button>
            
            <h2 className="text-2xl font-bold mb-4 text-gray-900 flex items-center gap-2">
              <Icon icon="mdi:image-multiple" className="w-6 h-6 text-pink-500" />
              Room Photos
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentProfile.roomImages.map((imageUrl, index) => (
                <div key={index} className="relative group">
                  <Image
                    src={imageUrl}
                    alt={`Room ${index + 1}`}
                    width={600}
                    height={256}
                    className="w-full h-64 object-cover rounded-lg shadow-md hover:shadow-xl transition cursor-pointer"
                    onClick={() => window.open(imageUrl, '_blank')}
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition rounded-lg flex items-center justify-center">
                    <Icon icon="mdi:magnify-plus" className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filter Sidebar Panel - Shared across all UI states */}
      {showFilterPanel && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-start z-50"
          onClick={() => {
            setShowFilterPanel(false);
            setTempFilters(filterPreferences); // Reset temp filters on cancel
          }}
        >
          <div 
            className="bg-white h-full w-96 shadow-2xl overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Filters</h2>
              <button
                onClick={() => {
                  setShowFilterPanel(false);
                  setTempFilters(filterPreferences); // Reset temp filters
                }}
                className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition"
              >
                <Icon icon="mdi:close" className="text-xl" />
              </button>
            </div>

            {/* Filter Sections */}
            <div className="space-y-6">
              {/* Accommodation Status */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                  <Icon icon="mdi:home" className="mr-2 text-green-600" />
                  Accommodation Status
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Have Room</span>
                    <button
                      onClick={() => {
                        const newShowHaveRoom = !tempFilters.showHaveRoom;
                        setTempFilters(prev => ({ 
                          ...prev, 
                          showHaveRoom: newShowHaveRoom,
                          // Clear district and fee filters when disabling have room
                          selectedDistricts: newShowHaveRoom ? prev.selectedDistricts : [],
                          minFee: newShowHaveRoom ? prev.minFee : null,
                          maxFee: newShowHaveRoom ? prev.maxFee : null,
                        }));
                      }}
                      className={`btn btn-xs ${tempFilters.showHaveRoom ? 'btn-success' : 'btn-error'}`}
                    >
                      {tempFilters.showHaveRoom ? '✓' : '×'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Looking for Room</span>
                    <button
                      onClick={() => setTempFilters(prev => ({ ...prev, showLooking: !prev.showLooking }))}
                      className={`btn btn-xs ${tempFilters.showLooking ? 'btn-success' : 'btn-error'}`}
                    >
                      {tempFilters.showLooking ? '✓' : '×'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Districts - Show when Have Room or Looking is selected */}
              {(tempFilters.showHaveRoom || tempFilters.showLooking) && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                    <Icon icon="mdi:map-marker" className="mr-2 text-blue-600" />
                    Districts (Only Show)
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {HCMC_DISTRICTS.map(district => (
                      <label key={district} className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tempFilters.selectedDistricts.includes(district)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTempFilters(prev => ({ ...prev, selectedDistricts: [...prev.selectedDistricts, district] }));
                            } else {
                              setTempFilters(prev => ({ ...prev, selectedDistricts: prev.selectedDistricts.filter(d => d !== district) }));
                            }
                          }}
                          className="checkbox checkbox-primary checkbox-sm mr-2"
                        />
                        <span className="text-sm text-gray-600">{district}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Monthly Fee Range - Only show when Have Room is selected */}
              {tempFilters.showHaveRoom && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                    <Icon icon="mdi:cash" className="mr-2 text-yellow-600" />
                    Monthly Fee Range (VND)
                  </h3>
                  <div className="space-y-3">
                    <label className="form-control">
                      <span className="label text-xs text-gray-600">Minimum Fee</span>
                      <input
                        type="number"
                        placeholder="e.g., 2000000"
                        value={tempFilters.minFee || ''}
                        onChange={(e) => setTempFilters(prev => ({ ...prev, minFee: e.target.value ? Number(e.target.value) : null }))}
                        className="input input-bordered input-sm w-full text-gray-700"
                      />
                    </label>
                    <label className="form-control">
                      <span className="label text-xs text-gray-600">Maximum Fee</span>
                      <input
                        type="number"
                        placeholder="e.g., 5000000"
                        value={tempFilters.maxFee || ''}
                        onChange={(e) => setTempFilters(prev => ({ ...prev, maxFee: e.target.value ? Number(e.target.value) : null }))}
                        className="input input-bordered input-sm w-full text-gray-700"
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* Cleanliness Level */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                  <Icon icon="mdi:spray-bottle" className="mr-2 text-cyan-600" />
                  Cleanliness Level
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Very Clean</span>
                    <button
                      onClick={() => setTempFilters(prev => ({ ...prev, showVeryClean: !prev.showVeryClean }))}
                      className={`btn btn-xs ${tempFilters.showVeryClean ? 'btn-success' : 'btn-error'}`}
                    >
                      {tempFilters.showVeryClean ? '✓' : '×'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Clean</span>
                    <button
                      onClick={() => setTempFilters(prev => ({ ...prev, showClean: !prev.showClean }))}
                      className={`btn btn-xs ${tempFilters.showClean ? 'btn-success' : 'btn-error'}`}
                    >
                      {tempFilters.showClean ? '✓' : '×'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Moderate</span>
                    <button
                      onClick={() => setTempFilters(prev => ({ ...prev, showModerateClean: !prev.showModerateClean }))}
                      className={`btn btn-xs ${tempFilters.showModerateClean ? 'btn-success' : 'btn-error'}`}
                    >
                      {tempFilters.showModerateClean ? '✓' : '×'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Relaxed</span>
                    <button
                      onClick={() => setTempFilters(prev => ({ ...prev, showRelaxed: !prev.showRelaxed }))}
                      className={`btn btn-xs ${tempFilters.showRelaxed ? 'btn-success' : 'btn-error'}`}
                    >
                      {tempFilters.showRelaxed ? '✓' : '×'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Smoking Policy */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                  <Icon icon="mdi:smoking" className="mr-2 text-red-600" />
                  Smoking Policy
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Smokers</span>
                    <button
                      onClick={() => setTempFilters(prev => ({ ...prev, showSmoking: !prev.showSmoking }))}
                      className={`btn btn-xs ${tempFilters.showSmoking ? 'btn-success' : 'btn-error'}`}
                    >
                      {tempFilters.showSmoking ? '✓' : '×'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Non-Smokers</span>
                    <button
                      onClick={() => setTempFilters(prev => ({ ...prev, showNonSmoking: !prev.showNonSmoking }))}
                      className={`btn btn-xs ${tempFilters.showNonSmoking ? 'btn-success' : 'btn-error'}`}
                    >
                      {tempFilters.showNonSmoking ? '✓' : '×'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Sleep Schedule */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                  <Icon icon="mdi:sleep" className="mr-2 text-indigo-600" />
                  Sleep Schedule
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Early Birds</span>
                    <button
                      onClick={() => setTempFilters(prev => ({ ...prev, showEarlyBird: !prev.showEarlyBird }))}
                      className={`btn btn-xs ${tempFilters.showEarlyBird ? 'btn-success' : 'btn-error'}`}
                    >
                      {tempFilters.showEarlyBird ? '✓' : '×'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Night Owls</span>
                    <button
                      onClick={() => setTempFilters(prev => ({ ...prev, showNightOwl: !prev.showNightOwl }))}
                      className={`btn btn-xs ${tempFilters.showNightOwl ? 'btn-success' : 'btn-error'}`}
                    >
                      {tempFilters.showNightOwl ? '✓' : '×'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Flexible</span>
                    <button
                      onClick={() => setTempFilters(prev => ({ ...prev, showFlexible: !prev.showFlexible }))}
                      className={`btn btn-xs ${tempFilters.showFlexible ? 'btn-success' : 'btn-error'}`}
                    >
                      {tempFilters.showFlexible ? '✓' : '×'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Noise Level */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                  <Icon icon="mdi:volume-high" className="mr-2 text-purple-600" />
                  Noise Level
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Quiet</span>
                    <button
                      onClick={() => setTempFilters(prev => ({ ...prev, showQuiet: !prev.showQuiet }))}
                      className={`btn btn-xs ${tempFilters.showQuiet ? 'btn-success' : 'btn-error'}`}
                    >
                      {tempFilters.showQuiet ? '✓' : '×'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Moderate</span>
                    <button
                      onClick={() => setTempFilters(prev => ({ ...prev, showModerate: !prev.showModerate }))}
                      className={`btn btn-xs ${tempFilters.showModerate ? 'btn-success' : 'btn-error'}`}
                    >
                      {tempFilters.showModerate ? '✓' : '×'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Loud</span>
                    <button
                      onClick={() => setTempFilters(prev => ({ ...prev, showLoud: !prev.showLoud }))}
                      className={`btn btn-xs ${tempFilters.showLoud ? 'btn-success' : 'btn-error'}`}
                    >
                      {tempFilters.showLoud ? '✓' : '×'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Guest Policy */}
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                  <Icon icon="mdi:account-group" className="mr-2 text-orange-600" />
                  Guest Policy
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">No Guests</span>
                    <button
                      onClick={() => setTempFilters(prev => ({ ...prev, showNoGuests: !prev.showNoGuests }))}
                      className={`btn btn-xs ${tempFilters.showNoGuests ? 'btn-success' : 'btn-error'}`}
                    >
                      {tempFilters.showNoGuests ? '✓' : '×'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Occasional Guests</span>
                    <button
                      onClick={() => setTempFilters(prev => ({ ...prev, showOccasionalGuests: !prev.showOccasionalGuests }))}
                      className={`btn btn-xs ${tempFilters.showOccasionalGuests ? 'btn-success' : 'btn-error'}`}
                    >
                      {tempFilters.showOccasionalGuests ? '✓' : '×'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Frequent Guests</span>
                    <button
                      onClick={() => setTempFilters(prev => ({ ...prev, showFrequentGuests: !prev.showFrequentGuests }))}
                      className={`btn btn-xs ${tempFilters.showFrequentGuests ? 'btn-success' : 'btn-error'}`}
                    >
                      {tempFilters.showFrequentGuests ? '✓' : '×'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setTempFilters({
                      showHaveRoom: true,
                      showLooking: true,
                      showSmoking: true,
                      showNonSmoking: true,
                      showEarlyBird: true,
                      showNightOwl: true,
                      showFlexible: true,
                      showQuiet: true,
                      showModerate: true,
                      showLoud: true,
                      showNoGuests: true,
                      showOccasionalGuests: true,
                      showFrequentGuests: true,
                      showVeryClean: true,
                      showClean: true,
                      showModerateClean: true,
                      showRelaxed: true,
                      selectedDistricts: [],
                      minFee: null,
                      maxFee: null,
                    });
                  }}
                  className="btn btn-outline btn-error flex-1"
                >
                  <Icon icon="mdi:filter-off" className="mr-2" />
                  Clear
                </button>
                <button
                  onClick={applyFilters}
                  className="btn btn-primary flex-1"
                >
                  <Icon icon="mdi:check" className="mr-2" />
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </GreenHomeBackground>
  );
}