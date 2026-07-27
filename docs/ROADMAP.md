# ROADMAP & SPRINT PLAN: PAPER DESKTOP

## TỔNG QUAN LỘ TRÌNH 4 SPRINTS

```
[Sprint 1: Architecture & UI Setup] ➔ [Sprint 2: Core Win32 POC] ➔ [Sprint 3: Tauri Integration] ➔ [Sprint 4: Performance & Package]
```

---

## SPRINT 1: ARCHITECTURE & UI/UX DESIGN (TUẦN 1)
**Mục tiêu**: Xây dựng kiến trúc hệ thống, tài liệu định hướng và thiết kế UI hoàn chỉnh qua Figma / v0.dev.

### Tasks:
- [x] Tạo tài liệu System Architecture & Roadmap.
- [x] Tạo file `.gitignore` tối ưu hóa AI context.
- [ ] Thiết kế Prompt AI sinh UI Figma & v0.dev (Windows 11 Fluent Glassmorphism UI).
- [ ] Tạo khung dự án Tauri (v2) + React Frontend scaffold.

**Acceptance Criteria**:
- Repository sẵn sàng trên GitHub.
- Frontend React có giao diện mẫu với các tab: *Virtual Desktops*, *Wallpaper Library*, *Settings*.

---

## SPRINT 2: CORE SYSTEM POC - WIN32 & WORKERW (TUẦN 2)
**Mục tiêu**: Làm chủ Win32 API Injection và Virtual Desktop API bằng Rust.

### Tasks:
- [ ] Viết POC Rust tương tác Message `0x052C` với `Progman` để bóc tách cửa sổ `WorkerW`.
- [ ] Nhúng cửa sổ Video Player làm con của `WorkerW` sử dụng `SetParent`.
- [ ] Lắng nghe sự kiện Virtual Desktop Switch thông qua COM API.

**Acceptance Criteria**:
- Chạy được ứng dụng POC hiển thị video nền đằng sau Desktop Icons.
- Đổi Desktop ảo trên Windows thì phát hiện được ID của Desktop mới.

---

## SPRINT 3: DESKTOP INTEGRATION & STATE MANAGEMENT (TUẦN 3)
**Mục tiêu**: Ghép nối UI React với Core Rust backend qua Tauri IPC.

### Tasks:
- [ ] Xây dựng Tauri Commands: `get_virtual_desktops`, `set_desktop_wallpaper`, `toggle_live_wallpaper`.
- [ ] Lưu trữ cấu hình danh sách Wallpaper đã gán cho từng Desktop vào `config.json`.
- [ ] Thêm tính năng Preview Wallpaper và quản lý Thư viện Wallpaper cá nhân.

**Acceptance Criteria**:
- Thay đổi cấu hình Wallpaper trên UI lập tức cập nhật tương ứng trên Desktop được chọn.

---

## SPRINT 4: PERFORMANCE OPTIMIZATION & PACKAGING (TUẦN 4)
**Mục tiêu**: Auto-pause khi Fullscreen, kiểm soát RAM/CPU và đóng gói file cài đặt.

### Tasks:
- [ ] Tích hợp `SHQueryUserNotificationState` để phát hiện ứng dụng bật Fullscreen.
- [ ] Tự động Pause Video Wallpaper khi Fullscreen và Mute hoàn toàn âm thanh.
- [ ] Đóng gói ứng dụng thành file installer (`.msi` / `.exe` qua Tauri Bundler).

**Acceptance Criteria**:
- Mức sử dụng CPU khi đang chạy Video Wallpaper < 3%.
- Mức sử dụng RAM tổng < 50MB.
- Tự động Pause 100% khi mở Game/Ứng dụng Fullscreen.
