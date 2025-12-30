# Email Notification Feature Documentation

## Overview
This feature adds comprehensive email notifications to Roomatinder, including:
- Daily digest emails with AI-generated intriguing content
- Instant match notifications with ice breaker suggestions
- Inactivity check emails (after 7 days)
- Weekly report emails with AI-powered insights

## Features

### 1. Daily Digest Email (6 PM daily)
- Summarizes daily activity (likes received, new messages)
- Uses Gemini AI to generate intriguing, curiosity-inducing lines about who liked/messaged the user
- Only sent if there's activity and user has email notifications enabled

### 2. Match Notification Email (Instant)
- Sent immediately when two users match
- Includes an AI-generated ice breaker suggestion based on both profiles
- Personalized conversation starter to help users begin chatting

### 3. Inactivity Check Email (7 days)
- Sent to users who haven't visited the app in 7 days
- Allows users to confirm they're still active or hide their profile
- One-click actions to stay active or deactivate

### 4. Weekly Report Email (Monday 9 AM)
- Comprehensive week summary with stats:
  - Profile views
  - Likes received
  - Messages exchanged
  - New matches
- AI-generated encouraging summary
- Top conversation highlights

## Setup Instructions

### 1. Environment Variables
Add these to your `.env` file:

```env
# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Gemini AI (already in your project)
GEMINI_API_KEY=your-gemini-api-key

# Cron Job Security
CRON_SECRET=your-random-secret-key

# App URL
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Enable cron jobs (set to 'true' in production or for testing)
ENABLE_CRON=false
```

### 2. Email Service Setup (Gmail Example)

#### For Gmail:
1. Go to your Google Account settings
2. Enable 2-Step Verification
3. Generate an App Password:
   - Visit: https://myaccount.google.com/apppasswords
   - Select app: "Mail"
   - Select device: "Other (Custom name)"
   - Enter name: "Roomatinder"
   - Copy the generated 16-character password
4. Use this password as `EMAIL_PASSWORD` in your `.env.local`

#### For other email services:
- Update `EMAIL_SERVICE` to your provider (e.g., 'outlook', 'yahoo', 'sendgrid')
- Or use custom SMTP settings in `lib/emailService.ts`

### 3. Firebase Configuration

Add these fields to your user documents in Firestore:

```javascript
{
  email: string,                    // User's email address
  emailNotificationsEnabled: boolean, // Default: true
  lastEmailSent: timestamp,          // Auto-updated
  lastActive: timestamp,             // Update on each visit
  isVisible: boolean,                // Profile visibility
  inactivityEmailSent: timestamp,    // Track inactivity email
  weeklyProfileViews: number,        // Reset weekly
  lastWeeklyReportSent: timestamp    // Track weekly reports
}
```

### 4. Enable Cron Jobs

#### Development:
Set `ENABLE_CRON=true` in `.env.local` to test cron jobs locally.

#### Production:
Cron jobs automatically start in production. Schedules:
- Daily Digest: 6 PM UTC daily
- Weekly Report: 9 AM UTC every Monday
- Inactivity Check: 10 AM UTC daily

### 5. Customize Cron Schedule

Edit `lib/cronScheduler.ts` to change timings:

```typescript
// Daily Digest - Change '0 18 * * *' to your preferred time
cron.schedule('0 18 * * *', async () => { ... });

// Weekly Report - Change '0 9 * * 1' (Monday 9 AM)
cron.schedule('0 9 * * 1', async () => { ... });

// Inactivity Check - Change '0 10 * * *'
cron.schedule('0 10 * * *', async () => { ... });
```

## API Endpoints

### For Cron Jobs (Protected by CRON_SECRET):

#### POST `/api/email/daily-digest`
Sends daily digest to all active users.
```bash
curl -X POST https://your-domain.com/api/email/daily-digest \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

#### POST `/api/email/weekly-report`
Sends weekly report to all active users.
```bash
curl -X POST https://your-domain.com/api/email/weekly-report \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

