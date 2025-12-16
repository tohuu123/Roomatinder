"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase";
import { getLikedProfiles, getMatches, unlikeUser, likeUser, getPassedProfiles, removeAllPassedUsers } from "@/lib/profileService";
import { UserProfile } from "@/types/profile";
import { createChatFromMatch, checkChatExists } from "@/lib/utils/matchHelper";
import { useUserChats } from "@/lib/hooks/useChat";
import { GreenHomeBackground } from "@/components/magicui/green-home-background";

export default function LikedPage() {
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [likedProfiles, setLikedProfiles] = useState<UserProfile[]>([]);
  const [passedProfiles, setPassedProfiles] = useState<UserProfile[]>([]);
  const [matches, setMatches] = useState<UserProfile[]>([]);
  const [activeTab, setActiveTab] = useState<'liked' | 'passed' | 'matches'>('liked');
  const [loading, setLoading] = useState(true);
  const [creatingChat, setCreatingChat] = useState<string | null>(null);
  const [processingUnlike, setProcessingUnlike] = useState<Record<string, boolean>>({});
  const [processingLike, setProcessingLike] = useState<Record<string, boolean>>({});


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
      const [liked, matched, passed] = await Promise.all([
        getLikedProfiles(userId),
        getMatches(userId),
        getPassedProfiles(userId)
      ]);
      
      // Filter out ADMIN profiles
      const filterAdmin = (profiles: UserProfile[]) => 
        profiles.filter(p => 
          p.displayName?.toUpperCase() !== "ADMIN" && 
          p.nickname?.toUpperCase() !== "ADMIN"
        );
      
      setLikedProfiles(filterAdmin(liked));
      setMatches(filterAdmin(matched));
      setPassedProfiles(filterAdmin(passed));
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlike = async (profileId: string) => {
    if (!currentUserId) return;

    setProcessingUnlike(prev => ({ ...prev, [profileId]: true }));
    
    const success = await unlikeUser(currentUserId, profileId);
    if (success) {
      setLikedProfiles(prev => prev.filter(p => p.userId !== profileId));
      setMatches(prev => prev.filter(p => p.userId !== profileId));
    }

    setProcessingUnlike(prev => {
      const copy = { ...prev };
      delete copy[profileId];
      return copy;
    });  
  };

  const handleViewProfile = (slug?: string) => {
    if (slug) {
      router.push(`/profile/${slug}`);
    }
  };

  const handleLikeUser = async (profileId: string) => {
    if (!currentUserId) return;

    setProcessingLike(prev => ({ ...prev, [profileId]: true }));

    const profileToMove = passedProfiles.find(p => p.userId === profileId);

    const result = await likeUser(currentUserId, profileId);

    if (result.success) {
      setPassedProfiles(prev => prev.filter(p => p.userId !== profileId));

      if (profileToMove) {
        setLikedProfiles(prev => 
          prev.some(p => p.userId === profileId)
            ? prev
            : [profileToMove, ...prev]
        );
      }

      if (result.isMatch && profileToMove) {
        setMatches(prev => [...prev, profileToMove]);
        setLikedProfiles(prev => prev.filter(p => p.userId !== profileId));
      }
    }

    setProcessingLike(prev => {
      const copy = { ...prev };
      delete copy[profileId];
      return copy;
    });
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
      <GreenHomeBackground>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </GreenHomeBackground>
    );
  }

  const displayProfiles = activeTab === 'liked' ? likedProfiles : activeTab === 'passed' ? passedProfiles : matches;

  return (
    <GreenHomeBackground>
    <div className="min-h-screen p-4">
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
          <button
            className={`tab flex-1 ${activeTab === 'passed' ? 'tab-active bg-green-500 text-black' : 'text-gray-600'} rounded-xl transition-all`}
            onClick={() => setActiveTab('passed')}
          >
            <Icon icon="mdi:account-remove" className="mr-2 text-xl" />
            Passed ({passedProfiles.length})
          </button>
        </div>

        {/* Content */}
        {displayProfiles.length === 0 ? (
          <div className="text-center py-16">
            <Icon 
              icon={activeTab === 'liked' ? "mdi:account-search-outline" : activeTab === 'passed' ? "mdi:account-remove-outline" : "mdi:account-group-outline"} 
              className="text-6xl text-gray-300 mx-auto mb-4" 
            />
            <h2 className="text-2xl font-bold text-gray-600 mb-2">
              {activeTab === 'liked' ? 'No one in the list yet' : activeTab === 'passed' ? 'No one in the list yet' : 'No matches yet'}
            </h2>
            <p className="text-gray-500 mb-6">
              {activeTab === 'liked' 
                ? 'Start swiping to find your roommate!' 
                : activeTab === 'passed'
                ? 'You have not passed on anyone yet.'
                : 'When someone likes you back, matches will appear here'}
            </p>
            <button
              onClick={() => router.push('/')}
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
                  <Image
                    src={profile.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.userId}`}
                    alt={profile.displayName || 'User'}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  {activeTab === 'matches' && (
                    <div className="absolute top-4 right-4 badge badge-success badge-lg shadow-lg">
                      <Icon icon="mdi:handshake" className="mr-1" /> 
                      Match!
                    </div>
                  )}
                </figure>
                <div className="card-body">
                  {/* Display Name */}
                  <h2 className="card-title text-gray-800 text-xl">
                    {profile.displayName || 'Unnamed'}
                  </h2>                  

                  {/* Liked Profiles */}
                  {activeTab === 'liked' && (
                    <div className="card-actions grid grid-cols-2 justify-end mt-4">
                      <button
                        className="btn btn-outline btn-error w-full"
                        disabled={processingUnlike[profile.userId]}
                        onClick={() => handleUnlike(profile.userId)}
                      >
                        {processingUnlike[profile.userId] ? (
                          <>
                            <span className="loading loading-spinner mr-2"></span>
                            Processing...
                          </>
                        ) : (
                          <>
                            <Icon icon="mdi:thumb-down-outline" className="mr-2" />
                            Unlike
                          </>
                        )}
                      </button>

                      <button
                        className="btn btn-primary w-full"
                        onClick={() => handleViewProfile(profile.slug)}
                      >
                        <Icon icon="mdi:account-circle-outline" className="mr-2" />
                        View Profile
                      </button>
                    </div>
                  )}

                  {/* Matched Profiles */}
                  {activeTab === 'matches' && (
                  <>
                    {/* Row 1: Unlike + View Profile */}
                    <div className="card-actions grid grid-cols-2 gap-3 mt-4">
                      <button
                        className="btn btn-outline btn-error w-full"
                        disabled={processingUnlike[profile.userId]}
                        onClick={() => handleUnlike(profile.userId)}
                      >
                        {processingUnlike[profile.userId] ? (
                          <>
                            <span className="loading loading-spinner mr-2"></span>
                            Processing...
                          </>
                        ) : (
                          <>
                            <Icon icon="mdi:thumb-down-outline" className="mr-2" />
                            Unlike
                          </>
                        )}
                      </button>

                      <button
                        className="btn btn-primary w-full"
                        onClick={() => handleViewProfile(profile.slug)}
                      >
                        <Icon icon="mdi:account-circle-outline" className="mr-2" />
                        View Profile
                      </button>
                    </div>

                    {/* Row 2: Start Chat (full width) */}
                    <div className="card-actions mt-3">
                      <button
                        className="btn w-full"
                        onClick={() => handleStartChat(profile.userId)}
                        disabled={creatingChat === profile.userId}
                      >
                        {creatingChat === profile.userId ? (
                          <>
                            <span className="loading loading-spinner mr-2"></span>
                            Starting Chat...
                          </>
                        ) : (
                          <>
                            <Icon icon="mdi:chat-outline" className="mr-2" />
                            Start Chat
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}

                {/* Passed Profiles */}
                {activeTab === 'passed' && (
                  <div className="card-actions grid grid-cols-2 justify-end mt-4">
                    <button
                      className="btn btn-outline btn-success w-full"
                      onClick={() => handleLikeUser(profile.userId)}
                      disabled={processingLike[profile.userId]}
                    >
                      {processingLike[profile.userId] ? (
                        <>
                          <span className="loading loading-spinner mr-2"></span>
                          Processing...
                        </>
                      ) : (
                        <>
                          <Icon icon="mdi:thumb-up-outline" className="mr-2" />
                          Like Back
                        </>
                      )}
                    </button>
                    <button
                      className="btn btn-primary w-full"
                      onClick={() => handleViewProfile(profile.slug)}
                    >
                      <Icon icon="mdi:account-circle-outline" className="mr-2" />
                      View Profile
                    </button>
                  </div>
                )}
                </div>
              </div>
            ))}
            </div>
          )}
          {/* Remove all passed user from passed list button */}
          {activeTab === 'passed' && passedProfiles.length > 0 && (
            <div className="text-center mt-8">
              <button
                className="btn btn-outline bg-[#a0d4a0] hover:bg-[#6b9b7f] border-[#6b9b7f] hover:border-[#4a6b5a] text-[#4a6b5a] hover:text-white"
                onClick={async () => {
                  if (!currentUserId) return;

                  const success = await removeAllPassedUsers(currentUserId);
                  if (success) {
                    setPassedProfiles([]);   // Clear UI
                  }
                }}
              >
                Remove All Passed Users
              </button>
            </div>
          )}
        </div>
    </div>
    </GreenHomeBackground>
  );
}
