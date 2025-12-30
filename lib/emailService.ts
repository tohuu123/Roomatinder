// Email Service - Handles sending emails using Nodemailer

import nodemailer from 'nodemailer';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

// Create email transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email
 */
export async function sendEmail({ to, subject, html, text }: EmailOptions): Promise<boolean> {
  try {
    const mailOptions = {
      from: `"Roomatinder" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML tags for plain text version
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Generate intriguing content using Gemini AI
 */
export async function generateIntriguingContent(
  profiles: Array<{ name: string; bio?: string; interests?: string[] }>,
  type: 'like' | 'message'
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
    
    const profileDescriptions = profiles.map((p, i) => 
      `Person ${i + 1}: ${p.name}${p.bio ? ` - ${p.bio}` : ''}${p.interests ? ` (Interests: ${p.interests.join(', ')})` : ''}`
    ).join('\n');

    const prompt = `You are a witty dating app assistant. Based on these profiles who ${type === 'like' ? 'liked' : 'messaged'} the user today:

${profileDescriptions}

Generate ONE short, intriguing, and playful sentence (max 20 words) that creates curiosity about these people without revealing too much. Make it fun and engaging!

Examples:
- "Someone who loves hiking and coffee just noticed you... 🏔️☕"
- "A music lover with an adventurous spirit is waiting for your reply! 🎵"
- "Your potential travel buddy just dropped a message! ✈️"

Generate only the sentence, no explanations.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Error generating intriguing content:', error);
    // Fallback message
    return type === 'like' 
      ? `You have ${profiles.length} new ${profiles.length === 1 ? 'like' : 'likes'} waiting! 💖`
      : `You have ${profiles.length} new ${profiles.length === 1 ? 'message' : 'messages'}! 💬`;
  }
}

/**
 * Generate ice breaker suggestion using Gemini AI
 */
export async function generateIceBreakerSuggestion(
  userProfile: { name: string; bio?: string; interests?: string[] },
  matchProfile: { name: string; bio?: string; interests?: string[] }
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
    
    const prompt = `You are a dating app conversation starter expert. Generate a friendly, personalized ice breaker message.

User: ${userProfile.name}${userProfile.bio ? ` - ${userProfile.bio}` : ''}${userProfile.interests ? ` (Interests: ${userProfile.interests.join(', ')})` : ''}

Match: ${matchProfile.name}${matchProfile.bio ? ` - ${matchProfile.bio}` : ''}${matchProfile.interests ? ` (Interests: ${matchProfile.interests.join(', ')})` : ''}

Generate ONE natural, friendly conversation starter (max 25 words) that references a common interest or something interesting from the match's profile. Make it casual and genuine!

Examples:
- "Hey! I noticed you love hiking too. Have you explored any trails recently? 🏔️"
- "Hi! Fellow coffee enthusiast here ☕ What's your go-to order?"
- "Hello! I see we both enjoy photography. What do you like to capture most? 📸"

Generate only the message, no explanations or quotes.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Error generating ice breaker:', error);
    return "Hey! I'm excited we matched. What brings you to Roomatinder? 😊";
  }
}

/**
 * Generate weekly summary insights using Gemini AI
 */
export async function generateWeeklySummary(stats: {
  totalLikes: number;
  totalMessages: number;
  totalMatches: number;
  topInteractions: Array<{ name: string; count: number }>;
}): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
    
    const topInteractionsText = stats.topInteractions.length > 0
      ? stats.topInteractions.map(t => `${t.name} (${t.count} interactions)`).join(', ')
      : 'None yet';

    const prompt = `You are a friendly dating app weekly summary writer. Generate an engaging, positive weekly summary message.

This week's stats:
- Likes received: ${stats.totalLikes}
- Messages: ${stats.totalMessages}
- New matches: ${stats.totalMatches}
- Most active conversations: ${topInteractionsText}

Generate a short, encouraging 2-3 sentence summary (max 50 words) that celebrates their progress and motivates them to keep engaging. Be positive and supportive!

Example format:
"Great week! You connected with [X] new people and had some amazing conversations. Keep being yourself - your authentic personality is what makes you stand out! 🌟"

Generate only the summary, no explanations.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Error generating weekly summary:', error);
    return `This week you received ${stats.totalLikes} likes, exchanged ${stats.totalMessages} messages, and made ${stats.totalMatches} new connections. Keep it up! 🌟`;
  }
}
