'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { UserProfile } from '@/types/profile';
import { getProfileBySlug } from '@/lib/profileService';
import { getUserAvatar } from '@/lib/avatarHelper';
import Link from 'next/link';

export default function ProfileViewPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }

      setCurrentUser(user);

      // Load profile by slug
      const userProfile = await getProfileBySlug(params.slug);
      
      if (!userProfile) {
        setLoading(false);
        return;
      }

      setProfile(userProfile);
      setIsOwnProfile(user.uid === userProfile.userId);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [params.slug, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-base-200">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 text-gray-900">404</h1>
          <p className="text-xl mb-6 text-gray-700">Không tìm thấy người dùng</p>
          <Link href="/" className="btn btn-primary">
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 py-8">
      <div className="container mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="bg-base-100 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="avatar">
                <div className="w-20 h-20 rounded-full">
                  <img src={getUserAvatar(profile.photoURL, profile.email || profile.userId)} alt={profile.displayName || 'Profile'} />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-1 text-gray-900">
                  {profile.displayName || profile.email?.split('@')[0] || 'No name'}
                </h1>
                <p className="text-sm text-gray-600">{profile.email}</p>
                {profile.university && (
                  <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    </svg>
                    {profile.university}
                  </p>
                )}
              </div>
            </div>
            
            {isOwnProfile && (
              <Link href="/profile" className="btn btn-primary">
                Chỉnh sửa hồ sơ
              </Link>
            )}
          </div>
          
          {/* Profile Completion */}
          <div className="mt-4">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-semibold text-gray-900">Hồ sơ hoàn thành</span>
              <span className="text-sm font-semibold text-gray-900">{profile.profileCompletion}%</span>
            </div>
            <progress 
              className="progress progress-primary w-full" 
              value={profile.profileCompletion} 
              max="100"
            ></progress>
          </div>
        </div>

        {/* Bio Section */}
        {profile.bio && (
          <div className="bg-base-100 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold mb-3 text-gray-900">Giới thiệu</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{profile.bio}</p>
          </div>
        )}

        {/* Basic Information */}
        <div className="bg-base-100 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">Thông tin cơ bản</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-base-200 rounded-lg">
              <span className="text-sm text-gray-600">Ngân sách</span>
              <p className="font-semibold text-gray-900">
                {profile.budgetMin?.toLocaleString()} - {profile.budgetMax?.toLocaleString()} VNĐ/tháng
              </p>
            </div>

            <div className="p-3 bg-base-200 rounded-lg">
              <span className="text-sm text-gray-600">Khu vực</span>
              <p className="font-semibold text-gray-900">{profile.location}</p>
            </div>

            {profile.district && (
              <div className="p-3 bg-base-200 rounded-lg">
                <span className="text-sm text-gray-600">Quận</span>
                <p className="font-semibold text-gray-900">{profile.district}</p>
              </div>
            )}

            <div className="p-3 bg-base-200 rounded-lg">
              <span className="text-sm text-gray-600">Ngày dự kiến dọn vào</span>
              <p className="font-semibold text-gray-900">
                {new Date(profile.moveInDate).toLocaleDateString('vi-VN')}
              </p>
            </div>
          </div>
        </div>

        {/* Lifestyle Preferences */}
        <div className="bg-base-100 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">Phong cách sống</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-base-200 rounded-lg">
              <span className="text-sm text-gray-600">Giấc ngủ</span>
              <p className="font-semibold text-gray-900">
                {profile.sleepSchedule === 'early-bird' && 'Dậy sớm 🌅'}
                {profile.sleepSchedule === 'night-owl' && 'Thức khuya 🦉'}
                {profile.sleepSchedule === 'flexible' && 'Linh hoạt ⏰'}
              </p>
            </div>

            {profile.wakeUpTime && (
              <div className="p-3 bg-base-200 rounded-lg">
                <span className="text-sm text-gray-600">Giờ thức dậy</span>
                <p className="font-semibold text-gray-900">{profile.wakeUpTime}</p>
              </div>
            )}

            <div className="p-3 bg-base-200 rounded-lg">
              <span className="text-sm text-gray-600">Độ sạch sẽ</span>
              <p className="font-semibold text-gray-900">
                {profile.cleanlinessLevel === 'very-clean' && 'Rất sạch sẽ ✨'}
                {profile.cleanlinessLevel === 'clean' && 'Sạch sẽ 🧹'}
                {profile.cleanlinessLevel === 'moderate' && 'Trung bình 👌'}
                {profile.cleanlinessLevel === 'relaxed' && 'Thoải mái 😌'}
              </p>
            </div>

            <div className="p-3 bg-base-200 rounded-lg">
              <span className="text-sm text-gray-600">Chính sách hút thuốc</span>
              <p className="font-semibold text-gray-900">
                {profile.smokingPolicy === 'no-smoking' && 'Không hút thuốc 🚭'}
                {profile.smokingPolicy === 'outdoor-only' && 'Chỉ ngoài trời 🌬️'}
                {profile.smokingPolicy === 'smoking-ok' && 'Chấp nhận hút thuốc 🚬'}
              </p>
            </div>

            <div className="p-3 bg-base-200 rounded-lg">
              <span className="text-sm text-gray-600">Chính sách thú cưng</span>
              <p className="font-semibold text-gray-900">
                {profile.petPolicy === 'no-pets' && 'Không nuôi thú'}
                {profile.petPolicy === 'pets-ok' && 'Chấp nhận thú cưng 🐾'}
                {profile.petPolicy === 'have-pets' && 'Đang nuôi thú 🐕🐈'}
              </p>
            </div>

            {profile.socialProfile && (
              <div className="p-3 bg-base-200 rounded-lg">
                <span className="text-sm text-gray-600">Tính cách</span>
                <p className="font-semibold text-gray-900">
                  {profile.socialProfile === 'introvert' && 'Hướng nội 📚'}
                  {profile.socialProfile === 'ambivert' && 'Trung tính 🤝'}
                  {profile.socialProfile === 'extrovert' && 'Hướng ngoại 🎉'}
                </p>
              </div>
            )}

            {profile.cookingSkills && (
              <div className="p-3 bg-base-200 rounded-lg">
                <span className="text-sm text-gray-600">Kỹ năng nấu ăn</span>
                <p className="font-semibold text-gray-900">
                  {profile.cookingSkills === 'no' && "Không biết nấu"}
                  {profile.cookingSkills === 'basic' && 'Cơ bản 🍳'}
                  {profile.cookingSkills === 'intermediate' && 'Trung bình 👨‍🍳'}
                  {profile.cookingSkills === 'advanced' && 'Giỏi 👨‍🍳✨'}
                </p>
              </div>
            )}

            {profile.studyHabits && (
              <div className="p-3 bg-base-200 rounded-lg">
                <span className="text-sm text-gray-600">Thói quen học tập</span>
                <p className="font-semibold text-gray-900">
                  {profile.studyHabits === 'library' && 'Học ở thư viện 📚'}
                  {profile.studyHabits === 'home-quiet' && 'Học ở nhà (yên tĩnh) 🤫'}
                  {profile.studyHabits === 'home-music' && 'Học ở nhà (có nhạc) 🎵'}
                  {profile.studyHabits === 'group-study' && 'Học nhóm 👥'}
                  {profile.studyHabits === 'flexible' && 'Linh hoạt'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Living Preferences */}
        {(profile.noiseLevelPreference || profile.guestPolicy || profile.partyFrequency || profile.sharedSpaceCleaning) && (
          <div className="bg-base-100 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Sở thích sinh hoạt</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile.noiseLevelPreference && (
                <div className="p-3 bg-base-200 rounded-lg">
                  <span className="text-sm text-gray-600">Acceptable Noise Level</span>
                  <p className="font-semibold text-gray-900">
                    {profile.noiseLevelPreference === 'very-quiet' && 'Very Quiet 🤫'}
                    {profile.noiseLevelPreference === 'quiet' && 'Quiet 🔇'}
                    {profile.noiseLevelPreference === 'moderate' && 'Moderate 🔉'}
                    {profile.noiseLevelPreference === 'lively' && 'Lively 🔊'}
                  </p>
                </div>
              )}

              {profile.guestPolicy && (
                <div className="p-3 bg-base-200 rounded-lg">
                  <span className="text-sm text-gray-600">Guest Policy</span>
                  <p className="font-semibold text-gray-900">
                    {profile.guestPolicy === 'rarely' && 'Rarely'}
                    {profile.guestPolicy === 'sometimes' && 'Sometimes'}
                    {profile.guestPolicy === 'often' && 'Often'}
                    {profile.guestPolicy === 'very-open' && 'Very Open'}
                  </p>
                </div>
              )}

              {profile.overnightGuestPolicy && (
                <div className="p-3 bg-base-200 rounded-lg">
                  <span className="text-sm text-gray-600">Overnight Guests</span>
                  <p className="font-semibold text-gray-900">
                    {profile.overnightGuestPolicy === 'never' && 'Never'}
                    {profile.overnightGuestPolicy === 'rarely' && 'Rarely'}
                    {profile.overnightGuestPolicy === 'sometimes' && 'Sometimes'}
                    {profile.overnightGuestPolicy === 'often' && 'Often'}
                    {profile.overnightGuestPolicy === 'very-flexible' && 'Very Flexible'}
                  </p>
                </div>
              )}

              {profile.partyFrequency && (
                <div className="p-3 bg-base-200 rounded-lg">
                  <span className="text-sm text-gray-600">Party Frequency</span>
                  <p className="font-semibold text-gray-900">
                    {profile.partyFrequency === 'never' && 'Never'}
                    {profile.partyFrequency === 'rarely' && 'Rarely'}
                    {profile.partyFrequency === 'monthly' && 'Monthly'}
                    {profile.partyFrequency === 'weekly' && 'Weekly'}
                    {profile.partyFrequency === 'often' && 'Often'}
                  </p>
                </div>
              )}

              {profile.sharedSpaceCleaning && (
                <div className="p-3 bg-base-200 rounded-lg">
                  <span className="text-sm text-gray-600">Shared Space Cleaning</span>
                  <p className="font-semibold text-gray-900">
                    {profile.sharedSpaceCleaning === 'daily' && 'Daily'}
                    {profile.sharedSpaceCleaning === 'weekly' && 'Weekly'}
                    {profile.sharedSpaceCleaning === 'bi-weekly' && 'Bi-weekly'}
                    {profile.sharedSpaceCleaning === 'monthly' && 'Monthly'}
                    {profile.sharedSpaceCleaning === 'as-needed' && 'As Needed'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Interests */}
        {profile.interests && profile.interests.length > 0 && (
          <div className="bg-base-100 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Interests</h2>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((interest, index) => (
                <span key={index} className="badge badge-primary badge-lg">
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Back Button */}
        <div className="flex justify-center">
          <Link href="/" className="btn btn-outline">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
