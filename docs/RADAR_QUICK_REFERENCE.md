# 🎯 Area Radar - Quick Reference Card

## ⚡ Quick Commands

```bash
# Install dependencies (already done)
npm install mapbox-gl @mapbox/mapbox-gl-geocoder

# Start development server
npm run dev

# Access the radar feature
http://localhost:3000/radar
```

## 🔑 Required Setup

```env
# .env file - ADD YOUR TOKEN HERE
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
# Gemini (recommended server-side)
GEMINI_API_KEY=your_gemini_api_key_here
# Fallback (works, but exposes key to client bundle)
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

Get Mapbox token: https://www.mapbox.com/

## 📂 Key Files

| File | Purpose |
|------|---------|
| `app/radar/page.tsx` | Main radar page |
| `app/components/radar/RadarMap.tsx` | Core map component |
| `lib/mapboxService.ts` | Mapbox API calls |
| `lib/geminiRadarService.ts` | AI analysis |
| `types/radar.ts` | TypeScript types |

## 🎨 UI Components

| Component | Location | Description |
|-----------|----------|-------------|
| FilterChips | Top center | Category filter buttons |
| POIInfoCard | Bottom center | POI details on click |
| AI Review Modal | Top right button | AI area review (opens modal) |
| SchoolDistancePanel | Bottom right | Distance to school (auto-search from profile) |

## 🔧 Customization

### Change Default Location
```typescript
// app/radar/page.tsx
const [center, setCenter] = useState<[number, number]>([
  YOUR_LONGITUDE,  // e.g., 106.6297
  YOUR_LATITUDE    // e.g., 10.8231
]);
```

### Change Radius
```typescript
// app/components/radar/RadarMap.tsx
// Radius is user-selectable via UI (1/2/3/5km)
const [radius, setRadius] = useState<number>(3);
```

### AI Review Radius
```typescript
// app/radar/page.tsx
// AI Review scans nearby POIs within 0.5/1/2/3km
const [radiusKm, setRadiusKm] = useState(1);
```

### Add Filter Category
```typescript
// app/components/radar/RadarMap.tsx - DEFAULT_FILTERS array
{ 
  id: 'library', 
  label: 'Library', 
  icon: '📚', 
  categories: ['library', 'book_store'], 
  active: false 
}
```

## 🎯 Filter Categories (current)

| Icon | Label | Mapbox Categories |
|------|-------|-------------------|
| 🌳 | Parks | park |
| 🏥 | Healthcare | hospital, clinic, pharmacy |
| 🛒 | Supermarket | supermarket |
| ⛽ | Gas Station | gas_station |
| 🎬 | Entertainment | theater, cinema |
| 🍽️ | Restaurant | restaurant, cafe, food |
| 🛍️ | Shopping | shopping_mall, shopping |
| 🏦 | Bank/ATM | bank, atm |

## 📊 API Calls

| Action | API | Limit |
|--------|-----|-------|
| Filter click | Mapbox Search Box (category) | Up to 25 results/category (then filtered by radius) |
| Search address/place | Mapbox Search Box (suggest/retrieve) | Suggest + retrieve flow |
| Get Directions | Google Maps | Opens external navigation |
| Calculate Route | Mapbox Directions | 1 request per calculation |
| AI Review | /api/location-review (Gemini) | 1 request per review (+ POI fetches server-side) |

## 🚀 Features

✅ Radius visualization (default 3km, selectable 1/2/3/5km)
✅ 8 filter categories
✅ Interactive map pins
✅ POI info cards
✅ AI Review (modal)
✅ School distance calculator (route uses driving-traffic)
✅ Responsive design
✅ Real-time search
✅ Distance calculation

## 📱 User Actions

1. **Explore POIs**: Click filter chips → See pins on map
2. **View Details**: Click pin → See info card
3. **Get Directions**: Click "Get Directions" → Opens Google Maps
4. **AI Review**: Click "AI Review" → Get area review in a modal
5. **School Distance**: Add school → Calculate route

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Map blank | Check Mapbox token in .env |
| No POIs | Click filter chips (should turn blue) |
| Analysis fails | Load POIs first, check Gemini key |
| Slow loading | Check internet, reduce active filters |

## 📚 Documentation

- [Full Documentation](./AREA_RADAR_FEATURE.md)
- [Setup Guide](./RADAR_QUICK_SETUP.md)
- [Implementation Summary](./RADAR_IMPLEMENTATION_SUMMARY.md)
- [Integration Examples](./RADAR_INTEGRATION_EXAMPLES.tsx)

## 🎓 Learning Resources

- [Mapbox GL JS Docs](https://docs.mapbox.com/mapbox-gl-js/)
- [Mapbox Search API](https://docs.mapbox.com/api/search/)
- [Gemini AI Docs](https://ai.google.dev/docs)
- [daisyUI Components](https://daisyui.com/components/)

## 💡 Pro Tips

1. **Multiple Filters**: Activate multiple categories for comprehensive view
2. **AI Review**: Use "AI Review" in the header for area insights
3. **Mobile Friendly**: Works great on phones and tablets
4. **Share Location**: Copy URL with coordinates to share specific locations
5. **Custom Radius**: Easily modify radius in RadarMap.tsx

## 🎉 Quick Demo Flow

```
1. Open http://localhost:3000/radar
2. Click "Healthcare" and "Dining" filters
3. Watch pins appear on map
4. Click a restaurant pin
5. Click "Get Directions"
6. Click "AI Review" in the header
7. Add school in bottom-right
8. Click "Calculate Route"
```

## ⚠️ Important Notes

- **Mapbox Token Required**: App won't work without valid token
- **API Limits**: Free tier has usage limits
- **Internet Required**: No offline mode
- **Browser Support**: Modern browsers only (Chrome, Firefox, Safari, Edge)

## 📞 Need Help?

Check these in order:
1. Browser console for errors
2. Network tab for failed requests
3. Verify .env variables
4. Restart dev server
5. Clear browser cache

---

**Status**: ✅ Ready to Use
**Version**: 1.0.0
**Updated**: December 30, 2025
