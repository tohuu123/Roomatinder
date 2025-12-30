# ✅ Email Notification System - Implementation Checklist

Use this checklist to ensure everything is set up correctly.

## 📋 Pre-Setup

- [ ] Node.js and npm installed
- [ ] Next.js project running
- [ ] Firebase configured
- [ ] Gemini API key obtained

## 🔧 Installation (Completed)

- [x] Dependencies installed (nodemailer, node-cron)
- [x] All service files created
- [x] API routes created
- [x] Email templates created
- [x] Documentation written

## ⚙️ Configuration

### Gmail Setup
- [ ] Google account has 2-Factor Authentication enabled
- [ ] App Password generated at https://myaccount.google.com/apppasswords
- [ ] App Password saved securely

### Environment Variables
- [ ] `.env` file exists and is configured
- [ ] `EMAIL_SERVICE` set (e.g., 'gmail')
- [ ] `EMAIL_USER` set (your email address)
- [ ] `EMAIL_PASSWORD` set (16-character App Password)
- [ ] `GEMINI_API_KEY` set (should already exist)
- [ ] `CRON_SECRET` generated and set
- [ ] `NEXT_PUBLIC_APP_URL` set
- [ ] `ENABLE_CRON` set to 'true' for testing

### Generate CRON_SECRET
Run one of these commands:

**Windows PowerShell:**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

**Linux/Mac:**
```bash
openssl rand -base64 32
```

**Or use any random string generator**

## 🗄️ Firebase Setup

### User Schema Updates
Ensure Firebase users have these fields:

```javascript
{
  // Existing fields
  displayName: string,
  bio?: string,
  interests?: string[],
  
  // Required for email notifications
  email: string,                      // ✅ Should already exist
  
  // Add these new fields
  emailNotificationsEnabled: boolean, // Default: true
  lastActive: timestamp,              // Update on each visit
  isVisible: boolean,                 // Profile visibility
  
  // Optional (auto-managed by system)
  lastEmailSent?: timestamp,
  inactivityEmailSent?: timestamp,
  weeklyProfileViews?: number,
  lastWeeklyReportSent?: timestamp,
  deactivatedAt?: timestamp,
  deactivationReason?: string
}
```

### Update Existing Users
- [ ] Add default values to existing user documents:
  ```javascript
  {
    emailNotificationsEnabled: true,
    isVisible: true,
    lastActive: new Date(),
    weeklyProfileViews: 0
  }
  ```

## 🧪 Testing

### Test Email Configuration
- [ ] Run: `npm run test-email`
- [ ] Check console for success message
- [ ] Verify test email received in inbox
- [ ] If failed, review troubleshooting output

### Test Individual Features

**Daily Digest:**
- [ ] Create some notifications for a test user
- [ ] Run: `curl "http://localhost:3000/api/email/daily-digest?userId=YOUR_USER_ID"`
- [ ] Check email inbox
- [ ] Verify email content looks correct

**Match Notification:**
- [ ] Create a match in your app (two users like each other)
- [ ] Check both users' email inboxes
- [ ] Verify "It's a Match!" email received
- [ ] Check ice breaker suggestion makes sense

**Weekly Report:**
- [ ] Add some activity data for a test user
- [ ] Run: `curl "http://localhost:3000/api/email/weekly-report?userId=YOUR_USER_ID"`
- [ ] Check email inbox
- [ ] Verify stats are displayed correctly

**Inactivity Check:**
- [ ] Update a user's `lastActive` to 8 days ago
- [ ] Run: `curl -X POST "http://localhost:3000/api/email/check-inactive" -H "Authorization: Bearer YOUR_CRON_SECRET"`
- [ ] Check email inbox
- [ ] Test "I'm Still Active" link
- [ ] Test "Hide My Profile" link

## 🚀 Development Environment

### Start Server with Cron Jobs
- [ ] Verify `ENABLE_CRON=true` in `.env`
- [ ] Run: `npm run dev`
- [ ] Check console for: "Starting email notification cron jobs..."
- [ ] Verify cron schedules are logged

### Monitor Logs
Look for these in console:
- [ ] ✅ "Email notification cron jobs started successfully"
- [ ] ✅ Cron job schedules displayed
- [ ] ✅ No error messages

## 📧 Email Verification

### Check Email Content
- [ ] Emails look professional
- [ ] Images load correctly (if any)
- [ ] Links work and point to correct URLs
- [ ] Mobile responsive (view on phone)
- [ ] No broken HTML/CSS

