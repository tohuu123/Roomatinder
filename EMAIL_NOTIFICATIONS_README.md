# 📧 Email Notifications - Quick Reference

## 🚀 Quick Start

```bash
# 1. Edit your .env file
# Add email configuration to your existing .env file

# 2. Add your email credentials

# 3. Test configuration
npm run test-email

# 4. Start dev server with cron jobs
npm run dev
```

## 📩 Email Types

| Type | When | AI Feature |
|------|------|------------|
| **Daily Digest** | 6 PM UTC daily | Intriguing teaser about who liked/messaged you |
| **Match Notification** | Instant on match | Personalized ice breaker suggestion |
| **Inactivity Check** | After 7 days | Friendly reminder with one-click actions |
| **Weekly Report** | Monday 9 AM UTC | Encouraging weekly summary |

## ⚙️ Environment Variables

```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
GEMINI_API_KEY=your-existing-key
CRON_SECRET=generate-random-secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
ENABLE_CRON=true
```

## 🧪 Testing

```bash
# Test email configuration
npm run test-email

# Test daily digest (replace USER_ID)
curl "http://localhost:3000/api/email/daily-digest?userId=USER_ID"

# Test weekly report
curl "http://localhost:3000/api/email/weekly-report?userId=USER_ID"

# Test cron job endpoint (with your CRON_SECRET)
curl -X POST "http://localhost:3000/api/email/daily-digest" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## 📁 File Structure

```
lib/
  ├── emailService.ts              # Email sending & AI
  ├── emailTemplates.ts            # HTML templates
  ├── emailNotificationService.ts  # Notification logic
  └── cronScheduler.ts             # Scheduled jobs

app/api/email/
  ├── daily-digest/route.ts        # Daily digest endpoint
  ├── weekly-report/route.ts       # Weekly report endpoint
  └── check-inactive/route.ts      # Inactivity check

app/api/user/
  ├── confirm-active/route.ts      # Confirm active action
  └── deactivate/route.ts          # Deactivate action

docs/
  ├── EMAIL_SETUP_GUIDE.md         # Setup instructions
  ├── EMAIL_NOTIFICATION_FEATURE.md # Full documentation
  └── IMPLEMENTATION_CHECKLIST.md  # Step-by-step checklist
```

## 🔐 Gmail Setup

1. Enable 2-Factor Authentication
2. Go to https://myaccount.google.com/apppasswords
3. Select App: Mail, Device: Other
4. Copy 16-character password
5. Use in `EMAIL_PASSWORD`

## ⏰ Cron Schedule

- **Daily Digest**: `0 18 * * *` (6 PM UTC)
- **Weekly Report**: `0 9 * * 1` (9 AM Monday UTC)
- **Inactivity Check**: `0 10 * * *` (10 AM UTC)

## 🔧 Customization

### Change Email Times
Edit `lib/cronScheduler.ts`

### Customize Templates
Edit `lib/emailTemplates.ts`

### Modify AI Prompts
Edit `lib/emailService.ts`

## 🌐 Production Deployment

### Vercel/Netlify (Serverless)
Create `vercel.json`:
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

### Server-Based (Railway/Render)
Cron jobs start automatically ✅

## 🆘 Troubleshooting

### Emails not sending?
- Check `EMAIL_USER` and `EMAIL_PASSWORD`
- Use App Password (not regular password)
- Run `npm run test-email` for diagnostics

### Cron jobs not running?
- Verify `ENABLE_CRON=true` in `.env`
- Check console for startup messages
- Restart dev server

### AI errors?
- Verify `GEMINI_API_KEY` is set
- Check API quota
- Fallback messages will be used

## 📚 Documentation

- **Quick Setup**: [EMAIL_SETUP_GUIDE.md](./docs/EMAIL_SETUP_GUIDE.md)
- **Full Docs**: [EMAIL_NOTIFICATION_FEATURE.md](./docs/EMAIL_NOTIFICATION_FEATURE.md)
- **Checklist**: [IMPLEMENTATION_CHECKLIST.md](./docs/IMPLEMENTATION_CHECKLIST.md)
- **Summary**: [EMAIL_NOTIFICATION_SUMMARY.md](./docs/EMAIL_NOTIFICATION_SUMMARY.md)

## ✅ Verification

Run this to verify everything works:
```bash
npm run test-email && npm run dev
```

Should see:
- ✅ Email configuration working
- ✅ Test email received
- ✅ Cron jobs started
- ✅ No errors in console

## 🎯 Next Steps

1. ✅ Set up Gmail App Password
2. ✅ Configure `.env.local`
3. ✅ Run `npm run test-email`
4. ✅ Test with real user data
5. ✅ Deploy to production

---

**Status**: ✅ Fully Implemented

**Need Help?** Check [EMAIL_SETUP_GUIDE.md](./docs/EMAIL_SETUP_GUIDE.md)
