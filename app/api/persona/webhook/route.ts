import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import crypto from 'crypto';

// Verify webhook signature
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const digest = hmac.digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('persona-signature');
    const payload = await request.text();

    // Verify webhook signature (recommended for production)
    if (process.env.PERSONA_WEBHOOK_SECRET && signature) {
      const isValid = verifyWebhookSignature(
        payload,
        signature,
        process.env.PERSONA_WEBHOOK_SECRET
      );
      
      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    const event = JSON.parse(payload);
    
    console.log('Received Persona webhook:', event.data.type);

    // Handle different webhook events
    switch (event.data.type) {
      case 'inquiry.completed':
        await handleInquiryCompleted(event.data);
        break;
      
      case 'inquiry.failed':
        await handleInquiryFailed(event.data);
        break;
      
      case 'inquiry.approved':
        await handleInquiryApproved(event.data);
        break;
      
      case 'inquiry.declined':
        await handleInquiryDeclined(event.data);
        break;
      
      default:
        console.log('Unhandled event type:', event.data.type);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

async function handleInquiryCompleted(data: any) {
  const userId = data.attributes['reference-id'];
  const inquiryId = data.id;
  const status = data.attributes.status;

  console.log(`Inquiry completed for user ${userId}: ${status}`);

  // Update user document in Firestore
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    'verification.inquiryId': inquiryId,
    'verification.status': 'completed',
    'verification.completedAt': new Date().toISOString(),
  });
}

async function handleInquiryFailed(data: any) {
  const userId = data.attributes['reference-id'];
  const inquiryId = data.id;

  console.log(`Inquiry failed for user ${userId}`);

  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    'verification.inquiryId': inquiryId,
    'verification.status': 'failed',
    'verification.failedAt': new Date().toISOString(),
  });
}

async function handleInquiryApproved(data: any) {
  const userId = data.attributes['reference-id'];
  const inquiryId = data.id;

  console.log(`Inquiry approved for user ${userId}`);

  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    'verification.inquiryId': inquiryId,
    'verification.status': 'approved',
    'verification.isVerified': true,
    'verification.approvedAt': new Date().toISOString(),
  });
}

async function handleInquiryDeclined(data: any) {
  const userId = data.attributes['reference-id'];
  const inquiryId = data.id;

  console.log(`Inquiry declined for user ${userId}`);

  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    'verification.inquiryId': inquiryId,
    'verification.status': 'declined',
    'verification.isVerified': false,
    'verification.declinedAt': new Date().toISOString(),
  });
}
