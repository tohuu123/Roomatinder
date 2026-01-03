# 📡 Area Radar Feature

A powerful location intelligence feature that combines Mapbox mapping capabilities with Gemini AI analysis to help users understand the surroundings of rental properties.

## 🌟 Features

### Core Functionality
- **Radius Visualization**: Interactive map with a translucent circle around the property (default 3km; selectable 1/2/3/5km)
- **POI Discovery**: Search and display Points of Interest (POIs) within the radius using Mapbox Search API
- **Interactive Filter Chips**: Quick filters mapped to Mapbox Search Box canonical categories
- **POI Information Cards**: Detailed cards showing name, distance, address, and directions button when clicking on map pins

### Distance Calculator
- **School Distance**: Calculate distance and travel time to school/university
- **Auto-search from Profile**: If the user profile includes a university name, the app attempts to find it automatically
- **Real-time Route Calculation**: Uses Mapbox Directions API for routing (current UI uses `driving-traffic`)

### AI-Powered Analysis
- **AI Review (Gemini)**: Server-side endpoint `/api/location-review` fetches nearby POIs + asks Gemini to generate an area review
- **Review Output** (modal): summary slogan, vibe score (1–10), details (amenities/environment/traffic/security), highlight tags, and a warning (if any)

## 🚀 Getting Started

### Prerequisites

