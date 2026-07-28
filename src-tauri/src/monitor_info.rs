use serde::Serialize;

#[cfg(target_os = "windows")]
use windows::core::PCWSTR;
#[cfg(target_os = "windows")]
use windows::Win32::Foundation::{BOOL, LPARAM, RECT};
#[cfg(target_os = "windows")]
use windows::Win32::Graphics::Gdi::{
    EnumDisplayDevicesW, EnumDisplayMonitors, EnumDisplaySettingsW, GetMonitorInfoW,
    DEVMODEW, DISPLAY_DEVICEW, DISPLAY_DEVICE_ATTACHED_TO_DESKTOP, DISPLAY_DEVICE_PRIMARY_DEVICE,
    ENUM_CURRENT_SETTINGS, HDC, HMONITOR, MONITORINFOEXW,
};
#[cfg(target_os = "windows")]
use windows::Win32::System::Com::{CoCreateInstance, CoInitializeEx, CLSCTX_ALL, COINIT_APARTMENTTHREADED};
#[cfg(target_os = "windows")]
use windows::Win32::UI::Shell::{DesktopWallpaper, IDesktopWallpaper};

#[derive(Debug, Serialize, Clone)]
pub struct DisplayMonitorInfo {
    pub id: u32,
    pub device_name: String,
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
    pub is_primary: bool,
    pub resolution_str: String,
    pub current_wallpaper_path: String,
}

/// Đọc đường dẫn hình nền Windows thực tế hiện tại của từng màn hình qua COM API IDesktopWallpaper
pub fn get_current_monitor_wallpaper(monitor_index: u32) -> String {
    #[cfg(target_os = "windows")]
    unsafe {
        let _ = CoInitializeEx(None, COINIT_APARTMENTTHREADED);
        if let Ok(dw) = CoCreateInstance::<_, IDesktopWallpaper>(&DesktopWallpaper, None, CLSCTX_ALL) {
            if let Ok(mon_id) = dw.GetMonitorDevicePathAt(monitor_index) {
                if let Ok(pwstr) = dw.GetWallpaper(mon_id) {
                    let path = pwstr.to_string().unwrap_or_default();
                    return path;
                }
            }
        }
    }
    String::new()
}

#[cfg(target_os = "windows")]
unsafe extern "system" fn enum_monitors_callback(
    hmonitor: HMONITOR,
    _hdc: HDC,
    _rect: *mut RECT,
    lparam: LPARAM,
) -> BOOL {
    let mut mi = MONITORINFOEXW::default();
    mi.monitorInfo.cbSize = std::mem::size_of::<MONITORINFOEXW>() as u32;

    if GetMonitorInfoW(hmonitor, &mut mi as *mut _ as *mut _).as_bool() {
        let left = mi.monitorInfo.rcMonitor.left;
        let top = mi.monitorInfo.rcMonitor.top;
        let width = (mi.monitorInfo.rcMonitor.right - mi.monitorInfo.rcMonitor.left).unsigned_abs();
        let height = (mi.monitorInfo.rcMonitor.bottom - mi.monitorInfo.rcMonitor.top).unsigned_abs();
        let is_primary = (mi.monitorInfo.dwFlags & 1) != 0;

        let raw_name = String::from_utf16_lossy(&mi.szDevice);
        let device_name = raw_name.trim_matches('\0').trim().to_string();

        let list = &mut *(lparam.0 as *mut Vec<DisplayMonitorInfo>);
        let id = list.len() as u32;
        let wallpaper_path = get_current_monitor_wallpaper(id);

        list.push(DisplayMonitorInfo {
            id: id + 1,
            device_name,
            x: left,
            y: top,
            width,
            height,
            is_primary,
            resolution_str: format!("{}×{}", width, height),
            current_wallpaper_path: wallpaper_path,
        });
    }
    BOOL(1)
}

/// Liệt kê toàn bộ các màn hình (Primary & Secondary) đang kết nối với máy tính bằng Win32 API
pub fn get_connected_monitors() -> Vec<DisplayMonitorInfo> {
    #[cfg(target_os = "windows")]
    unsafe {
        let mut monitors: Vec<DisplayMonitorInfo> = Vec::new();

        // 1. Quét bằng EnumDisplayMonitors
        let _ = EnumDisplayMonitors(
            HDC::default(),
            None,
            Some(enum_monitors_callback),
            LPARAM(&mut monitors as *mut _ as isize),
        );

        if !monitors.is_empty() {
            return monitors;
        }

        // 2. Dự phòng quét qua EnumDisplayDevicesW
        let mut device_index = 0u32;
        loop {
            let mut dd = DISPLAY_DEVICEW::default();
            dd.cb = std::mem::size_of::<DISPLAY_DEVICEW>() as u32;

            if !EnumDisplayDevicesW(PCWSTR::null(), device_index, &mut dd, 0).as_bool() {
                break;
            }

            if (dd.StateFlags & DISPLAY_DEVICE_ATTACHED_TO_DESKTOP) != 0 {
                let mut dm = DEVMODEW::default();
                dm.dmSize = std::mem::size_of::<DEVMODEW>() as u16;

                if EnumDisplaySettingsW(PCWSTR(dd.DeviceName.as_ptr()), ENUM_CURRENT_SETTINGS, &mut dm).as_bool() {
                    let w = dm.dmPelsWidth;
                    let h = dm.dmPelsHeight;
                    let x = dm.Anonymous1.Anonymous2.dmPosition.x;
                    let y = dm.Anonymous1.Anonymous2.dmPosition.y;
                    let is_primary = (dd.StateFlags & DISPLAY_DEVICE_PRIMARY_DEVICE) != 0;
                    let name = String::from_utf16_lossy(&dd.DeviceName).trim_matches('\0').trim().to_string();
                    let wallpaper_path = get_current_monitor_wallpaper(device_index);

                    monitors.push(DisplayMonitorInfo {
                        id: device_index + 1,
                        device_name: name,
                        x,
                        y,
                        width: w,
                        height: h,
                        is_primary,
                        resolution_str: format!("{}×{}", w, h),
                        current_wallpaper_path: wallpaper_path,
                    });
                }
            }

            device_index += 1;
            if device_index > 10 {
                break;
            }
        }

        if !monitors.is_empty() {
            return monitors;
        }
    }

    // Fallback mặc định
    vec![
        DisplayMonitorInfo {
            id: 1,
            device_name: "\\\\.\\DISPLAY1".into(),
            x: 0,
            y: 0,
            width: 2560,
            height: 1600,
            is_primary: true,
            resolution_str: "2560×1600".into(),
            current_wallpaper_path: "".into(),
        },
        DisplayMonitorInfo {
            id: 2,
            device_name: "\\\\.\\DISPLAY2".into(),
            x: 2560,
            y: 0,
            width: 1280,
            height: 1024,
            is_primary: false,
            resolution_str: "1280×1024".into(),
            current_wallpaper_path: "".into(),
        },
    ]
}
