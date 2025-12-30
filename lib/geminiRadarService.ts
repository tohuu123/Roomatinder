import { GoogleGenerativeAI } from '@google/generative-ai';
import { POI, GeminiAreaAnalysis } from '@/types/radar';

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

if (!GEMINI_API_KEY) {
  console.warn('[GeminiRadar] Warning: NEXT_PUBLIC_GEMINI_API_KEY is not set');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export class GeminiRadarService {
  /**
   * Analyze area based on nearby POIs
   */
  static async analyzeArea(pois: POI[]): Promise<GeminiAreaAnalysis> {
    try {
      console.log('[GeminiRadar] Starting analysis with', pois.length, 'POIs');
      
      if (!GEMINI_API_KEY) {
        throw new Error('Gemini API key is not configured. Please add NEXT_PUBLIC_GEMINI_API_KEY to your .env file');
      }
      
      // Use Gemini 2.5 Flash Lite - latest model
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

      // Group POIs by category
      const categoryCounts: Record<string, number> = {};
      const categoryExamples: Record<string, string[]> = {};

      pois.forEach(poi => {
        categoryCounts[poi.category] = (categoryCounts[poi.category] || 0) + 1;
        if (!categoryExamples[poi.category]) {
          categoryExamples[poi.category] = [];
        }
        if (categoryExamples[poi.category].length < 3) {
          categoryExamples[poi.category].push(poi.name);
        }
      });

      const poiSummary = Object.entries(categoryCounts)
        .map(([category, count]) => {
          const examples = categoryExamples[category].join(', ');
          return `${category}: ${count} locations (e.g., ${examples})`;
        })
        .join('\n');

      console.log('[GeminiRadar] POI Summary:', poiSummary);

      const prompt = `Based on the following list of places around a rental property, please provide an analysis in English:

POI Summary (within 3km radius):
${poiSummary}

Please analyze and provide:
1. Living Convenience Level: Rate how convenient daily life would be (1-10) and explain why
2. Potential Noise Level: Assess potential noise (Low/Medium/High) based on nearby establishments
3. Suitable For: Determine if this area is more suitable for Students or Working Professionals, and explain why
4. Overall Summary: Provide a brief 2-3 sentence summary of living in this area

Format your response as JSON with these keys: convenience, noiseLevel, suitableFor, summary`;

      console.log('[GeminiRadar] Sending request to Gemini...');
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      console.log('[GeminiRadar] Response received:', text.substring(0, 200));

      // Try to parse JSON response
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          console.log('[GeminiRadar] Successfully parsed JSON');
          return {
            convenience: parsed.convenience || 'Analysis not available',
            noiseLevel: parsed.noiseLevel || 'Unknown',
            suitableFor: parsed.suitableFor || 'Both students and professionals',
            summary: parsed.summary || 'No summary available'
          };
        }
      } catch (parseError) {
        console.error('[GeminiRadar] Error parsing JSON:', parseError);
      }

      // Fallback: parse from text
      console.log('[GeminiRadar] Using text fallback parser');
      return this.parseTextResponse(text);
    } catch (error) {
      console.error('[GeminiRadar] Error analyzing area:', error);
      return {
        convenience: 'Unable to analyze at this time',
        noiseLevel: 'Unknown',
        suitableFor: 'N/A',
        summary: 'Analysis service is temporarily unavailable. Please try again later.'
      };
    }
  }

  /**
   * Parse text response when JSON parsing fails
   */
  private static parseTextResponse(text: string): GeminiAreaAnalysis {
    const lines = text.split('\n').filter(line => line.trim());
    
    return {
      convenience: lines.find(l => l.toLowerCase().includes('convenience'))?.trim() || 
                   'Moderate convenience based on available amenities',
      noiseLevel: lines.find(l => l.toLowerCase().includes('noise'))?.trim() || 
                  'Medium',
      suitableFor: lines.find(l => l.toLowerCase().includes('suitable'))?.trim() || 
                   'Both students and professionals',
      summary: lines.slice(-3).join(' ') || 
               'This area offers a balanced living environment with access to various amenities.'
    };
  }

  /**
   * Get a quick assessment without full analysis
   */
  static getQuickAssessment(pois: POI[]): string {
    const categories = new Set(pois.map(p => p.category));
    const count = pois.length;

    if (count === 0) {
      return 'Limited amenities in the immediate area';
    }

    if (count < 5) {
      return `Quiet area with ${count} nearby amenities`;
    }

    if (count < 15) {
      return `Moderate convenience with ${count} places nearby covering ${categories.size} categories`;
    }

    return `Highly convenient area with ${count} places nearby across ${categories.size} different categories`;
  }
}
