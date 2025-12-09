"use client";

import { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";
import { getProfile, likeUser, passUser } from "@/lib/profileService";
import { queryMatchingProfile } from "@/lib/chromaService";
import { UserProfile } from "@/types/profile";
import { auth } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getUserAvatar } from "@/lib/avatarHelper";
import { useRouter } from "next/navigation";
import { createChatFromMatch, checkChatExists } from "@/lib/utils/matchHelper";
import { useUserChats } from "@/lib/hooks/useChat";
import { GreenHomeBackground } from "@/components/magicui/green-home-background";
import MapEmbed from "@/app/components/MapEmbed";

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

interface HomePageProps {
  email?: string;
}

export default function HomePage({ email }: HomePageProps) {
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

  // Get user's chats to check existing conversations
  const { chats } = useUserChats(currentUserId);

  const fetchProfileBatch = async (
    userId: string,
    excludeIds: string[],
    batchSize = 10
  ): Promise<UserProfile[]> => {
    const newProfiles: UserProfile[] = [];
    const currentUserProfile = await getProfile(userId);
    let attempts = 0;
    const maxAttempts = batchSize * 5; // Prevent infinite loops

    while (newProfiles.length < batchSize && attempts < maxAttempts) {
      attempts++;
      const result = await queryMatchingProfile(userId, excludeIds);

      if (!result?.userId) {
        console.log("[Fetch] No more profiles from ChromaDB");
        break;
      }

      const matchedId = result.userId;

      // Skip yourself
      if (matchedId === userId) {
        console.log("[Fetch] Skipping self:", matchedId);
        excludeIds.push(matchedId);
        continue;
      }

      // Skip already liked or passed
      if (
        currentUserProfile?.likedUsers?.includes(matchedId) ||
        currentUserProfile?.passedUsers?.includes(matchedId)
      ) {
        console.log("[Fetch] Skipping already interacted:", matchedId, {
          liked: currentUserProfile?.likedUsers?.includes(matchedId),
          passed: currentUserProfile?.passedUsers?.includes(matchedId)
        });
        excludeIds.push(matchedId);
        continue;
      }

      // Load profile details
      const prof = await getProfile(matchedId);
      if (!prof) {
        console.log("[Fetch] Profile not found in Firebase:", matchedId);
        excludeIds.push(matchedId);
        continue;
      }

      console.log("[Fetch] Added profile to batch:", matchedId, `(${newProfiles.length + 1}/${batchSize})`);
      newProfiles.push(prof);
      excludeIds.push(matchedId);
    }

    console.log(`[Fetch] Batch complete: ${newProfiles.length} profiles fetched in ${attempts} attempts`);
    return newProfiles;
  };

  // Function to load the next matching profile
  const loadNextProfile = async () => {    
    if (profileQueue.length > 0) {
      console.log(`[Load] Using queued profile (${profileQueue.length} remaining)`);
      const next = profileQueue[0];
      setProfileQueue(prev => prev.slice(1));
      setCurrentProfile(next);
      return;
    }

    console.log("[Load] Queue empty, fetching new batch...");
    setLoadingNext(true);

    try {
      if (!currentUserId) {
        console.log("[Load] No currentUserId, skipping fetch");
        return;
      }

      const batch = await fetchProfileBatch(currentUserId, [...seenUserIds], 10);

      if (batch.length === 0) {
        console.log("[Load] No more profiles available");
        setNoMoreProfiles(true);
        setCurrentProfile(null);
        return;
      }

      console.log(`[Load] Loaded batch of ${batch.length} profiles`);
      // Put all in queue and load first
      setProfileQueue(batch.slice(1));
      setCurrentProfile(batch[0]);

      // Track what we have seen
      setSeenUserIds(prev => [...prev, ...batch.map(p => p.userId)]);
    } catch (error) {
      console.error("[Load] Error loading profiles:", error);
      setNoMoreProfiles(true);
    } finally {
      setLoadingNext(false);
    }
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

        const myProfile = await getProfile(user.uid);

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
    if (!currentUserId || currentProfile !== null) return;

    console.log("[Init] 🚀 Starting profile load for:", currentUserId);

    const init = async () => {
      // Step 1: Fetch ONLY 1 profile to show ASAP
      console.log("[Init] ⚡ Fetching first profile (high priority)...");
      const firstBatch = await fetchProfileBatch(currentUserId, [], 1);
      
      if (firstBatch.length === 0) {
        console.log("[Init] ❌ No profiles found");
        setNoMoreProfiles(true);
        setLoading(false);
        return;
      }

      // Step 2: Show first profile IMMEDIATELY (end loading)
      console.log("[Init] ✓ Displaying first profile:", firstBatch[0].userId);
      setCurrentProfile(firstBatch[0]);
      setSeenUserIds([firstBatch[0].userId]);
      setLoading(false); // User sees content NOW

      // Step 3: Background preload (non-blocking, user won't notice)
      console.log("[Init] 🔄 Background: preloading 3 profiles...");
      fetchProfileBatch(currentUserId, [firstBatch[0].userId], 3)
        .then(moreBatch => {
          if (moreBatch.length > 0) {
            console.log(`[Init] ✓ Preloaded ${moreBatch.length} profiles silently`);
            setProfileQueue(moreBatch);
            setSeenUserIds(prev => [...prev, ...moreBatch.map(p => p.userId)]);
          }
        })
        .catch(err => console.error("[Init] ❌ Preload error:", err));
    };

    init();
  }, [currentUserId]);

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (isAnimating || !currentProfile || !currentUserId) return;

    setIsAnimating(true);
    setSwipeDirection(direction);

    const swipedUserId = currentProfile.userId;

    // Background: Save interaction (non-blocking)
    if (direction === 'right') {
      console.log('[Swipe] ❤️ Liking:', swipedUserId);
      likeUser(currentUserId, swipedUserId).then(result => {
        if (result?.success && result?.isMatch) {
          console.log('[Swipe] 🎉 Match!');
          setMatchedProfile(currentProfile);
          setShowMatchModal(true);
        }
      });
    } else {
      console.log('[Swipe] 👎 Passing:', swipedUserId);
      passUser(currentUserId, swipedUserId);
    }

    // Animation + instant load next profile
    setTimeout(async () => {
      setSwipeDirection(null);
      setIsAnimating(false);

      // Load next (instant from queue if available)
      await loadNextProfile();
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

  if (!currentProfile || noMoreProfiles) {
    return (
      <GreenHomeBackground>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4 text-gray-600">No more profiles!</h2>
          </div>
        </div>
      </GreenHomeBackground>
    );
  }

  const profileImage = getUserAvatar(currentProfile.photoURL, currentProfile.email || currentProfile.userId);

  return (
    <GreenHomeBackground>
      <div className="max-w-md mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push('/people')}
            className="btn btn-circle btn-ghost relative"
          >
            <Icon icon="mdi:home-account" className="text-2xl text-green-500" />
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Roomatinder</h1>
          <div className="w-12"></div>
        </div>

        {/* Card Container */}
        {fetchingProfile ? (
          <div className="flex flex-col items-center justify-center h-[900px]">
            <span className="loading loading-spinner loading-lg"></span>
            <p className="mt-4 text-gray-600 font-semibold">Fetching profile...</p>
          </div>
        ) : (
          <div className="relative h-[1000px] mb-6">
            <div
              ref={cardRef}
              className={`absolute inset-0 bg-white rounded-3xl shadow-2xl overflow-hidden cursor-pointer transition-transform duration-300 hover:scale-105 ${
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
                <img
                  src={profileImage}
                  alt={currentProfile.displayName || currentProfile.email}
                  className="w-full h-full object-cover"
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
                    {currentProfile && currentUserProfile && getSharedInterests(currentProfile, currentUserProfile).length > 3 && (
                      <div>
                        <Tag
                          label="Interest Match"
                          icon="mdi:heart-multiple"
                          color="green"
                          tooltip={`You share interests: ${getSharedInterests(currentProfile, currentUserProfile).join(', ')}`}
                        />
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
                      <span className="text-xs px-2 py-1 rounded-full font-medium bg-purple-400/80 backdrop-blur-sm border border-purple-300/50">
                        "{currentProfile.nickname}"
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
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">About</h3>
                  <p className="text-gray-600 text-sm leading-relaxed break-words">
                    {currentProfile.bio || "No bio available"}
                  </p>
                </div>

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
                  
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {/* Sleep Schedule */}
                  {currentProfile.sleepSchedule && (
                    <div className="flex items-center">
                      <Icon icon="mdi:sleep" className="mr-2 text-base text-purple-500" />
                      <span className="text-gray-700"><strong>Sleep:</strong> {formatLabel(currentProfile.sleepSchedule)}</span>
                    </div>
                  )}

                  {/* Cleanliness Level */}
                  {currentProfile.cleanlinessLevel && (
                    <div className="flex items-center">
                      <Icon icon="mdi:broom" className="mr-2 text-base text-blue-500" />
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
                      <Icon icon="mdi:smoking-off" className="mr-2 text-base text-red-500" />
                      <span className="text-gray-700"><strong>Smoking:</strong> {formatLabel(currentProfile.smokingPolicy)}</span>
                    </div>
                  )}

                  {/* Cooking Skills */}
                  {currentProfile.cookingSkills && (
                    <div className="flex items-center">
                      <Icon icon="mdi:chef-hat" className="mr-2 text-base text-orange-500" />
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
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-800">Accommodation Status:</h3>

                  <p className="rounded-full bg-blue-500 text-white px-3 py-1 text-sm font-semibold shadow-md">
                    {formatLabel(
                      currentProfile.accommodationStatus === 'have-room'
                        ? 'Has Room'
                        : 'Looking'
                    )}
                  </p>
                </div>
                
                {/* Have Room Details*/}
                {currentProfile.accommodationStatus === 'have-room' && (
                  <div>
                    <div className={`mt-2 space-y-2`}>
                      {(currentProfile.districts) && (
                        <div className="flex items-center">
                          <Icon icon="mdi:map-marker" className="mr-2 text-base text-blue-500" />
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
                          <Icon icon="mdi:currency-usd" className="mr-2 text-base text-blue-500" />
                          <span className="text-gray-700"><strong>Monthly Fee:</strong> {currentProfile.accommodationFee} Million VND/month</span>
                        </div>
                      )}
                    </div>

                  {currentProfile.accommodationServices &&
                    currentProfile.accommodationServices.length > 0 && (
                      <div className="mt-2">
                        <div className="flex items-center mb-1">
                          <Icon icon="mdi:tools" className="mr-2 text-base text-blue-500" />
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
                <div className={`absolute top-20 right-4 p-4 rounded-full ${currentX < -50 ? 'bg-red-500 opacity-100' : 'bg-gray-300 opacity-50'} transition-all`}>
                  <Icon icon="mdi:close" className="text-white text-2xl" />
                </div>
              </>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center gap-8 mb-6">
          {/* Dislike Button */}
          <button
            onClick={() => handleSwipe('left')}
            disabled={isAnimating}
            className="w-20 h-20 bg-red-500 hover:bg-red-600 rounded-full border-none text-white disabled:opacity-50 flex flex-col justify-center items-center shadow-lg transition-all duration-200"
          >
            <Icon icon="mdi:close" className="text-4xl" />
          </button>
          
          {/* Like Button */}
          <button
            onClick={() => handleSwipe('right')}
            disabled={isAnimating}
            className="w-20 h-20 bg-green-500 hover:bg-green-600 rounded-full border-none text-white disabled:opacity-50 flex flex-col justify-center items-center shadow-lg transition-all duration-200"
          >
            <Icon icon="mdi:like" className="text-4xl" />
          </button>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-6"
          onClick={closeDetailModal}
        >
          <div 
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[95vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 space-y-6">
              <img
                src={profileImage}
                alt={currentProfile.displayName || currentProfile.email}
                className="w-128 h-128 object-top rounded-t-2xl block mx-auto"
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
                          {currentProfile.accommodationServiceFee && (
                            <div className="flex items-center">
                              <Icon icon="mdi:account-cash" className="mr-2 text-base text-emerald-500" />
                              <span className="text-gray-700"><strong>Service Fee:</strong> {currentProfile.accommodationServiceFee}  VND/month</span>
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
              It's a Match!
            </h2>
            <p className="text-gray-600 mb-6">
              You and <span className="font-bold text-green-600">{matchedProfile.displayName || matchedProfile.email}</span> have liked each other!
            </p>

            {/* Profile Preview */}
            <div className="flex justify-center gap-4 mb-6">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-green-500 shadow-lg">
                <img
                  src={getUserAvatar(matchedProfile.photoURL, matchedProfile.email || matchedProfile.userId)}
                  alt={matchedProfile.displayName || 'User'}
                  className="w-full h-full object-cover"
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
          onClick={() => setShowMap(false)}   // Bấm bên ngoài → tắt
        >
          <div
            className="bg-white p-4 rounded-xl shadow-xl max-w-7xl w-full relative"
            onClick={(e) => e.stopPropagation()}   // Bấm vào box → không tắt
          >
            {/* Close button */}
            <button
              onClick={() => setShowMap(false)}
              className="absolute top-3 right-3 text-gray-600 hover:text-black"
            >
              <Icon icon="mdi:close" className="w-10 h-10" />
            </button>

            {/* Map Component */} 
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
    </GreenHomeBackground>
  );
}