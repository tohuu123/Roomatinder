# 📧 Email Notification Quick Setup Guide

## Quick Start (5 minutes)

### 1. Install Dependencies
Already installed! ✅
- nodemailer
- @types/nodemailer
- node-cron
- @types/node-cron

### 2. Get Gmail App Password

1. Go to [Google Account](https://myaccount.google.com/)
2. Click **Security** → **2-Step Verification** (enable if not enabled)
3. Scroll down → Click **App passwords**
4. Select:
   - **App**: Mail
   - **Device**: Other (Custom name)
   - **Name**: Roomatinder
5. Click **Generate**
6. **Copy the 16-character password** (you won't see it again!)

### 3. Generate CRON_SECRET

Run in terminal:
```bash
# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))

# Or use any random string generator
```

### 4. Update .env

Add these to your `.env` file:

```env
# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password-here

# Cron Security
CRON_SECRET=your-generated-secret-here

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Enable for testing (set to false for production unless you have a server)
ENABLE_CRON=true
```

### 5. Update Firebase User Schema

Make sure your Firebase users have these fields:
```javascript
{
  email: string,
  displayName: string,
  bio?: string,
  interests?: string[],
  emailNotificationsEnabled: boolean, // default true
  lastActive: timestamp,
  isVisible: boolean,
  lastEmailSent?: timestamp,
  inactivityEmailSent?: timestamp,
  weeklyProfileViews?: number,
  lastWeeklyReportSent?: timestamp
}
```

### 6. Test It!

#### Test Daily Digest:
```bash
# Replace USER_ID with actual Firebase user ID
curl "http://localhost:3000/api/email/daily-digest?userId=USER_ID"
```

#### Test Match Notification:
Just create a match in your app - email will send automatically!

#### Test Weekly Report:
```bash
curl "http://localhost:3000/api/email/weekly-report?userId=USER_ID"
```

## What Happens Now?

### Automatic Emails:
1. **Match Notifications** - Instant when users match
2. **Daily Digest** - 6 PM UTC daily (if user has activity)
3. **Weekly Report** - Monday 9 AM UTC
4. **Inactivity Check** - Daily at 10 AM UTC (for 7-day inactive users)

### Cron Schedule:
- Daily Digest: `0 18 * * *` (6 PM UTC)
- Weekly Report: `0 9 * * 1` (9 AM UTC Monday)
- Inactivity Check: `0 10 * * *` (10 AM UTC)

## Customization

### Change Email Times:
Edit `lib/cronScheduler.ts` and modify the cron expressions.

### Customize Email Design:
Edit `lib/emailTemplates.ts` to change HTML templates.

### Modify AI Prompts:
Edit `lib/emailService.ts` to customize Gemini AI generation.

## Troubleshooting

### ❌ Emails not sending:
```bash
# Check your .env has correct values
cat .env | grep EMAIL

# Test direct email send (will show errors)
node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: 'YOUR_EMAIL', pass: 'YOUR_APP_PASSWORD' }
});
transporter.sendMail({
  from: 'YOUR_EMAIL',
  to: 'YOUR_EMAIL',
  subject: 'Test',
  text: 'Test'
}, (err, info) => {
  if (err) console.error(err);
  else console.log('Success!', info);
});
"
```

### ❌ Cron jobs not running:
- Verify `ENABLE_CRON=true` in `.env`
- Check server logs for "Starting email notification cron jobs..."
- Restart your dev server

### ❌ Gemini AI errors:
- Verify `GEMINI_API_KEY` is set
- Check API quota at [Google AI Studio](https://aistudio.google.com/)
- Fallback messages will be used if AI fails

## Production Deployment

### ⚠️ Important for Vercel/Netlify:
Serverless platforms don't support long-running cron jobs!

**Options:**
1. **Use Vercel Cron** (recommended):
   - Create `vercel.json`:
   ```json
   {
     "crons": [
       {
         "path": "/api/email/daily-digest",
         "schedule": "0 18 * * *"
       },
       {
         "path": "/api/email/weekly-report",
         "schedule": "0 9 * * 1"
       },
       {
         "path": "/api/email/check-inactive",
         "schedule": "0 10 * * *"
       }
     ]
   }
   ```
   - Add `CRON_SECRET` header in Vercel dashboard

2. **Use External Cron Service**:
   - [cron-job.org](https://cron-job.org) (free)
   - [EasyCron](https://www.easycron.com)
   - Set up POST requests with `Authorization: Bearer YOUR_CRON_SECRET`

3. **Deploy on Traditional Server**:
   - Railway, Render, DigitalOcean, AWS EC2
   - Cron jobs will work automatically

## Email Preview

Want to see what emails look like?
1. Run dev server: `npm run dev`
2. Visit: `http://localhost:3000/api/email/daily-digest?userId=YOUR_USER_ID`
3. Check your email inbox!

## Need Help?

- Check [EMAIL_NOTIFICATION_FEATURE.md](./EMAIL_NOTIFICATION_FEATURE.md) for full documentation
- Review console logs for error messages
- Test each component individually
- Make sure Firebase user has valid email address

## Success Checklist ✅

- [ ] Gmail App Password generated
- [ ] `.env.local` configured
- [ ] `ENABLE_CRON=true` for testing
- [ ] Server restarted
- [ ] Test email received
- [ ] Firebase users have required fields
- [ ] Match notification works
- [ ] Daily digest sends with activity

## Next Steps

Once basic emails work:
1. Customize email templates
2. Adjust AI prompts
3. Add user preference controls
4. Set up production cron service
5. Monitor email delivery rates

---

**Need more info?** See [docs/EMAIL_NOTIFICATION_FEATURE.md](./EMAIL_NOTIFICATION_FEATURE.md)
