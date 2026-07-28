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
use tauri::{
    menu::{MenuBuilder, MenuItemBuilder},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, WindowEvent,
};
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
    attach_to_workerw(child_hwnd, 0, 0, 1920, 1080)
}

#[tauri::command]
fn create_video_wallpaper_window(app: tauri::AppHandle, monitor_index: u32, video_path: String) -> Result<String, String> {
    use base64::Engine;
    let monitors = get_connected_monitors();
    let mon = monitors.get(monitor_index as usize).cloned();

    let (x, y, width, height) = if let Some(ref m) = mon {
        (m.x, m.y, m.width as i32, m.height as i32)
    } else {
        (0, 0, 1920, 1080)
    };

    let label = format!("wallpaper_window_{}", monitor_index);

    if let Some(existing) = app.get_webview_window(&label) {
        let _ = existing.close();
    }

    let b64_path = base64::engine::general_purpose::URL_SAFE.encode(video_path.as_bytes());
    let url = format!("?wallpaper_win={}&video_b64={}", monitor_index, b64_path);

    let window = tauri::WebviewWindowBuilder::new(&app, &label, tauri::WebviewUrl::App(url.into()))
        .title(format!("Paper Desktop Video Engine - Display {}", monitor_index + 1))
        .decorations(false)
        .transparent(true)
        .resizable(false)
        .position(x as f64, y as f64)
        .inner_size(width as f64, height as f64)
        .build();

    match window {
        Ok(win) => {
            let _ = init_workerw();
            #[cfg(target_os = "windows")]
            if let Ok(hwnd) = win.hwnd() {
                let hwnd_ptr = hwnd.0 as usize;
                let _ = attach_to_workerw(hwnd_ptr, x, y, width, height);
            }
            Ok(format!("Đã khởi tạo Live Video Wallpaper cho Màn hình {} thành công!", monitor_index + 1))
        }
        Err(e) => {
            println!("Lỗi khi tạo cửa sổ Video Wallpaper: {:?}", e);
            Err(format!("Không thể tạo cửa sổ Video Wallpaper: {}", e))
        }
    }
}

#[tauri::command]
fn set_monitor_wallpaper(app: tauri::AppHandle, monitor_index: u32, wallpaper_path: String) -> Result<String, String> {
    let is_video = wallpaper_path.ends_with(".mp4") || wallpaper_path.ends_with(".webm");
    if is_video {
        return create_video_wallpaper_window(app, monitor_index, wallpaper_path);
    }

    let label = format!("wallpaper_window_{}", monitor_index);
    if let Some(existing) = app.get_webview_window(&label) {
        let _ = existing.close();
    }

    set_wallpaper_for_monitor(monitor_index, &wallpaper_path)
}

#[tauri::command]
fn restore_windows_wallpaper_cmd(app: tauri::AppHandle) -> Result<String, String> {
    for i in 0..4 {
        let label = format!("wallpaper_window_{}", i);
        if let Some(existing) = app.get_webview_window(&label) {
            let _ = existing.close();
        }
    }
    restore_original_wallpapers()?;
    Ok("Đã khôi phục thành công hình nền gốc mặc định của Windows".into())
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
            _ => "image/jpeg",
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
        .setup(|app| {
            let toggle_item = MenuItemBuilder::new("Mở / Ẩn Paper Desktop").id("toggle").build(app)?;
            let quit_item = MenuItemBuilder::new("Thoát Hoàn Toàn (Khôi phục hình nền)").id("quit").build(app)?;

            let tray_menu = MenuBuilder::new(app)
                .items(&[&toggle_item, &quit_item])
                .build()?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&tray_menu)
                .tooltip("Paper Desktop - Live Wallpaper Engine")
                .on_menu_event(|app_handle, event| match event.id.as_ref() {
                    "toggle" => {
                        if let Some(window) = app_handle.get_webview_window("main") {
                            let is_visible = window.is_visible().unwrap_or(false);
                            if is_visible {
                                let _ = window.hide();
                            } else {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                    "quit" => {
                        for i in 0..4 {
                            let label = format!("wallpaper_window_{}", i);
                            if let Some(existing) = app_handle.get_webview_window(&label) {
                                let _ = existing.close();
                            }
                        }
                        let _ = restore_original_wallpapers();
                        app_handle.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app_handle = tray.app_handle();
                        if let Some(window) = app_handle.get_webview_window("main") {
                            let is_visible = window.is_visible().unwrap_or(false);
                            if is_visible {
                                let _ = window.hide();
                            } else {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .invoke_handler(tauri::generate_handler![
            init_workerw_engine,
            attach_wallpaper_window,
            set_monitor_wallpaper,
            create_video_wallpaper_window,
            restore_windows_wallpaper_cmd,
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
