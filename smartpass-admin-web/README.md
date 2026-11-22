# SmartPass Admin Web UI

Giao diện quản trị hệ thống thẻ học đường thông minh SmartPass (Vite + React 18 + TypeScript + Ant Design v5).

---

## 1. Yêu cầu tiên quyết (Prerequisites)

- **Node.js**: Phiên bản 20 trở lên
- **SmartPass Backend REST API**: Đang chạy tại `http://localhost:3000` (`cd ../smartpass-backend && npm start`)
- **Tài khoản quản trị viên (Admin)**: Đã được khởi tạo qua seed (`admin@smartpass.edu` / `Admin@123`)

---

## 2. Hướng dẫn cài đặt & Khởi chạy (Run Instructions)

```bash
# 1. Di chuyển vào thư mục admin web
cd smartpass-admin-web

# 2. Cài đặt các gói thư viện phụ thuộc
npm install

# 3. Tạo file cấu hình môi trường từ file mẫu
cp .env.example .env

# 4. Khởi động máy chủ phát triển Vite
npm run dev

# 5. Mở trình duyệt và truy cập
# http://localhost:5173
```

---

## 3. Quy chuẩn công nghệ & Kiến trúc

- **Framework**: React 18 + Vite + TypeScript (Strict Mode)
- **UI Library**: Ant Design v5 (`antd`) + `@ant-design/icons`
- **Theme Design System**:
  - Color Primary: `#0F766E`
  - Font Stack: System Font Stack
  - Border Radius: `8px`
  - Locale: Tiếng Việt (`vi_VN` + `dayjs/locale/vi`)
- **HTTP Client**: Axios với Interceptor tự động xử lý token JWT, chuẩn hóa định dạng trả về và kiểm soát lỗi HTTP thống nhất
- **Bảo mật**: Chỉ cho phép tài khoản có vai trò `admin` đăng nhập. Dữ liệu y tế khẩn cấp tuân thủ chính sách bảo mật Zero-Knowledge Privacy.

