"use client";

import { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";
import { getProfile, likeUser } from "@/lib/profileService";
import { queryMatchingProfile } from "@/lib/chromaService";
import { UserProfile } from "@/types/profile";
import { auth } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getUserAvatar } from "@/lib/avatarHelper";
import { useRouter } from "next/navigation";
import { profile } from "console";
import { createChatFromMatch, checkChatExists } from "@/lib/utils/matchHelper";
import { useUserChats } from "@/lib/hooks/useChat";

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
  const [seenUserIds, setSeenUserIds] = useState<string[]>([]);
  const [noMoreProfiles, setNoMoreProfiles] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [currentX, setCurrentX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState<UserProfile | null>(null);
  const [creatingChat, setCreatingChat] = useState<string | null>(null);

  // Get user's chats to check existing conversations
  const { chats } = useUserChats(currentUserId);

  // Function to load the next matching profile
  const loadNextProfile = async (userId: string, excludeIds: string[]) => {
    try {
      setLoadingNext(true);
      
      // Query ChromaDB for a matching profile
      const result = await queryMatchingProfile(userId, excludeIds);
      const targetId = result?.userId;

      if (!targetId) {
        await loadNextProfile(userId, excludeIds);
        return;
      }
      
      
      if (!result) {
        setCurrentProfile(null);
        setNoMoreProfiles(true);
        return;
      }
      
      const { userId: matchedUserId, similarity } = result;
      const currentUserProfile = await getProfile(userId);

      if (matchedUserId === userId) {
        await loadNextProfile(userId, [...excludeIds, matchedUserId]);
        return;
      }
      else if (currentUserProfile?.likedUsers?.includes(matchedUserId) || currentUserProfile?.passedUsers?.includes(matchedUserId)) {
        await loadNextProfile(userId, [...excludeIds, matchedUserId]);
        return;
      }

      console.log(`[Match] Profile: ${matchedUserId} | Similarity: ${similarity.toFixed(1)}%`);
      
      // Fetch the full profile from Firebase
      const profile = await getProfile(matchedUserId);

      if (profile) {
        setCurrentProfile(profile);
        setSeenUserIds(prev => [...prev, matchedUserId]);
      } else {
        // Profile not found in Firebase, try next one
        await loadNextProfile(userId, [...excludeIds, matchedUserId]);
      }
    } catch (error) {
      console.error("Error loading next profile:", error);
      setNoMoreProfiles(true);
    } finally {
      setLoadingNext(false);
    }
  };

  // Load first profile on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUserId(user.uid);
        try {
          await loadNextProfile(user.uid, []);
        } catch (error) {
          console.error("Error fetching initial profile:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (isAnimating || !currentProfile || !currentUserId) return;
    
    setIsAnimating(true);
    setSwipeDirection(direction);
    
    // If user liked, save to Firebase
    if (direction === 'right') {
      const result = await likeUser(currentUserId, currentProfile.userId);
      
      if (result.success && result.isMatch) {
        // Show match modal
        setMatchedProfile(currentProfile);
        setShowMatchModal(true);
      }
    }
    
    setTimeout(async () => {
      setSwipeDirection(null);
      setIsAnimating(false);
      // Load the next profile
      await loadNextProfile(currentUserId, seenUserIds);
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

  const handleStartOver = async () => {
    if (!currentUserId) return;
    setSeenUserIds([]);
    setNoMoreProfiles(false);
    await loadNextProfile(currentUserId, []);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-100 to-emerald-100">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg"></span>
          <p className="mt-4 text-gray-600">Loading profiles...</p>
        </div>
      </div>
    );
  }

  if (!currentProfile || noMoreProfiles) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-100 to-emerald-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-600">No more profiles!</h2>
          <button 
            onClick={handleStartOver}
            className="btn btn-primary"
          >
            Start Over
          </button>
        </div>
      </div>
    );
  }

  const profileImage = getUserAvatar(currentProfile.photoURL, currentProfile.email || currentProfile.userId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-emerald-100 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push('/liked')}
            className="btn btn-circle btn-ghost relative"
          >
            <Icon icon="mdi:home-account" className="text-2xl text-green-500" />
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Roomatinder</h1>
          <div className="w-12"></div>
        </div>

        {/* Card Container */}
        <div className="relative h-[900px] mb-6">
          
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

              <div className="absolute bottom-4 left-4 text-white">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-2xl font-bold">
                    {currentProfile.displayName || currentProfile.email.split('@')[0]}
                  </h2>
                  {currentProfile.isStudentVerified && (
                    <img 
                      src="/icons/verified.png" 
                      alt="Verified Student" 
                      className="w-6 h-6"
                      title="Verified Student"
                    />
                  )}
                  {currentProfile.nickname && (
                    <span className="text-xs px-2 py-1 rounded-full font-medium bg-purple-400/80 backdrop-blur-sm border border-purple-300/50">
                      "{currentProfile.nickname}"
                    </span>
                  )}
                  {currentProfile.accommodationStatus && (
                    <span className="text-xs px-2 py-1 rounded-full font-medium bg-white/20 backdrop-blur-sm border border-white/30 bg-green-600">
                      {currentProfile.accommodationStatus === 'have-room' ? 'Has Room' : 'Looking for Room'}
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
                <p className="text-gray-600 text-sm leading-relaxed">
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
                    {currentProfile.districts && (
                      <div className="flex items-center">
                        <Icon icon="mdi:map-marker" className="mr-2 text-base text-blue-500" />
                        <span className="text-gray-700"><strong>Address:</strong> {currentProfile.districts.join(', ')}</span>
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
                            className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium"
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
                      {currentProfile.districts && (
                        <div className="flex items-center">
                          <Icon icon="mdi:map-marker" className="mr-2 text-base text-emerald-500" />
                          <span className="text-gray-700"><strong>Address:</strong> {currentProfile.districts.join(', ')}</span>
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
    </div>
  );
}