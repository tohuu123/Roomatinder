# Hướng dẫn kiểm tra và sửa lỗi Daily & Weekly Email

## 🔍 Các vấn đề đã phát hiện và đã fix

### ❌ Vấn đề 1: Query sai collection
**Triệu chứng**: Daily & Weekly email không được gửi

**Nguyên nhân**: 
- API routes đang query từ collection `'users'`
- Nhưng hệ thống chính lưu data ở collection `'profiles'`

**Đã fix**: 
- ✅ `app/api/email/daily-digest/route.ts` - đổi từ `'users'` sang `'profiles'`
- ✅ `app/api/email/weekly-report/route.ts` - đổi từ `'users'` sang `'profiles'`

---

### ❌ Vấn đề 2: Không có notification records
**Triệu chứng**: Daily digest báo "No activity" dù có match

**Nguyên nhân**: 
- Daily/Weekly dựa vào collection `'notifications'` để đếm likes/messages
- Nhưng hệ thống KHÔNG tạo notification records khi match/like
- Chỉ hiển thị notification trên UI, không lưu vào Firestore

**Đã fix**:
- ✅ Thêm code tạo notification record khi user LIKE (chưa match)
- ✅ Thêm code tạo notification record khi MATCH xảy ra
- ✅ Location: `lib/profileService.ts` trong function `likeUser()`

---

### ❌ Vấn đề 3: Không nhận được email
**Có thể do**:
1. ❌ Chưa có activity (likes/messages) trong ngày → Email không gửi
2. ❌ `emailNotificationsEnabled` = false
3. ❌ Không có email address trong profile
4. ❌ Chưa setup cron job
5. ❌ Email service chưa config đúng (.env)

---

## ✅ Cách kiểm tra

### 1. Kiểm tra profile của bạn có đầy đủ thông tin
```typescript
// Trong Firebase Console, kiểm tra collection 'profiles'
// Profile cần có:
{
  email: "your@email.com",
  emailNotificationsEnabled: true,  // hoặc undefined (default true)
  isVisible: true
}
```

### 2. Tạo test notifications
Để test daily digest, bạn cần có notifications trong ngày.

**Cách 1: Tạo match/like thật**
- Dùng 2 accounts
- Account A like Account B
- Account B like Account A → Match!
- Hệ thống sẽ tự tạo 2 notification records

**Cách 2: Tạo notification record thủ công**
```typescript
// Trong Firebase Console, thêm document vào collection 'notifications'
{
  userId: "YOUR_USER_ID",
  fromUserId: "SOME_OTHER_USER_ID",
  fromUserName: "Test User",
  type: "like",  // hoặc "match", "message"
  message: "Test User liked you!",
  read: false,
  createdAt: Timestamp.now()
}
```

### 3. Test gửi email trực tiếp

#### Option A: Dùng test script
```bash
npx tsx scripts/test-daily-digest.ts YOUR_USER_ID
```

Script này sẽ:
- ✅ Kiểm tra profile
- ✅ Đếm notifications trong ngày
- ✅ Thử gửi email
- ✅ Báo kết quả chi tiết

#### Option B: Dùng API endpoint
```bash
# GET request (dễ test hơn)
curl "http://localhost:3000/api/email/daily-digest?userId=YOUR_USER_ID"

# POST request (production - cần CRON_SECRET)
curl -X POST http://localhost:3000/api/email/daily-digest \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

---

## 🔧 Setup Email Service (nếu chưa có)

### 1. Kiểm tra .env file
```env
# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Gemini AI (for intriguing content)
NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-key

# Cron Secret (for scheduled jobs)
CRON_SECRET=your-random-secret-string
```

### 2. Gmail App Password
Nếu dùng Gmail, cần tạo App Password:
1. Vào https://myaccount.google.com/security
2. Bật 2-Step Verification
3. Tạo App Password
4. Copy password vào .env

---

## 📊 Debug Flow

### Daily Digest Flow:
```
1. Cron job trigger (hoặc manual test)
   ↓
