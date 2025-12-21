import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

type ToneType = 'friendly' | 'humorous' | 'straightforward';

const TONE_DESCRIPTIONS = {
  friendly: 'warm, welcoming, and open-minded',
  humorous: 'light-hearted, fun, and slightly playful',
  straightforward: 'direct, disciplined, and focused on practical matters'
};

export async function POST(request: NextRequest) {
  try {
    const { keywords, tone = 'friendly' } = await request.json();

    if (!keywords || typeof keywords !== 'object') {
      return NextResponse.json(
        { error: 'Keywords object is required' },
        { status: 400 }
      );
    }

    if (!['friendly', 'humorous', 'straightforward'].includes(tone)) {
      return NextResponse.json(
        { error: 'Invalid tone. Must be: friendly, humorous, or straightforward' },
        { status: 400 }
      );
    }

    // Extract keywords
    const {
      personalTraits = [],
      hobbies = [],
      lifestyle = [],
      roommatePreferences = [],
      additionalInfo = ''
    } = keywords;

    // Build base information
    const baseInfo = `
Personal traits: ${personalTraits.length > 0 ? personalTraits.join(', ') : 'not specified'}
Hobbies & interests: ${hobbies.length > 0 ? hobbies.join(', ') : 'not specified'}
Lifestyle: ${lifestyle.length > 0 ? lifestyle.join(', ') : 'not specified'}
Roommate preferences: ${roommatePreferences.length > 0 ? roommatePreferences.join(', ') : 'not specified'}
${additionalInfo ? `Additional notes: ${additionalInfo}` : ''}`.trim();

    // Build tone-specific prompt
    const toneDescription = TONE_DESCRIPTIONS[tone as ToneType];
    
    const prompt = `You are an expert bio writer for a roommate-finding app. Create a compelling bio that is ${toneDescription}.

User Information:
${baseInfo}

Requirements:
- Write in a ${toneDescription} tone
- Maximum 255 characters (STRICT LIMIT - count every character)
- First person perspective ("I" not "they")
- No emojis or special characters
- Natural and conversational
- Highlight what makes them a great roommate
- Return ONLY the bio text, no quotes, no explanations

Bio:`;

    // Call Gemini AI
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash-lite',
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 150,
      }
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let generatedBio = response.text().trim();

    // Remove quotes if present
    generatedBio = generatedBio.replace(/^["']|["']$/g, '');

    // Ensure bio is within 255 characters
    if (generatedBio.length > 255) {
      console.log(`Bio too long (${generatedBio.length} chars), shortening...`);
      
      const shorterPrompt = `Shorten this bio to exactly 255 characters or less while keeping the ${toneDescription} tone and main message:

"${generatedBio}"

Return ONLY the shortened bio, no explanations:`;

      const shorterResult = await model.generateContent(shorterPrompt);
      const shorterResponse = await shorterResult.response;
      generatedBio = shorterResponse.text().trim().replace(/^["']|["']$/g, '');

      // Hard truncate if still too long
      if (generatedBio.length > 255) {
        generatedBio = generatedBio.substring(0, 252) + '...';
      }
    }

    console.log(`Generated bio (${generatedBio.length} chars, ${tone} tone):`, generatedBio);

    return NextResponse.json({
      bio: generatedBio,
      tone: tone,
      length: generatedBio.length
    });

  } catch (error: any) {
    console.error('Error generating bio:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate bio', 
        details: error.message,
        hint: 'Please check your GEMINI_API_KEY in .env file'
      },
      { status: 500 }
    );
  }
}
