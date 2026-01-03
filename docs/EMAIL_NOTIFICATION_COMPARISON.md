# So sánh các phương thức gửi Email Notification

## Tổng quan
Hệ thống có **5 loại email notification** chính, tất cả đều tuân theo cùng một quy trình gửi email nhưng có sự khác biệt về trigger và nội dung.

---

## 1. Match Notification Email ✅ (Đã hoạt động tốt)

### Trigger
- Được gọi từ `profileService.ts` khi 2 user like lẫn nhau
- Gửi tự động ngay khi match xảy ra

### Flow
```
User A likes User B 
→ Kiểm tra User B đã like User A chưa?
→ Nếu có: isMatch = true
→ profileService.ts gọi sendMatchNotificationEmail()
→ Gửi email cho CẢ 2 users
```

### Code location
- **Service**: `lib/emailNotificationService.ts` - `sendMatchNotificationEmail()`
- **Caller**: `lib/profileService.ts` - trong `likeUser()` function
- **API Route**: `app/api/email/match-notification/route.ts` (empty - không dùng)
- **Template**: `lib/emailTemplates.ts` - `getMatchNotificationTemplate()`

### Đặc điểm
✅ Gửi NGAY LẬP TỨC khi match xảy ra  
✅ Gửi cho CẢ 2 users  
✅ Có AI-generated ice breaker suggestion  
✅ Kiểm tra email settings của user  
✅ Server-side only (check `typeof window === 'undefined'`)  
✅ Dynamic import module để tránh client-side error  

### Email content
- Subject: "🎉 It's a Match! Start chatting now!"
- Match banner với tên người match
- Bio của người match
- AI-generated ice breaker suggestion
- Button "Start Chatting Now"

---

## 2. Daily Digest Email

### Trigger
- Cron job chạy mỗi ngày
- API route: `/api/email/daily-digest`

### Flow
```
Cron job trigger
→ GET all users with emailNotificationsEnabled = true
→ For each user:
   → sendDailyDigestEmail(userId)
   → Đếm likes & messages trong ngày
   → Generate AI intriguing content
   → Send email
```

### Code location
- **Service**: `lib/emailNotificationService.ts` - `sendDailyDigestEmail()`
- **API Route**: `app/api/email/daily-digest/route.ts`
- **Template**: `lib/emailTemplates.ts` - `getDailyDigestTemplate()`

### Đặc điểm
✅ Kiểm tra email settings  
✅ Skip nếu không có activity trong ngày  
✅ Có AI-generated intriguing content  
✅ Đếm số likes & messages  
✅ Update lastEmailSent timestamp  
⚠️ Cần CRON_SECRET để authenticate  

### Email content
- Subject: "Your Daily Update: X new notifications! 💖"
- Stats card: số likes & messages
- AI-generated intriguing line
- Button "Check Your Messages" hoặc "See Your Matches"

### Khác biệt so với Match Notification
- ⏰ Gửi theo lịch (daily) thay vì instant
- 📊 Tổng hợp nhiều activities thay vì 1 event
- 🔒 Cần authentication từ cron job
- 📧 Gửi cho 1 user (không phải cả 2 như match)

---

## 3. Weekly Report Email

### Trigger
- Cron job chạy mỗi tuần
- API route: `/api/email/weekly-report`

### Flow
```
Cron job trigger (weekly)
→ GET all users with emailNotificationsEnabled = true
→ For each user:
   → sendWeeklyReportEmail(userId)
   → Tính stats của tuần (likes, messages, matches, profile views)
   → Get top 3 interactions
   → Generate AI summary
   → Send email
```

### Code location
- **Service**: `lib/emailNotificationService.ts` - `sendWeeklyReportEmail()`
- **API Route**: `app/api/email/weekly-report/route.ts`
- **Template**: `lib/emailTemplates.ts` - `getWeeklyReportTemplate()`

### Đặc điểm
✅ Kiểm tra email settings  
✅ Tính toán stats trong 7 ngày  
✅ AI-generated weekly summary  
✅ Top 3 interactions  
✅ Reset weeklyProfileViews sau khi gửi  
✅ Update lastWeeklyReportSent timestamp  
⚠️ Cần CRON_SECRET để authenticate  

### Email content
- Subject: "Your Week in Review: X new matches! 📊"
- Stats card: likes, messages, matches, profile views
- AI-generated summary
- Top matches với message count
- Week date range

