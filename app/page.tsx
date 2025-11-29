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



// Helper function to format budget in VND
function formatBudget(min: number, max: number): string {
  return `${(min / 1000000).toFixed(1)}-${(max / 1000000).toFixed(1)} million VND/month`;
}

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
    'smoking-ok': 'Smoking OK',
    'outdoor-only': 'Outdoor Only',
    'no-pets': 'No Pets',
    'pets-ok': 'Pets OK',
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
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState<UserProfile | null>(null);
  const [showAccommodationDetails, setShowAccommodationDetails] = useState(false);

  // Function to load the next matching profile
  const loadNextProfile = async (userId: string, excludeIds: string[]) => {
    try {
      setLoadingNext(true);
      
      // Query ChromaDB for a matching profile
      const result = await queryMatchingProfile(userId, excludeIds);
      
      if (!result) {
        setCurrentProfile(null);
        setNoMoreProfiles(true);
        return;
      }
      
      const { userId: matchedUserId, similarity } = result;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-pink-100 to-blue-100">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg"></span>
          <p className="mt-4 text-gray-600">Loading profiles...</p>
        </div>
      </div>
    );
  }

  if (!currentProfile || noMoreProfiles) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-pink-100 to-blue-100">
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
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-blue-100 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push('/liked')}
            className="btn btn-circle btn-ghost relative"
          >
            <Icon icon="mdi:home-account" className="text-2xl text-pink-500" />
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Roomatinder</h1>
          <div className="w-12"></div>
        </div>

        {/* Card Container */}
        <div className="relative h-[600px] mb-6">
          
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
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold">
                    {currentProfile.displayName || currentProfile.email.split('@')[0]}
                  </h2>
                  {currentProfile.hasAccommodation && (
                    <span className="text-xs px-2 py-1 rounded-full font-medium bg-white/20 backdrop-blur-sm border border-white/30">
                      {currentProfile.hasAccommodation === 'have-room' ? 'Has Room' : 'Looking'}
                    </span>
                  )}
                </div>
                <p className="text-sm opacity-90">{currentProfile.location}</p>
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
                        className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-xs font-medium"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                {currentProfile.gender && (
                  <div>
                    <h4 className="font-semibold text-gray-800">Gender</h4>
                    <p className="text-gray-600">
                      {currentProfile.gender === 'male' && 'Male'}
                      {currentProfile.gender === 'female' && 'Female'}
                      {currentProfile.gender === 'other' && 'Other'}
                    </p>
                  </div>
                )}
                <div>
                  <h4 className="font-semibold text-gray-800">Budget</h4>
                  <p className="text-gray-600">{formatBudget(currentProfile.budgetMin, currentProfile.budgetMax)}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Cleanliness</h4>
                  <p className="text-gray-600">{formatLabel(currentProfile.cleanlinessLevel)}</p>
                </div>
                {currentProfile.hasAccommodation && (
                  <div>
                    <h4 className="font-semibold text-gray-800">Accommodation</h4>
                    <p className="text-gray-600">
                      {currentProfile.hasAccommodation === 'have-room' ? 'Has room' : 'Looking'}
                    </p>
                  </div>
                )}
              </div>
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
                <p className="text-gray-600 text-sm leading-relaxed">
                  {currentProfile.bio || "No bio available"}
                </p>
              </div>

              {/* Interests Section */}
              {currentProfile.interests && currentProfile.interests.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                    <Icon icon="mdi:star" className="mr-2 text-xl text-pink-600" />
                    Interests
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {currentProfile.interests.map((interest, index) => (
                      <span
                        key={index}
                        className="bg-gradient-to-r from-pink-100 to-blue-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium border border-pink-200 shadow-sm"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Basic Details Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentProfile.gender && (
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                    <h4 className="text-base font-bold text-gray-800 mb-2 flex items-center">
                      <Icon icon="mdi:account" className="mr-2 text-lg text-purple-600" />
                      Gender
                    </h4>
                    <p className="text-gray-700 text-sm font-medium">
                      {currentProfile.gender === 'male' && 'Male'}
                      {currentProfile.gender === 'female' && 'Female'}
                      {currentProfile.gender === 'other' && 'Other'}
                    </p>
                  </div>
                )}
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                  <h4 className="text-base font-bold text-gray-800 mb-2 flex items-center">
                    <Icon icon="mdi:cash-multiple" className="mr-2 text-lg text-green-600" />
                    Budget
                  </h4>
                  <p className="text-gray-700 text-sm font-medium">
                    {formatBudget(currentProfile.budgetMin, currentProfile.budgetMax)}
                  </p>
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
                    <span className="text-gray-700"><strong>Cleanliness:</strong> {formatLabel(currentProfile.cleanlinessLevel)}</span>
                  </div>
                  <div className="flex items-center">
                    <Icon icon="mdi:sleep" className="mr-2 text-base text-purple-500" />
                    <span className="text-gray-700"><strong>Sleep Schedule:</strong> {formatLabel(currentProfile.sleepSchedule)}</span>
                  </div>
                  <div className="flex items-center">
                    <Icon icon="mdi:smoking-off" className="mr-2 text-base text-red-500" />
                    <span className="text-gray-700"><strong>Smoking:</strong> {formatLabel(currentProfile.smokingPolicy)}</span>
                  </div>
                  <div className="flex items-center">
                    <Icon icon="mdi:paw" className="mr-2 text-base text-orange-500" />
                    <span className="text-gray-700"><strong>Pets:</strong> {formatLabel(currentProfile.petPolicy)}</span>
                  </div>
                  {currentProfile.noiseLevelPreference && (
                    <div className="flex items-center">
                      <Icon icon="mdi:volume-high" className="mr-2 text-base text-yellow-500" />
                      <span className="text-gray-700"><strong>Noise Level:</strong> {formatLabel(currentProfile.noiseLevelPreference)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Educatio Section */}
              <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                  <Icon icon="mdi:map-marker" className="mr-2 text-xl text-purple-600" />
                  Education
                </h3>
                <div className="grid grid-cols-1 gap-3 text-sm">
                  {currentProfile.university && (
                    <div className="flex items-center">
                      <Icon icon="mdi:school" className="mr-2 text-base text-purple-500" />
                      <span className="text-gray-700"><strong>University:</strong> {currentProfile.university}</span>
                    </div>
                  )}
                  {currentProfile.district && (
                    <div className="flex items-center">
                      <Icon icon="mdi:map" className="mr-2 text-base text-purple-500" />
                      <span className="text-gray-700"><strong>University District:</strong> {currentProfile.district}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Accommodation Information Section */}
              {(currentProfile.hasAccommodation || process.env.NODE_ENV === 'development') && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center">
                      <Icon icon="mdi:home" className="mr-2 text-xl text-blue-600" />
                      Accommodation Details
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-200 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                        {currentProfile.hasAccommodation === 'have-room' ? '🏠 Has Room' : '🔍 Looking'}
                      </span>
                      {currentProfile.hasAccommodation === 'have-room' && (
                        <button
                          onClick={() => setShowAccommodationDetails(!showAccommodationDetails)}
                          className="btn btn-xs btn-circle btn-ghost"
                          aria-label={showAccommodationDetails ? 'Hide details' : 'Show details'}
                        >
                          <Icon 
                            icon={showAccommodationDetails ? "mdi:chevron-up" : "mdi:chevron-down"} 
                            className="text-lg text-blue-600" 
                          />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center">
                      <Icon icon="mdi:home-account" className="mr-2 text-base text-blue-500" />
                      <span className="text-gray-700">
                        <strong>Status:</strong> {currentProfile.hasAccommodation === 'have-room' ? 'Has room to share' : 'Looking for accommodation'}
                      </span>
                    </div>
                    
                    {/* Accommodation Details for users who have rooms */}
                    {currentProfile.hasAccommodation === 'have-room' && showAccommodationDetails && (
                      <div className="bg-white p-4 rounded-lg border border-blue-100 space-y-3">
                        {/* Basic Property Info */}
                        <div className="border-b border-gray-100 pb-3">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold text-blue-700 flex items-center">
                              <Icon icon="mdi:home-city" className="mr-1 text-base" />
                              Property Information
                            </h4>
                          </div>
                          <div className="grid grid-cols-1 gap-2">
                            <div className="flex items-start">
                              <Icon icon="mdi:map-marker" className="mr-2 text-base text-blue-500 mt-0.5 flex-shrink-0" />
                              <div className="text-gray-700 text-sm">
                                <strong>Address:</strong> {currentProfile.accommodationLocation || <span className="text-gray-400 italic">Not specified</span>}
                              </div>
                            </div>
                            <div className="flex items-center">
                              <Icon icon="mdi:resize" className="mr-2 text-base text-blue-500 flex-shrink-0" />
                              <div className="text-gray-700 text-sm">
                                <strong>Size:</strong> {currentProfile.accommodationSize ? currentProfile.accommodationSize.replace('-', ' ').replace('bedroom', ' bedroom') : <span className="text-gray-400 italic">Not specified</span>}
                              </div>
                            </div>
                            <div className="flex items-center">
                              <Icon icon="mdi:home-variant" className="mr-2 text-base text-blue-500 flex-shrink-0" />
                              <div className="text-gray-700 text-sm">
                                <strong>Type:</strong> {currentProfile.accommodationHouseType || <span className="text-gray-400 italic">Not specified</span>}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Cost Breakdown */}
                        <div className="border-b border-gray-100 pb-3">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold text-green-700 flex items-center">
                              <Icon icon="mdi:cash-multiple" className="mr-1 text-base" />
                              Cost Breakdown
                            </h4>
                          </div>
                          <div className="grid grid-cols-1 gap-1">
                            <div className="flex items-center">
                              <Icon icon="mdi:cash" className="mr-2 text-base text-green-500 flex-shrink-0" />
                              <div className="text-gray-700 text-sm">
                                <strong>Rent:</strong> {currentProfile.accommodationHomeFeesAmount || currentProfile.accommodationHomeFees || <span className="text-gray-400 italic">Not specified</span>}
                              </div>
                            </div>
                            <div className="flex items-center">
                              <Icon icon="mdi:flash" className="mr-2 text-base text-yellow-500 flex-shrink-0" />
                              <div className="text-gray-700 text-sm">
                                <strong>Electricity:</strong> {currentProfile.accommodationElectricityFees || <span className="text-gray-400 italic">Not specified</span>}
                              </div>
                            </div>
                            <div className="flex items-center">
                              <Icon icon="mdi:water" className="mr-2 text-base text-blue-500 flex-shrink-0" />
                              <div className="text-gray-700 text-sm">
                                <strong>Water:</strong> {currentProfile.accommodationWaterFees || <span className="text-gray-400 italic">Not specified</span>}
                              </div>
                            </div>
                            <div className="flex items-center">
                              <Icon icon="mdi:wifi" className="mr-2 text-base text-purple-500 flex-shrink-0" />
                              <div className="text-gray-700 text-sm">
                                <strong>Utilities:</strong> {currentProfile.accommodationUtilitiesFees || <span className="text-gray-400 italic">Not specified</span>}
                              </div>
                            </div>
                            <div className="flex items-center">
                              <Icon icon="mdi:plus-circle" className="mr-2 text-base text-orange-500 flex-shrink-0" />
                              <div className="text-gray-700 text-sm">
                                <strong>Additional:</strong> {currentProfile.accommodationAdditionalFees || <span className="text-gray-400 italic">Not specified</span>}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Amenities & Features */}
                        <div className="border-b border-gray-100 pb-3">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold text-purple-700 flex items-center">
                              <Icon icon="mdi:home-modern" className="mr-1 text-base" />
                              Amenities & Features
                            </h4>
                          </div>
                          <div className="grid grid-cols-1 gap-2">
                            <div className="flex items-start">
                              <Icon icon="mdi:sofa" className="mr-2 text-base text-purple-500 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <span className="text-gray-700 text-sm"><strong>Furniture & Appliances:</strong></span>
                                <p className="text-gray-600 text-xs mt-0.5">
                                  {currentProfile.accommodationFurniture || <span className="text-gray-400 italic">Not specified</span>}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start">
                              <Icon icon="mdi:security" className="mr-2 text-base text-red-500 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <span className="text-gray-700 text-sm"><strong>Security Features:</strong></span>
                                <p className="text-gray-600 text-xs mt-0.5">
                                  {currentProfile.accommodationSecurity || <span className="text-gray-400 italic">Not specified</span>}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* House Rules & Policies */}
                        <div className="border-b border-gray-100 pb-3">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold text-orange-700 flex items-center">
                              <Icon icon="mdi:clipboard-list" className="mr-1 text-base" />
                              House Rules & Policies
                            </h4>
                          </div>
                          <div className="grid grid-cols-1 gap-2">
                            <div className="flex items-start">
                              <Icon icon="mdi:paw" className="mr-2 text-base text-orange-500 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <span className="text-gray-700 text-sm"><strong>Pet Policy:</strong></span>
                                <p className="text-gray-600 text-xs mt-0.5">
                                  {currentProfile.accommodationPetPolicy || <span className="text-gray-400 italic">Not specified</span>}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start">
                              <Icon icon="mdi:clock-outline" className="mr-2 text-base text-orange-500 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <span className="text-gray-700 text-sm"><strong>Time Restrictions:</strong></span>
                                <p className="text-gray-600 text-xs mt-0.5">
                                  {currentProfile.accommodationRestrictedHours || <span className="text-gray-400 italic">Not specified</span>}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <Icon icon="mdi:account-supervisor" className="mr-2 text-base text-orange-500 flex-shrink-0" />
                              <span className="text-gray-700 text-sm">
                                <strong>Lives with landlord:</strong> {currentProfile.accommodationLiveWithRental ? 'Yes' : 'No'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold text-gray-700 flex items-center">
                              <Icon icon="mdi:text" className="mr-1 text-base" />
                              Property Description
                            </h4>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-md border">
                            <p className="text-gray-600 text-xs leading-relaxed">
                              {currentProfile.accommodationDescription || 
                                <span className="text-gray-400 italic">No description provided yet. This would include details about the neighborhood, nearby amenities, transportation, and what makes this place special.</span>
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Additional Preferences Section - if any optional fields exist */}
              {(currentProfile.sharedSpaceCleaning || currentProfile.cookingSkills || currentProfile.guestPolicy) && (
                <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                    <Icon icon="mdi:cog" className="mr-2 text-xl text-orange-600" />
                    Additional Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    {currentProfile.sharedSpaceCleaning && (
                      <div className="flex items-center">
                        <Icon icon="mdi:home-cleaning" className="mr-2 text-base text-orange-500" />
                        <span className="text-gray-700"><strong>Cleaning:</strong> {formatLabel(currentProfile.sharedSpaceCleaning)}</span>
                      </div>
                    )}
                    {currentProfile.cookingSkills && (
                      <div className="flex items-center">
                        <Icon icon="mdi:chef-hat" className="mr-2 text-base text-orange-500" />
                        <span className="text-gray-700"><strong>Cooking:</strong> {formatLabel(currentProfile.cookingSkills)}</span>
                      </div>
                    )}
                    {currentProfile.guestPolicy && (
                      <div className="flex items-center">
                        <Icon icon="mdi:account-multiple" className="mr-2 text-base text-orange-500" />
                        <span className="text-gray-700"><strong>Guest Policy:</strong> {formatLabel(currentProfile.guestPolicy)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

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
          className="fixed inset-0 bg-gradient-to-br from-pink-500/90 to-purple-500/90 flex items-center justify-center z-50 p-6"
          onClick={() => setShowMatchModal(false)}
        >
          <div 
            className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl text-center animate-bounce"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Match Icon */}
            <div className="mb-6">
              <Icon icon="mdi:home" className="text-8xl text-yellow-500 mx-auto animate-pulse" />
            </div>

            {/* Match Title */}
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              It's a Match!
            </h2>
            <p className="text-gray-600 mb-6">
              You and <span className="font-bold text-yellow-600">{matchedProfile.displayName || matchedProfile.email}</span> have liked each other!
            </p>

            {/* Profile Preview */}
            <div className="flex justify-center gap-4 mb-6">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-yellow-500 shadow-lg">
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
                  setShowMatchModal(false);
                  router.push('/liked');
                }}
                className="btn btn-primary btn-lg w-full"
              >
                <Icon icon="mdi:message" className="mr-2" />
                View Matches
              </button>
              <button
                onClick={() => setShowMatchModal(false)}
                className="btn btn-ghost btn-lg w-full text-gray-600"
              > 
                Continue Swipe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}