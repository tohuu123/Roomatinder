'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { UserProfile } from '@/types/profile';
import { getProfileBySlug } from '@/lib/profileService';
import { getUserAvatar } from '@/lib/avatarHelper';
import Link from 'next/link';
import { Icon } from '@iconify/react';

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
              <div className="avatar">
                <div className="w-20 h-20 rounded-full">
                  <img src={getUserAvatar(profile.photoURL, profile.email || profile.userId)} alt={profile.displayName || 'Profile'} />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-bold text-gray-900">
                      {profile.displayName || profile.email?.split('@')[0] || 'No name'}  
                    </h1>

                    {/* Gender icon */}
                    {profile.gender === 'male' && (
                      <Icon icon="mdi:gender-male" className="w-6 h-6 text-blue-500" />

                    )} 
                    {profile.gender === 'female' && (
                      <Icon icon="mdi:gender-female" className="w-6 h-6 text-pink-500" />
                    )}
                  </div>

                  {/* Accommodation Status */}
                  {profile.accommodationStatus && (
                    <span className="text-sm px-3 py-1 rounded-full font-semibold bg-blue-500 text-white shadow-md">
                      {profile.accommodationStatus === 'have-room' ? 'Has Room' : 'Looking'}
                    </span>
                  )}
                </div>

                {/* Additional */}
                {profile.birthYear && (
                  <p className="text-sm text-gray-900">
                    <Icon icon="mdi:cake-variant" className="w-4 h-4 inline-block mr-1" />
                    Age: {new Date().getFullYear() - profile.birthYear}
                  </p>
                )}
                {profile.university && (
                  <p className="text-sm text-gray-900 mt-1 flex items-center gap-1">
                    <Icon icon="mdi:school" className="w-4 h-4" />
                    {profile.university}
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
        </div>
            
        {/* Bio Section */} 
        {profile.bio && (
          <div className="bg-base-100 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold mb-3 text-gray-900 flex items-center">
              <Icon icon="mdi:account-circle" className="w-6 h-6 mr-2 text-blue-600" />
                About
            </h2>
              <p className="text-gray-900 whitespace-pre-wrap leading-relaxed break-words">
                {profile.bio}
              </p>
          </div>
        )}

        {/* Personal Information Section */}
        {/* Basic Information */}
        {(profile.hometown || profile.birthYear || profile.bio) && (
          <div className="bg-base-100 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 flex items-center">
              <Icon icon="mdi:information" className="w-6 h-6 mr-2 text-blue-600" />
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile.gender && (
                <div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                  <Icon icon="mdi:human-male-female" className="w-6 h-6 text-purple-600" />
                  <div>
                    <p className="text-xs text-gray-900">Gender</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {profile.gender === 'male' && 'Male'}
                      {profile.gender === 'female' && 'Female'}
                    </p>
                  </div>
                </div>
              )}
              {profile.birthYear && (
                <div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                  <Icon icon="mdi:cake-variant" className="w-6 h-6 text-pink-600" />
                  <div>
                    <p className="text-xs text-gray-900">Birth Year</p>
                    <p className="text-sm font-semibold text-gray-900">{profile.birthYear}</p>
                  </div>
                </div>
              )}
              {profile.hometown && (
                <div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                  <Icon icon="mdi:home-city" className="w-6 h-6 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-900">Hometown</p>
                    <p className="text-sm font-semibold text-gray-900">{profile.hometown}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Interests Section */}
        {profile.interests && profile.interests.length > 0 && (
          <div className="bg-base-100 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 flex items-center">
              <Icon icon="mdi:heart-multiple" className="w-6 h-6 mr-2 text-red-600" />
              Interests & Hobby
            </h2>
            <div className="flex flex-wrap gap-3">
              {profile.interests.map((interest: string, index: number) => (
                <span key={index} className="badge badge-outline text-sm text-gray-900">
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Lifestyle Section */}
        {(profile.sleepSchedule || profile.cleanlinessLevel || profile.noiseLevel || profile.cookingSkills || profile.guestPolicy || profile.smokingPolicy || profile.petPolicy) && (
          <div className="bg-base-100 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 flex items-center">
              <Icon icon="mdi:home-heart" className="w-6 h-6 mr-2 text-purple-600" />
              Lifestyle Preferences
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {profile.sleepSchedule && (
                <div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                  <Icon icon="mdi:sleep" className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="text-xs text-gray-900">Sleep Schedule</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {profile.sleepSchedule === 'early-bird' && 'Early Bird'}
                      {profile.sleepSchedule === 'night-owl' && 'Night Owl'}
                      {profile.sleepSchedule === 'flexible' && 'Flexible'}
                    </p>
                  </div>
                </div>
              )}
              {profile.cleanlinessLevel && (
                <div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                  <Icon icon="mdi:spray-bottle" className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-xs text-gray-900">Cleanliness</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {profile.cleanlinessLevel === 'very-clean' && 'Very Tidy'}
                      {profile.cleanlinessLevel === 'clean' && 'Tidy'}
                      {profile.cleanlinessLevel === 'moderate' && 'Moderate'}
                      {profile.cleanlinessLevel === 'relaxed' && 'Relaxed'}
                    </p>
                  </div>
                </div>
              )}
              {profile.noiseLevel && (
                <div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                  <Icon icon="mdi:volume-high" className="w-5 h-5 text-yellow-500" />
                  <div>
                    <p className="text-xs text-gray-900">Noise Level</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {profile.noiseLevel === 'very-quiet' && 'Very Quiet'}
                      {profile.noiseLevel === 'quiet' && 'Quiet'}
                      {profile.noiseLevel === 'moderate' && 'Moderate'}
                      {profile.noiseLevel === 'lively' && 'Lively'}
                    </p>
                  </div>
                </div>
              )}
              {profile.cookingSkills && (
                <div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                  <Icon icon="mdi:chef-hat" className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="text-xs text-gray-900">Cooking Skills</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {profile.cookingSkills === 'no' && "Can't Cook"}
                      {profile.cookingSkills === 'basic' && 'Basic'}
                      {profile.cookingSkills === 'intermediate' && 'Intermediate'}
                      {profile.cookingSkills === 'advanced' && 'Advanced'}
                    </p>
                  </div>
                </div>
              )}
              {profile.guestPolicy && (
                <div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                  <Icon icon="mdi:account-multiple" className="w-5 h-5 text-teal-500" />
                  <div>
                    <p className="text-xs text-gray-900">Guest Policy</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {profile.guestPolicy === 'never' && 'Never'}
                      {profile.guestPolicy === 'rarely' && 'Rarely'}
                      {profile.guestPolicy === 'sometimes' && 'Sometimes'}
                      {profile.guestPolicy === 'often' && 'Often'}  
                      {profile.guestPolicy === 'very-flexible' && 'Very Flexible'}
                    </p>
                  </div>
                </div>
              )}
              {profile.smokingPolicy && (
                <div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                  <Icon icon="mdi:smoking" className="w-5 h-5 text-red-500" />
                  <div>
                    <p className="text-xs text-gray-900">Smoking Policy</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {profile.smokingPolicy === 'no-smoking' && 'No Smoking'}
                      {profile.smokingPolicy === 'outdoor-only' && 'Outdoor Only'}
                      {profile.smokingPolicy === 'smoking-ok' && 'Smoking OK'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Pet Policy */}
            {profile.petPolicy && (
              <div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg mt-4">
                <Icon icon="mdi:dog" className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-xs text-gray-900">Pet Policy</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {profile.petPolicy === 'no-pets' && 'No Pets'}
                    {profile.petPolicy === 'pets-ok' && 'Pets Allowed'}
                    {profile.petPolicy === 'have-pets' && 'Have Pets: ' + (profile.petType || '')}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Accommodation Status Section */}
        {profile.accommodationStatus && (
          <div className="bg-base-100 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 flex items-center">
              <Icon icon="mdi:home-city" className="w-6 h-6 mr-2 text-green-600" />
              Accommodation Status: 
              <span className="ml-2 px-3 py-1 bg-blue-100 border-2 border-blue-500 rounded-lg text-blue-700 font-semibold">
                {profile.accommodationStatus === 'have-room' ? 'Has Room to Share' : 'Looking for Accommodation'}
              </span>
            </h2>
            
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile.accommodationStatus === 'have-room' && (
                  <>
                    <div className="col-span-1 md:col-span-2">
                      <h3 className="text-lg font-bold mb-2 text-gray-900">General Information</h3>
                    </div>

                    {profile.accommodationAddress && (
                      <div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                        <Icon icon="mdi:map-marker" className="w-5 h-5 text-red-500" />
                        <div>
                          <p className="text-xs text-gray-900">Address</p>
                          <p className="text-sm font-semibold text-gray-900">{profile.accommodationAddress}</p>
                        </div>
                      </div>
                    )}
                    {profile.accommodationType && (
                      <div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                        <Icon icon="mdi:home" className="w-5 h-5 text-yellow-500" />
                        <div>
                          <p className="text-xs text-gray-900">Accommodation Type</p>
                          <p className="text-sm font-semibold text-gray-900">{profile.accommodationType.join(", ")}</p>
                        </div>
                      </div>
                    )}
                    {profile.accommodationSize !== undefined && (
                      <div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                        <Icon icon="mdi:vector-square" className="w-5 h-5 text-purple-500" />
                        <div>
                          <p className="text-xs text-gray-900">Accommodation Size</p>
                          <p className="text-sm font-semibold text-gray-900">{profile.accommodationSize.join(", ")}</p>
                        </div>
                      </div>
                    )}
                    {profile.numberOfRoomates !== undefined && (
                      <div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                        <Icon icon="mdi:account-group" className="w-5 h-5 text-blue-500" />
                        <div>
                          <p className="text-xs text-gray-900">Number of Roommates</p>
                          <p className="text-sm font-semibold text-gray-900">{profile.numberOfRoomates}</p>
                        </div>
                      </div>
                    )}

                    {/* Live with Landlord */}
                    {profile.liveWithLandlord && (
                      <div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                        <Icon icon="mdi:home-account" className="w-5 h-5 text-indigo-500" />
                        <div>
                          <p className="text-xs text-gray-900">Live with Landlord</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {profile.liveWithLandlord === 'yes' ? 'Yes' : 'No'}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="col-span-1 md:col-span-2">
                      <h3 className="text-lg font-bold mb-2 text-gray-900">Fees Breakdown</h3>
                    </div>  
                    
                    {/* General Fee */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                        <Icon icon="mdi:currency-usd" className="w-5 h-5 text-green-500" />
                        <div>
                          <p className="text-xs text-gray-900">Monthly Rent</p>
                          <p className="text-sm font-semibold text-gray-900">{profile.accommodationFee ? `${profile.accommodationFee.toLocaleString()} million VND` : "N/A"}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                        <Icon icon="mdi:lightning-bolt" className="w-5 h-5 text-yellow-500" />
                        <div>
                          <p className="text-xs text-gray-900">Electricity</p>
                          <p className="text-sm font-semibold text-gray-900">{profile.accommodationElectricityFee ? `${profile.accommodationElectricityFee.toLocaleString()} VND/kWh` : "N/A"}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                        <Icon icon="mdi:water" className="w-5 h-5 text-blue-500" />
                        <div>
                          <p className="text-xs text-gray-900">Water</p>
                          <p className="text-sm font-semibold text-gray-900">{profile.accommodationWaterFee ? `${profile.accommodationWaterFee.toLocaleString()} VND/m³` : "N/A"}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                        <Icon icon="mdi:toolbox" className="w-5 h-5 text-purple-500" />
                        <div>
                          <p className="text-xs text-gray-900">Service Fee</p>
                          <p className="text-sm font-semibold text-gray-900">{profile.accommodationServiceFee ? `${profile.accommodationServiceFee.toLocaleString()} VND/month` : "N/A"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Other Fees */}
                      <div className="flex gap-3 p-3 bg-base-200 rounded-lg">
                        <Icon icon="mdi:cash-plus" className="w-5 h-5 text-orange-500 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-900 mb-1">Other Fees</p>
                          <p className="text-sm font-semibold text-gray-900">{profile.accommodationOtherFees ? `${profile.accommodationOtherFees}` : "N/A"}</p>
                        </div>
                      </div>

                    <div className="col-span-1 md:col-span-2">
                      <h3 className="text-lg font-bold mb-2 text-gray-900">Other Details</h3>
                    </div>  

                    {/* Service List */}
                    {profile.accommodationServices && profile.accommodationServices.length > 0 && (
                      <div className="flex items-start gap-3 p-3 bg-base-200 rounded-lg col-span-1 md:col-span-2">
                        <Icon icon="mdi:star-circle" className="w-5 h-5 text-indigo-500 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-900 mb-1">Available Services</p>
                          <div className="flex flex-wrap gap-2">
                            {profile.accommodationServices.map((service, index) => (
                              <span key={index} className="badge badge-primary badge-outline text-xs">
                                {service}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
                
                {profile.accommodationStatus === 'looking' && (
                  <>
                    <div className="col-span-1 md:col-span-2">
                      <h3 className="text-lg font-bold mb-2 text-gray-900">Preferences</h3>
                    </div>

                    {/* Districts */}
                    {profile.districts && profile.districts.length > 0 && (
                      <div className="flex items-start gap-3 p-3 bg-base-200 rounded-lg col-span-1 md:col-span-2">
                        <Icon icon="mdi:map-marker-radius" className="w-5 h-5 text-green-500 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-900 mb-1">Preferred Districts</p>
                          <div className="flex flex-wrap gap-2">
                            {profile.districts.map((district: string, index: number) => (
                              <span key={index} className="badge badge-outline text-xs text-gray-900">
                                {district}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Accommodation Type */}
                    {profile.accommodationType && profile.accommodationType.length > 0 && (
                      <div className="flex items-start gap-3 p-3 bg-base-200 rounded-lg">
                        <Icon icon="mdi:home-variant" className="w-5 h-5 text-yellow-500 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-900 mb-1">Accommodation Type</p>
                          <div className="flex flex-wrap gap-2">
                            {profile.accommodationType.map((type: string, index: number) => (
                              <span key={index} className="badge badge-outline text-xs text-gray-900">
                                {type}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Accommodation Size */}
                    {profile.accommodationSize && profile.accommodationSize.length > 0 && (
                      <div className="flex items-start gap-3 p-3 bg-base-200 rounded-lg">
                        <Icon icon="mdi:home-variant" className="w-5 h-5 text-yellow-500 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-900 mb-1">Accommodation Size</p>
                          <div className="flex flex-wrap gap-2">
                            {profile.accommodationSize.map((size: string, index: number) => (
                              <span key={index} className="badge badge-outline text-xs text-gray-900">
                                {size}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Number of Roommates */}
                    {profile.numberOfRoomates !== undefined && (
                      <div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                        <Icon icon="mdi:account-group" className="w-5 h-5 text-blue-500" />
                        <div>
                          <p className="text-xs text-gray-900">Number of Roommates</p>
                          <p className="text-sm font-semibold text-gray-900">{profile.numberOfRoomates} {profile.numberOfRoomates === 1 ? 'person' : 'people'}</p>
                        </div>
                      </div>
                    )}

                    {/* Live with Landlord */}
                    {profile.liveWithLandlord && (
                      <div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                        <Icon icon="mdi:home-account" className="w-5 h-5 text-indigo-500" />
                        <div>
                          <p className="text-xs text-gray-900">Live with Landlord</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {profile.liveWithLandlord === 'yes' ? 'Yes' : 'No'}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Accommodation Services */}
                    {profile.accommodationServices && profile.accommodationServices.length > 0 && (
                      <div className="flex items-start gap-3 p-3 bg-base-200 rounded-lg col-span-1 md:col-span-2">
                        <Icon icon="mdi:star-circle" className="w-5 h-5 text-indigo-500 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-900 mb-1">Desired Services</p>
                          <div className="flex flex-wrap gap-2">
                            {profile.accommodationServices.map((service: string, index: number) => (
                              <span key={index} className="badge badge-primary badge-outline text-xs">
                                {service}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}


                    <div className="col-span-1 md:col-span-2">
                      <h3 className="text-lg font-bold mb-2 text-gray-900">Budget</h3>
                    </div>

                    {/* Budget Range */}
                    {(profile.budgetMin !== undefined || profile.budgetMax !== undefined) && (
                      <div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg col-span-1 md:col-span-2">
                        <Icon icon="mdi:cash" className="w-5 h-5 text-green-500" />
                        <div>
                          <p className="text-xs text-gray-900">Budget Range</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {profile.budgetMin !== undefined && profile.budgetMax !== undefined
                              ? `${profile.budgetMin}-${profile.budgetMax} million VND/month`
                              : profile.budgetMin !== undefined
                              ? `From ${profile.budgetMin} million VND/month`
                              : profile.budgetMax !== undefined
                              ? `Up to ${profile.budgetMax} million VND/month`
                              : "Not specified"}
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}
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
