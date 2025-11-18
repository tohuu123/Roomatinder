"use client";

import { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";
import { getAllProfiles } from "@/lib/profileService";
import { UserProfile } from "@/types/profile";
import { auth } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";

// Generic stock images for profile pictures
const STOCK_IMAGES = [
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1494790108755-2616b612b167?w=400&h=600&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=600&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=600&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=600&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=600&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=600&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=600&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?w=400&h=600&fit=crop&crop=face",
];

// Helper function to get a consistent stock image for a user
function getStockImage(userId: string): string {
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return STOCK_IMAGES[hash % STOCK_IMAGES.length];
}

// Helper function to format budget in USD
function formatBudget(min: number, max: number): string {
  return `$${(min / 1000000).toFixed(1)}-${(max / 1000000).toFixed(1)}M VND/month`;
}

// Helper function to format field labels
function formatLabel(value: string): string {
  return value.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

// Helper function to format date
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
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Load profiles from Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUserId(user.uid);
        try {
          const fetchedProfiles = await getAllProfiles(user.uid);
          setProfiles(fetchedProfiles);
        } catch (error) {
          console.error("Error fetching profiles:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const currentProfile = profiles[currentIndex];

  const handleSwipe = (direction: 'left' | 'right') => {
    if (isAnimating || !currentProfile) return;
    
    setIsAnimating(true);
    setSwipeDirection(direction);
    
    // Log swipe action (can be saved to Firebase later)
    console.log(`${direction === 'left' ? 'Rejected' : 'Liked'}: ${currentProfile.displayName || currentProfile.email}`);
    
    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
      setSwipeDirection(null);
      setIsAnimating(false);
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

  if (!currentProfile || currentIndex >= profiles.length) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-pink-100 to-blue-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-600">No more profiles!</h2>
          <button 
            onClick={() => setCurrentIndex(0)}
            className="btn btn-primary"
          >
            Start Over
          </button>
        </div>
      </div>
    );
  }

  const profileImage = currentProfile.photoURL || getStockImage(currentProfile.userId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-blue-100 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Roomatinder</h1>
          <p className="text-gray-600">Find your perfect roommate</p>
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
                <h2 className="text-2xl font-bold">
                  {currentProfile.displayName || currentProfile.email.split('@')[0]}
                </h2>
                <p className="text-sm opacity-90">{currentProfile.location}</p>
              </div>
            </div>

            {/* Profile Info */}
            <div className="p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">About</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {currentProfile.bio || "No bio provided"}
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
                <div>
                  <h4 className="font-semibold text-gray-800">Budget</h4>
                  <p className="text-gray-600">{formatBudget(currentProfile.budgetMin, currentProfile.budgetMax)}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Cleanliness</h4>
                  <p className="text-gray-600">{formatLabel(currentProfile.cleanlinessLevel)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Swipe Indicators */}
          {isDragging && (
            <>
              <div className={`absolute top-20 left-4 p-4 rounded-full ${currentX > 50 ? 'bg-green-500 opacity-100' : 'bg-gray-300 opacity-50'} transition-all`}>
                <Icon icon="mdi:heart" className="text-white text-2xl" />
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
            <Icon icon="mdi:heart" className="text-4xl" />
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
              {/* Profile Name and Location */}
              <div className="text-center mb-4">
                <h2 className="text-2xl font-bold mb-1 text-gray-800">
                  {currentProfile.displayName || currentProfile.email.split('@')[0]}
                </h2>
                <p className="text-sm text-gray-600 flex items-center justify-center">
                  <Icon icon="mdi:map-marker" className="mr-1 text-sm" />
                  {currentProfile.location}
                </p>
              </div>
              
              {/* Bio Section */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                  <Icon icon="mdi:account-circle" className="mr-2 text-xl text-blue-600" />
                  About
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {currentProfile.bio || "No bio provided"}
                </p>
              </div>

              {/* Interests Section */}
              {currentProfile.interests && currentProfile.interests.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                    <Icon icon="mdi:heart-multiple" className="mr-2 text-xl text-pink-600" />
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
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                  <h4 className="text-base font-bold text-gray-800 mb-2 flex items-center">
                    <Icon icon="mdi:cash-multiple" className="mr-2 text-lg text-green-600" />
                    Budget
                  </h4>
                  <p className="text-gray-700 text-sm font-medium">
                    {formatBudget(currentProfile.budgetMin, currentProfile.budgetMax)}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                  <h4 className="text-base font-bold text-gray-800 mb-2 flex items-center">
                    <Icon icon="mdi:calendar" className="mr-2 text-lg text-blue-600" />
                    Move-in Date
                  </h4>
                  <p className="text-gray-700 text-sm font-medium">
                    {formatDate(currentProfile.moveInDate)}
                  </p>
                </div>
              </div>

              {/* Lifestyle Section */}
              <div className="bg-gray-50 p-4 rounded-xl">
                <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                  <Icon icon="mdi:home-heart" className="mr-2 text-xl text-gray-600" />
                  Lifestyle Preferences
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
                  {currentProfile.socialProfile && (
                    <div className="flex items-center">
                      <Icon icon="mdi:account-group" className="mr-2 text-base text-green-500" />
                      <span className="text-gray-700"><strong>Social:</strong> {formatLabel(currentProfile.socialProfile)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Education & Location Section */}
              <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                  <Icon icon="mdi:map-marker" className="mr-2 text-xl text-purple-600" />
                  Location & Education
                </h3>
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="flex items-center">
                    <Icon icon="mdi:city" className="mr-2 text-base text-purple-500" />
                    <span className="text-gray-700"><strong>Location:</strong> {currentProfile.location}</span>
                  </div>
                  {currentProfile.district && (
                    <div className="flex items-center">
                      <Icon icon="mdi:map" className="mr-2 text-base text-purple-500" />
                      <span className="text-gray-700"><strong>District:</strong> {currentProfile.district}</span>
                    </div>
                  )}
                  {currentProfile.university && (
                    <div className="flex items-center">
                      <Icon icon="mdi:school" className="mr-2 text-base text-purple-500" />
                      <span className="text-gray-700"><strong>University:</strong> {currentProfile.university}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Preferences Section - if any optional fields exist */}
              {(currentProfile.sharedSpaceCleaning || currentProfile.overnightGuestPolicy || 
                currentProfile.partyFrequency || currentProfile.studyHabits || 
                currentProfile.cookingSkills || currentProfile.guestPolicy) && (
                <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                    <Icon icon="mdi:cog" className="mr-2 text-xl text-orange-600" />
                    Additional Preferences
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    {currentProfile.sharedSpaceCleaning && (
                      <div className="flex items-center">
                        <Icon icon="mdi:home-cleaning" className="mr-2 text-base text-orange-500" />
                        <span className="text-gray-700"><strong>Cleaning:</strong> {formatLabel(currentProfile.sharedSpaceCleaning)}</span>
                      </div>
                    )}
                    {currentProfile.overnightGuestPolicy && (
                      <div className="flex items-center">
                        <Icon icon="mdi:bed" className="mr-2 text-base text-orange-500" />
                        <span className="text-gray-700"><strong>Overnight Guests:</strong> {formatLabel(currentProfile.overnightGuestPolicy)}</span>
                      </div>
                    )}
                    {currentProfile.partyFrequency && (
                      <div className="flex items-center">
                        <Icon icon="mdi:party-popper" className="mr-2 text-base text-orange-500" />
                        <span className="text-gray-700"><strong>Parties:</strong> {formatLabel(currentProfile.partyFrequency)}</span>
                      </div>
                    )}
                    {currentProfile.studyHabits && (
                      <div className="flex items-center">
                        <Icon icon="mdi:book-open" className="mr-2 text-base text-orange-500" />
                        <span className="text-gray-700"><strong>Study Habits:</strong> {formatLabel(currentProfile.studyHabits)}</span>
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
                    {currentProfile.wakeUpTime && (
                      <div className="flex items-center">
                        <Icon icon="mdi:alarm" className="mr-2 text-base text-orange-500" />
                        <span className="text-gray-700"><strong>Wake Up:</strong> {currentProfile.wakeUpTime}</span>
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
                  <Icon icon="mdi:heart-circle" className="text-lg" />
                  Like
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}