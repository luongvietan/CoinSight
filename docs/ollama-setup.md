# Hướng dẫn cài đặt Ollama cho CoinSight AI Insights

Tài liệu này hướng dẫn bạn cách cài đặt và cấu hình Ollama để có thể chạy các mô hình AI offline cho tính năng AI Insights trong CoinSight.

## 1. Cài đặt Ollama

### Windows

1. Tải Ollama từ trang chủ: [https://ollama.com/download/windows](https://ollama.com/download/windows)
2. Cài đặt Ollama theo hướng dẫn.
3. Sau khi cài đặt, Ollama sẽ chạy như một dịch vụ trên máy tính của bạn.

### macOS

1. Tải Ollama từ trang chủ: [https://ollama.com/download/mac](https://ollama.com/download/mac)
2. Cài đặt Ollama theo hướng dẫn.
3. Mở Ollama từ Launchpad hoặc thư mục Applications.

### Linux

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

## 2. Cài đặt mô hình Llama 3.2

Sau khi cài đặt Ollama, bạn cần tải mô hình Llama 3.2 về máy:

1. Mở Terminal hoặc Command Prompt
2. Chạy lệnh sau để tải Llama 3.2:

```bash
ollama pull llama3.2
```

Quá trình tải mô hình có thể mất từ 5-15 phút tùy thuộc vào tốc độ internet của bạn và cấu hình máy tính.

## 3. Cấu hình CoinSight để sử dụng Ollama

1. Mở file `.env.local` trong thư mục gốc của CoinSight
2. Đảm bảo các biến môi trường sau được cấu hình:

```
OLLAMA_API_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

3. Khởi động lại ứng dụng CoinSight:

```bash
npm run dev
```

## 4. Kiểm tra kết nối tới Ollama

1. Đảm bảo Ollama đang chạy trên máy của bạn (kiểm tra biểu tượng Ollama trong system tray).
2. Chạy lệnh kiểm tra kết nối:

```bash
npm run test-ollama
```

3. Nếu kết nối thành công, bạn sẽ thấy thông báo xác nhận.
4. Truy cập trang dashboard của CoinSight và phần AI Insights sẽ tự động sử dụng Ollama.

## 5. Khắc phục sự cố

### Nếu AI Insights không hoạt động:

1. **Kiểm tra Ollama**: Đảm bảo Ollama đang chạy và mô hình llama3.2 đã được tải.
2. **Kiểm tra kết nối**: Đảm bảo ứng dụng CoinSight có thể kết nối tới Ollama API endpoint.
3. **Kiểm tra logs**: Xem logs của ứng dụng để tìm lỗi kết nối hoặc lỗi gọi API.

### Thử nghiệm kết nối với Ollama:

Bạn có thể kiểm tra kết nối tới Ollama bằng lệnh:

```bash
curl -X POST http://localhost:11434/api/generate -d '{
  "model": "llama3.2",
  "prompt": "Xin chào",
  "stream": false
}'
```

Nếu nhận được phản hồi, Ollama đang hoạt động bình thường.

## 6. Sử dụng các mô hình Ollama khác

Nếu muốn sử dụng mô hình khác thay vì llama3.2, bạn có thể:

1. Tải mô hình mới: `ollama pull tên_mô_hình`
2. Cập nhật biến môi trường: `OLLAMA_MODEL=tên_mô_hình` trong file `.env.local`

Tuy nhiên, chúng tôi khuyến nghị sử dụng llama3.2 vì mô hình này có hiệu suất tốt hơn các phiên bản trước và hỗ trợ tiếng Việt tốt.

## 7. Lưu ý về yêu cầu phần cứng

Để chạy mô hình Llama 3.2 hiệu quả, bạn cần:

- RAM: tối thiểu 8GB, khuyến nghị 16GB+
- Ổ cứng: cần ít nhất 5-10GB trống để lưu trữ mô hình
- GPU: Không bắt buộc nhưng sẽ cải thiện tốc độ đáng kể

### Mô hình Llama 3.2 so với các phiên bản trước

Llama 3.2 là phiên bản cải tiến của Llama 3 với hiệu suất tốt hơn, đặc biệt là:

- Xử lý tiếng Việt tốt hơn
- Khả năng theo dõi hướng dẫn (instruction following) tốt hơn
- Cần ít bộ nhớ hơn để chạy
- Phản hồi nhanh hơn

---

Nếu gặp bất kỳ vấn đề gì trong quá trình cài đặt, vui lòng liên hệ với đội hỗ trợ hoặc kiểm tra tài liệu chính thức tại [https://ollama.com/](https://ollama.com/).
