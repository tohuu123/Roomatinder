# 📡 Area Radar Feature

A powerful location intelligence feature that combines Mapbox mapping capabilities with Gemini AI analysis to help users understand the surroundings of rental properties.

## 🌟 Features

### Core Functionality
- **3km Radius Visualization**: Interactive map with a translucent circle showing a 3km radius around the property
- **POI Discovery**: Search and display Points of Interest (POIs) within the radius using Mapbox Search API
- **Interactive Filter Chips**: Quick filters for different categories (Healthcare, Convenience, Entertainment, Markets, Dining, Transport, Parks, Fitness)
- **POI Information Cards**: Detailed cards showing name, distance, address, and directions button when clicking on map pins

### Distance Calculator
- **School Distance**: Calculate distance and travel time to school/university
- **Multiple Transport Modes**: Support for walking, driving, and cycling routes
- **Real-time Route Calculation**: Uses Mapbox Directions API for accurate routing

### AI-Powered Analysis
- **Gemini Integration**: AI analyzes the area based on discovered POIs
- **Living Insights**: Provides analysis on:
  - Living convenience level (with rating 1-10)
  - Potential noise level assessment
  - Suitability for students vs working professionals
  - Overall area summary

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
   - The project already has `NEXT_PUBLIC_GEMINI_API_KEY` in `.env`

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
6. Use "Analyze Area" to get AI insights
7. Add school location to calculate travel time

## 📁 Project Structure

```
app/
├── components/
│   └── radar/
│       ├── RadarMap.tsx              # Main map component
│       ├── FilterChips.tsx           # Filter buttons UI
│       ├── POIInfoCard.tsx           # POI detail card
│       ├── GeminiAnalysisPanel.tsx   # AI analysis panel
│       └── SchoolDistancePanel.tsx   # School distance calculator
└── radar/
    └── page.tsx                      # Radar page

lib/
├── mapboxService.ts                  # Mapbox API integration
└── geminiRadarService.ts             # Gemini AI integration

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

### GeminiAnalysisPanel
- Right-side panel with AI insights
- Loading states with spinner
- Collapsible sections for different analysis aspects

### SchoolDistancePanel
- Bottom-right panel
- Editable school information
- Shows distance, duration, and transport mode

## 🔧 Configuration

### Default Filters

The app includes 8 default filter categories:
- 🏥 Healthcare (hospitals, clinics, pharmacies)
- 🏪 Convenience (stores, supermarkets, groceries)
- 🎬 Entertainment (cinemas, theaters)
- 🛒 Market (markets, shopping malls)
- 🍴 Dining (restaurants, cafes)
- 🚌 Transport (bus, train, subway stations)
- 🌳 Parks (parks, gardens, playgrounds)
- 💪 Fitness (gyms, fitness centers, sports facilities)

You can customize these in `RadarMap.tsx` by modifying the `DEFAULT_FILTERS` array.

### Map Settings

Default settings in `RadarMap.tsx`:
- **Center**: `[106.6297, 10.8231]` (Ho Chi Minh City)
- **Zoom**: 14
- **Radius**: 3km (3000 meters)
- **Style**: `mapbox://styles/mapbox/streets-v12`

## 📊 API Integration

### Mapbox Search API
```typescript
MapboxService.searchPOIs(longitude, latitude, category, radius)
```
- Returns POIs within specified radius
- Filters by category
- Includes distance calculation

### Mapbox Directions API
```typescript
MapboxService.getRoute(startLng, startLat, endLng, endLat, mode)
```
- Calculates route between two points
- Supports walking, driving, cycling
- Returns distance and duration

### Gemini AI Analysis
```typescript
GeminiRadarService.analyzeArea(pois)
```
- Analyzes list of POIs
- Returns structured insights
- Provides recommendations

## 🎯 Features in Detail

### POI Search
1. User clicks filter chip
2. App queries Mapbox Search API for each category
3. Results are deduplicated by coordinates
4. Pins are displayed on map within 3km radius

### Gemini Analysis Flow
1. User selects filters to discover POIs
2. Clicks "Analyze Area" button
3. App sends POI list to Gemini with structured prompt
4. Gemini returns JSON analysis
5. Results displayed in side panel with sections for:
   - Living convenience rating
   - Noise level assessment
   - Suitability recommendation
   - Overall summary

### Distance Calculation
1. User adds school location
2. App geocodes address (manual coordinates for now)
3. Mapbox Directions API calculates route
4. Shows distance, duration, and transport mode

## 🌐 Internationalization

The interface is in English as requested. All UI text, analysis results, and labels use English.

## 🔐 Environment Variables

Required in `.env`:
```env
# Mapbox (YOU NEED TO ADD YOUR TOKEN)
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here

# Gemini AI (Already configured)
NEXT_PUBLIC_GEMINI_API_KEY=AIzaSyCfRgoxcg1b-8D5l3Zx4_NPTMbq1qKR9po
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