### Khác biệt so với Match Notification
- ⏰ Gửi theo lịch (weekly) thay vì instant
- 📊 Tổng hợp toàn bộ tuần
- 🏆 Có ranking (top 3 interactions)
- 🔄 Reset counters sau khi gửi
- 🔒 Cần authentication từ cron job

---

## 4. Inactivity Check Email

### Trigger
- Cron job tự động
- API route: `/api/email/check-inactive`

### Flow
```
Cron job trigger
→ Query users: lastActive < 7 days ago
→ AND isVisible = true
→ AND inactivityEmailSent = null
→ For each user:
   → sendInactivityCheckEmail(userId)
   → Send reminder email
   → Mark inactivityEmailSent timestamp
```

### Code location
- **Service**: `lib/emailNotificationService.ts` - `sendInactivityCheckEmail()` & `checkInactiveUsers()`
- **API Route**: `app/api/email/check-inactive/route.ts`
- **Template**: `lib/emailTemplates.ts` - `getInactivityCheckTemplate()`

### Đặc điểm
✅ Tự động phát hiện users inactive > 7 ngày  
✅ Có confirm/deactivate URLs  
⚠️ **KHÔNG** kiểm tra emailNotificationsEnabled (gửi dù user tắt notification)  
✅ Mark inactivityEmailSent để tránh gửi lại  
✅ Include lastActiveDate trong email  
⚠️ Cần CRON_SECRET để authenticate  

### Email content
- Subject: "We miss you! Are you still there? 💙"
- Last active date
- Options: Confirm still active hoặc Deactivate account
- 2 buttons với URLs để xử lý

### Khác biệt so với Match Notification
- ⏰ Gửi theo inactive trigger (không phải instant)
- 🎯 Mục đích: retention, không phải notification
- ⚠️ **QUAN TRỌNG**: Không respect emailNotificationsEnabled
- 🔗 Có action URLs để user response
- 🔒 Cần authentication từ cron job

### ⚠️ Potential Issue
Email này gửi NGAY CẢ KHI user đã tắt notification. Có thể cần review logic này.

---

## 5. Account Deactivated Email

### Trigger
- Được gọi từ `deactivateUserProfile()` function
- Khi user bị deactivate do inactive

### Flow
```
User inactive quá lâu
→ System calls deactivateUserProfile(userId)
→ Set isVisible = false
→ Send deactivation email
```

### Code location
- **Service**: `lib/emailNotificationService.ts` - `deactivateUserProfile()`
- **Template**: `lib/emailTemplates.ts` - `getAccountDeactivatedTemplate()`

### Đặc điểm
✅ Gửi khi account bị hide  
✅ Có reactivate URL  
⚠️ **KHÔNG** kiểm tra emailNotificationsEnabled  
❌ Không update lastEmailSent  

### Email content
- Subject: "Your Roomatinder profile has been hidden"
- Thông báo profile đã bị ẩn
- Reactivate URL để khôi phục

### Khác biệt so với Match Notification
- 🎯 Mục đích: thông báo system action
- ⚠️ Không respect emailNotificationsEnabled
- 🔗 Có reactivate URL

---

## So sánh tổng quan

| Loại Email | Trigger | Instant/Scheduled | Check Email Settings | AI Content | Recipients |
|------------|---------|-------------------|---------------------|------------|------------|
| **Match Notification** ✅ | User action (like) | Instant | ✅ Yes | ✅ Ice breaker | 2 users |
| **Daily Digest** | Cron daily | Scheduled | ✅ Yes | ✅ Intriguing line | 1 user |
| **Weekly Report** | Cron weekly | Scheduled | ✅ Yes | ✅ Summary | 1 user |
| **Inactivity Check** | Cron (inactive users) | Triggered | ⚠️ **NO** | ❌ No | 1 user |
| **Account Deactivated** | System action | Instant | ⚠️ **NO** | ❌ No | 1 user |

---

## Core Email Sending Process (Giống nhau cho TẤT CẢ)

### 1. Get user email settings
```typescript
const userSettings = await getUserEmailSettings(userId);
// Returns: { email, emailNotificationsEnabled, lastEmailSent }
```

### 2. Kiểm tra điều kiện
```typescript
// Đối với hầu hết emails:
if (!userSettings.email || !userSettings.emailNotificationsEnabled) {
  return false;
}

// ⚠️ Inactivity & Deactivation emails BỎ QUA emailNotificationsEnabled
```

### 3. Lấy data cần thiết
- User profile từ Firestore
- Thống kê (nếu cần)
- AI-generated content (nếu cần)

