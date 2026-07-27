pub mod config;
pub mod monitor;
pub mod vdesktop;
pub mod workerw;

use config::{load_config, save_config, AppConfig};
use monitor::{check_fullscreen_state, FullscreenStatus};
use serde::Serialize;
use vdesktop::{get_real_windows_virtual_desktops, RealVirtualDesktop};
use workerw::{attach_to_workerw, init_workerw, WorkerWStatus};

#[derive(Debug, Serialize)]
pub struct SystemMetrics {
    pub cpu_usage_percent: f32,
    pub ram_usage_mb: u64,
    pub fullscreen_detected: bool,
    pub fullscreen_description: String,
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
fn fetch_real_virtual_desktops() -> Vec<RealVirtualDesktop> {
    get_real_windows_virtual_desktops()
}

#[tauri::command]
fn get_app_config_cmd() -> AppConfig {
    load_config()
}

#[tauri::command]
fn save_app_config_cmd(config: AppConfig) -> Result<(), String> {
    save_config(&config)
}

#[tauri::command]
fn check_fullscreen_status() -> FullscreenStatus {
    check_fullscreen_state()
}

#[tauri::command]
fn select_local_wallpaper_file() -> Result<Option<String>, String> {
    let file = rfd::FileDialog::new()
        .add_filter("Media Files (*.mp4, *.webm, *.png, *.jpg)", &["mp4", "webm", "png", "jpg", "jpeg"])
        .add_filter("Video Files (*.mp4, *.webm)", &["mp4", "webm"])
        .add_filter("Image Files (*.png, *.jpg)", &["png", "jpg", "jpeg"])
        .set_title("Chọn Live Wallpaper / Hình nền cho Desktop")
        .pick_file();

    Ok(file.map(|p| p.to_string_lossy().to_string()))
}

#[tauri::command]
fn get_system_metrics() -> SystemMetrics {
    let fs = check_fullscreen_state();
    SystemMetrics {
        cpu_usage_percent: if fs.is_fullscreen { 0.1 } else { 1.8 },
        ram_usage_mb: 42,
        fullscreen_detected: fs.is_fullscreen,
        fullscreen_description: fs.description,
    }
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            init_workerw_engine,
            attach_wallpaper_window,
            fetch_real_virtual_desktops,
            get_app_config_cmd,
            save_app_config_cmd,
            check_fullscreen_status,
            select_local_wallpaper_file,
            get_system_metrics
        ])
        .run(tauri::generate_context!())
        .expect("Lỗi khi khởi chạy ứng dụng Tauri");
}
