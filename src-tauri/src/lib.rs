pub mod workerw;

use serde::Serialize;
use workerw::{attach_to_workerw, init_workerw, WorkerWStatus};

#[derive(Debug, Serialize)]
pub struct VirtualDesktopInfo {
    pub id: u32,
    pub name: String,
    pub active: bool,
    pub wallpaper: String,
}

#[derive(Debug, Serialize)]
pub struct SystemMetrics {
    pub cpu_usage_percent: f32,
    pub ram_usage_mb: u64,
    pub fullscreen_detected: bool,
}

#[tauri::command]
fn init_workerw_engine() -> Result<WorkerWStatus, String> {
    init_workerw()
}

#[tauri::command]
fn attach_wallpaper_window(child_hwnd: usize) -> Result<String, String> {
    attach_to_workerw(child_hwnd)
}

#[tauri::command]
fn get_virtual_desktops() -> Vec<VirtualDesktopInfo> {
    // Mock danh sách Virtual Desktop chuẩn bị cho COM API binding
    vec![
        VirtualDesktopInfo {
            id: 1,
            name: "Desktop 1".into(),
            active: true,
            wallpaper: "Aurora Drift".into(),
        },
        VirtualDesktopInfo {
            id: 2,
            name: "Desktop 2".into(),
            active: false,
            wallpaper: "Neon City Rain".into(),
        },
        VirtualDesktopInfo {
            id: 3,
            name: "Desktop 3".into(),
            active: false,
            wallpaper: "Deep Ocean Flow".into(),
        },
        VirtualDesktopInfo {
            id: 4,
            name: "Work".into(),
            active: false,
            wallpaper: "Minimal White Noise".into(),
        },
        VirtualDesktopInfo {
            id: 5,
            name: "Gaming".into(),
            active: false,
            wallpaper: "Cyberpunk Alley".into(),
        },
    ]
}

#[tauri::command]
fn get_system_metrics() -> SystemMetrics {
    SystemMetrics {
        cpu_usage_percent: 2.4,
        ram_usage_mb: 38,
        fullscreen_detected: false,
    }
}

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            init_workerw_engine,
            attach_wallpaper_window,
            get_virtual_desktops,
            get_system_metrics
        ])
        .run(tauri::generate_context!())
        .expect("Lỗi khi khởi chạy ứng dụng Tauri");
}
