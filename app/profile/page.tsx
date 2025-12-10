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
  NOISE_LEVEL_OPTIONS,
  GUEST_POLICY_OPTIONS,
  COOKING_SKILLS_OPTIONS,
  COMMON_INTERESTS,
  GENDER_OPTIONS,
  ACCOMMODATION_STATUS_OPTIONS,
  ACCOMMODATION_SIZE_OPTIONS,
  ACCOMMODATION_TYPE_OPTIONS,
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
  const [currentStep, setCurrentStep] = useState(1);
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [customInterest, setCustomInterest] = useState('');
  const [customService, setCustomService] = useState('');
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

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1: // Basic Information
        if (!profile.displayName || !profile.gender || !profile.birthYear || !profile.hometown || !profile.university) {
          alert('Please fill in all required fields in Basic Information!');
          return false;
        }
        return true;
      case 2: // Lifestyle
        if (!profile.sleepSchedule || !profile.cleanlinessLevel || !profile.noiseLevel || 
            !profile.cookingSkills || !profile.guestPolicy || !profile.smokingPolicy || !profile.petPolicy) {
          alert('Please fill in all required fields in Lifestyle & Habit!');
          return false;
        }
        return true;
      case 3: // Accommodation
        if (!profile.accommodationStatus) {
          alert('Please select your accommodation status!');
          return false;
        }
        // Validate accommodation details based on status
        if (profile.accommodationStatus === 'looking') {
          if (!profile.districts || profile.districts.length === 0 || !profile.budgetMin || !profile.budgetMax ||
              !profile.accommodationType || profile.accommodationType.length === 0 ||
              !profile.accommodationSize || profile.numberOfRoomates === undefined) {
            alert('Please fill in all required fields for accommodation preferences!');
            return false;
          }
        } else if (profile.accommodationStatus === 'have-room') {
          if (!profile.districts || !profile.accommodationFee ||
              !profile.accommodationElectricityFee || !profile.accommodationWaterFee ||
              !profile.accommodationServiceFee || !profile.accommodationType || profile.accommodationType.length === 0 ||
              !profile.accommodationSize || profile.numberOfRoomates === undefined || !profile.liveWithLandlord) {
            alert('Please fill in all required fields for your accommodation!');
            return false;
          }
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
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

  const getTotalSteps = () => {
    return 3; // Basic Info, Lifestyle, Accommodation
  };

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

          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <ul className="steps w-full">
              <li className={`step ${currentStep >= 1 ? 'step-primary' : ''}`}>Basic Info</li>
              <li className={`step ${currentStep >= 2 ? 'step-primary' : ''}`}>Lifestyle & Habit</li>
              <li className={`step ${currentStep >= 3 ? 'step-primary' : ''}`}>Accommodation</li>
            </ul>
          </div>
          
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
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-gray-900">
                  {profile.displayName || user?.displayName || 'No name set'}
                </h2> 
              </div>
              <p className="text-sm text-gray-600">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
        <div className="bg-base-100 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center text-gray-900">
            <span className="mr-2">👤</span>
            Basic Information
          </h2>

          {/* Display Name */}
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text font-semibold text-gray-900">Display Name *</span>
            </label>
            <input
              type="text"
              placeholder="Enter your display name"
              className="input input-bordered text-gray-900"
              value={profile.displayName || ''}
              onChange={(e) => handleInputChange('displayName', e.target.value)}
              required
            />
          </div>

          {/* Email - read only */}
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text font-semibold text-gray-900">Email</span>
            </label>
            <input
              type="email"
              className="input input-bordered bg-gray-100 text-gray-500 cursor-not-allowed"
              value={user?.email || ''}
              readOnly
            />
          </div>

          {/* Gender */}
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text font-semibold text-gray-900">Gender *</span>
            </label>
            <select
              className="select select-bordered text-gray-900"
              value={profile.gender || ''}
              onChange={(e) => handleInputChange('gender', e.target.value)}
              required
            >
              <option value="">Select gender</option>
              {GENDER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Birth Year */}
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text font-semibold text-gray-900">Birth Year *</span>
            </label>
            <input
              type="number"
              placeholder="Ex: 2000"
              className="input input-bordered text-gray-900"
              value={profile.birthYear || ''}
              onChange={(e) => handleInputChange('birthYear', parseInt(e.target.value) || undefined)}
              min="1950"
              max={new Date().getFullYear()}
              required
            />
          </div>

          {/* Hometown */}
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text font-semibold text-gray-900">Hometown *</span>
            </label>
            <input
              type="text"
              placeholder="Ex: Da Nang, Hanoi, HCMC"
              className="input input-bordered text-gray-900"
              value={profile.hometown || ''}
              onChange={(e) => handleInputChange('hometown', e.target.value)}
              required
            />
          </div>

          {/* University */}
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text font-semibold text-gray-900">University *</span>
            </label>
            <input
              type="text"
              placeholder="Example: HCMC University of Technology"
              className="input input-bordered text-gray-900"
              value={profile.university || ''}
              onChange={(e) => handleInputChange('university', e.target.value)}
              required
            />
          </div>
        </div>
        )}

        {/* Step 2: Lifestyle & Habit */}
        {currentStep === 2 && (
          <div>
            {/* Lifestyle Card */}
            <div className="bg-base-100 rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-bold mb-4 flex items-center text-gray-900">
                <span className="mr-2">🏡</span>
                Lifestyle & Habit
              </h2>

              {/* Sleep Schedule */}
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text font-semibold text-gray-900">
                    Sleep Schedule *
                  </span>
                </label>
                <select
                  className="select select-bordered text-gray-900"
                  value={profile.sleepSchedule || ''}
                  onChange={(e) => handleInputChange('sleepSchedule', e.target.value)}
                  required
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
                  <span className="label-text font-semibold text-gray-900">
                    Cleanliness Level *
                  </span>
                </label>
                <select
                  className="select select-bordered text-gray-900"
                  value={profile.cleanlinessLevel || ''}
                  onChange={(e) => handleInputChange('cleanlinessLevel', e.target.value)}
                  required
                >
                  <option value="">Select cleanliness level</option>
                  {CLEANLINESS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Noise Level */}
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text font-semibold text-gray-900">
                    Preferred Noise Level *
                  </span>
                </label>
                <select
                  className="select select-bordered text-gray-900"
                  value={profile.noiseLevel || ''}
                  onChange={(e) => handleInputChange('noiseLevel', e.target.value)}
                  required
                >
                  <option value="">Select noise level</option>
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
                  <span className="label-text font-semibold text-gray-900">
                    Cooking Skills *
                  </span>
                </label>
                <select
                  className="select select-bordered text-gray-900"
                  value={profile.cookingSkills || ''}
                  onChange={(e) => handleInputChange('cookingSkills', e.target.value)}
                  required
                >
                  <option value="">Select cooking skills</option>
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
                  <span className="label-text font-semibold text-gray-900">
                    Guest Policy *
                  </span>
                </label>
                <select
                  className="select select-bordered text-gray-900"
                  value={profile.guestPolicy || ''}
                  onChange={(e) => handleInputChange('guestPolicy', e.target.value)}
                  required
                >
                  <option value="">Select guest policy</option>
                  {GUEST_POLICY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Smoking Policy */}
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text font-semibold text-gray-900">
                    Smoking Policy *
                  </span>
                </label>
                <select
                  className="select select-bordered text-gray-900"
                  value={profile.smokingPolicy || ''}
                  onChange={(e) => handleInputChange('smokingPolicy', e.target.value)}
                  required
                >
                  <option value="">Select smoking policy</option>
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
                  <span className="label-text font-semibold text-gray-900">
                    Pet Policy *
                  </span>
                </label>
                <select
                  className="select select-bordered text-gray-900"
                  value={profile.petPolicy || ''}
                  onChange={(e) => handleInputChange('petPolicy', e.target.value)}
                  required
                >
                  <option value="">Select pet policy</option>
                  {PET_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {profile.petPolicy === 'have-pets' && (
                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text font-semibold text-gray-900">
                      Pet Details
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder="Describe your pet(s)"
                    className="input input-bordered text-gray-900"
                    value={profile.petType || ''}
                    onChange={(e) => handleInputChange('petType', e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* About You Card */}
            <div className="bg-base-100 rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-bold mb-4 flex items-center text-gray-900">
                <span className="mr-2">💝</span>
                About you
              </h2>

              {/* Interests */}
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text font-semibold text-gray-900">
                    Interests & Hobbies
                  </span>
                </label>

                <div className="flex flex-wrap gap-2 mb-3">
                  {COMMON_INTERESTS.map((interest: string) => (
                    <button
                      key={interest}
                      type="button"
                      className={`btn btn-sm ${
                        selectedInterests.includes(interest)
                          ? 'btn-primary'
                          : 'btn-outline'
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
                    {selectedInterests.map((interest: string) => (
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
                  <span className="label-text font-semibold text-gray-900">
                    About Yourself (max 255 characters)
                  </span>
                </label>

                <textarea
                  className="textarea textarea-bordered h-32 text-gray-900"
                  placeholder="Describe your ideal weekend, things you like to do, or what's important to you when living with others..."
                  value={profile.bio || ''}
                  maxLength={255}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                ></textarea>

                <label className="label">
                  <span className="label-text-alt text-gray-600">
                    This information helps find more compatible roommates
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

          {/* Step 3: Accommodation */}
          {currentStep === 3 && (
          <div>
            <div className="bg-base-100 rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-bold mb-4 flex items-center text-gray-900">
                <span className="mr-2">🏠</span>
                Accommodation
              </h2>
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text font-semibold text-gray-900">Accommodation Status *</span>
                </label>
                <select
                  className="select select-bordered text-gray-900"
                  value={profile.accommodationStatus || ''}
                  onChange={(e) => handleInputChange('accommodationStatus', e.target.value)}
                  required
                  >
                  <option value="">Select status</option>
                    {ACCOMMODATION_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Accommodation Details - Looking */}
            {profile.accommodationStatus === 'looking' && (
              <div className="bg-base-100 rounded-lg shadow-lg p-6 mb-6">
                <h2 className="text-2xl font-bold mb-4 flex items-center text-gray-900">
                  <span className="mr-2">🔍</span>
                  <span className="badge badge-primary mr-2">Looking</span>
                  What You're Looking For
                </h2>

              {/* Preferred Districts */}
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text font-semibold text-gray-900">Preferred Districts *</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {['District 1', 'District 2', 'District 3', 'District 4', 'District 5', 'District 7', 'District 8', 'District 10', 'Binh Thanh', 'Phu Nhuan', 'Tan Binh', 'Go Vap', 'Thu Duc'].map((district) => (
                    <button
                      key={district}
                      type="button"
                      className={`btn btn-sm ${
                        profile.districts?.includes(district) ? 'btn-primary' : 'btn-outline'
                      }`}
                      onClick={() => {
                        const currentDistricts = profile.districts || [];
                        if (currentDistricts.includes(district)) {
                          handleInputChange('districts', currentDistricts.filter(d => d !== district));
                        } else {
                          handleInputChange('districts', [...currentDistricts, district]);
                        }
                      }}
                    >
                      {district}
                    </button>
                  ))}
                </div>
              </div>  
              
              {/* Budget Range */}
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text font-semibold text-gray-900">Budget Range (Monthly Rent in VND) *</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <span className="label-text text-gray-900 whitespace-nowrap">Budget Min:</span>
                    <input
                      type="number"
                      className="input input-bordered text-gray-900 flex-1"
                      placeholder= "EX: 2 is 2.000.000 VND"
                      value={profile.budgetMin || ''}
                      onChange={(e) => handleInputChange('budgetMin', e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="label-text text-gray-900 whitespace-nowrap">Budget Max:</span>
                    <input
                      type="number"
                      className="input input-bordered text-gray-900 flex-1"
                      placeholder="EX: 5 is 5.000.000 VND"
                      value={profile.budgetMax || ''}
                      onChange={(e) => handleInputChange('budgetMax', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Accommodation Type */}
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text font-semibold text-gray-900">Preferred Accommodation Type *</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {ACCOMMODATION_TYPE_OPTIONS.map((type) => (
                    <button
                      key={type}
                      type="button"
                      className={`btn btn-sm ${
                        profile.accommodationType?.includes(type) ? 'btn-primary' : 'btn-outline'
                      }`}
                      onClick={() => {
                        const currentTypes = profile.accommodationType || [];
                        if (currentTypes.includes(type)) {
                          handleInputChange('accommodationType', currentTypes.filter(t => t !== type));
                        } else {
                          handleInputChange('accommodationType', [...currentTypes, type]);
                        }
                      }}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Accommodation Size */}
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text font-semibold text-gray-900">
                    Preferred Accommodation Size *
                  </span>
                </label>

                <div className="flex flex-wrap gap-2">
                  {ACCOMMODATION_SIZE_OPTIONS.map((size) => (
                    <button
                      key={size}
                      type="button"
                      className={`btn btn-sm ${
                          Array.isArray(profile.accommodationSize) &&
                          profile.accommodationSize.includes(size)
                          ? "btn-primary" 
                          : "btn-outline"
                      }`}
                      onClick={() => {
                        const currentSizes = profile.accommodationSize || [];
                        if (currentSizes.includes(size)) {
                          handleInputChange('accommodationSize', currentSizes.filter(s => s !== size));
                        } else {
                          handleInputChange('accommodationSize', [...currentSizes, size]);
                        }
                      }}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            
              {/* Number of Roommates */}
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text font-semibold text-gray-900">Preferred Number of Roommates *</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered text-gray-900"
                  placeholder="Enter preferred number of roommates"
                  value={profile.numberOfRoomates || ''}
                  onChange={(e) => handleInputChange('numberOfRoomates', parseInt(e.target.value) || undefined)}
                  min="0"
                  required
                />
              </div>

              {/* Desired Services */}
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text font-semibold text-gray-900">Desired Services</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {['WiFi', 'Parking', 'Furnished', 'Air Conditioning', 'Washing Machine', 'Kitchen', 'Elevator', 'Security', 'Gym', 'Swimming Pool'].map((service) => (
                    <button
                      key={service}
                      type="button"
                      className={`btn btn-sm ${
                        profile.accommodationServices?.includes(service) ? 'btn-primary' : 'btn-outline'
                      }`}
                      onClick={() => {
                        const currentServices = profile.accommodationServices || [];
                        if (currentServices.includes(service)) {
                          handleInputChange('accommodationServices', currentServices.filter(s => s !== service));
                        } else {
                          handleInputChange('accommodationServices', [...currentServices, service]);
                        }
                      }}
                    >
                      {service}
                    </button>
                  ))}
                  {/* Show custom services with remove button */}
                  {(profile.accommodationServices || []).filter(
                    service => !['WiFi', 'Parking', 'Furnished', 'Air Conditioning', 'Washing Machine', 'Kitchen', 'Elevator', 'Security', 'Gym', 'Swimming Pool'].includes(service)
                  ).map((service) => (
                    <button
                      key={service}
                      type="button"
                      className="btn btn-sm btn-primary gap-1"
                      onClick={() => {
                        const currentServices = profile.accommodationServices || [];
                        handleInputChange('accommodationServices', currentServices.filter(s => s !== service));
                      }}
                    >
                      {service}
                      <span className="text-xs">✕</span>
                    </button>
                  ))}
                </div>

                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    placeholder="Add custom service (e.g., Garden, Balcony)"
                    className="input input-sm flex-1 text-gray-900 input-bordered"
                    value={customService}
                    onChange={(e) => setCustomService(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && customService.trim()) {
                        e.preventDefault();
                        const currentServices = profile.accommodationServices || [];
                        if (!currentServices.includes(customService.trim())) {
                          handleInputChange('accommodationServices', [...currentServices, customService.trim()]);
                          setCustomService('');
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={() => {
                      if (customService.trim()) {
                        const currentServices = profile.accommodationServices || [];
                          if (!currentServices.includes(customService.trim())) {
                          handleInputChange('accommodationServices', [...currentServices, customService.trim()]);
                          setCustomService('');
                        }
                      }
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Live with Landlord Preference */}
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text font-semibold text-gray-900">Live with Landlord</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {['No preference', 'Yes', 'No'].map((option) => {
                    const value = option === 'No preference' ? '' : option.toLowerCase();
                    return (
                      <button
                        key={option}
                        type="button"
                        className={`btn btn-sm ${
                          profile.liveWithLandlord === value ? 'btn-primary' : 'btn-outline'
                        }`}
                        onClick={() => handleInputChange('liveWithLandlord', value)}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>
              </div>
            )}

            {/* Accommodation Details - Have Room */}
            {profile.accommodationStatus === 'have-room' && (
              <div className="bg-base-100 rounded-lg shadow-lg p-6 mb-6">
                <h2 className="text-2xl font-bold mb-4 flex items-center text-gray-900">
                  <span className="mr-2">🏠</span>
                  <span className="badge badge-success mr-2">Have Room</span>
                  Your Accommodation Details
                </h2>

            {/* Accommodation Address */}
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-semibold text-gray-900">Accommodation Address *</span>
              </label>
              <input
                type="text"
                className="input input-bordered text-gray-900"
                placeholder="Enter accommodation address  Ex: 123 Nguyen Hue, District 1, HCMC"
                onChange={(e) => {
                  const value = e.target.value;

                  const parsed =
                    value.includes(",")
                      ? value.split(",").map((v) => v.trim())
                      : value;

                  handleInputChange("districts", parsed);
                }}
                required
              />
            </div>

            {/* Monthly Rent */}
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-semibold text-gray-900">Monthly Rent (Milion VND/month) *</span>
              </label>
              <input
                type="number"
                className="input input-bordered text-gray-900"
                placeholder="Ex: 3.5 is 3.5 million VND"
                value={profile.accommodationFee || ''}
                onChange={(e) => handleInputChange('accommodationFee', parseFloat(e.target.value) || undefined)}
                required
              />
            </div>

            {/* Utility Fees */}
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-semibold text-gray-900">Utility Fees *</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="label">
                    <span className="label-text text-gray-900 text-sm">Electricity (VND/kWh)</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered text-gray-900 w-full"
                    placeholder="Ex: 4000"
                    value={profile.accommodationElectricityFee || ''}
                    onChange={(e) => handleInputChange('accommodationElectricityFee', parseFloat(e.target.value) || undefined)}
                    required
                  />
                </div>
                <div>
                  <label className="label">
                    <span className="label-text text-gray-900 text-sm">Water (VND/m³)</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered text-gray-900 w-full"
                    placeholder="Ex: 20000"
                    value={profile.accommodationWaterFee || ''}
                    onChange={(e) => handleInputChange('accommodationWaterFee', parseFloat(e.target.value) || undefined)}
                    required
                  />
                </div>
                <div>
                  <label className="label">
                    <span className="label-text text-gray-900 text-sm">Service Fee (VND/month)</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered text-gray-900 w-full"
                    placeholder="Ex: 200000"
                    value={profile.accommodationServiceFee || ''}
                    onChange={(e) => handleInputChange('accommodationServiceFee', parseFloat(e.target.value) || undefined)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Other Fees */}
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-semibold text-gray-900">Other Fees</span>
              </label>
              <input
                type="text"
                className="input input-bordered text-gray-900"
                placeholder="Ex: Parking: 200k/month, Security: 100k/month"
                value={profile.accommodationOtherFees || ''}
                onChange={(e) => handleInputChange('accommodationOtherFees', e.target.value)}
              />
            </div>

            {/* Accommodation Type (Select only one, button) */}
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-semibold text-gray-900">
                  Accommodation Size *
                </span>
              </label>

              <div className="flex flex-wrap gap-2">
                {ACCOMMODATION_TYPE_OPTIONS.map((size) => {
                  const isSelected = Array.isArray(profile.accommodationType)
                    ? profile.accommodationType.includes(size)
                    : false;

                  return (
                    <button
                      key={size}
                      type="button"
                      className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => {
                        if (isSelected) {
                          handleInputChange('accommodationType', []);
                        } else {
                          handleInputChange('accommodationType', [size]);
                        }
                      }}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Accommodation Size (Select only one, button) */}
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-semibold text-gray-900">
                  Accommodation Size *
                </span>
              </label>

              <div className="flex flex-wrap gap-2">
                {ACCOMMODATION_SIZE_OPTIONS.map((size) => {
                  const isSelected = Array.isArray(profile.accommodationSize)
                    ? profile.accommodationSize.includes(size)
                    : false;

                  return (
                    <button
                      key={size}
                      type="button"
                      className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => {
                        if (isSelected) {
                          handleInputChange('accommodationSize', []);
                        } else {
                          handleInputChange('accommodationSize', [size]);
                        }
                      }}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Number of Roommates */}
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-semibold text-gray-900">Number of Roommates *</span>
              </label>
              <input
                type="number"
                className="input input-bordered text-gray-900"
                placeholder="Enter current/maximum number of roommates"
                value={profile.numberOfRoomates || ''}
                onChange={(e) => handleInputChange('numberOfRoomates', parseInt(e.target.value) || undefined)}
                min="0"
                required
              />
            </div>

            {/* Available Services */}
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-semibold text-gray-900">Available Services</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {['WiFi', 'Parking', 'Furnished', 'Air Conditioning', 'Washing Machine', 'Kitchen', 'Elevator', 'Security', 'Gym', 'Swimming Pool'].map((service) => (
                  <button
                    key={service}
                    type="button"
                    className={`btn btn-sm ${
                      profile.accommodationServices?.includes(service) ? 'btn-primary' : 'btn-outline'
                    }`}
                    onClick={() => {
                      const currentServices = profile.accommodationServices || [];
                      if (currentServices.includes(service)) {
                        handleInputChange('accommodationServices', currentServices.filter(s => s !== service));
                      } else {
                        handleInputChange('accommodationServices', [...currentServices, service]);
                      }
                    }}
                  >
                    {service}
                  </button>
                ))}
                {/* Show custom services with remove button */}
                {(profile.accommodationServices || []).filter(
                  service => !['WiFi', 'Parking', 'Furnished', 'Air Conditioning', 'Washing Machine', 'Kitchen', 'Elevator', 'Security', 'Gym', 'Swimming Pool'].includes(service)
                ).map((service) => (
                  <button
                    key={service}
                    type="button"
                    className="btn btn-sm btn-primary gap-1"
                    onClick={() => {
                      const currentServices = profile.accommodationServices || [];
                      handleInputChange('accommodationServices', currentServices.filter(s => s !== service));
                    }}
                  >
                    {service}
                    <span className="text-xs">✕</span>
                  </button>
                ))}
              </div>

              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  placeholder="Add additional service (e.g., Garden, Balcony)"
                  className="input input-sm flex-1 text-gray-900 input-bordered"
                  value={customService}
                  onChange={(e) => setCustomService(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && customService.trim()) {
                      e.preventDefault();
                      const currentServices = profile.accommodationServices || [];
                      if (!currentServices.includes(customService.trim())) {
                        handleInputChange('accommodationServices', [...currentServices, customService.trim()]);
                        setCustomService('');
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => {
                    if (customService.trim()) {
                      const currentServices = profile.accommodationServices || [];
                      if (!currentServices.includes(customService.trim())) {
                        handleInputChange('accommodationServices', [...currentServices, customService.trim()]);
                        setCustomService('');
                      }
                    }
                  }}
                >
                  Add
                </button>
              </div>
            </div>

            {/* Live with Landlord */}
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-semibold text-gray-900">Live with Landlord *</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {['Yes', 'No'].map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`btn btn-sm ${
                      profile.liveWithLandlord === option.toLowerCase() ? 'btn-primary' : 'btn-outline'
                    }`}
                    onClick={() => handleInputChange('liveWithLandlord', option.toLowerCase())}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
              </div>
            )}
          </div>
          )}

        {/* Navigation Buttons */}
        <div className="flex gap-4 mb-8">
          {currentStep > 1 && (
            <button
              className="btn btn-outline"
              onClick={handlePrevious}
            >
              ← Previous
            </button>
          )}
          
          {currentStep < getTotalSteps() && (
            <button
              className="btn btn-primary flex-1"
              onClick={handleNext}
            >
              Next →
            </button>
          )}
          
          {currentStep === getTotalSteps() && (
            <button
              className="btn btn-primary flex-1"
              onClick={handleSave}
              disabled={saving}
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
          )}

          <button
            className="btn btn-outline"
            onClick={() => {
              if (profile.slug) {
                router.push(`/profile/${profile.slug}`);
              } else {
                router.push('/');
              }
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
