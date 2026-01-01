import { GoogleGenerativeAI } from '@google/generative-ai';
import { POI, GeminiAreaAnalysis } from '@/types/radar';

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

if (!GEMINI_API_KEY) {
  console.warn('[GeminiRadar] Warning: NEXT_PUBLIC_GEMINI_API_KEY is not set');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export class GeminiRadarService {
  /**
   * Analyze a specific location by name and address
   */
  static async analyzeSpecificLocation(locationName: string, address: string): Promise<GeminiAreaAnalysis> {
    try {
      console.log('[GeminiRadar] Analyzing specific location:', locationName);
      
      if (!GEMINI_API_KEY) {
        throw new Error('Gemini API key is not configured. Please add NEXT_PUBLIC_GEMINI_API_KEY to your .env file');
      }
      
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

      const prompt = `Bạn là "Gemini Thổ Địa" - một trợ lý AI chuyên sâu về bất động sản và đời sống đô thị tích hợp trong ứng dụng tìm trọ "Roomatinder".

NHIỆM VỤ CỦA BẠN:
Người dùng đã chọn một địa điểm cụ thể. Bạn phải phân tích xem việc thuê trọ GẦN địa điểm đó (bán kính < 1km) sẽ như thế nào đối với một sinh viên/người mới đi làm.

Địa điểm: ${locationName}
Địa chỉ: ${address}

NGUYÊN TẮC PHÂN TÍCH:
1. Tiện ích (Convenience): Gần đó có dễ đi chợ, mua sắm, ăn uống giá rẻ không?
2. Môi trường (Vibe & Noise): Khu vực này yên tĩnh để học bài hay ồn ào, xô bồ?
3. Giao thông (Traffic): Có hay kẹt xe, ngập nước không?
4. An ninh (Safety): Đánh giá sơ bộ dựa trên loại hình địa điểm.

ĐỊNH DẠNG OUTPUT (Bắt buộc trả về JSON):
{
  "summary": "Một câu slogan ngắn gọn, bắt trend mô tả khu này (tối đa 15 từ).",
  "score": Đánh giá thang điểm 10 về độ đáng sống (Number),
  "pros": ["Điểm cộng 1", "Điểm cộng 2", "Điểm cộng 3"],
  "cons": ["Điểm trừ 1", "Điểm trừ 2"],
  "tags": ["Tag1", "Tag2", "Tag3"],
  "recommendation": "Lời khuyên chân thành: Có nên thuê ở đây không và phù hợp với ai?"
}

LƯU Ý QUAN TRỌNG:
- Tone giọng: Trẻ trung, khách quan, thẳng thắn (giống review của Gen Z), dùng tiếng Việt tự nhiên.
- Nếu địa điểm là TTTM (như Aeon, Vincom): Nhấn mạnh tiện lợi nhưng cảnh báo kẹt xe/ồn ào.
- Nếu địa điểm là Trường ĐH: Nhấn mạnh giá rẻ, nhiều đồ ăn nhưng phòng trọ có thể cũ.
- Nếu địa điểm lạ hoặc không rõ: Hãy đưa ra nhận định chung dựa trên tên đường/quận (nếu có).`;

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
            summary: parsed.summary || 'Chưa có phân tích',
            score: parsed.score || 5,
            pros: parsed.pros || [],
            cons: parsed.cons || [],
            tags: parsed.tags || [],
            recommendation: parsed.recommendation || 'Chưa có đề xuất'
          };
        }
      } catch (parseError) {
        console.error('[GeminiRadar] Error parsing JSON:', parseError);
      }

      return this.parseTextResponse(text);
    } catch (error) {
      console.error('[GeminiRadar] Error analyzing location:', error);
      return {
        summary: 'Không thể phân tích lúc này',
        score: 5,
        pros: [],
        cons: [],
        tags: [],
        recommendation: 'Dịch vụ phân tích tạm thời không khả dụng. Vui lòng thử lại sau.'
      };
    }
  }

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

      const prompt = `Bạn là "Gemini Thổ Địa" - một trợ lý AI chuyên sâu về bất động sản và đời sống đô thị tích hợp trong ứng dụng tìm trọ "Roomatinder".

NHIỆM VỤ CỦA BẠN:
Người dùng sẽ gửi cho bạn danh sách các địa điểm (POI) trong bán kính 3km. Bạn phải phân tích xem việc thuê trọ GẦN khu vực này (bán kính < 3km) sẽ như thế nào đối với một sinh viên/người mới đi làm.

Danh sách địa điểm:
${poiSummary}

NGUYÊN TẮC PHÂN TÍCH:
1. Tiện ích (Convenience): Gần đó có dễ đi chợ, mua sắm, ăn uống giá rẻ không?
2. Môi trường (Vibe & Noise): Khu vực này yên tĩnh để học bài hay ồn ào, xô bồ?
3. Giao thông (Traffic): Có hay kẹt xe, ngập nước không?
4. An ninh (Safety): Đánh giá sơ bộ dựa trên loại hình địa điểm.

ĐỊNH DẠNG OUTPUT (Bắt buộc trả về JSON):
{
  "summary": "Một câu slogan ngắn gọn, bắt trend mô tả khu này (tối đa 15 từ).",
  "score": Đánh giá thang điểm 10 về độ đáng sống (Number),
  "pros": ["Điểm cộng 1", "Điểm cộng 2", "Điểm cộng 3"],
  "cons": ["Điểm trừ 1", "Điểm trừ 2"],
  "tags": ["Tag1", "Tag2", "Tag3"],
  "recommendation": "Lời khuyên chân thành: Có nên thuê ở đây không và phù hợp với ai?"
}

LƯU Ý QUAN TRỌNG:
- Tone giọng: Trẻ trung, khách quan, thẳng thắn (giống review của Gen Z), dùng tiếng Việt tự nhiên.
- Nếu địa điểm là TTTM (như Aeon, Vincom): Nhấn mạnh tiện lợi nhưng cảnh báo kẹt xe/ồn ào.
- Nếu địa điểm là Trường ĐH: Nhấn mạnh giá rẻ, nhiều đồ ăn nhưng phòng trọ có thể cũ.
- Nếu địa điểm lạ hoặc không rõ: Hãy đưa ra nhận định chung dựa trên tên đường/quận (nếu có).`;

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
            summary: parsed.summary || 'Chưa có phân tích',
            score: parsed.score || 5,
            pros: parsed.pros || [],
            cons: parsed.cons || [],
            tags: parsed.tags || [],
            recommendation: parsed.recommendation || 'Chưa có đề xuất'
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
        summary: 'Không thể phân tích lúc này',
        score: 5,
        pros: [],
        cons: [],
        tags: [],
        recommendation: 'Dịch vụ phân tích tạm thời không khả dụng. Vui lòng thử lại sau.'
      };
    }
  }

  /**
   * Parse text response when JSON parsing fails
   */
  private static parseTextResponse(text: string): GeminiAreaAnalysis {
    const lines = text.split('\n').filter(line => line.trim());
    
    return {
      summary: 'Khu vực có tiện ích đa dạng',
      score: 7,
      pros: ['Có nhiều tiện ích xung quanh', 'Dễ dàng đi lại'],
      cons: ['Cần thêm thông tin để đánh giá chính xác'],
      tags: ['#ĐaTiện', '#TiềmNăng'],
      recommendation: 'Nên tham khảo thêm thông tin về khu vực trước khi quyết định thuê.'
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
