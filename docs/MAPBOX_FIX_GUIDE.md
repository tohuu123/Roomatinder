# 🔧 Hướng dẫn sửa lỗi Mapbox Token

## ❌ Lỗi hiện tại

```
Error: Use a public access token (pk.*) with Mapbox GL, 
not a secret access token (sk.*).
```

Token hiện tại trong `.env` là **SECRET TOKEN** (sk.*) nhưng Mapbox GL cần **PUBLIC TOKEN** (pk.*)

## ✅ Cách sửa

### Bước 1: Lấy Public Token

1. Vào https://account.mapbox.com/access-tokens/
2. Tìm token có tên **"Default public token"**
3. Token này sẽ bắt đầu bằng `pk.` (ví dụ: `pk.eyJ1Ijoi...`)
4. Copy token này

### Bước 2: Cập nhật .env

Mở file `.env` và thay thế dòng:

```env
# TRƯỚC (SAI - token secret)
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=sk.eyJ1Ijoidm5raG9hODM4IiwiYSI6ImNtanN1Mm1mbjJ0Y2EzbXF5ZDI0dDJ1MHAifQ.5UPchrKfqahhlBvqQGI-Qw
```

Bằng:

```env
# SAU (ĐÚNG - token public)
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.eyJ1Ijoidm5raG9hODM4IiwiYSI6ImNtanN1M...your_token_here
```

### Bước 3: Restart Server

```bash
# Dừng server (Ctrl+C)
# Chạy lại
npm run dev
```

---

## 🗺️ Google Maps đã được thay bằng Mapbox Radar

### Những gì đã thay đổi:

**TRƯỚC:**
- Click vào icon map trên profile card → Hiển thị Google Maps iframe
- Chỉ xem được vị trí đơn giản

**SAU:**
- Click vào icon map trên profile card → Mở Mapbox Radar full-screen
- Có thể:
  - ✅ Xem 3km radius xung quanh nhà trọ
  - ✅ Lọc các POI (bệnh viện, siêu thị, v.v.)
  - ✅ Xem khoảng cách đến trường
  - ✅ Phân tích AI về khu vực

### Cần thêm coordinates cho profile

Để Radar hoạt động chính xác, profile có `have-room` nên có coordinates:

**Thêm vào profile form (tùy chọn):**

```typescript
// Khi user điền thông tin nhà trọ
coordinates: [longitude, latitude] // Ví dụ: [106.6297, 10.8231]
```

**Default:** Nếu không có coordinates, sẽ dùng tọa độ mặc định của HCMC

---

## 📝 Tóm tắt

### Điều chỉnh .env (BẮT BUỘC):
```env
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.your_public_token_here
```

### Tính năng mới:
- ✅ Mapbox Radar thay Google Maps
- ✅ Full-screen interactive map
- ✅ POI discovery trong 3km
- ✅ AI area analysis
- ✅ School distance calculator

### Test:
1. Fix token trong .env
2. Restart server
3. Vào trang chủ
4. Tìm profile có "have-room"
5. Click icon map marker
6. Enjoy Radar! 🎉
