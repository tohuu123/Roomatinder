"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase";
import { getLikedProfiles, getMatches, unlikeUser } from "@/lib/profileService";
import { UserProfile } from "@/types/profile";

export default function LikedPage() {
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [likedProfiles, setLikedProfiles] = useState<UserProfile[]>([]);
  const [matches, setMatches] = useState<UserProfile[]>([]);
  const [activeTab, setActiveTab] = useState<'liked' | 'matches'>('liked');
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-pink-100 to-blue-100">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  const displayProfiles = activeTab === 'liked' ? likedProfiles : matches;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-blue-100 p-4">
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
            {activeTab === 'liked' ? 'Đã thích' : 'Đã match'}
          </h1>
          <div className="w-12"></div>
        </div>

        {/* Tabs */}
        <div className="tabs tabs-box mb-6 bg-white shadow-lg rounded-2xl p-2">
          <button
            className={`tab flex-1 ${activeTab === 'liked' ? 'tab-active bg-pink-500 text-white' : 'text-gray-600'} rounded-xl transition-all`}
            onClick={() => setActiveTab('liked')}
          >
            <Icon icon="mdi:heart" className="mr-2 text-xl" />
            Đã thích ({likedProfiles.length})
          </button>
          <button
            className={`tab flex-1 ${activeTab === 'matches' ? 'tab-active bg-green-500 text-white' : 'text-gray-600'} rounded-xl transition-all`}
            onClick={() => setActiveTab('matches')}
          >
            <Icon icon="mdi:heart-multiple" className="mr-2 text-xl" />
            Đã match ({matches.length})
          </button>
        </div>

        {/* Content */}
        {displayProfiles.length === 0 ? (
          <div className="text-center py-16">
            <Icon 
              icon={activeTab === 'liked' ? "mdi:heart-outline" : "mdi:heart-multiple-outline"} 
              className="text-6xl text-gray-300 mx-auto mb-4" 
            />
            <h2 className="text-2xl font-bold text-gray-600 mb-2">
              {activeTab === 'liked' ? 'Chưa có ai trong danh sách' : 'Chưa có match nào'}
            </h2>
            <p className="text-gray-500 mb-6">
              {activeTab === 'liked' 
                ? 'Hãy bắt đầu swipe để tìm bạn cùng phòng!' 
                : 'Khi có người cũng thích bạn lại, match sẽ xuất hiện ở đây'}
            </p>
            <button
              onClick={() => router.push('/Swipe')}
              className="btn btn-primary"
            >
              <Icon icon="mdi:cards" className="mr-2" />
              Bắt đầu Swipe
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
                      <Icon icon="mdi:heart-multiple" className="mr-1" />
                      Match!
                    </div>
                  )}
                </figure>

                <div className="card-body">
                  <h2 className="card-title">
                    {profile.displayName || 'Anonymous'}
                    <span className="text-sm font-normal text-gray-500">
                      {profile.gender === 'male' ? '♂' : profile.gender === 'female' ? '♀' : ''}
                    </span>
                  </h2>

                  <div className="space-y-2 text-sm">
                    <p className="flex items-center text-gray-600">
                      <Icon icon="mdi:map-marker" className="mr-2" />
                      {profile.location || 'Chưa cập nhật'}
                    </p>
                    <p className="flex items-center text-gray-600">
                      <Icon icon="mdi:cash" className="mr-2" />
                      {profile.budgetMin?.toLocaleString('vi-VN')} - {profile.budgetMax?.toLocaleString('vi-VN')} VNĐ
                    </p>
                    {profile.bio && (
                      <p className="text-gray-600 line-clamp-2">
                        {profile.bio}
                      </p>
                    )}
                  </div>

                  {profile.interests && profile.interests.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {profile.interests.slice(0, 3).map((interest, idx) => (
                        <span
                          key={idx}
                          className="badge badge-soft badge-sm"
                        >
                          {interest}
                        </span>
                      ))}
                      {profile.interests.length > 3 && (
                        <span className="badge badge-ghost badge-sm">
                          +{profile.interests.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="card-actions justify-end mt-4">
                    <button
                      onClick={() => handleViewProfile(profile.slug)}
                      className="btn btn-primary btn-sm"
                    >
                      <Icon icon="mdi:account" className="mr-1" />
                      Xem profile
                    </button>
                    <button
                      onClick={() => handleUnlike(profile.userId)}
                      className="btn btn-ghost btn-sm text-red-500"
                    >
                      <Icon icon="mdi:heart-off" className="mr-1" />
                      Bỏ thích
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