1. **Mapbox Access Token**
   - Sign up at [Mapbox](https://www.mapbox.com/)
   - Get your access token from the dashboard
   - Add to `.env`:
     ```env
     NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
     ```

2. **Gemini API Key** (Already configured)
   - Recommended: set `GEMINI_API_KEY` in `.env` (server-side)
   - Fallback: `NEXT_PUBLIC_GEMINI_API_KEY` also works but exposes key to the client bundle

### Installation

Dependencies are already installed:
- `mapbox-gl`: Mapbox GL JS library for interactive maps
- `@mapbox/mapbox-gl-geocoder`: Geocoding functionality

### Usage

1. Navigate to `/radar` route in your application
2. The map will load with the default location (Ho Chi Minh City)
3. Use the "Change Location" button to set a custom property location
4. Click on filter chips to discover nearby amenities
5. Click on map pins to view POI details
6. Use "AI Review" (header button) to get an AI review in a modal
7. Add school location to calculate travel time

## 📁 Project Structure

```
app/
├── components/
│   └── radar/
│       ├── RadarMap.tsx              # Main map component
│       ├── FilterChips.tsx           # Filter buttons UI
│       ├── POIInfoCard.tsx           # POI detail card
│       ├── LocationReviewModal.tsx   # AI review modal
│       └── SchoolDistancePanel.tsx   # School distance calculator
└── radar/
    └── page.tsx                      # Radar page

lib/
├── mapboxService.ts                  # Mapbox API integration
└── geminiLocationReviewService.ts    # Gemini AI (server-side) location review

types/
└── radar.ts                          # TypeScript type definitions
```

## 🎨 UI Components

All components follow daisyUI design patterns:

### FilterChips
- Horizontal scrollable chip buttons
- Active/inactive states with color coding
- Floating above the map

### POIInfoCard
- Compact card at bottom of screen
- Shows POI name, category, address, and distance
- "Get Directions" button opens Google Maps

### AI Review (Header button + Modal)
- "AI Review" button in the header triggers a server-side review
- Modal displays: score, tags, category breakdown, and warning

### SchoolDistancePanel
- Bottom-right panel
- School lookup by name using Mapbox Search Box suggest/retrieve
- Shows distance and duration (route calculated via Mapbox Directions)

## 🔧 Configuration

### Default Filters

The app includes these default filter categories (current):
- 🌳 Parks (park)
- 🏥 Healthcare (hospital, clinic, pharmacy)
- 🛒 Supermarket (supermarket)
- ⛽ Gas Station (gas_station)
- 🎬 Entertainment (theater, cinema)
- 🍽️ Restaurant (restaurant, cafe, food)
- 🛍️ Shopping (shopping_mall, shopping)
- 🏦 Bank/ATM (bank, atm)

You can customize these in `RadarMap.tsx` by modifying the `DEFAULT_FILTERS` array.

### Map Settings

Default settings in `RadarMap.tsx`:
- **Center**: `[106.6297, 10.8231]` (Ho Chi Minh City)
- **Zoom**: 14
- **Radius**: Default 3km, selectable 1/2/3/5km
- **Style**: `mapbox://styles/mapbox/streets-v12`

## 📊 API Integration

### Mapbox Search API
```typescript
MapboxService.searchPOIs(longitude, latitude, category, radius)
```
- Returns POIs within specified radius
- Filters by category
- Includes distance calculation

Notes:
- Uses Mapbox Search Box **category endpoint**.
- Current implementation applies a Ho Chi Minh City bounding box and then filters results by radius.

### Mapbox Directions API
```typescript
MapboxService.getRoute(startLng, startLat, endLng, endLat, mode)
```
- Calculates route between two points
- Supports walking, driving, cycling
- Returns distance and duration

### AI Review Endpoint (server)
```typescript
POST /api/location-review
```
- Input: locationName, address, longitude, latitude, radius (km)
- Server: fetches nearby POIs, calls Gemini, returns structured JSON for the modal

## 🎯 Features in Detail

### POI Search
1. User clicks filter chip
2. App queries Mapbox Search Box category API for each category
3. Results are deduplicated by coordinates
4. Pins are displayed on map within selected radius (1/2/3/5km)

### AI Review Flow
1. User sets a location (district / address search / coordinates)
2. Clicks "AI Review" in the header
3. Frontend calls `POST /api/location-review` with location + selected radius
4. Server fetches nearby POIs via Mapbox
5. Server calls Gemini and returns structured JSON
6. Frontend displays results in a modal

### Distance Calculation (School)
1. User adds school location
2. App searches school by name (Mapbox Search Box suggest/retrieve)
3. Mapbox Directions API calculates route
4. Shows distance, duration, and transport mode

## 🌐 Internationalization

The interface is in English as requested. All UI text, analysis results, and labels use English.

## 🔐 Environment Variables

Required in `.env`:
```env
# Mapbox (YOU NEED TO ADD YOUR TOKEN)
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here

# Gemini AI (recommended server-side)
GEMINI_API_KEY=your_gemini_api_key_here
# Fallback (works, but exposes key to client bundle)
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

## 🐛 Troubleshooting

### Map Not Loading
- Check if Mapbox token is correctly set in `.env`
- Verify the token has access to required APIs
- Check browser console for errors

### POIs Not Appearing
- Ensure filters are active (blue colored chips)
- Check if location is valid
- Verify Mapbox Search API quota

### Gemini Analysis Fails
- Check API key is valid
- Ensure POIs are loaded first
- Check network connection
- Review browser console for errors

## 📝 TODO / Future Enhancements

- [ ] Add geocoding for school address input
- [ ] Save favorite locations
- [ ] Export analysis as PDF
- [ ] Multi-language support
- [ ] Custom radius selection
- [ ] Compare multiple locations
- [ ] Integration with property listings
- [ ] Save and share radar views

## 🔗 Related Documentation

- [Mapbox GL JS Documentation](https://docs.mapbox.com/mapbox-gl-js/)
- [Mapbox Search API](https://docs.mapbox.com/api/search/)
- [Mapbox Directions API](https://docs.mapbox.com/api/navigation/)
- [Gemini API Documentation](https://ai.google.dev/docs)

## 💡 Tips

1. **Performance**: The app limits POI searches to 20 results per category
2. **Accuracy**: Distance calculations use Haversine formula for accuracy
3. **Mobile**: The interface is responsive and works on mobile devices
4. **Accessibility**: All interactive elements have proper ARIA labels

## 🙏 Credits

- Maps powered by [Mapbox](https://www.mapbox.com/)
- AI analysis by [Google Gemini](https://ai.google.dev/)
- UI components by [daisyUI](https://daisyui.com/)

---

**Note**: Don't forget to add your Mapbox access token to `.env` before using this feature!
