# Hướng dẫn tích hợp Persona Verification

## Tổng quan
Persona là dịch vụ xác minh danh tính (Identity Verification) giúp xác thực người dùng thông qua:
- Xác minh giấy tờ tùy thân (CMND, CCCD, Passport)
- Xác thực khuôn mặt (Face verification)
- Kiểm tra thông tin cá nhân

## Các bước setup

### 1. Đăng ký tài khoản Persona

1. Truy cập: https://withpersona.com
2. Đăng ký tài khoản (có sandbox miễn phí)
3. Tạo một Inquiry Template:
   - Đăng nhập vào Dashboard
   - Vào **Products** → **Inquiry Templates**
   - Click **Create Template**
   - Chọn loại xác minh phù hợp (Government ID + Selfie được recommend)
   - Cấu hình các bước xác minh
   - Lưu template và copy Template ID (dạng: `itmpl_xxxxxxxxxxxxx`)

### 2. Lấy API Keys

1. Vào **Settings** → **API Keys**
2. Copy các keys sau:
   - **Sandbox API Key**: `persona_sandbox_xxxxxxxxxxxxx` (cho development)
   - **Production API Key**: `persona_live_xxxxxxxxxxxxx` (cho production)

### 3. Cấu hình Environment Variables

Tạo file `.env.local` trong thư mục root:

```env
# Persona Configuration
NEXT_PUBLIC_PERSONA_TEMPLATE_ID=itmpl_xxxxxxxxxxxxx
PERSONA_API_KEY=persona_sandbox_xxxxxxxxxxxxx
NEXT_PUBLIC_PERSONA_ENVIRONMENT=sandbox

# Persona Webhook (optional - for webhook signature verification)
PERSONA_WEBHOOK_SECRET=your_webhook_secret
```

**Lưu ý:**
- `NEXT_PUBLIC_PERSONA_TEMPLATE_ID`: Template ID từ bước 1
- `PERSONA_API_KEY`: API Key từ bước 2 (KHÔNG có prefix NEXT_PUBLIC vì dùng server-side)
- `NEXT_PUBLIC_PERSONA_ENVIRONMENT`: `sandbox` hoặc `production`
- `PERSONA_WEBHOOK_SECRET`: Secret key để verify webhooks (optional)

### 4. Setup Webhooks

1. Trong Persona Dashboard, vào **Settings** → **Webhooks**
2. Click **Add Webhook Endpoint**
3. Nhập URL: `https://your-domain.com/api/persona/webhook`
4. Chọn các events cần lắng nghe:
   - `inquiry.completed` - Khi người dùng hoàn thành xác minh
   - `inquiry.approved` - Khi xác minh được chấp thuận
   - `inquiry.declined` - Khi xác minh bị từ chối
   - `inquiry.failed` - Khi xác minh thất bại
5. Copy **Webhook Secret** và thêm vào `.env.local`

### 5. Cấu trúc dữ liệu trong Firestore

Thêm field `verification` vào collection `users`:

```typescript
{
  userId: "user123",
  displayName: "Nguyen Van A",
  // ... other fields
  verification: {
    inquiryId: "inq_xxxxx",                    // ID của inquiry từ Persona
    status: "approved",                         // pending | completed | approved | declined | failed
    isVerified: true,                           // true nếu approved
    completedAt: "2025-01-15T10:30:00Z",       // Thời gian hoàn thành
    approvedAt: "2025-01-15T11:00:00Z",        // Thời gian được duyệt
    declinedAt: null,                           // Thời gian bị từ chối
    failedAt: null                              // Thời gian thất bại
  }
}
```

### 6. Sử dụng trong Profile Page

Thêm VerificationSection vào profile page:

```tsx
import VerificationSection from './components/VerificationSection';

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  
  const handleVerificationComplete = async () => {
    // Reload profile để cập nhật trạng thái
    const updatedProfile = await getProfile(user.uid);
    setProfile(updatedProfile);
  };

  return (
    <div>
      {/* Other profile sections */}
      
      <VerificationSection
        userId={user.uid}
        verificationStatus={profile?.verification}
        onVerificationComplete={handleVerificationComplete}
      />
    </div>
  );
}
```

### 7. Flow hoạt động

1. **User clicks "Start Verification"**
   - Component gọi API `/api/persona/create-inquiry`
   - Server tạo Inquiry và Session Token từ Persona
   - Return inquiryId và sessionToken cho client

2. **Persona SDK mở popup**
   - User thực hiện các bước xác minh:
     - Upload ảnh giấy tờ
     - Chụp selfie
     - Trả lời câu hỏi (nếu có)

3. **User hoàn thành verification**
   - Persona gửi webhook đến `/api/persona/webhook`
   - Server cập nhật Firestore với trạng thái mới

4. **Persona review (manual hoặc automatic)**
   - Nếu approved: webhook `inquiry.approved` → update `isVerified: true`
   - Nếu declined: webhook `inquiry.declined` → update `isVerified: false`

### 8. Testing trong Sandbox

Trong môi trường sandbox, bạn có thể test với dữ liệu giả:

1. Sử dụng test documents từ Persona:
   - Test passport numbers
   - Test government IDs
   - Fake selfies

2. Xem kết quả trong Dashboard → Inquiries

### 9. Deploy lên Production

1. Tạo Production Template trong Persona
2. Lấy Production API Key
3. Cập nhật `.env.local`:
```env
NEXT_PUBLIC_PERSONA_ENVIRONMENT=production
PERSONA_API_KEY=persona_live_xxxxxxxxxxxxx
```
4. Cập nhật webhook URL với domain production
5. Test kỹ trước khi release

## Pricing

- **Sandbox**: Miễn phí, unlimited tests
- **Production**: 
  - Pay per verification
  - Giá phụ thuộc vào loại verification
  - Xem chi tiết: https://withpersona.com/pricing

## Tài liệu tham khảo

- Persona Docs: https://docs.withpersona.com
- API Reference: https://docs.withpersona.com/reference
- Webhooks Guide: https://docs.withpersona.com/docs/webhooks
- Client SDK: https://docs.withpersona.com/docs/embedded-flow

## Troubleshooting

### Lỗi "Failed to load Persona SDK"
- Kiểm tra internet connection
- Kiểm tra xem script có bị block bởi ad blocker

### Webhook không nhận được
- Kiểm tra URL webhook có đúng không
- Kiểm tra firewall/security group
- Xem logs trong Persona Dashboard → Webhooks → Delivery Logs

### Inquiry tạo thất bại
- Kiểm tra API Key có đúng không
- Kiểm tra Template ID có đúng không
- Kiểm tra environment (sandbox/production) có khớp không

## Bảo mật

1. **KHÔNG** commit API keys vào Git
2. Luôn verify webhook signature trong production
3. Chỉ lưu inquiryId và status, không lưu dữ liệu nhạy cảm
4. Sử dụng HTTPS cho webhook endpoint
5. Rate limit API endpoints
