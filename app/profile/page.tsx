'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { auth, storage } from '@/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getUserAvatar } from '@/lib/avatarHelper';
import {
  UserProfile,
  SLEEP_SCHEDULE_OPTIONS,
  CLEANLINESS_OPTIONS,
  SMOKING_OPTIONS,
  PET_OPTIONS,
  SHARED_CLEANING_OPTIONS,
  NOISE_LEVEL_OPTIONS,
  GUEST_POLICY_OPTIONS,
  PARTY_FREQUENCY_OPTIONS,
  STUDY_HABITS_OPTIONS,
  SOCIAL_PROFILE_OPTIONS,
  COOKING_SKILLS_OPTIONS,
  COMMON_INTERESTS,
} from '@/types/profile';
import {
  getProfile,
  createProfile,
  updateProfile,
  hasCompletedRequiredFields,
  calculateProfileCompletion,
} from '@/lib/profileService';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Partial<UserProfile>>({});
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [customInterest, setCustomInterest] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/login');
        return;
      }

      setUser(currentUser);

      // Load existing profile
      const existingProfile = await getProfile(currentUser.uid);
      if (existingProfile) {
        setProfile(existingProfile);
        setSelectedInterests(existingProfile.interests || []);
        setShowOptionalFields(hasCompletedRequiredFields(existingProfile));
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleInputChange = (field: string, value: any) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleInterestToggle = (interest: string) => {
    setSelectedInterests((prev) => {
      if (prev.includes(interest)) {
        return prev.filter((i) => i !== interest);
      }
      return [...prev, interest];
    });
  };

  const handleAddCustomInterest = () => {
    if (customInterest.trim() && !selectedInterests.includes(customInterest.trim())) {
      setSelectedInterests((prev) => [...prev, customInterest.trim()]);
      setCustomInterest('');
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploadError('');

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Vui lòng chọn file hình ảnh!');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Kích thước ảnh phải nhỏ hơn 10MB!');
      return;
    }

    setUploading(true);
    try {
      // Create a reference to the storage location
      const storageRef = ref(storage, `profile-images/${user.uid}/${Date.now()}_${file.name}`);
      
      console.log('Uploading to:', storageRef.fullPath);
      
      // Upload the file
      const uploadResult = await uploadBytes(storageRef, file);
      console.log('Upload result:', uploadResult);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef);
      console.log('Download URL:', downloadURL);
      
      // Update profile with new photo URL
      setProfile((prev) => ({
        ...prev,
        photoURL: downloadURL,
      }));
      
      setImagePreview(downloadURL);
      alert('Upload ảnh thành công!');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      const errorMsg = error?.code === 'storage/unauthorized' 
        ? 'Không có quyền upload. Vui lòng kiểm tra Firebase Storage rules.'
        : error?.message || 'Upload thất bại. Vui lòng thử lại.';
      setUploadError(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    // Validate required fields
    if (!hasCompletedRequiredFields(profile)) {
      alert('Please fill in all required fields!');
      return;
    }

    setSaving(true);
    try {
      const profileData = {
        ...profile,
        interests: selectedInterests,
        displayName: profile.displayName || user.displayName,
        photoURL: profile.photoURL || user.photoURL,
      };

      const existingProfile = await getProfile(user.uid);
      if (existingProfile) {
        await updateProfile(user.uid, profileData);
        // Redirect to the user's profile view page
        const updatedProfile = await getProfile(user.uid);
        if (updatedProfile?.slug) {
          alert('Profile saved successfully!');
          router.push(`/profile/${updatedProfile.slug}`);
        }
      } else {
        await createProfile(user.uid, user.email || '', profileData);
        // Redirect to the user's profile view page
        const newProfile = await getProfile(user.uid);
        if (newProfile?.slug) {
          alert('Profile created successfully!');
          router.push(`/profile/${newProfile.slug}`);
        }
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('An error occurred while saving profile!');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  const completion = calculateProfileCompletion(profile);
  const hasRequired = hasCompletedRequiredFields(profile);

  return (
    <div className="min-h-screen bg-base-200 py-8">
      <div className="container mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="bg-base-100 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
            <span className="badge badge-info">Edit Mode</span>
          </div>
          <p className="text-gray-700 mb-4">
            Complete your profile to find the most compatible roommate
          </p>
          
          {/* Profile Photo Upload */}
          <div className="flex flex-col items-center mb-6">
            <div className="avatar mb-4">
              <div className="w-32 h-32 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                <img 
                  src={imagePreview || getUserAvatar(profile.photoURL || user?.photoURL, user?.email || user?.uid)} 
                  alt="Profile" 
                />
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="btn btn-primary btn-sm gap-2"
            >
              {uploading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Uploading...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Upload Photo
                </>
              )}
            </button>
            <p className="text-xs text-gray-500 mt-2">Max size: 10MB</p>
            {uploadError && (
              <div className="alert alert-error mt-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{uploadError}</span>
              </div>
            )}
            
            {/* Display Name and Email */}
            <div className="text-center mt-4">
              <h2 className="text-xl font-bold text-gray-900">
                {profile.displayName || user?.displayName || 'No name set'}
              </h2>
              <p className="text-sm text-gray-600">{user?.email}</p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-semibold text-gray-900">Profile Completion</span>
              <span className="text-sm font-semibold text-gray-900">{completion}%</span>
            </div>
            <progress 
              className="progress progress-primary w-full" 
              value={completion} 
              max="100"
            ></progress>
          </div>

          {!hasRequired && (
            <div className="alert alert-warning">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>Please complete all required fields first!</span>
            </div>
          )}

          {hasRequired && completion < 80 && (
            <div className="alert alert-info">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>Complete {Math.ceil((80 - completion) / 5)} more items to increase your match chance by 70%!</span>
            </div>
          )}
        </div>

        {/* Required Fields */}
        <div className="bg-base-100 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center text-gray-900">
            <span className="badge badge-error mr-2">Required</span>
            Basic Information
          </h2>

          {/* Budget Range */}
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text font-semibold text-gray-900">Ngân sách (triệu VNĐ/tháng) *</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div className="join">
                <input
                  type="number"
                  placeholder="Tối thiểu"
                  className="input input-bordered text-gray-900 join-item flex-1"
                  value={profile.budgetMin ? profile.budgetMin / 1000000 : ''}
                  onChange={(e) => handleInputChange('budgetMin', (parseFloat(e.target.value) || 0) * 1000000)}
                  step="0.5"
                  min="0"
                />
                <span className="btn btn-ghost join-item no-animation cursor-default">triệu</span>
              </div>
              <div className="join">
                <input
                  type="number"
                  placeholder="Tối đa"
                  className="input input-bordered text-gray-900 join-item flex-1"
                  value={profile.budgetMax ? profile.budgetMax / 1000000 : ''}
                  onChange={(e) => handleInputChange('budgetMax', (parseFloat(e.target.value) || 0) * 1000000)}
                  step="0.5"
                  min="0"
                />
                <span className="btn btn-ghost join-item no-animation cursor-default">triệu</span>
              </div>
            </div>
            <label className="label">
              <span className="label-text-alt text-gray-600">
                Ví dụ: 2.5 = 2.500.000 VNĐ, 5 = 5.000.000 VNĐ
              </span>
            </label>
          </div>

          {/* Location */}
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text font-semibold text-gray-900">Location *</span>
            </label>
            <input
              type="text"
              placeholder="Example: District 1, HCMC"
              className="input input-bordered text-gray-900"
              value={profile.location || ''}
              onChange={(e) => handleInputChange('location', e.target.value)}
            />
          </div>

          {/* University & District */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-gray-900">University</span>
              </label>
              <input
                type="text"
                placeholder="Example: HCMC University of Technology"
                className="input input-bordered text-gray-900"
                value={profile.university || ''}
                onChange={(e) => handleInputChange('university', e.target.value)}
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-gray-900">District</span>
              </label>
              <input
                type="text"
                placeholder="Example: Thu Duc District"
                className="input input-bordered text-gray-900"
                value={profile.district || ''}
                onChange={(e) => handleInputChange('district', e.target.value)}
              />
            </div>
          </div>

          {/* Move-in Date */}
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text font-semibold text-gray-900">Expected Move-in Date *</span>
            </label>
            <input
              type="date"
              className="input input-bordered text-gray-900"
              value={profile.moveInDate ? new Date(profile.moveInDate).toISOString().split('T')[0] : ''}
              onChange={(e) => handleInputChange('moveInDate', new Date(e.target.value))}
            />
          </div>

          {/* Sleep Schedule */}
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text font-semibold text-gray-900">Sleep Schedule *</span>
            </label>
            <select
              className="select select-bordered text-gray-900"
              value={profile.sleepSchedule || ''}
              onChange={(e) => handleInputChange('sleepSchedule', e.target.value)}
            >
              <option value="">Select sleep schedule</option>
              {SLEEP_SCHEDULE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Cleanliness Level */}
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text font-semibold text-gray-900">Cleanliness Level *</span>
            </label>
            <select
              className="select select-bordered text-gray-900"
              value={profile.cleanlinessLevel || ''}
              onChange={(e) => handleInputChange('cleanlinessLevel', e.target.value)}
            >
              <option value="">Select cleanliness level</option>
              {CLEANLINESS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Smoking Policy */}
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text font-semibold text-gray-900">Smoking Policy *</span>
            </label>
            <select
              className="select select-bordered text-gray-900"
              value={profile.smokingPolicy || ''}
              onChange={(e) => handleInputChange('smokingPolicy', e.target.value)}
            >
              <option value="">Select policy</option>
              {SMOKING_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Pet Policy */}
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text font-semibold text-gray-900">Pet Policy *</span>
            </label>
            <select
              className="select select-bordered text-gray-900"
              value={profile.petPolicy || ''}
              onChange={(e) => handleInputChange('petPolicy', e.target.value)}
            >
              <option value="">Select policy</option>
              {PET_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Optional Fields Toggle */}
        {hasRequired && (
          <button
            className="btn btn-outline btn-primary w-full mb-6"
            onClick={() => setShowOptionalFields(!showOptionalFields)}
          >
            {showOptionalFields ? '▼' : '▶'} Additional Information (Optional - Recommended)
          </button>
        )}

        {/* Optional Fields */}
        {hasRequired && showOptionalFields && (
          <div className="bg-base-100 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center text-gray-900">
              <span className="badge badge-info mr-2">Optional</span>
              Detailed Information
            </h2>

            {/* Shared Space Cleaning */}
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-semibold text-gray-900">Shared Space Cleaning Frequency</span>
              </label>
              <select
                className="select select-bordered text-gray-900"
                value={profile.sharedSpaceCleaning || ''}
                onChange={(e) => handleInputChange('sharedSpaceCleaning', e.target.value)}
              >
                <option value="">Select frequency</option>
                {SHARED_CLEANING_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Noise Level */}
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-semibold text-gray-900">Acceptable Noise Level</span>
              </label>
              <select
                className="select select-bordered text-gray-900"
                value={profile.noiseLevelPreference || ''}
                onChange={(e) => handleInputChange('noiseLevelPreference', e.target.value)}
              >
                <option value="">Select level</option>
                {NOISE_LEVEL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Overnight Guest Policy */}
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-semibold text-gray-900">Overnight Guests</span>
              </label>
              <select
                className="select select-bordered text-gray-900"
                value={profile.overnightGuestPolicy || ''}
                onChange={(e) => handleInputChange('overnightGuestPolicy', e.target.value)}
              >
                <option value="">Select policy</option>
                {GUEST_POLICY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Party Frequency */}
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-semibold text-gray-900">Party / Drinking Frequency</span>
              </label>
              <select
                className="select select-bordered text-gray-900"
                value={profile.partyFrequency || ''}
                onChange={(e) => handleInputChange('partyFrequency', e.target.value)}
              >
                <option value="">Select frequency</option>
                {PARTY_FREQUENCY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Study Habits */}
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-semibold text-gray-900">Study Habits</span>
              </label>
              <select
                className="select select-bordered text-gray-900"
                value={profile.studyHabits || ''}
                onChange={(e) => handleInputChange('studyHabits', e.target.value)}
              >
                <option value="">Select habits</option>
                {STUDY_HABITS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Social Profile */}
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-semibold text-gray-900">Social Profile</span>
              </label>
              <select
                className="select select-bordered text-gray-900"
                value={profile.socialProfile || ''}
                onChange={(e) => handleInputChange('socialProfile', e.target.value)}
              >
                <option value="">Select profile</option>
                {SOCIAL_PROFILE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Cooking Skills */}
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-semibold text-gray-900">Cooking Skills</span>
              </label>
              <select
                className="select select-bordered text-gray-900"
                value={profile.cookingSkills || ''}
                onChange={(e) => handleInputChange('cookingSkills', e.target.value)}
              >
                <option value="">Select skill level</option>
                {COOKING_SKILLS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Wake-up Time */}
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-semibold text-gray-900">Wake-up Time</span>
              </label>
              <input
                type="time"
                className="input input-bordered text-gray-900"
                value={profile.wakeUpTime || ''}
                onChange={(e) => handleInputChange('wakeUpTime', e.target.value)}
              />
            </div>

            {/* Guest Policy */}
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-semibold text-gray-900">Guest Policy (General)</span>
              </label>
              <select
                className="select select-bordered text-gray-900"
                value={profile.guestPolicy || ''}
                onChange={(e) => handleInputChange('guestPolicy', e.target.value)}
              >
                <option value="">Select policy</option>
                {GUEST_POLICY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* AI/LLM Fields */}
        {hasRequired && showOptionalFields && (
          <div className="bg-base-100 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center text-gray-900">
              <span className="badge badge-success mr-2">AI</span>
              About You
            </h2>

            {/* Interests */}
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-semibold text-gray-900">Interests & Hobbies</span>
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {COMMON_INTERESTS.map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    className={`btn btn-sm ${
                      selectedInterests.includes(interest) ? 'btn-primary' : 'btn-outline'
                    }`}
                    onClick={() => handleInterestToggle(interest)}
                  >
                    {interest}
                  </button>
                ))}
              </div>
              <div className="join w-full">
                <input
                  type="text"
                  placeholder="Add other interests..."
                  className="input input-bordered join-item flex-1"
                  value={customInterest}
                  onChange={(e) => setCustomInterest(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddCustomInterest()}
                />
                <button
                  type="button"
                  className="btn btn-primary join-item"
                  onClick={handleAddCustomInterest}
                >
                  Add
                </button>
              </div>
              {selectedInterests.length > 0 && (
                <div className="mt-2">
                  <span className="text-sm text-gray-700">Selected: </span>
                  {selectedInterests.map((interest) => (
                    <span key={interest} className="badge badge-primary gap-2 mr-1">
                      {interest}
                      <button
                        type="button"
                        className="btn btn-xs btn-circle btn-ghost"
                        onClick={() => handleInterestToggle(interest)}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Bio */}
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-semibold text-gray-900">About Yourself</span>
              </label>
              <textarea
                className="textarea textarea-bordered h-32"
                placeholder="Describe your ideal weekend, things you like to do, or what's important to you when living with others..."
                value={profile.bio || ''}
                onChange={(e) => handleInputChange('bio', e.target.value)}
              ></textarea>
              <label className="label">
                <span className="label-text-alt text-gray-600">
                  This information helps AI find more compatible roommates for you
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <button
            className="btn btn-primary flex-1"
            onClick={handleSave}
            disabled={!hasRequired || saving}
          >
            {saving ? (
              <>
                <span className="loading loading-spinner"></span>
                Saving...
              </>
            ) : (
              'Save & View Profile'
            )}
          </button>
          <button
            className="btn btn-outline"
            onClick={() => {
              // If profile exists with slug, go to profile view, otherwise go home
              if (profile.slug) {
                router.push(`/profile/${profile.slug}`);
              } else {
                router.push('/');
              }
            }}
          >
            {profile.slug ? 'Cancel' : 'Back to Home'}
          </button>
        </div>
      </div>
    </div>
  );
}