#### POST `/api/email/check-inactive`
Checks for inactive users and sends reminders.
```bash
curl -X POST https://your-domain.com/api/email/check-inactive \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### For Testing (Development only):

#### GET `/api/email/daily-digest?userId=USER_ID`
Test daily digest for specific user.

#### GET `/api/email/weekly-report?userId=USER_ID`
Test weekly report for specific user.

### User Actions:

#### GET `/api/user/confirm-active?userId=USER_ID`
Confirms user is still active (from email link).

#### GET `/api/user/deactivate?userId=USER_ID`
Hides user profile from search (from email link).

## Usage

### Manual Email Triggers

```typescript
import { 
  sendDailyDigestEmail, 
  sendMatchNotificationEmail, 
  sendWeeklyReportEmail 
} from '@/lib/emailNotificationService';

// Send daily digest to a user
await sendDailyDigestEmail('user-id');

// Send match notification
await sendMatchNotificationEmail('user-id', 'match-user-id');

// Send weekly report
await sendWeeklyReportEmail('user-id');
```

### Automatic Triggers

- **Match notification**: Automatically sent when `createNotification()` is called with `type: 'match'`
- **Daily digest**: Automatically sent daily at 6 PM UTC
- **Weekly report**: Automatically sent every Monday at 9 AM UTC
- **Inactivity check**: Automatically runs daily at 10 AM UTC

## Customization

### Email Templates
Edit `lib/emailTemplates.ts` to customize email designs and content.

### AI Prompts
Edit `lib/emailService.ts` to customize Gemini AI prompts for:
- `generateIntriguingContent()` - Daily digest teasers
- `generateIceBreakerSuggestion()` - Match conversation starters
- `generateWeeklySummary()` - Weekly insights

### Notification Preferences
Add a settings page for users to control:
- Email notification toggle
- Notification frequency
- Specific notification types

## Testing

### Test Daily Digest:
```bash
curl "http://localhost:3000/api/email/daily-digest?userId=USER_ID"
```

### Test Weekly Report:
```bash
curl "http://localhost:3000/api/email/weekly-report?userId=USER_ID"
```

### Test Match Notification:
Trigger a match in your app - the email will be sent automatically.

## Troubleshooting

### Emails not sending:
1. Verify `EMAIL_USER` and `EMAIL_PASSWORD` are correct
2. Check Gmail App Password is enabled
3. Review console logs for error messages
4. Test with a simple email library first

### Cron jobs not running:
1. Verify `ENABLE_CRON=true` or `NODE_ENV=production`
2. Check `CRON_SECRET` is set
3. Review server logs for cron execution
4. Test API endpoints manually with curl

### Gemini AI errors:
1. Verify `GEMINI_API_KEY` is valid
2. Check API quota/limits
3. Fallback messages will be used if AI fails

## Production Deployment

### Vercel/Netlify:
Note: Cron jobs require a long-running server. For serverless:
- Use Vercel Cron Jobs: https://vercel.com/docs/cron-jobs
- Or use external cron service (cron-job.org, EasyCron)
- Set up webhooks to trigger your API endpoints

### Traditional Server:
Cron jobs will run automatically on server startup.

### External Cron Service:
Set up scheduled requests to:
- `POST https://your-domain.com/api/email/daily-digest` (daily 6 PM)
- `POST https://your-domain.com/api/email/weekly-report` (Monday 9 AM)
- `POST https://your-domain.com/api/email/check-inactive` (daily 10 AM)

Include header: `Authorization: Bearer YOUR_CRON_SECRET`

## Security Notes

- `CRON_SECRET` protects cron endpoints from unauthorized access
- User email addresses are never exposed in client-side code
- Email templates use parameterized content to prevent injection
- User actions (confirm/deactivate) use Firebase server-side validation

## Future Enhancements

- [ ] Email preference management UI
- [ ] A/B testing for email subject lines
- [ ] Advanced segmentation (time zone based sending)
- [ ] Email open/click tracking
- [ ] Rich notification history in app
- [ ] SMS notifications option
- [ ] Push notifications (web/mobile)