### Check AI Content
- [ ] Daily digest teaser is relevant and intriguing
- [ ] Ice breakers are personalized
- [ ] Weekly summaries are encouraging
- [ ] Fallback messages work if AI fails

## ⏰ Cron Job Verification

### Scheduled Jobs
- [ ] Daily Digest: 6 PM UTC (18:00)
- [ ] Weekly Report: Monday 9 AM UTC
- [ ] Inactivity Check: Daily 10 AM UTC

### Test Cron Execution
Wait for scheduled time or manually trigger:
- [ ] Daily digest runs automatically
- [ ] Weekly report runs on Monday
- [ ] Inactivity check runs daily
- [ ] No duplicate emails sent
- [ ] Proper error handling

## 🔒 Security Checks

- [ ] `CRON_SECRET` is strong and random
- [ ] API endpoints require authorization header
- [ ] Email addresses not exposed in client code
- [ ] User confirmation links are secure
- [ ] Rate limiting prevents email spam

## 🌐 Production Preparation

### Choose Deployment Strategy

**Option 1: Vercel Cron (Recommended for Vercel)**
- [ ] Create `vercel.json` with cron configuration
- [ ] Add cron jobs to Vercel dashboard
- [ ] Set `CRON_SECRET` in Vercel environment variables

**Option 2: External Cron Service**
- [ ] Sign up for cron-job.org or similar
- [ ] Create 3 scheduled jobs (daily, weekly, inactivity)
- [ ] Configure POST requests with Authorization header

**Option 3: Server-Based Deployment**
- [ ] Deploy to Railway, Render, or similar
- [ ] Verify cron jobs start automatically
- [ ] Monitor logs for execution

### Production Email Service
- [ ] Decide on email service (Gmail limit: 500/day)
- [ ] Consider upgrading to SendGrid, AWS SES, or Mailgun
- [ ] Update email configuration if needed
- [ ] Test production email sending

### Environment Variables in Production
- [ ] All `.env.local` variables added to production
- [ ] `NEXT_PUBLIC_APP_URL` points to production domain
- [ ] `ENABLE_CRON` set appropriately
- [ ] `CRON_SECRET` is different from development

## 📊 Monitoring & Maintenance

### Set Up Monitoring
- [ ] Track email delivery rates
- [ ] Monitor error logs
- [ ] Check cron job execution
- [ ] Verify AI API usage

### Regular Checks
- [ ] Weekly: Review email delivery success rate
- [ ] Monthly: Check user email preferences
- [ ] Monthly: Review AI-generated content quality
- [ ] Quarterly: Update email templates if needed

## 🎨 Optional Enhancements

- [ ] Create user settings page for email preferences
- [ ] Add email open tracking
- [ ] Implement A/B testing for subject lines
- [ ] Add more email templates (e.g., new feature announcements)
- [ ] Create admin dashboard for email analytics
- [ ] Add SMS notifications
- [ ] Implement push notifications

## 📚 Documentation Review

- [ ] Read [EMAIL_SETUP_GUIDE.md](./EMAIL_SETUP_GUIDE.md)
- [ ] Review [EMAIL_NOTIFICATION_FEATURE.md](./EMAIL_NOTIFICATION_FEATURE.md)
- [ ] Understand [EMAIL_NOTIFICATION_SUMMARY.md](./EMAIL_NOTIFICATION_SUMMARY.md)
- [ ] Bookmark docs for future reference

## ✅ Final Verification

### All Systems Go
- [ ] ✅ Email configuration tested and working
- [ ] ✅ All 4 email types tested successfully
- [ ] ✅ Cron jobs running as scheduled
- [ ] ✅ AI content generation working
- [ ] ✅ User actions (confirm/deactivate) working
- [ ] ✅ Error handling tested
- [ ] ✅ Production deployment planned
- [ ] ✅ Team trained on system

## 🎉 Success!

Once all items are checked, your email notification system is fully operational!

**Next Steps:**
1. Monitor the first week of emails
2. Gather user feedback
3. Iterate on email content
4. Expand notification types

## 🆘 Need Help?

If you're stuck on any item:
1. Check the console logs for errors
2. Review the detailed documentation
3. Run the test script: `npm run test-email`
4. Verify all environment variables are set
5. Check Firebase user data structure
6. Test email service independently

---

**Quick Test Command:**
```bash
npm run test-email && npm run dev
```

This will test your email configuration and start the server with cron jobs.

Good luck! 🚀
