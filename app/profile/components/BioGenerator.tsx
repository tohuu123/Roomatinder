'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';

interface BioGeneratorProps {
  onBioGenerated: (bio: string) => void;
  currentBio?: string;
}

type ToneType = 'friendly' | 'humorous' | 'straightforward';
type StepType = 1 | 2 | 3;

const PERSONAL_TRAITS = [
  'Friendly', 'Outgoing', 'Helpful', 'Cheerful', 'Open-minded',
  'Quiet', 'Focused', 'Active', 'Creative', 'Responsible'
];

const HOBBIES = [
  'Reading', 'Movies', 'Music', 'Gaming', 'Sports',
  'Cooking', 'Travel', 'Photography', 'Art', 'Yoga/Gym'
];

const LIFESTYLE = [
  'Early riser', 'Night owl', 'Organized', 'Clean', 
  'Cook often', 'Eat out', 'Prefer quiet', 'Non-smoker'
];

const ROOMMATE_PREFS = [
  'Easy to talk to', 'Respect privacy', 'Share chores',
  'Social', 'Responsible with bills', 'Quiet', 'Friendly'
];

interface GeneratedBio {
  bio: string;
  tone: ToneType;
  length: number;
}

export default function BioGenerator({ onBioGenerated, currentBio }: BioGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<StepType>(1);
  const [generating, setGenerating] = useState(false);
  
  // Step 1 - Data Collection
  const [selectedPersonalTraits, setSelectedPersonalTraits] = useState<string[]>([]);
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>([]);
  const [selectedLifestyle, setSelectedLifestyle] = useState<string[]>([]);
  const [selectedRoommatePrefs, setSelectedRoommatePrefs] = useState<string[]>([]);
  const [additionalInfo, setAdditionalInfo] = useState('');
  
  // Step 2 - Tone Selection
  const [selectedTone, setSelectedTone] = useState<ToneType>('friendly');
  
  // Step 3 - Results
  const [generatedBios, setGeneratedBios] = useState<GeneratedBio[]>([]);
  const [error, setError] = useState('');

  const toggleSelection = (
    item: string,
    selectedItems: string[],
    setSelectedItems: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (selectedItems.includes(item)) {
      setSelectedItems(selectedItems.filter(i => i !== item));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const resetFlow = () => {
    setCurrentStep(1);
    setSelectedPersonalTraits([]);
    setSelectedHobbies([]);
    setSelectedLifestyle([]);
    setSelectedRoommatePrefs([]);
    setAdditionalInfo('');
    setSelectedTone('friendly');
    setGeneratedBios([]);
    setError('');
  };

  const handleClose = () => {
    setIsOpen(false);
    resetFlow();
  };

  const handleNextToToneSelection = () => {
    // Validate at least some keywords are selected
    if (
      selectedPersonalTraits.length === 0 &&
      selectedHobbies.length === 0 &&
      selectedLifestyle.length === 0 &&
      selectedRoommatePrefs.length === 0 &&
      !additionalInfo.trim()
    ) {
      setError('Please select at least one keyword or add additional information!');
      return;
    }
    
    setError('');
    setCurrentStep(2);
  };

  const handleGenerateBio = async () => {
    setError('');
    setGenerating(true);
    setCurrentStep(3);
    setGeneratedBios([]);

    const keywords = {
      personalTraits: selectedPersonalTraits,
      hobbies: selectedHobbies,
      lifestyle: selectedLifestyle,
      roommatePreferences: selectedRoommatePrefs,
      additionalInfo: additionalInfo.trim(),
    };

    try {
      // Generate bio with selected tone
      const response = await fetch('/api/generate-bio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keywords,
          tone: selectedTone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate bio');
      }

      // Add the generated bio to results
      setGeneratedBios([{
        bio: data.bio,
        tone: selectedTone,
        length: data.length
      }]);
      
    } catch (err: any) {
      console.error('Error generating bio:', err);
      setError(err.message || 'An error occurred while generating bio. Please try again!');
    } finally {
      setGenerating(false);
    }
  };

  const handleUseBio = (bio: string) => {
    onBioGenerated(bio);
    setIsOpen(false);
    resetFlow();
  };

  const handleRegenerateBio = () => {
    setCurrentStep(2);
    setGeneratedBios([]);
    setError('');
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        className="btn btn-outline btn-sm gap-2"
        onClick={() => setIsOpen(true)}
      >
        <Icon icon="mdi:sparkles" className="text-lg" />
        AI Bio Assistant
      </button>

      {/* Modal Dialog */}
      {isOpen && (
        <dialog className="modal modal-open">
          <div className="modal-box max-w-3xl max-h-[90vh] overflow-y-auto">
            {/* Header with Steps */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-xl flex items-center gap-2">
                <Icon icon="mdi:sparkles" className="text-2xl text-primary" />
                AI Bio Assistant
              </h3>
              
              {/* Step Indicator */}
              <div className="flex items-center gap-2">
                <div className={`badge ${currentStep >= 1 ? 'badge-primary' : 'badge-ghost'}`}>
                  1
                </div>
                <div className="w-8 border-t-2 border-gray-300"></div>
                <div className={`badge ${currentStep >= 2 ? 'badge-primary' : 'badge-ghost'}`}>
                  2
                </div>
                <div className="w-8 border-t-2 border-gray-300"></div>
                <div className={`badge ${currentStep >= 3 ? 'badge-primary' : 'badge-ghost'}`}>
                  3
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="alert alert-error mb-4">
                <Icon icon="mdi:alert-circle" />
                <span>{error}</span>
              </div>
            )}

            {/* Step 1: Data Collection */}
            {currentStep === 1 && (
              <div>
                <h4 className="text-lg font-semibold mb-4">A Few Things About You</h4>
                <p className="text-sm text-gray-600 mb-6">
                  Select keywords that describe you. The more you share, the better your bio!
                </p>

                {/* Personal Traits */}
                <div className="mb-6">
                  <h5 className="font-semibold text-gray-900 mb-2 flex items-center gap-1">
                    <Icon icon="mdi:account-heart" />
                    Personal Traits
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {PERSONAL_TRAITS.map((trait) => (
                      <button
                        key={trait}
                        type="button"
                        className={`btn btn-sm ${
                          selectedPersonalTraits.includes(trait)
                            ? 'btn-primary'
                            : 'btn-outline'
                        }`}
                        onClick={() =>
                          toggleSelection(trait, selectedPersonalTraits, setSelectedPersonalTraits)
                        }
                      >
                        {trait}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hobbies */}
                <div className="mb-6">
                  <h5 className="font-semibold text-gray-900 mb-2 flex items-center gap-1">
                    <Icon icon="mdi:palette" />
                    Hobbies & Interests
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {HOBBIES.map((hobby) => (
                      <button
                        key={hobby}
                        type="button"
                        className={`btn btn-sm ${
                          selectedHobbies.includes(hobby)
                            ? 'btn-primary'
                            : 'btn-outline'
                        }`}
                        onClick={() =>
                          toggleSelection(hobby, selectedHobbies, setSelectedHobbies)
                        }
                      >
                        {hobby}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lifestyle */}
                <div className="mb-6">
                  <h5 className="font-semibold text-gray-900 mb-2 flex items-center gap-1">
                    <Icon icon="mdi:home-heart" />
                    Lifestyle
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {LIFESTYLE.map((style) => (
                      <button
                        key={style}
                        type="button"
                        className={`btn btn-sm ${
                          selectedLifestyle.includes(style)
                            ? 'btn-primary'
                            : 'btn-outline'
                        }`}
                        onClick={() =>
                          toggleSelection(style, selectedLifestyle, setSelectedLifestyle)
                        }
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Roommate Preferences */}
                <div className="mb-6">
                  <h5 className="font-semibold text-gray-900 mb-2 flex items-center gap-1">
                    <Icon icon="mdi:account-group" />
                    What I'm Looking For in a Roommate
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {ROOMMATE_PREFS.map((pref) => (
                      <button
                        key={pref}
                        type="button"
                        className={`btn btn-sm ${
                          selectedRoommatePrefs.includes(pref)
                            ? 'btn-primary'
                            : 'btn-outline'
                        }`}
                        onClick={() =>
                          toggleSelection(pref, selectedRoommatePrefs, setSelectedRoommatePrefs)
                        }
                      >
                        {pref}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Additional Info */}
                <div className="mb-6">
                  <h5 className="font-semibold text-gray-900 mb-2 flex items-center gap-1">
                    <Icon icon="mdi:text-box" />
                    Additional Information (Optional)
                  </h5>
                  <textarea
                    className="textarea textarea-bordered w-full h-24 text-gray-900"
                    placeholder="Anything else you'd like to share? e.g., I'm looking for a place near campus, prefer living with someone quiet..."
                    value={additionalInfo}
                    onChange={(e) => setAdditionalInfo(e.target.value)}
                    maxLength={200}
                  />
                  <span className="text-xs text-gray-500">
                    {additionalInfo.length}/200 characters
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={handleClose}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary gap-2"
                    onClick={handleNextToToneSelection}
                  >
                    Next: Choose Tone
                    <Icon icon="mdi:arrow-right" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Tone Selection */}
            {currentStep === 2 && (
              <div>
                <h4 className="text-lg font-semibold mb-4">Choose Your Writing Style</h4>
                <p className="text-sm text-gray-600 mb-6">
                  Select the tone that best represents your personality
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  {/* Friendly Tone */}
                  <button
                    type="button"
                    className={`card border-2 p-6 cursor-pointer transition-all hover:shadow-lg ${
                      selectedTone === 'friendly'
                        ? 'border-primary bg-primary/10'
                        : 'border-base-300 hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedTone('friendly')}
                  >
                    <div className="text-center">
                      <Icon icon="mdi:hand-wave" className="text-5xl text-primary mx-auto mb-3" />
                      <h5 className="font-bold text-lg mb-2">Friendly & Open</h5>
                      <p className="text-sm text-gray-600">
                        Warm, welcoming, and approachable. Perfect for making connections.
                      </p>
                    </div>
                  </button>

                  {/* Humorous Tone */}
                  <button
                    type="button"
                    className={`card border-2 p-6 cursor-pointer transition-all hover:shadow-lg ${
                      selectedTone === 'humorous'
                        ? 'border-primary bg-primary/10'
                        : 'border-base-300 hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedTone('humorous')}
                  >
                    <div className="text-center">
                      <Icon icon="mdi:emoticon-happy" className="text-5xl text-secondary mx-auto mb-3" />
                      <h5 className="font-bold text-lg mb-2">Fun & Humorous</h5>
                      <p className="text-sm text-gray-600">
                        Light-hearted and playful. Show your fun personality!
                      </p>
                    </div>
                  </button>

                  {/* Straightforward Tone */}
                  <button
                    type="button"
                    className={`card border-2 p-6 cursor-pointer transition-all hover:shadow-lg ${
                      selectedTone === 'straightforward'
                        ? 'border-primary bg-primary/10'
                        : 'border-base-300 hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedTone('straightforward')}
                  >
                    <div className="text-center">
                      <Icon icon="mdi:bullseye-arrow" className="text-5xl text-accent mx-auto mb-3" />
                      <h5 className="font-bold text-lg mb-2">Direct & Disciplined</h5>
                      <p className="text-sm text-gray-600">
                        Straightforward and focused. Get straight to the point.
                      </p>
                    </div>
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between">
                  <button
                    type="button"
                    className="btn btn-ghost gap-2"
                    onClick={() => setCurrentStep(1)}
                  >
                    <Icon icon="mdi:arrow-left" />
                    Back
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary gap-2"
                    onClick={handleGenerateBio}
                  >
                    <Icon icon="mdi:creation" />
                    Generate Bio
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Results */}
            {currentStep === 3 && (
              <div>
                <h4 className="text-lg font-semibold mb-4">Your Generated Bio</h4>
                
                {generating ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <span className="loading loading-spinner loading-lg text-primary mb-4"></span>
                    <p className="text-gray-600">Creating your perfect bio...</p>
                  </div>
                ) : generatedBios.length > 0 ? (
                  <div>
                    <p className="text-sm text-gray-600 mb-6">
                      Review your bio and click "Use This Bio" if you like it, or regenerate with a different tone.
                    </p>

                    <div className="space-y-4">
                      {generatedBios.map((result, index) => (
                        <div key={index} className="card border-2 border-primary bg-base-100 p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="badge badge-primary capitalize">{result.tone} Tone</div>
                            <div className="text-xs text-gray-500">{result.length}/255 chars</div>
                          </div>
                          
                          <p className="text-gray-900 text-lg leading-relaxed mb-4">
                            "{result.bio}"
                          </p>
                          
                          <button
                            type="button"
                            className="btn btn-primary w-full gap-2"
                            onClick={() => handleUseBio(result.bio)}
                          >
                            <Icon icon="mdi:check-circle" />
                            Use This Bio
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Regenerate Button */}
                    <div className="flex justify-center mt-6">
                      <button
                        type="button"
                        className="btn btn-sm btn-ghost gap-2"
                        onClick={handleRegenerateBio}
                      >
                        <Icon icon="mdi:refresh" />
                        Try Different Tone
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
          
          <form method="dialog" className="modal-backdrop">
            <button type="button" onClick={handleClose}>close</button>
          </form>
        </dialog>
      )}
    </>
  );
}
