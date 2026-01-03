import { GoogleGenerativeAI } from '@google/generative-ai';
import { MapboxService } from './mapboxService';

// Use server-side API key (without NEXT_PUBLIC_ prefix for better security)
// But fallback to NEXT_PUBLIC_ version if available
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

if (!GEMINI_API_KEY) {
  console.warn('[GeminiLocationReview] Warning: GEMINI_API_KEY is not set');
} else {
  console.log('[GeminiLocationReview] API Key loaded:', GEMINI_API_KEY.substring(0, 10) + '...');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export interface LocationReviewInput {
  location_name: string;
  address: string;
  radius: string; // e.g., "1km", "3km"
  nearby_amenities: string[];
}

export interface LocationReviewOutput {
  summary: string;
  vibe_score: number;
  details: {
    amenities: string;
    environment: string;
    traffic: string;
    security: string;
  };
  highlight_tag: string[];
  warning: string;
}

export class GeminiLocationReviewService {
  /**
   * Fetch nearby POIs from Mapbox within a given radius
   */
  static async fetchNearbyPOIs(
    longitude: number,
    latitude: number,
    radiusKm: number
  ): Promise<string[]> {
    try {
      const radiusMeters = radiusKm * 1000;
      // Limit to most important categories to avoid rate limits
      const categories = [
        'shopping_mall',
        'restaurant',
        'cafe',
        'hospital',
        'school',
        'university',
        'park',
        'convenience'
      ];

      const allPOIs: string[] = [];

      // Fetch POIs with error handling for each category
      for (const category of categories) {
        try {
          const pois = await MapboxService.searchPOIs(longitude, latitude, category, radiusMeters);
          // Add POI names to the list
          pois.forEach(poi => {
            if (poi.name && !allPOIs.includes(poi.name)) {
              allPOIs.push(poi.name);
            }
          });
        } catch (error) {
          console.warn(`[GeminiLocationReview] Failed to fetch ${category}:`, error);
          // Continue with other categories
        }
      }

      console.log(`[GeminiLocationReview] Total POIs found: ${allPOIs.length}`);
      return allPOIs;
    } catch (error) {
      console.error('[GeminiLocationReview] Error in fetchNearbyPOIs:', error);
      // Return empty array instead of throwing to allow AI to still analyze
      return [];
    }
  }

  /**
   * Generate location review using Gemini AI
   */
  static async generateLocationReview(
    locationName: string,
    address: string,
    longitude: number,
    latitude: number,
    radiusKm: number = 1
  ): Promise<LocationReviewOutput> {
    try {
      console.log('[GeminiLocationReview] Generating review for:', locationName);

      if (!GEMINI_API_KEY) {
        throw new Error('Gemini API key is not configured. Please add NEXT_PUBLIC_GEMINI_API_KEY to your .env file');
      }

      // Fetch nearby POIs
      console.log('[GeminiLocationReview] Fetching nearby POIs...');
      const nearbyAmenities = await this.fetchNearbyPOIs(longitude, latitude, radiusKm);
      console.log('[GeminiLocationReview] Found', nearbyAmenities.length, 'POIs');

      // If no POIs found, add a note
      if (nearbyAmenities.length === 0) {
        console.warn('[GeminiLocationReview] No POIs found, AI will analyze based on location name and address only');
      }

      // Prepare input JSON
      const input: LocationReviewInput = {
        location_name: locationName,
        address: address,
        radius: `${radiusKm}km`,
        nearby_amenities: nearbyAmenities.slice(0, 50) // Limit to first 50 POIs
      };

      // System prompt
      const systemPrompt = `You are "Gemini Local Insider" – an AI assistant specializing in real estate and urban lifestyle, integrated into the "Roomatinder" application.

YOUR MISSION:
Based on the location selected by the user (Address/Name) and the list of surrounding places (Nearby POIs) within a provided radius, you must analyze and provide a candid, honest review of the living conditions in that area.

INPUT DATA:
You will receive a JSON object containing:
- "location_name": Name of the central location.
- "address": Specific address (Ward, District, City).
- "radius": Scan radius (e.g., 1km, 3km).
- "nearby_amenities": List of nearby places found via map service (Supermarket, University, Hospital, Mall, Cafe, Bar, etc.).

TONE & VOICE:
- Tone: Gen Z, youthful, straight-talking, "no-nonsense". Use natural, trendy language (e.g., "vibey", "bustling", "traffic nightmare", "wallet-friendly").
- Attitude: Objective. Praise what deserves praise, criticize what needs criticism. Act like a local friend who has lived there giving advice.
- Language: Output ALL content in ENGLISH.

ANALYSIS RULES (LOGIC):
1. Shopping Malls (Aeon, Vincom, Lotte...):
   - Pros: "All-in-one" convenience, great for shopping/AC, endless food options.
   - Cons: Traffic jams on weekends, surrounding rentals might be pricey.
2. Universities (University Village, Bach Khoa, NEU...):
   - Pros: "Foodie paradise", extremely cheap living costs, fun and lively.
   - Cons: Rentals can be old/run-down, potential security issues in cheap alleys, noise pollution.
3. Unknown/General Locations:
   - Infer the vibe based on the District/Street name in the address.
   - Example: District 1/3 (Central, expensive), Binh Thanh/Thu Duc (Prone to flooding/tides, traffic jams but fun), District 7 (Expats or flooding depending on the specific area).
4. Mandatory Criteria:
   - Amenities: Food, grocery, entertainment.
   - Environment: Noise level, flooding risks, air quality.
   - Traffic: Congestion during rush hour? One-way streets?
   - Security: Safe residential area or complicated nightlife zone?

OUTPUT FORMAT (JSON):
Return ONLY a single JSON Object. Do not include markdown formatting.
Structure:
{
  "summary": "A short, catchy slogan (max 15 words) summarizing the vibe of this area.",
  "vibe_score": An integer from 1 to 10 (representing livability),
  "details": {
    "amenities": "Review of amenities...",
    "environment": "Review of the environment...",
    "traffic": "Review of traffic conditions...",
    "security": "Review of security..."
  },
  "highlight_tag": ["#Tag1", "#Tag2", "#Tag3"],
  "warning": "The most important warning for the user (if any)."
}

EXAMPLE INPUT:
{
  "location_name": "Bach Khoa University HCMC",
  "address": "Ly Thuong Kiet, District 10, HCMC",
  "radius": "1km",
  "nearby_amenities": ["Canteen B4", "Com Tam Ba Ghien", "Circle K", "Truong Vuong Hospital", "Phu Tho Stadium"]
}

EXAMPLE OUTPUT:
{
  "summary": "Engineering student central hub with endless food options at super affordable prices.",
  "vibe_score": 8,
  "details": {
    "amenities": "Tons of cheap rice and noodle spots around Ly Thuong Kiet and To Hien Thanh gates. Student-friendly prices everywhere. Circle K is perfect for late-night study sessions.",
    "environment": "Bustling and lively. Heavy student vibe keeps it young and energetic, though a bit dusty at times.",
    "traffic": "Ly Thuong Kiet and To Hien Thanh streets are traffic jam central at any hour. Watch out for tricky U-turn spots.",
    "security": "Pretty solid since it's near the university and hospital, but lock your doors carefully if you're in a deep alley."
  },
  "highlight_tag": ["#FoodParadise", "#TrafficJam", "#CheapLiving"],
  "warning": "Rental rooms here tend to be quite old due to the age of buildings. Check the plumbing and walls carefully before signing."
}

BEGIN ANALYSIS:`;

      // Use Gemini 2.5 Flash Lite model
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash-lite',
        generationConfig: {
          temperature: 0.9,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      });

      const prompt = `${systemPrompt}\n\nInput:\n${JSON.stringify(input, null, 2)}\n\nPlease analyze and return JSON according to the format specified above. Remember to write ALL content in English.`;

      console.log('[GeminiLocationReview] Calling Gemini API with model: gemini-2.5-flash-lite');
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      console.log('[GeminiLocationReview] Raw response:', text);

      // Parse JSON from response
      let jsonText = text.trim();
      
      // Remove markdown code blocks if present
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/g, '');
      }

      const reviewData: LocationReviewOutput = JSON.parse(jsonText);

      console.log('[GeminiLocationReview] Successfully generated review');
      return reviewData;
    } catch (error) {
      console.error('[GeminiLocationReview] Error:', error);
      if (error instanceof Error) {
        console.error('[GeminiLocationReview] Error message:', error.message);
        console.error('[GeminiLocationReview] Error stack:', error.stack);
      }
      throw error;
    }
  }
}
