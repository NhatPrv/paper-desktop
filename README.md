# Paper Desktop 🖥️✨

> **Paper Desktop** là ứng dụng Windows Desktop mã nguồn mở cho phép quản lý và cài đặt Live Wallpaper (Video) / Hình nền tĩnh độc lập cho từng **Virtual Desktop (Desktop ảo)** trên Windows 10/11 với hiệu năng tối ưu tối đa.

---

## 🌟 Tính năng nổi bật

- 🖥️ **Virtual Desktop Isolation**: Cài đặt hình nền/video riêng biệt cho từng Desktop ảo.
- 🎬 **Live Wallpaper Engine**: Nhúng trực tiếp Video/Đồ họa động vào cửa sổ `WorkerW` dưới Desktop Icons.
- ⚡ **Siêu nhẹ & Hiệu năng cao**: Được xây dựng với **Tauri (v2)** và **Rust Core Win32 API**.
- ⏸️ **Smart Auto-Pause**: Tự động tạm dừng Video khi có ứng dụng khác chạy ở chế độ Fullscreen (Chơi game, xem phim) để giải phóng 100% GPU/CPU.
- 🎨 **Fluent Glassmorphism UI**: Giao diện thiết kế theo ngôn ngữ Windows 11 Fluent Design hiện đại, mượt mà.

---

## 🏗️ Kiến trúc & Tài liệu Dự án

Tài liệu chi tiết về dự án được tổ chức trong thư mục [`docs/`](./docs/):

- 📜 [Tài liệu Kiến trúc Hệ thống (System Architecture)](./docs/SYSTEM_ARCHITECTURE.md)
- 🗺️ [Lộ trình phát triển & Quản lý Sprint (Roadmap)](./docs/ROADMAP.md)

---

## 🛠️ Công nghệ sử dụng

- **Core Backend**: Rust (`windows-rs`, Win32 API Interop, COM API)
- **UI Framework**: Tauri v2, React, Tailwind CSS, Lucide Icons
- **Target OS**: Windows 10 / Windows 11 (64-bit)

---

## 🚀 Giấy phép & Đóng góp

Dự án được bảo hộ theo giấy phép MIT License.
