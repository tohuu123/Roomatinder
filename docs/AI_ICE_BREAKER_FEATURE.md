# AI Ice Breaker Feature

## Overview
The AI Ice Breaker feature helps users start conversations after matching by generating personalized conversation starters using Google's Gemini AI.

## Features

### 1. **Match Notification with Ice Breakers**
When two users match, a modal appears with:
- Match celebration animation
- 3 AI-generated conversation starters
- Option to write a custom message
- Quick actions to view profile or start chatting

### 2. **Empty Chat Widget**
When opening a chat with no messages:
- Displays a beautiful horizontal scrollable card interface
- Shows 3 ice breaker suggestions with reasons
- Allows regenerating new suggestions
- One-click to send and start conversation

### 3. **Smart Message Input Button**
A robot icon button next to the send button that:
- Opens a dropdown with AI suggestions
- Works anytime during conversation (not just at start)
- Helps when conversation runs dry
- Fills the input field with selected suggestion

## AI Strategy

The AI uses three different strategies to generate opening messages:

1. **Common Interest Strategy**: Finds shared interests, hobbies, or background
2. **Lifestyle Match Strategy**: Based on compatible living habits (sleep schedule, cleanliness, etc.)
3. **Curiosity Strategy**: Creates interesting questions based on unique profile details

## Technical Implementation

### API Route
`/app/api/ice-breaker/route.ts`
- POST endpoint that accepts two user profiles
- Uses Gemini 2.5 Flash Lite model
- Returns 3 suggestions with reasons

### Components

1. **IceBreakerCard** (`/app/chatroom/components/IceBreakerCard.tsx`)
   - Displays a single suggestion as a card
   - Shows icon, type, reason, and message
   - Click to send functionality

2. **IceBreakerWidget** (`/app/chatroom/components/IceBreakerWidget.tsx`)
   - Main widget for empty chat screen
   - Horizontal scrollable cards
   - Refresh button for new suggestions

3. **IceBreakerButton** (`/app/chatroom/components/IceBreakerButton.tsx`)
   - Compact button for message input area
   - Dropdown interface for suggestions
   - Fills input field on selection

4. **MatchNotificationModal** (`/app/components/MatchNotificationModal.tsx`)
   - Modal shown on new match
   - Includes ice breaker suggestions
   - Handles chat creation with initial message

### Services

- **Ice Breaker Service** (`/lib/iceBreakerService.ts`)
  - Helper functions for chat creation
  - Sends initial ice breaker message

### Types

- **Ice Breaker Types** (`/types/icebreaker.ts`)
  - TypeScript interfaces for suggestions
  - Request/response types

## Usage

### In Chatroom

The ice breaker features are automatically integrated into the chat interface:

```tsx
// Empty chat shows ice breaker widget automatically
// Message input includes AI suggestion button automatically
```

### With Match Notifications

```tsx
import MatchNotificationModal from '@/app/components/MatchNotificationModal';
import { createChatWithIceBreaker } from '@/lib/iceBreakerService';

// Show modal on match
<MatchNotificationModal
  matchedUser={matchedUser}
  currentUserProfile={currentUserProfile}
  matchedUserProfile={matchedUserProfile}
  onClose={() => setShowModal(false)}
  onChatNow={async (message) => {
    const chatId = await createChatWithIceBreaker({
      currentUserId: currentUser.uid,
      currentUserName: currentUserProfile.displayName,
      currentUserAvatar: currentUserProfile.photoURL,
      partnerId: matchedUser.userId,
      initialMessage: message,
    });
    router.push(`/chatroom?chatId=${chatId}`);
  }}
/>
```

## Configuration

The AI uses the following configuration:
- **Model**: gemini-2.5-flash-lite
- **Temperature**: 0.9 (creative responses)
- **Max Tokens**: 500
- **Language**: English
- **Tone**: Casual, friendly, Gen Z style

## Customization

### Changing AI Behavior

Edit the system prompt in `/app/api/ice-breaker/route.ts`:

```typescript
const systemPrompt = `You are an intelligent AI matchmaker assistant...`;
```

### Styling

The components use daisyUI classes. Customize colors and styles:

```tsx
// In IceBreakerCard.tsx
const getColorByType = (type: string) => {
  switch (type) {
    case 'common': return 'border-primary bg-primary/5';
    case 'lifestyle': return 'border-secondary bg-secondary/5';
    case 'curiosity': return 'border-accent bg-accent/5';
  }
};
```

## Error Handling

The feature gracefully handles errors:
- Falls back to "No messages yet" if profiles unavailable
- Shows retry button if API fails
- Continues to work even if AI suggestions fail

## Performance

- Suggestions are generated on-demand
- Results are cached in component state
- Can regenerate new suggestions without page reload
- Fast response time with flash-lite model

## Future Enhancements

Potential improvements:
- Cache suggestions in localStorage
- Multi-language support
- More AI strategies
- User feedback on suggestions
- A/B testing different prompts
- Integration with user preferences
