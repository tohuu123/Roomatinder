'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { UserProfile } from '@/types/profile';
import { getProfileBySlug } from '@/lib/profileService';
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
          <p className="text-xl mb-6 text-gray-700">User not found</p>
          <Link href="/" className="btn btn-primary">
            Back to Home
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
              {profile.photoURL && (
                <div className="avatar">
                  <div className="w-20 h-20 rounded-full">
                    <img src={profile.photoURL} alt={profile.displayName || 'Profile'} />
                  </div>
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold mb-1 text-gray-900">
                  {profile.displayName || 'User'}
                </h1>
                <p className="text-gray-600">@{profile.slug}</p>
                {profile.university && (
                  <p className="text-sm text-gray-600 mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><path fill="#f8c778" d="M6.33 66.37v57.72h116.06V66.15S99.17 50.13 98.1 49.98s-32.26-28.7-32.26-28.7L31.46 49.01z"/><path fill="#f5b03f" d="M6.33 66.31h27.4l-.03 57.72h4.55l.03-70.27L65.16 30.1l27.12 24.8l-.07 69.13h4.26l.07-58.05l25.85.18v-3.45L98.81 50.07L67.27 22.36L32.45 49.5L6.35 63.01z"/><path fill="#a62714" d="M13.1 42.57c-.18.29-7.15 19.51-7.28 19.91s.2.87 1 .94s28.39 0 28.39 0l-.08-11.78s29.62-26.66 29.95-26.66s30.18 27.35 30.25 27.76c.07.4.13 10.22.13 10.22s26.25.2 26.79.27s.67-.67.2-2.07s-5.95-18.3-6.35-18.57s-22.04-.27-22.04-.27s-27.11-24.96-27.58-25.36s-1.87-1.01-3.11.23c-1.09 1.09-28.13 25.33-28.13 25.33s-21.94-.29-22.14.05"/><path fill="#cf6150" d="m43.91 80.59l-.01 43.48h42.36V80.59s-42.35-.11-42.35 0"/><path fill="#7db240" d="M3.64 124.25c.37.56 4.69.3 16.2.36s14.86.04 15.46-.08c.59-.12 1.07-2.71.68-4.96c-.43-2.47-1.91-4.8-4.31-5.55c-3.21-1-5.19-.08-6.73-.62c-1.54-.53-6.05-2.79-10.62-2.49c-3.92.25-6.71 1.4-9.14 4.98c-2.61 3.85-1.78 8-1.54 8.36m122.45-.24c.59-.41.54-11.77-7.36-12.64c-5.93-.65-7.48 1.9-8.48 1.9c-1.01 0-4.85-1.87-10.15.18c-6.59 2.55-6.47 9.97-6.23 10.68s7.06.53 16.43.59s15.02-.17 15.79-.71"/><path fill="#3e737c" d="M11.57 69.63h18.69v15.05H11.32s.12-14.93.25-15.05m-.25 22.08h18.61v14.56H11.16c0 .01.08-14.64.16-14.56"/><path fill="#a7d0d7" d="M14.4 72.38h12.7v9.95H14.24s-.09-9.87.16-9.95m-.57 21.76h13.43v9.63H13.83z"/><path fill="#3e737c" d="M99.67 70.52h18.61v14.97H99.59s.08-15.21.08-14.97"/><path fill="#a7d0d7" d="M102.26 73.11h13.35v9.71h-13.35z"/><path fill="#3e737c" d="M99.43 92.6h18.53v14.16H99.43s-.12-14.03 0-14.16"/><path fill="#a7d0d7" d="M102.34 95.19v8.74h12.7v-8.82s-12.82-.04-12.7.08"/><path fill="#3e737c" d="m50.06 124.09l-.01-38.76h30.5v38.76z"/><path fill="#a7d0d7" d="M76.94 93.24v-5.1H53.82v5.1zm-23.12 2.55h23.12v13.27H53.82zm0 16h23.12v6.94H53.82z"/><path fill="#3e737c" d="M64.28 94.65v26.11h2.64V94.38s-2.46.27-2.64.27m.18-54.59c-10.37.09-17.32 7.82-16.79 17.76c.51 9.66 8.18 15.72 17.05 15.47c9.32-.26 16-7.74 16.26-16.61s-6.94-16.7-16.52-16.62"/><path fill="#fff" d="M64.2 43.05c-8.44 0-14.07 6.42-13.71 14.15c.34 7.46 5.36 13.1 13.98 13.1c7.91 0 13.11-6.5 13.27-13.19c.17-7.3-5.28-14.06-13.54-14.06"/><path fill="#2f2f2f" d="M61.74 57.46s-4.9 4.12-5.17 4.6s-.26 1.27.39 1.8c.66.53 1.31.22 1.71-.09c.39-.31 5.56-4.55 5.56-4.55s1.67-.03 2.06-2.01c.31-1.58-.83-2.32-.83-2.32s-.18-9.46-.26-10.16c-.07-.52-.61-1.01-1.09-.96c-.48.04-.96.31-1.01 1.09S63 54.7 63 54.7s-.7.26-1.09 1.01c-.39.74-.17 1.75-.17 1.75"/></svg> {profile.university}
                  </p>
                )}
              </div>
            </div>
            
            {isOwnProfile && (
              <Link href="/profile" className="btn btn-primary">
                Edit Profile
              </Link>
            )}
          </div>
          
          {/* Profile Completion */}
          <div className="mt-4">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-semibold text-gray-900">Profile Completion</span>
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
            <h2 className="text-2xl font-bold mb-3 text-gray-900">About</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{profile.bio}</p>
          </div>
        )}

        {/* Basic Information */}
        <div className="bg-base-100 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-base-200 rounded-lg">
              <span className="text-sm text-gray-600">Budget</span>
              <p className="font-semibold text-gray-900">
                {profile.budgetMin?.toLocaleString()} - {profile.budgetMax?.toLocaleString()} VND/month
              </p>
            </div>

            <div className="p-3 bg-base-200 rounded-lg">
              <span className="text-sm text-gray-600">Location</span>
              <p className="font-semibold text-gray-900">{profile.location}</p>
            </div>

            {profile.district && (
              <div className="p-3 bg-base-200 rounded-lg">
                <span className="text-sm text-gray-600">District</span>
                <p className="font-semibold text-gray-900">{profile.district}</p>
              </div>
            )}

            <div className="p-3 bg-base-200 rounded-lg">
              <span className="text-sm text-gray-600">Expected Move-in Date</span>
              <p className="font-semibold text-gray-900">
                {new Date(profile.moveInDate).toLocaleDateString('en-US')}
              </p>
            </div>
          </div>
        </div>

        {/* Lifestyle Preferences */}
        <div className="bg-base-100 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">Lifestyle & Preferences</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-base-200 rounded-lg">
              <span className="text-sm text-gray-600">Sleep Schedule</span>
              <p className="font-semibold text-gray-900">
                {profile.sleepSchedule === 'early-bird' && 'Early Bird 🌅'}
                {profile.sleepSchedule === 'night-owl' && 'Night Owl 🦉'}
                {profile.sleepSchedule === 'flexible' && 'Flexible ⏰'}
              </p>
            </div>

            {profile.wakeUpTime && (
              <div className="p-3 bg-base-200 rounded-lg">
                <span className="text-sm text-gray-600">Wake-up Time</span>
                <p className="font-semibold text-gray-900">{profile.wakeUpTime}</p>
              </div>
            )}

            <div className="p-3 bg-base-200 rounded-lg">
              <span className="text-sm text-gray-600">Cleanliness Level</span>
              <p className="font-semibold text-gray-900">
                {profile.cleanlinessLevel === 'very-clean' && 'Very Tidy ✨'}
                {profile.cleanlinessLevel === 'clean' && 'Tidy 🧹'}
                {profile.cleanlinessLevel === 'moderate' && 'Moderate 👌'}
                {profile.cleanlinessLevel === 'relaxed' && 'Relaxed 😌'}
              </p>
            </div>

            <div className="p-3 bg-base-200 rounded-lg">
              <span className="text-sm text-gray-600">Smoking Policy</span>
              <p className="font-semibold text-gray-900">
                {profile.smokingPolicy === 'no-smoking' && 'No Smoking 🚭'}
                {profile.smokingPolicy === 'outdoor-only' && 'Outdoor Only 🌬️'}
                {profile.smokingPolicy === 'smoking-ok' && 'Smoking OK 🚬'}
              </p>
            </div>

            <div className="p-3 bg-base-200 rounded-lg">
              <span className="text-sm text-gray-600">Pet Policy</span>
              <p className="font-semibold text-gray-900">
                {profile.petPolicy === 'no-pets' && 'No Pets'}
                {profile.petPolicy === 'pets-ok' && 'Pets Allowed 🐾'}
                {profile.petPolicy === 'have-pets' && 'Have Pets 🐕🐈'}
              </p>
            </div>

            {profile.socialProfile && (
              <div className="p-3 bg-base-200 rounded-lg">
                <span className="text-sm text-gray-600">Social Profile</span>
                <p className="font-semibold text-gray-900">
                  {profile.socialProfile === 'introvert' && 'Introvert 📚'}
                  {profile.socialProfile === 'ambivert' && 'Ambivert 🤝'}
                  {profile.socialProfile === 'extrovert' && 'Extrovert 🎉'}
                </p>
              </div>
            )}

            {profile.cookingSkills && (
              <div className="p-3 bg-base-200 rounded-lg">
                <span className="text-sm text-gray-600">Cooking Skills</span>
                <p className="font-semibold text-gray-900">
                  {profile.cookingSkills === 'no' && "Can't Cook"}
                  {profile.cookingSkills === 'basic' && 'Basic 🍳'}
                  {profile.cookingSkills === 'intermediate' && 'Intermediate 👨‍🍳'}
                  {profile.cookingSkills === 'advanced' && 'Advanced 👨‍🍳✨'}
                </p>
              </div>
            )}

            {profile.studyHabits && (
              <div className="p-3 bg-base-200 rounded-lg">
                <span className="text-sm text-gray-600">Study Habits</span>
                <p className="font-semibold text-gray-900">
                  {profile.studyHabits === 'library' && 'Study at Library 📚'}
                  {profile.studyHabits === 'home-quiet' && 'Study at Home (Quiet) 🤫'}
                  {profile.studyHabits === 'home-music' && 'Study at Home (With Music) 🎵'}
                  {profile.studyHabits === 'group-study' && 'Group Study 👥'}
                  {profile.studyHabits === 'flexible' && 'Flexible'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Living Preferences */}
        {(profile.noiseLevelPreference || profile.guestPolicy || profile.partyFrequency || profile.sharedSpaceCleaning) && (
          <div className="bg-base-100 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Living Preferences</h2>
            
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
