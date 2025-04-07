# CoinSight Backend

Backend cho ứng dụng "CoinSight - AI-Powered Personal Finance Management"

## Tech stack

- **Firebase**: Firestore, Authentication, Cloud Functions
- **Next.js API Routes**: Xử lý các endpoint API
- **Stripe**: Xử lý thanh toán
- **OpenAI**: Phân loại giao dịch tự động

## Triển khai Firebase

### 1. Tạo Firebase Project

1. Truy cập [Firebase Console](https://console.firebase.google.com/)
2. Tạo project mới với tên "CoinSight-Prod"
3. Bật các dịch vụ:
   - Authentication: Email/Password + Google Sign-in
   - Firestore Database: Production mode
   - Cloud Functions: Node.js 18

### 2. Cài đặt Firebase CLI và Deploy Functions

```bash
# Cài đặt Firebase CLI
npm install -g firebase-tools

# Đăng nhập vào Firebase
firebase login

# Di chuyển đến thư mục functions
cd lib/firebase/cloud-functions

# Khởi tạo Firebase project
firebase init

# Chọn project vừa tạo
# Chọn Firestore và Functions

# Deploy chỉ Cloud Functions
firebase deploy --only functions
```

### 3. Triển khai Security Rules

Truy cập Firestore Database trong Firebase Console và thay thế rules với nội dung từ file `lib/firebase/security-rules.txt`.

## Biến môi trường trên Vercel

Đảm bảo thiết lập đầy đủ các biến môi trường trên Vercel:

### Firebase Config:

- NEXT_PUBLIC_FIREBASE_API_KEY
- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
- NEXT_PUBLIC_FIREBASE_PROJECT_ID
- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
- NEXT_PUBLIC_FIREBASE_APP_ID

### API Keys:

- OPENAI_API_KEY
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET

### Site Config:

- NEXT_PUBLIC_SITE_URL

### Sentry:

- SENTRY_DSN

## Sử dụng trong Frontend

```typescript
// Ví dụ: Thêm giao dịch mới
import { addTransaction } from "@/lib/firebase";

const newTransaction = {
  userId: currentUser.uid,
  amount: 150000,
  description: "Mua cà phê",
  category: "food",
  date: new Date(),
  isRecurring: false,
};

// Thêm vào database
const transaction = await addTransaction(newTransaction);
```

## Xử lý Webhook Stripe

1. Cấu hình Webhook trong [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Thêm endpoint: `https://coinsight.app/api/stripe-webhook`
3. Chọn sự kiện:
   - `checkout.session.completed`
   - `customer.subscription.deleted`

## Xử lý phân loại tự động

Khi một giao dịch mới được tạo, Cloud Function `classifyTransaction` sẽ tự động được kích hoạt và phân loại giao dịch dựa vào mô tả, sử dụng OpenAI.

## Kiểm tra và Giám sát

- **Sentry**: Giám sát lỗi và hiệu suất
- **Firebase Console**: Xem logs từ Cloud Functions
- **Stripe Dashboard**: Kiểm tra thanh toán và đăng ký

## Các API Endpoint

- `GET /api/transactions?userId=xyz`: Lấy danh sách giao dịch
- `POST /api/classify-transaction`: Phân loại giao dịch
- `POST /api/create-stripe-session`: Tạo phiên thanh toán Stripe
- `POST /api/stripe-webhook`: Webhook nhận thông báo từ Stripe

## Backup & Khôi phục

Thực hiện backup dữ liệu Firestore theo lịch, lưu trữ trong Google Cloud Storage.

```bash
# Backup Firestore
gcloud firestore export gs://coinsight-backups/$(date +%Y-%m-%d) \
  --collection-ids=users,transactions,budgets

# Khôi phục dữ liệu
gcloud firestore import gs://coinsight-backups/2023-11-15/ \
  --collection-ids=users,transactions
```
