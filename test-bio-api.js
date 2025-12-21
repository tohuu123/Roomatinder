// Quick test for bio generation API
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function testBioGeneration() {
  console.log('Testing Bio Generation API...\n');
  
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  console.log('API Key exists:', !!apiKey);
  console.log('API Key length:', apiKey?.length, '\n');

  if (!apiKey) {
    console.error('❌ No API key found!');
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Test with gemini-2.0-flash-exp
  console.log('=== Testing gemini-2.0-flash-exp ===');
  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 150,
      }
    });

    const prompt = `You are a professional bio writer for a roommate-finding app. Create a compelling bio that is warm, welcoming, and open-minded.

User Information:
Personal traits: Friendly, Outgoing
Hobbies & interests: Reading, Movies
Lifestyle: Early riser, Organized
Roommate preferences: Easy to talk to, Respect privacy

Requirements:
- Write in a warm, welcoming, and open-minded tone
- Maximum 255 characters (STRICT LIMIT - count every character)
- First person perspective ("I" not "they")
- No emojis or special characters
- Natural and conversational
- Highlight what makes them a great roommate
- Return ONLY the bio text, no quotes, no explanations

Bio:`;

    console.log('Generating bio...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const bio = response.text().trim().replace(/^["']|["']$/g, '');
    
    console.log('✅ Success!');
    console.log('Generated bio:', bio);
    console.log('Length:', bio.length, 'characters');
    
  } catch (error) {
    console.error('❌ gemini-2.0-flash-exp failed:', error.message);
  }

  // Test with gemini-2.5-flash-lite (your current model)
  console.log('\n=== Testing gemini-2.5-flash-lite ===');
  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash-lite',
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 150,
      }
    });

    const prompt = `Create a short bio (max 255 characters) for a roommate finder: I'm friendly, outgoing, love reading and movies. Early riser, organized. Looking for someone easy to talk to who respects privacy.`;

    console.log('Generating bio...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const bio = response.text().trim().replace(/^["']|["']$/g, '');
    
    console.log('✅ Success!');
    console.log('Generated bio:', bio);
    console.log('Length:', bio.length, 'characters');
    
  } catch (error) {
    console.error('❌ gemini-2.5-flash-lite failed:', error.message);
  }
}

testBioGeneration().catch(console.error);
