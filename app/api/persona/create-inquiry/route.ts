import { NextRequest, NextResponse } from 'next/server';

const PERSONA_API_URL = process.env.NEXT_PUBLIC_PERSONA_ENVIRONMENT === 'production'
  ? 'https://withpersona.com/api/v1'
  : 'https://withpersona.com/api/v1';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.PERSONA_API_KEY;
    if (!apiKey) {
      console.error('PERSONA_API_KEY is not set');
      return NextResponse.json(
        { error: 'Persona API key is not configured' },
        { status: 500 }
      );
    }

    console.log('Creating Persona inquiry for user:', userId);

    // Create an inquiry using Persona REST API
    const inquiryResponse = await fetch(`${PERSONA_API_URL}/inquiries`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Persona-Version': '2023-01-05',
      },
      body: JSON.stringify({
        data: {
          attributes: {
            'reference-id': userId,
            'inquiry-template-id': process.env.NEXT_PUBLIC_PERSONA_TEMPLATE_ID,
          },
        },
      }),
    });

    if (!inquiryResponse.ok) {
      const errorText = await inquiryResponse.text();
      console.error('Persona API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to create inquiry with Persona' },
        { status: inquiryResponse.status }
      );
    }

    const inquiry = await inquiryResponse.json();
    const inquiryId = inquiry.data.id;

    console.log('Inquiry created:', inquiryId);

    // For embedded flow, we can use the inquiry directly without session token
    // The client SDK will handle authentication with the inquiry ID
    return NextResponse.json({
      inquiryId: inquiryId,
      // Return null for sessionToken as it's not needed for template-based flow
      sessionToken: null,
    });
  } catch (error: any) {
    console.error('Error creating Persona inquiry:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create inquiry' },
      { status: 500 }
    );
  }
}
