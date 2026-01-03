# 🚀 Quick Setup Guide - Area Radar Feature

## Step 1: Get Mapbox Access Token

1. Go to [https://www.mapbox.com/](https://www.mapbox.com/)
2. Sign up for a free account (or log in)
3. Navigate to your [Account Dashboard](https://account.mapbox.com/)
4. Find your "Default public token" or create a new token
5. Copy the token

## Step 2: Update Environment Variables

Open `.env` file and replace `your_mapbox_token_here` with your actual token:

```env
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImNscXh5ejEyMzB4eHkyam81NnM0Ym5vZGwifQ.example_token_here

# Gemini (recommended server-side)
GEMINI_API_KEY=your_gemini_api_key_here
# Fallback (works, but exposes key to client bundle)
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

**Important**: Make sure your Mapbox token has access to:
- ✅ Maps API
- ✅ Search API
- ✅ Directions API

## Step 3: Run the Application

```bash
npm run dev
```

## Step 4: Access the Radar Feature

Open your browser and navigate to:
```
http://localhost:3000/radar
```

## 🎯 First Time Usage

1. **Change Location** (optional)
   - Click "Change Location" in the top-right
   - Quick select a district (HCMC)
   - Or search by address/place (Mapbox Search Box suggest/retrieve)
   - Or manually enter longitude/latitude

2. **Explore Nearby Places**
   - Click on any filter chip (Healthcare, Convenience, etc.)
   - Wait for pins to appear on the map
   - Click on pins to see details

3. **Adjust Radar Radius (POI search radius)**
   - Use the Radius buttons (1km / 2km / 3km / 5km)
   - Changing radius clears existing filters and POIs

4. **Get AI Review**
   - Click "AI Review" in the header
   - Choose the AI review radius (500m / 1km / 2km / 3km)
   - Wait for the modal to show the review

5. **Calculate School Distance**
   - The app can auto-search your university from profile (if available)
   - Or click "Add School" and search by school name
   - Click "Calculate Route" to see distance and time

## ✅ Verification Checklist

- [ ] Mapbox token added to `.env`
- [ ] Application running on `http://localhost:3000`
- [ ] Map loads correctly on `/radar` page
- [ ] Filter chips are visible at the top
- [ ] Clicking filters shows POI pins on map
- [ ] AI Analysis panel appears on the right
- [ ] School Distance panel appears at bottom-right

## 🐛 Common Issues

### Map is blank or not loading
**Solution**: Check your Mapbox token in `.env` and restart the dev server

### POIs not appearing
**Solution**: 
- Make sure you clicked on a filter chip (it should turn blue)
- Check browser console for API errors
- Verify your Mapbox token has Search API access

### "Unable to analyze" message
**Solution**: 
- Check if Gemini API key is valid in `.env` (prefer `GEMINI_API_KEY`)
- Check server logs for `/api/location-review` errors
- Ensure Mapbox token is valid (AI Review fetches nearby POIs server-side)

## 📱 Mobile Testing

The radar feature is fully responsive. Test on mobile by:
```bash
# Find your local IP
ipconfig

# Access from mobile
http://YOUR_LOCAL_IP:3000/radar
```

## 🎨 Customization

### Change Default Location

Edit `app/radar/page.tsx`:
```typescript
const [center, setCenter] = useState<[number, number]>([
  YOUR_LONGITUDE,  // e.g., 106.6297
  YOUR_LATITUDE    // e.g., 10.8231
]);
```

### Change Radius

Edit `app/components/radar/RadarMap.tsx`:
```typescript
const radiusInKm = 3; // Change to 1, 2, 5, etc.
```

### Add More Filter Categories

Edit `app/components/radar/RadarMap.tsx`:
```typescript
const DEFAULT_FILTERS: RadarFilter[] = [
  // ... existing filters
  { 
    id: 'library', 
    label: 'Library', 
    icon: '📚', 
    categories: ['library'], 
    active: false 
  },
];
```

## 📊 API Usage Limits

**Mapbox Free Tier:**
- 50,000 Search API requests/month
- 100,000 Directions API requests/month
- 200,000 map views/month

**Gemini Free Tier:**
- 60 requests per minute
- 1500 requests per day

## 🎓 Learning Resources

- [Mapbox GL JS Tutorial](https://docs.mapbox.com/help/tutorials/get-started-mapbox-gl-js/)
- [Mapbox Search API Guide](https://docs.mapbox.com/api/search/search-box/)
- [Gemini API Quickstart](https://ai.google.dev/tutorials/get_started_web)

## 📞 Support

If you encounter issues:
1. Check the [troubleshooting section](./AREA_RADAR_FEATURE.md#troubleshooting)
2. Review browser console for errors
3. Verify all environment variables are set correctly

---

**Ready to go!** 🎉 Navigate to `/radar` and start exploring!
