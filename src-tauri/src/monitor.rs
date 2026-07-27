use serde::Serialize;

#[cfg(target_os = "windows")]
use windows::Win32::UI::Shell::{
    SHQueryUserNotificationState,
    QUNS_BUSY, QUNS_PRESENTATION_MODE, QUNS_RUNNING_D3D_FULL_SCREEN,
};

#[derive(Debug, Serialize, Clone)]
pub struct FullscreenStatus {
    pub is_fullscreen: bool,
    pub state_code: u32,
    pub description: String,
}

/// Kiểm tra xem hiện tại Windows có ứng dụng/game nào đang chạy Fullscreen hay không
pub fn check_fullscreen_state() -> FullscreenStatus {
    #[cfg(target_os = "windows")]
    unsafe {
        if let Ok(state) = SHQueryUserNotificationState() {
            let code = state.0 as u32;
            let is_fs = state == QUNS_BUSY
                || state == QUNS_RUNNING_D3D_FULL_SCREEN
                || state == QUNS_PRESENTATION_MODE;

            let desc = match state {
                QUNS_RUNNING_D3D_FULL_SCREEN => "Phát hiện Game 3D / DirectX Fullscreen đang chạy".into(),
                QUNS_BUSY => "Phát hiện ứng dụng Fullscreen / Video bận".into(),
                QUNS_PRESENTATION_MODE => "Phát hiện chế độ Trình chiếu (Presentation Mode)".into(),
                _ => "Không có ứng dụng Fullscreen nào đang active".into(),
            };

            return FullscreenStatus {
                is_fullscreen: is_fs,
                state_code: code,
                description: desc,
            };
        }
    }

    FullscreenStatus {
        is_fullscreen: false,
        state_code: 0,
        description: "Hệ điều hành không phải Windows hoặc không thể đọc notification state".into(),
    }
}
