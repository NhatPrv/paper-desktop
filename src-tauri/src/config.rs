use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DesktopSetting {
    pub id: u32,
    pub guid: String,
    pub name: String,
    pub wallpaper_path: String,
    pub wallpaper_type: String, // "video" | "image" | "none"
    pub volume: f32,            // 0.0 to 1.0
    pub paused: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppConfig {
    pub global_active: bool,
    pub global_volume: f32,
    pub auto_pause_fullscreen: bool,
    pub desktops: Vec<DesktopSetting>,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            global_active: true,
            global_volume: 0.0, // Mute audio by default for wallpapers
            auto_pause_fullscreen: true,
            desktops: vec![
                DesktopSetting {
                    id: 1,
                    guid: "default-1".into(),
                    name: "Desktop 1".into(),
                    wallpaper_path: "".into(),
                    wallpaper_type: "none".into(),
                    volume: 0.0,
                    paused: false,
                },
                DesktopSetting {
                    id: 2,
                    guid: "default-2".into(),
                    name: "Desktop 2".into(),
                    wallpaper_path: "".into(),
                    wallpaper_type: "none".into(),
                    volume: 0.0,
                    paused: false,
                },
                DesktopSetting {
                    id: 3,
                    guid: "default-3".into(),
                    name: "Desktop 3".into(),
                    wallpaper_path: "".into(),
                    wallpaper_type: "none".into(),
                    volume: 0.0,
                    paused: false,
                },
            ],
        }
    }
}

pub fn get_config_path() -> PathBuf {
    if let Some(mut dir) = dirs::config_dir() {
        dir.push("PaperDesktop");
        let _ = fs::create_dir_all(&dir);
        dir.push("config.json");
        dir
    } else {
        PathBuf::from("config.json")
    }
}

pub fn load_config() -> AppConfig {
    let path = get_config_path();
    if path.exists() {
        if let Ok(content) = fs::read_to_string(&path) {
            if let Ok(cfg) = serde_json::from_str::<AppConfig>(&content) {
                return cfg;
            }
        }
    }
    let default_cfg = AppConfig::default();
    let _ = save_config(&default_cfg);
    default_cfg
}

pub fn save_config(config: &AppConfig) -> Result<(), String> {
    let path = get_config_path();
    let json = serde_json::to_string_pretty(config)
        .map_err(|e| format!("Lỗi serialize cấu hình JSON: {}", e))?;
    fs::write(&path, json).map_err(|e| format!("Lỗi ghi file config.json: {}", e))?;
    Ok(())
}