### 4. Generate HTML từ template
```typescript
const emailHtml = getXxxTemplate({ ...data });
```

### 5. Gửi email
```typescript
const success = await sendEmail({
  to: userSettings.email,
  subject: "...",
  html: emailHtml,
});
```

### 6. Update timestamp (nếu thành công)
```typescript
if (success) {
  await updateLastEmailSent(userId);
}
```

---

## Các điểm chung (Common Pattern)

✅ **TẤT CẢ** đều dùng cùng:
- `sendEmail()` function từ `emailService.ts`
- Base template structure từ `emailTemplates.ts`
- `getUserEmailSettings()` để lấy email
- Nodemailer transporter
- Update `lastEmailSent` timestamp (trừ deactivation)

✅ **TẤT CẢ** đều return boolean:
- `true` nếu gửi thành công
- `false` nếu thất bại hoặc skip

✅ **TẤT CẢ** đều có error handling:
- Try-catch blocks
- Console logging
- Graceful failures

---

## Khác biệt chính (Key Differences)

### 1. Timing
- **Instant**: Match, Deactivation
- **Scheduled**: Daily, Weekly
- **Triggered**: Inactivity (by condition)

### 2. Email Settings Respect
- **Respect**: Match ✅, Daily ✅, Weekly ✅
- **Ignore**: Inactivity ⚠️, Deactivation ⚠️

### 3. AI Content
- **Match**: Ice breaker suggestion
- **Daily**: Intriguing content line
- **Weekly**: Summary text
- **Others**: None

### 4. Authentication
- **Match**: None (internal call)
- **Scheduled emails**: CRON_SECRET required
- **Deactivation**: None (internal call)

### 5. Recipients
- **Match**: 2 users (both match participants)
- **Others**: 1 user each

---

## Recommendations / Issues to Review

### ⚠️ Issue 1: Inconsistent Email Settings Check
**Problem**: Inactivity & Deactivation emails không respect `emailNotificationsEnabled`

**Impact**: Users có thể nhận email dù đã tắt notifications

**Solution options**:
1. Tôn trọng user preference cho TẤT CẢ emails
2. Tạo separate setting cho "system emails" vs "notification emails"
3. Document rõ behavior này

### ⚠️ Issue 2: Match Email API Route Empty
**Problem**: `app/api/email/match-notification/route.ts` exists nhưng empty

**Impact**: Không có test endpoint cho match emails

**Solution**: 
- Implement test endpoint như daily-digest
- Hoặc xóa file nếu không cần

### ⚠️ Issue 3: No Rate Limiting
**Problem**: Không có rate limiting cho emails

**Impact**: Có thể spam users hoặc vượt quá email service limits

**Solution**: 
- Check lastEmailSent trước khi gửi
- Implement minimum interval between emails

### ✅ Good Practices Already Implemented
1. ✅ Server-side only check (`typeof window === 'undefined'`)
2. ✅ Dynamic imports để tránh client-side errors
3. ✅ Comprehensive logging
4. ✅ Template-based email generation
5. ✅ Error handling với graceful failures
6. ✅ Update timestamps để track gửi email

---

## Test Scripts Available

1. **Match Email**: `scripts/test-match-email.ts`
   - Test gửi match notification cho 2 users

2. **API Routes**:
   - Daily Digest: `GET /api/email/daily-digest?userId=xxx`
   - Weekly Report: `GET /api/email/weekly-report?userId=xxx`
   - Check Inactive: `POST /api/email/check-inactive` (với auth)

---

## Kết luận

### Câu trả lời cho câu hỏi:
**"Các trường hợp gửi mail khác có giống cách gửi khi thông báo match không?"**

**Trả lời**: 
✅ **YES** - Về cơ bản TẤT CẢ đều dùng CÙNG core process:
1. Get user email settings
2. Check conditions
3. Prepare data
4. Generate HTML from template
5. Send via `sendEmail()`
6. Update timestamp

⚠️ **BUT** - Có những khác biệt quan trọng:
1. **Timing**: Instant vs Scheduled vs Triggered
2. **Email settings respect**: Một số email (inactivity, deactivation) bỏ qua user preferences
3. **AI content**: Match & digest có AI, others không
4. **Authentication**: Scheduled emails cần CRON_SECRET
5. **Recipients**: Chỉ match email gửi cho 2 users

💡 **Recommendation**: 
- Review lại logic của Inactivity & Deactivation emails
- Có thể cần tôn trọng `emailNotificationsEnabled` cho consistency
- Hoặc document rõ ràng behavior khác biệt này
