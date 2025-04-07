# CoinSight - Bộ công cụ kiểm thử

Bộ công cụ này cung cấp các kiểm thử tự động cho ứng dụng CoinSight, bao gồm authentication, Firestore, API, hiệu năng và tích hợp.

## Cài đặt

```bash
# Di chuyển vào thư mục testing
cd lib/firebase/testing

# Cài đặt các dependencies
npm install
```

## Cấu hình

Bạn có thể chạy kiểm thử theo hai chế độ:

- **Chế độ mock**: Không cần kết nối Firebase thật, sử dụng mock data
- **Chế độ thật**: Kết nối với Firebase thật, yêu cầu cấu hình API keys

### Cấu hình môi trường thật

Tạo file `.env` với nội dung:

```
# Firebase Config
NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxxxxxxxx
NEXT_PUBLIC_FIREBASE_APP_ID=1:xxxxxxx:web:xxxxx

# Không sử dụng mock data
USE_MOCK_AUTH=false
USE_MOCK_DATA=false
USE_MOCK_API=false

# Tắt CSP để tránh lỗi unsafe-eval
DISABLE_CSP=true

# Môi trường
NODE_ENV=development
```

## Chạy kiểm thử

### Kiểm thử tổng hợp (Khuyên dùng)

```bash
# Chạy tất cả kiểm thử với mock data (nhanh)
npm test

# Chạy tất cả kiểm thử với mock data (cách khác)
npm run test:combined:mock

# Chạy tất cả kiểm thử với Firebase thật
npm run test:combined:real
```

### Chạy kiểm thử riêng lẻ (mock)

```bash
# Authentication
npm run test:auth:mock

# Firestore
npm run test:firestore:mock

# API
npm run test:api:mock

# Hiệu năng
npm run test:performance:mock

# Tích hợp
npm run test:integration:mock
```

### Chạy kiểm thử riêng lẻ (thật)

```bash
# Authentication
npm run test:auth

# Firestore
npm run test:firestore

# API
npm run test:api

# Hiệu năng
npm run test:performance

# Tích hợp
npm run test:integration
```

### Chạy kiểm thử tuần tự (legacy)

```bash
# Chạy tất cả kiểm thử tuần tự với mock data
npm run test:all:mock

# Chạy tất cả kiểm thử tuần tự với Firebase thật
npm run test:all:real
```

## Mô tả các kiểm thử

1. **Authentication Tests (auth-tests.ts)**:

   - Đăng ký người dùng mới
   - Đăng xuất
   - Đăng nhập

2. **Firestore Tests (firestore-tests.ts)**:

   - Thêm giao dịch
   - Lấy chi tiết giao dịch
   - Cập nhật giao dịch
   - Xóa giao dịch
   - Lấy danh sách giao dịch

3. **API Tests (api-tests.ts)**:

   - Kiểm tra API lấy danh sách giao dịch
   - Kiểm tra API phân loại giao dịch

4. **Performance Tests (performance-tests.ts)**:

   - Đo tốc độ đọc dữ liệu
   - Đo tốc độ ghi dữ liệu
   - Đo tốc độ cập nhật
   - Đo tốc độ xóa
   - Đánh giá hiệu năng

5. **Integration Tests (integration-tests.ts)**:
   - Kiểm thử luồng đầy đủ từ đăng ký đến phân loại

## Gỡ lỗi

### Lỗi Content Security Policy (CSP)

Nếu gặp lỗi CSP như "Refused to execute inline script", hãy thực hiện:

1. Đảm bảo đã cài đặt `DISABLE_CSP=true` trong file `.env`
2. Đã tạo file `v0-user-next.config.mjs` ở thư mục gốc với nội dung:

```javascript
const nextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              process.env.DISABLE_CSP === "true"
                ? ""
                : "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' *.firebaseio.com; connect-src 'self' *.googleapis.com *.firebaseio.com wss://*.firebaseio.com; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; frame-src 'self' *.firebaseapp.com;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

3. Khởi động lại server Next.js

### Lỗi kết nối Firebase

Nếu gặp lỗi "Firebase: Error (auth/invalid-api-key)", hãy kiểm tra:

- API Key trong file `.env` đã chính xác chưa
- Tài khoản Firebase của bạn đã được kích hoạt đầy đủ chưa

### Lỗi "cannot find module"

Cài đặt lại dependencies:

```bash
npm install
```

### Sử dụng emulator

Bạn có thể sử dụng Firebase Emulator cho kiểm thử:

1. Cài đặt Firebase CLI: `npm install -g firebase-tools`
2. Khởi động emulator: `firebase emulators:start`
3. Sửa file `.env`:
   ```
   USE_FIREBASE_EMULATOR=true
   ```

## Tùy chỉnh nâng cao

### Thêm kiểm thử mới

1. Tạo file kiểm thử mới trong thư mục `lib/firebase/testing`
2. Thêm các hàm kiểm thử (mock và real) với cùng interface
3. Thêm import vào file `index-tests.ts`
4. Thêm script mới vào `package.json`