2. Query profiles collection
   - where emailNotificationsEnabled != false
   - where isVisible == true
   ↓
3. For each profile:
   a. Check email settings
   b. Count notifications (likes, messages) từ 00:00 hôm nay
   c. Skip nếu count = 0
   d. Generate AI intriguing content
   e. Send email
   ↓
4. Return stats (successCount, failCount)
```

### Notification Creation Flow:
```
User A likes User B
   ↓
profileService.likeUser()
   ↓
1. Update profiles in Firestore
   ↓
2. Check if match?
   ↓
3. Create notification record:
   - If NOT match → create "like" notification for B
   - If MATCH → create "match" notifications for BOTH A & B
   ↓
4. Send match email (if match)
```

---

## 🧪 Test Scenarios

### Scenario 1: Test với 0 notifications
**Expected**: Email không được gửi, log "No activity"

```bash
npx tsx scripts/test-daily-digest.ts YOUR_USER_ID
```

### Scenario 2: Test với 1+ likes
**Expected**: Email được gửi với subject "Your Daily Update: X new notifications!"

1. Tạo 1 like notification (thủ công hoặc thật)
2. Run test script
3. Check inbox

### Scenario 3: Test với match
**Expected**: 
- 2 emails: Daily digest + Match notification
- Match notification ngay lập tức
- Daily digest theo schedule

1. Tạo match (2 users like nhau)
2. Check cả 2 users nhận được:
   - Match notification email (instant)
   - Notification record trong Firestore
3. Ngày hôm sau, daily digest sẽ có data

---

## 📝 Troubleshooting

### "No activity for user today"
- ✅ Check: Có notification records trong ngày không?
- ✅ Fix: Tạo test notification hoặc tạo match thật

### "User has email notifications disabled"
- ✅ Check: `emailNotificationsEnabled` trong profile
- ✅ Fix: Set field này = true hoặc xóa nó

### "Email sent successfully" nhưng không nhận được
- ✅ Check: Email trong spam folder
- ✅ Check: EMAIL_USER và EMAIL_PASSWORD đúng chưa
- ✅ Check: Gmail App Password đúng chưa
- ✅ Check: Console có lỗi không

### "Failed to load notification service"
- ✅ Check: File `lib/notificationService.ts` có tồn tại không
- ✅ Fix: Import đúng đường dẫn

---

## 🎯 Next Steps

### 1. Test ngay bây giờ
```bash
# 1. Get your user ID từ Firebase Console
# 2. Run test
npx tsx scripts/test-daily-digest.ts YOUR_USER_ID

# 3. Tạo test notification nếu cần
# 4. Run test lại
```

### 2. Setup Cron Job (nếu muốn auto)
- Vercel Cron
- External cron service (cron-job.org)
- Daily: `POST /api/email/daily-digest` với Authorization header

### 3. Monitor
- Check logs khi có match/like
- Verify notification records được tạo
- Test weekly email tương tự

---

## 📌 Key Changes Made

### File: `app/api/email/daily-digest/route.ts`
```diff
- collection(db, 'users')
+ collection(db, 'profiles')
```

### File: `app/api/email/weekly-report/route.ts`
```diff
- collection(db, 'users')
+ collection(db, 'profiles')
```

### File: `lib/profileService.ts` - Added notification creation
```typescript
// When like (not match yet)
if (!isMatch) {
  createNotification(likedUserId, currentUserId, ..., 'like')
}

// When match
if (isMatch) {
  createNotification(currentUserId, likedUserId, ..., 'match')
  createNotification(likedUserId, currentUserId, ..., 'match')
}
```

---

## ✅ Checklist

- [ ] Profile có email và emailNotificationsEnabled = true
- [ ] Có notification records trong collection 'notifications'
- [ ] Email service đã config trong .env
- [ ] Test script chạy thành công
- [ ] Nhận được email test
- [ ] Match tạo notification records
- [ ] Daily digest có data để gửi
