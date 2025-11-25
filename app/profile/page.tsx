'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/firebase';
import { onAuthStateChanged } from 'firebase/auth';
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
  GENDER_OPTIONS,
  ACCOMMODATION_STATUS_OPTIONS,
  ACCOMMODATION_SIZE_OPTIONS,
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
      setUploadError('Please select an image file!');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image size must be less than 10MB!');
      return;
    }

    setUploading(true);
    try {
      // Convert image to base64
      const base64String = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      console.log('Image converted to base64, size:', base64String.length, 'characters');
      
      // Update profile with base64 string
      setProfile((prev) => ({
        ...prev,
        photoURL: base64String,
      }));
      
      setImagePreview(base64String);
      alert('Image uploaded successfully!');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      const errorMsg = error?.message || 'Upload failed. Please try again.';
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

          {/* Gender */}
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text font-semibold text-gray-900">Gender</span>
            </label>
            <select
              className="select select-bordered text-gray-900"
              value={profile.gender || ''}
              onChange={(e) => handleInputChange('gender', e.target.value)}
            >
              <option value="">Select gender</option>
              {GENDER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Budget Range */}
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text font-semibold text-gray-900">Budget (million VND/month) *</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div className="join">
                <input
                  type="number"
                  placeholder="Minimum"
                  className="input input-bordered text-gray-900 join-item flex-1"
                  value={profile.budgetMin ? profile.budgetMin / 1000000 : ''}
                  onChange={(e) => handleInputChange('budgetMin', (parseFloat(e.target.value) || 0) * 1000000)}
                  step="0.5"
                  min="0"
                />
                <span className="btn btn-ghost join-item no-animation cursor-default">million</span>
              </div>
              <div className="join">
                <input
                  type="number"
                  placeholder="Maximum"
                  className="input input-bordered text-gray-900 join-item flex-1"
                  value={profile.budgetMax ? profile.budgetMax / 1000000 : ''}
                  onChange={(e) => handleInputChange('budgetMax', (parseFloat(e.target.value) || 0) * 1000000)}
                  step="0.5"
                  min="0"
                />
                <span className="btn btn-ghost join-item no-animation cursor-default">million</span>
              </div>
            </div>
            <label className="label">
              <span className="label-text-alt text-gray-600">
                Example: 2.5 = 2,500,000 VND, 5 = 5,000,000 VND
              </span>
            </label>
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
                <span className="label-text font-semibold text-gray-900">University District</span>
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

         {/* Accommodation Status */}
        <div className="form-control mb-4">
          <label className="label">
            <span className="label-text font-semibold text-gray-900">Accommodation Status *</span>
          </label>
          <select
            className="select select-bordered text-gray-900"
            value={profile.hasAccommodation || ''}
            onChange={(e) => handleInputChange('hasAccommodation', e.target.value)}
            >
            <option value="">Select status</option>
              {ACCOMMODATION_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
              ))}
          </select>
        </div>

        {/* Desired Districts - Only show when looking for accommodation */}
        {profile.hasAccommodation === 'looking' && (
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text font-semibold text-gray-900">Desired Districts</span>
            </label>
            <input
              type="text"
              placeholder="Example: District 1, HCMC"
              className="input input-bordered text-gray-900"
              value={profile.location || ''}
              onChange={(e) => handleInputChange('location', e.target.value)}
            />
          </div>
        )}

        {/* Accommodation Details (for users who have accommodation) */}
        {profile.hasAccommodation === 'have-room' && (
          <div className="bg-base-100 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center text-gray-900">
              <span className="badge badge-success mr-2">Accommodation Details</span>
              Tell us about your place
            </h2>

            {/* Accommodation Location */}
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-semibold text-gray-900">Home's location: address, district *</span>
              </label>
              <input
                type="text"
                placeholder="e.g., District 1, HCMC - near university"
                className="input input-bordered text-gray-900"
                value={profile.accommodationLocation || ''}
                onChange={(e) => handleInputChange('accommodationLocation', e.target.value)}
              />
            </div>

            {/* Accommodation Size */}
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-semibold text-gray-900">Size *</span>
              </label>
              <select
                className="select select-bordered text-gray-900"
                value={profile.accommodationSize || ''}
                onChange={(e) => handleInputChange('accommodationSize', e.target.value)}
              >
                <option value="">Select size</option>
                {ACCOMMODATION_SIZE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Fee Structure */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Fee Breakdown *</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Home Fees */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold text-gray-900">Home Fees</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 3,500,000 VND/month"
                    className="input input-bordered text-gray-900"
                    value={profile.accommodationHomeFeesAmount || ''}
                    onChange={(e) => handleInputChange('accommodationHomeFeesAmount', e.target.value)}
                  />  
                  <label className="label">
                    <span className="label-text-alt text-gray-600">
                      Example input home fees: 2.5 = 2,500,000 VND, 5 = 5,000,000 VND
                    </span>
                  </label>
                </div>

                {/* Electricity Fees */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold text-gray-900">Electricity Fees</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 4,000 VND/kWh or included"
                    className="input input-bordered text-gray-900"
                    value={profile.accommodationElectricityFees || ''}
                    onChange={(e) => handleInputChange('accommodationElectricityFees', e.target.value)}
                  />
                </div>

                {/* Water Fees */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold text-gray-900">Water Fees</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 20,000 VND/m³ or included"
                    className="input input-bordered text-gray-900"
                    value={profile.accommodationWaterFees || ''}
                    onChange={(e) => handleInputChange('accommodationWaterFees', e.target.value)}
                  />
                </div>

                {/* Utilities Fees */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold text-gray-900">Utilities Fees</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Internet, gas, cable - 200,000 VND/month"
                    className="input input-bordered text-gray-900"
                    value={profile.accommodationUtilitiesFees || ''}
                    onChange={(e) => handleInputChange('accommodationUtilitiesFees', e.target.value)}
                  />
                </div>

                {/* Additional Fees */}
                <div className="form-control md:col-span-2">
                  <label className="label">
                    <span className="label-text font-semibold text-gray-900">Additional Fees</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Parking, security, cleaning service, maintenance"
                    className="input input-bordered text-gray-900"
                    value={profile.accommodationAdditionalFees || ''}
                    onChange={(e) => handleInputChange('accommodationAdditionalFees', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* House Type */}
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-semibold text-gray-900">House Type</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Apartment, House, Townhouse, Serviced apartment"
                className="input input-bordered text-gray-900"
                value={profile.accommodationHouseType || ''}
                onChange={(e) => handleInputChange('accommodationHouseType', e.target.value)}
              />
            </div>

            {/* Pet Policy Details */}
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-semibold text-gray-900">Pet Policy Details</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Small pets allowed, No pets, Cats only"
                className="input input-bordered text-gray-900"
                value={profile.accommodationPetPolicy || ''}
                onChange={(e) => handleInputChange('accommodationPetPolicy', e.target.value)}
              />
            </div>

            {/* Furniture & Amenities */}
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-semibold text-gray-900">Furniture & Amenities</span>
              </label>
              <textarea
                className="textarea textarea-bordered h-24 text-gray-900"
                placeholder="e.g., Fully furnished, Kitchen, Air-conditioner, Washing machine, Refrigerator, WiFi"
                value={profile.accommodationFurniture || ''}
                onChange={(e) => handleInputChange('accommodationFurniture', e.target.value)}
              ></textarea>
            </div>

            {/* Live with Rental Owner */}
            <div className="form-control mb-4">
              <label className="label cursor-pointer">
                <span className="label-text font-semibold text-gray-900">Live with rental property owner</span>
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={profile.accommodationLiveWithRental || false}
                  onChange={(e) => handleInputChange('accommodationLiveWithRental', e.target.checked)}
                />
              </label>
            </div>

            {/* Restricted Hours */}
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-semibold text-gray-900">Restricted Hours</span>
              </label>
              <input
                type="text"
                placeholder="e.g., No visitors after 10 PM, Quiet hours 10 PM - 6 AM"
                className="input input-bordered text-gray-900"
                value={profile.accommodationRestrictedHours || ''}
                onChange={(e) => handleInputChange('accommodationRestrictedHours', e.target.value)}
              />
            </div>

            {/* Security */}
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-semibold text-gray-900">Security</span>
              </label>
              <input
                type="text"
                placeholder="e.g., 24/7 security, CCTV, Key card access, Fingerprint lock"
                className="input input-bordered text-gray-900"
                value={profile.accommodationSecurity || ''}
                onChange={(e) => handleInputChange('accommodationSecurity', e.target.value)}
              />
            </div>

            {/* General Description */}
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-semibold text-gray-900">General Description</span>
              </label>
              <textarea
                className="textarea textarea-bordered h-32 text-gray-900"
                placeholder="Describe your place, neighborhood, nearby amenities, transportation, what makes it special..."
                value={profile.accommodationDescription || ''}
                onChange={(e) => handleInputChange('accommodationDescription', e.target.value)}
              ></textarea>
            </div>
          </div>
        )}

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
              About you
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
                  className="input input-bordered join-item flex-1 text-gray-900"
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
                className="textarea textarea-bordered h-32 text-gray-900"
                placeholder="Describe your ideal weekend, things you like to do, or what's important to you when living with others..."
                value={profile.bio || ''}
                onChange={(e) => handleInputChange('bio', e.target.value)}
              ></textarea>
              <label className="label">
                <span className="label-text-alt text-gray-600">
                  This information helps find more compatible roommates
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
