"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase";
import { getLikedProfiles, getMatches, unlikeUser } from "@/lib/profileService";
import { UserProfile } from "@/types/profile";
import { createChatFromMatch, checkChatExists } from "@/lib/utils/matchHelper";
import { useUserChats } from "@/lib/hooks/useChat";

export default function LikedPage() {
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [likedProfiles, setLikedProfiles] = useState<UserProfile[]>([]);
  const [matches, setMatches] = useState<UserProfile[]>([]);
  const [activeTab, setActiveTab] = useState<'liked' | 'matches'>('liked');
  const [loading, setLoading] = useState(true);
  const [creatingChat, setCreatingChat] = useState<string | null>(null);

  // Get user's chats to check existing conversations
  const { chats } = useUserChats(currentUserId);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserId(user.uid);
        loadData(user.uid);
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const loadData = async (userId: string) => {
    setLoading(true);
    try {
      const [liked, matched] = await Promise.all([
        getLikedProfiles(userId),
        getMatches(userId)
      ]);
      setLikedProfiles(liked);
      setMatches(matched);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlike = async (profileId: string) => {
    if (!currentUserId) return;
    
    const success = await unlikeUser(currentUserId, profileId);
    if (success) {
      setLikedProfiles(prev => prev.filter(p => p.userId !== profileId));
      setMatches(prev => prev.filter(p => p.userId !== profileId));
    }
  };

  const handleViewProfile = (slug?: string) => {
    if (slug) {
      router.push(`/profile/${slug}`);
    }
  };

  const handleStartChat = async (matchedUserId: string) => {
    if (!currentUserId) return;

    setCreatingChat(matchedUserId);

    try {
      // Check if chat already exists
      const existingChatId = checkChatExists(currentUserId, matchedUserId, chats);
      
      if (existingChatId) {
        // Navigate to existing chat
        router.push(`/chatroom?chatId=${existingChatId}`);
        return;
      }
      
      // Create new chat
      const chatId = await createChatFromMatch(currentUserId, matchedUserId);
      
      if (chatId) {
        router.push(`/chatroom?chatId=${chatId}`);
      } else {
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
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const displayProfiles = activeTab === 'liked' ? likedProfiles : matches;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-emerald-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.back()}
            className="btn btn-circle btn-ghost"
          >
            <Icon icon="mdi:arrow-left" className="text-2xl" />
          </button>
          <h1 className="text-3xl font-bold text-gray-800">
            People
          </h1>
          <div className="w-12"></div>
        </div>

        {/* Tabs */}
        <div className="tabs tabs-box mb-6 bg-white shadow-lg rounded-2xl p-2">
          <button
            className={`tab flex-1 ${activeTab === 'liked' ? 'tab-active bg-green-500 text-white' : 'text-gray-600'} rounded-xl transition-all`}
            onClick={() => setActiveTab('liked')}
          >
            <Icon icon="mdi:account-check" className="mr-2 text-xl" />
            Liked ({likedProfiles.length})
          </button>
          <button
            className={`tab flex-1 ${activeTab === 'matches' ? 'tab-active bg-green-500 text-black' : 'text-gray-600'} rounded-xl transition-all`}
            onClick={() => setActiveTab('matches')}
          >
            <Icon icon="mdi:handshake" className="mr-2 text-xl" />
            Matches ({matches.length})
          </button>
        </div>

        {/* Content */}
        {displayProfiles.length === 0 ? (
          <div className="text-center py-16">
            <Icon 
              icon={activeTab === 'liked' ? "mdi:account-search-outline" : "mdi:account-group-outline"} 
              className="text-6xl text-gray-300 mx-auto mb-4" 
            />
            <h2 className="text-2xl font-bold text-gray-600 mb-2">
              {activeTab === 'liked' ? 'No one in the list yet' : 'No matches yet'}
            </h2>
            <p className="text-gray-500 mb-6">
              {activeTab === 'liked' 
                ? 'Start swiping to find your roommate!' 
                : 'When someone likes you back, matches will appear here'}
            </p>
            <button
              onClick={() => router.push('/Swipe')}
              className="btn btn-primary"
            >
              <Icon icon="mdi:cards" className="mr-2" />
              Start Swiping
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayProfiles.map((profile) => (
              <div
                key={profile.userId}
                className="card card-border bg-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
              >
                <figure className="h-64 relative">
                  <img
                    src={profile.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.userId}`}
                    alt={profile.displayName || 'User'}
                    className="w-full h-full object-cover"
                  />
                  {activeTab === 'matches' && (
                    <div className="absolute top-4 right-4 badge badge-success badge-lg shadow-lg">
                      <Icon icon="mdi:handshake" className="mr-1" />
                      Match!
                    </div>
                  )}
                </figure>

                <div className="card-body">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="card-title text-gray-800">
                        {profile.displayName || 'Anonymous'}
                        <span className="text-sm font-normal text-gray-500">
                          {profile.gender === 'male' ? '♂' : profile.gender === 'female' ? '♀' : ''}
                        </span>
                      </h2>
                      {profile.isStudentVerified && (
                        <img 
                          src="/icons/verified.png" 
                          alt="Verified Student" 
                          className="w-5 h-5"
                          title="Verified Student"
                        />
                      )}
                      {profile.nickname && (
                        <span className="text-xs px-2 py-1 rounded-full font-medium bg-purple-100 text-purple-800">
                          "{profile.nickname}"
                        </span>
                      )}
                    </div>
                    {profile.hasAccommodation && (
                      <span className="text-xs px-2 py-1 rounded-full font-medium bg-blue-100 text-blue-800 border border-blue-200 whitespace-nowrap">
                        {profile.hasAccommodation === 'have-room' ? 'Has Room' : 'Looking'}
                      </span>
                    )}
                  </div>

                  <div className="space-y-4">
                    {/* About Section */}
                    {profile.bio && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <h3 className="font-semibold text-gray-800 mb-2">About</h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {profile.bio}
                        </p>
                      </div>
                    )}

                    {/* Interests Section */}
                    {profile.interests && profile.interests.length > 0 && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <h3 className="font-semibold text-gray-800 mb-2">Interests</h3>
                        <div className="flex flex-wrap gap-2">
                          {profile.interests.slice(0, 5).map((interest, idx) => (
                            <span
                              key={idx}
                              className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium"
                            >
                              {interest}
                            </span>
                          ))}
                          {profile.interests.length > 5 && (
                            <span className="text-gray-500 text-xs self-center">
                              +{profile.interests.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Basic Information Section */}
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h3 className="font-semibold text-gray-800 mb-2">Basic Information</h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {profile.gender && (
                          <div>
                            <h4 className="font-semibold text-gray-800">Gender</h4>
                            <p className="text-gray-600">
                              {profile.gender === 'male' && 'Male'}
                              {profile.gender === 'female' && 'Female'}
                            </p>
                          </div>
                        )}
                        {(profile.budgetMin || profile.budgetMax) && (
                          <div>
                            <h4 className="font-semibold text-gray-800">Budget</h4>
                            <p className="text-gray-600">
                              {profile.budgetMin?.toLocaleString('vi-VN')} - {profile.budgetMax?.toLocaleString('vi-VN')} VNĐ
                            </p>
                          </div>
                        )}
                        {(profile.hasAccommodation === 'looking' && profile.location) && (
                          <div>
                            <h4 className="font-semibold text-gray-800">Desired Location</h4>
                            <p className="text-gray-600">{profile.location}</p>
                          </div>
                        )}
                        {(profile.hasAccommodation === 'have-room' && profile.accommodationLocation) && (
                          <div>
                            <h4 className="font-semibold text-gray-800">Room Location</h4>
                            <p className="text-gray-600">{profile.accommodationLocation}</p>
                          </div>
                        )}
                        {profile.cleanlinessLevel && (
                          <div>
                            <h4 className="font-semibold text-gray-800">Cleanliness</h4>
                            <p className="text-gray-600 capitalize">{profile.cleanlinessLevel}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="card-actions justify-end mt-4">
                    {activeTab === 'matches' && (
                      <button
                        onClick={() => handleStartChat(profile.userId)}
                        disabled={creatingChat === profile.userId}
                        className="btn btn-success btn-sm"
                      >
                        {creatingChat === profile.userId ? (
                          <span className="loading loading-spinner loading-xs"></span>
                        ) : (
                          <>
                            <Icon icon="mdi:message" className="mr-1" />
                            Message
                          </>
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => handleViewProfile(profile.slug)}
                      className="btn btn-primary btn-sm"
                    >
                      <Icon icon="mdi:account" className="mr-1" />
                      View Profile
                    </button>
                    <button
                      onClick={() => handleUnlike(profile.userId)}
                      className="btn btn-ghost btn-sm text-red-500"
                    >
                      <Icon icon="mdi:account-remove" className="mr-1" />
                      Unlike
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
