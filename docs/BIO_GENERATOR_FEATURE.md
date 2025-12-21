# AI Bio Generator Feature

## Overview
The AI Bio Generator helps users automatically create compelling bio (self-introduction) based on keywords they provide. This feature uses Gemini AI with a streamlined 3-step process to generate personalized, engaging bios.

## How It Works

### 1. API Route (`/app/api/generate-bio/route.ts`)
- Receives keywords from user including:
  - **personalTraits**: Personal characteristics (Friendly, Outgoing, etc.)
  - **hobbies**: Interests (Reading, Movies, etc.)
  - **lifestyle**: Living style (Early riser, Organized, etc.)
  - **roommatePreferences**: Roommate expectations (Easy to talk to, Respect privacy, etc.)
  - **additionalInfo**: Additional context (optional)
  - **tone**: Writing style (friendly, humorous, or straightforward)

- Calls Gemini AI API with tone-specific prompts
- Ensures bio stays within 255 characters (system requirement)
- Auto-shortens if bio exceeds limit

### 2. BioGenerator Component (`/app/profile/components/BioGenerator.tsx`)
A modal-based UI with 3-step wizard:

#### **Step 1: Data Collection - "A Few Things About You"**
- Quick keyword selection from pre-defined categories:
  - Personal Traits
  - Hobbies & Interests
  - Lifestyle
  - Roommate Preferences
- Optional open-ended textarea for additional information
- Validation: requires at least one keyword or additional info

#### **Step 2: Tone Selection - "Choose Your Writing Style"**
Three tone cards to choose from:
- **Friendly & Open**: Warm, welcoming, and approachable
- **Fun & Humorous**: Light-hearted and playful
- **Direct & Disciplined**: Straightforward and focused

#### **Step 3: Results - "Your Generated Bio"**
- Loading state with spinner during generation
- Display generated bio in a card with:
  - Tone badge
  - Character count
  - Full bio text
  - "Use This Bio" button
- Small "Try Different Tone" button at bottom to regenerate

### 3. Integration in Profile Page
- "AI Bio Assistant" button placed above the bio textarea
- Generated bio automatically fills the textarea
- User can edit after generation
- Character counter shows (x/255 characters)

## User Flow

1. Go to Profile Page (Step 2: Lifestyle & Habit)
2. Find "About Yourself" section
3. Click "AI Bio Assistant" button (with sparkles icon ✨)
4. **Step 1**: Select keywords describing yourself:
   - Personal traits: Friendly, Outgoing, Cheerful...
   - Hobbies: Reading, Movies, Travel...
   - Lifestyle: Early riser, Organized, Quiet...
   - Roommate preferences: Easy to talk to, Respect privacy...
   - (Optional) Add additional information
   - Click "Next: Choose Tone"
5. **Step 2**: Choose writing style:
   - Select one of three tone cards
   - Click "Generate Bio"
6. **Step 3**: Review result:
   - Wait 2-5 seconds for AI generation
   - Review the generated bio
   - Click "Use This Bio" to apply, or
   - Click "Try Different Tone" to regenerate with a different style

## Examples

### Input Keywords:
- Personal Traits: Friendly, Outgoing, Cheerful
- Hobbies: Reading, Movies, Travel
- Lifestyle: Early riser, Organized
- Preferences: Easy to talk to, Respect privacy

### Output Bios:

**Friendly Tone:**
"I'm a friendly, outgoing person who loves reading, movies, and travel. I'm an early riser who values organization. Looking for an easy-going roommate who respects personal space and enjoys good conversation!"

**Humorous Tone:**
"Early bird who's probably read every book and watched every movie (slight exaggeration!). Organized, cheerful, and promise not to talk your ear off... unless you're into that. Seeking chill roommate!"

**Straightforward Tone:**
"Organized early riser with interests in reading, movies, and travel. I'm friendly and outgoing but respect boundaries. Seeking responsible roommate who values clear communication and personal space."

## Technical Requirements

### Environment Variables
Requires `NEXT_PUBLIC_GEMINI_API_KEY` in `.env` file:
```
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

### Dependencies
- `@google/generative-ai`: Package for Gemini AI API calls
- `@iconify/react`: Icon library for UI elements

### API Configuration
- Model: `gemini-1.5-flash`
- Temperature: 0.8 (for creative variety)
- Max Output Tokens: 150
- Max Bio Length: 255 characters (enforced)

## Features

✅ **3-Step Wizard Flow**
- Intuitive step-by-step process
- Visual step indicator
- Back/Next navigation

✅ **Tone Selection**
- Three distinct writing styles
- Visual card-based selection
- Tone-specific AI prompts

✅ **Smart Generation**
- Context-aware bio creation
- Automatic length optimization
- First-person perspective

✅ **User-Friendly UI**
- Clean, modern interface with DaisyUI
- Loading states and error handling
- Responsive design
- Easy bio application

✅ **Validation**
- Requires minimum input
- Character limit enforcement
- Error messages

## Troubleshooting

### Error: "Failed to generate bio"
**Solutions:**
- Check if `NEXT_PUBLIC_GEMINI_API_KEY` exists in `.env`
- Verify API key is valid
- Check network connection
- Check browser console for detailed errors

### Bio too short or doesn't match tone
**Solutions:**
- Add more keywords in Step 1
- Include additional information in the optional textarea
- Try different tone in Step 2
- Regenerate multiple times to compare results

### Modal doesn't open
**Solutions:**
- Check browser console for errors
- Reload the page
- Ensure JavaScript is enabled

### Generation takes too long
**Solutions:**
- Check internet connection
- Gemini API might be experiencing high load
- Try again in a few moments

## Future Enhancements
- [ ] Generate multiple variations simultaneously
- [ ] Save bio generation history
- [ ] Support for multiple languages
- [ ] Bio templates for quick start
- [ ] Preview mode before applying
- [ ] Character personality analysis
- [ ] Save favorite bios

## Technical Notes

### API Rate Limits
- Gemini API has rate limits
- Consider implementing caching for repeated requests
- Add request throttling if needed

### Character Limit Strategy
1. Primary generation with strict 255-char limit in prompt
2. If too long, regenerate with shortening prompt
3. Hard truncate as last resort (252 chars + "...")

### Error Handling
- Client-side validation before API call
- Server-side error responses with details
- User-friendly error messages
- Console logging for debugging
