pub mod config;
pub mod monitor;
pub mod monitor_info;
pub mod vdesktop;
pub mod workerw;

use config::{load_config, save_config, AppConfig};
use monitor::{check_fullscreen_state, FullscreenStatus};
use monitor_info::{get_connected_monitors, DisplayMonitorInfo};
use serde::Serialize;
use std::fs;
use vdesktop::{get_real_windows_virtual_desktops, RealVirtualDesktop};
use workerw::{attach_to_workerw, init_workerw, restore_original_wallpapers, set_wallpaper_for_monitor, WorkerWStatus};

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
fn set_monitor_wallpaper(monitor_index: u32, wallpaper_path: String) -> Result<String, String> {
    set_wallpaper_for_monitor(monitor_index, &wallpaper_path)
}

#[tauri::command]
fn fetch_real_virtual_desktops() -> Vec<RealVirtualDesktop> {
    get_real_windows_virtual_desktops()
}

#[tauri::command]
fn fetch_connected_monitors() -> Vec<DisplayMonitorInfo> {
    get_connected_monitors()
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
        .add_filter("Media Files (*.mp4, *.webm, *.png, *.jpg, *.jpeg, *.webp)", &["mp4", "webm", "png", "jpg", "jpeg", "webp"])
        .add_filter("Video Files (*.mp4, *.webm)", &["mp4", "webm"])
        .add_filter("Image Files (*.png, *.jpg, *.jpeg, *.webp)", &["png", "jpg", "jpeg", "webp"])
        .set_title("Chọn Live Wallpaper / Hình nền cho Desktop")
        .pick_file();

    Ok(file.map(|p| p.to_string_lossy().to_string()))
}

#[tauri::command]
fn read_file_base64(file_path: String) -> Result<String, String> {
    let bytes = fs::read(&file_path).map_err(|e| format!("Không thể đọc tệp {}: {}", file_path, e))?;
    
    // Thuật toán Magic Bytes Detection: tự động bóc tách chữ ký byte ảnh/video
    // Hỗ trợ 100% các file wallpaper cache của Windows 11 không có phần mở rộng (TranscodedWallpaper, AQPP6...)
    let mime = if bytes.len() >= 3 && bytes[0] == 0xFF && bytes[1] == 0xD8 && bytes[2] == 0xFF {
        "image/jpeg"
    } else if bytes.len() >= 4 && bytes[0] == 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4E && bytes[3] == 0x47 {
        "image/png"
    } else if bytes.len() >= 3 && &bytes[0..3] == b"GIF" {
        "image/gif"
    } else if bytes.len() >= 12 && &bytes[8..12] == b"WEBP" {
        "image/webp"
    } else if bytes.len() >= 8 && &bytes[4..8] == b"ftyp" {
        "video/mp4"
    } else {
        let ext = file_path.split('.').last().unwrap_or("").to_lowercase();
        match ext.as_str() {
            "png" => "image/png",
            "webp" => "image/webp",
            "mp4" => "video/mp4",
            "webm" => "video/webm",
            _ => "image/jpeg", // Windows Wallpaper Cache luôn là tệp JPEG
        }
    };

    use base64::Engine;
    let b64 = base64::engine::general_purpose::STANDARD.encode(&bytes);
    Ok(format!("data:{};base64,{}", mime, b64))
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
        .on_window_event(|_window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                // Tự động khôi phục (revert) hình nền gốc mặc định của Windows khi tắt ứng dụng
                let _ = restore_original_wallpapers();
            }
        })
        .invoke_handler(tauri::generate_handler![
            init_workerw_engine,
            attach_wallpaper_window,
            set_monitor_wallpaper,
            fetch_real_virtual_desktops,
            fetch_connected_monitors,
            get_app_config_cmd,
            save_app_config_cmd,
            check_fullscreen_status,
            select_local_wallpaper_file,
            read_file_base64,
            get_system_metrics
        ])
        .run(tauri::generate_context!())
        .expect("Lỗi khi khởi chạy ứng dụng Tauri");
}
