import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

interface IceBreakerRequest {
  meProfile: any;
  partnerProfile: any;
}

interface IceBreakerSuggestion {
  type: 'common' | 'lifestyle' | 'curiosity';
  text: string;
  reason?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { meProfile, partnerProfile }: IceBreakerRequest = await request.json();

    if (!meProfile || !partnerProfile) {
      return NextResponse.json(
        { error: 'Both user profiles are required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      console.error('NEXT_PUBLIC_GEMINI_API_KEY is not set');
      return NextResponse.json(
        { error: 'API configuration error' },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 500,
      },
    });

    const systemPrompt = `You are an intelligent AI matchmaker assistant for a roommate-finding app.
Task: Create 3 short opening lines (under 20 words each), natural, and friendly for "me" to send to "partner".

Requirements:
1. Analyze the JSON data of both people to find common points (Intersection) or complementary points.
2. Output 1: Based on common interests or background (if any).
3. Output 2: Based on lifestyle habits (related to living together - sleep schedule, cleanliness, guests, etc).
4. Output 3: An interesting open-ended question based on partner's unique interests or bio.
5. Tone: Young, casual, friendly Gen Z style. Can use light casual language, emojis. Not cheesy, not too formal.
6. Keep it natural and conversational - like how real students would chat.

Return ONLY valid JSON array format (no markdown, no code blocks):
[
  {"type": "common", "text": "...", "reason": "..."},
  {"type": "lifestyle", "text": "...", "reason": "..."},
  {"type": "curiosity", "text": "...", "reason": "..."}
]

The "reason" field should be a brief explanation (5-10 words) of why this opener works.`;

    const userPrompt = `Generate ice breaker messages for this match:

ME Profile:
${JSON.stringify(meProfile, null, 2)}

PARTNER Profile:
${JSON.stringify(partnerProfile, null, 2)}

Generate 3 opening messages that will help "me" start a conversation with "partner".`;

    const result = await model.generateContent(systemPrompt + '\n\n' + userPrompt);
    const response = await result.response;
    let text = response.text().trim();

    // Clean up the response - remove markdown code blocks if present
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Parse the JSON response
    const suggestions: IceBreakerSuggestion[] = JSON.parse(text);

    // Validate the response structure
    if (!Array.isArray(suggestions) || suggestions.length !== 3) {
      console.error('Invalid response structure:', suggestions);
      return NextResponse.json(
        { error: 'Invalid AI response format' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      suggestions,
      success: true,
    });

  } catch (error) {
    console.error('Ice breaker generation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate ice breakers',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
