use serde::Serialize;

#[cfg(target_os = "windows")]
use windows::Win32::Foundation::{BOOL, LPARAM, RECT};
#[cfg(target_os = "windows")]
use windows::Win32::Graphics::Gdi::{
    EnumDisplayMonitors, GetMonitorInfoW, HDC, HMONITOR, MONITORINFOEXW,
};

#[derive(Debug, Serialize, Clone)]
pub struct DisplayMonitorInfo {
    pub device_name: String,
    pub width: u32,
    pub height: u32,
    pub is_primary: bool,
    pub resolution_str: String,
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
        let width = (mi.monitorInfo.rcMonitor.right - mi.monitorInfo.rcMonitor.left).unsigned_abs();
        let height = (mi.monitorInfo.rcMonitor.bottom - mi.monitorInfo.rcMonitor.top).unsigned_abs();
        let is_primary = (mi.monitorInfo.dwFlags & 1) != 0; // MONITORINFOF_PRIMARY = 1

        let device_name = String::from_utf16_lossy(&mi.szDevice)
            .trim_matches('\0')
            .to_string();

        let list = &mut *(lparam.0 as *mut Vec<DisplayMonitorInfo>);
        list.push(DisplayMonitorInfo {
            device_name,
            width,
            height,
            is_primary,
            resolution_str: format!("{}×{}", width, height),
        });
    }
    BOOL(1)
}

/// Liệt kê toàn bộ các màn hình (Primary & Secondary) đang kết nối với máy tính
pub fn get_connected_monitors() -> Vec<DisplayMonitorInfo> {
    #[cfg(target_os = "windows")]
    unsafe {
        let mut monitors: Vec<DisplayMonitorInfo> = Vec::new();
        let _ = EnumDisplayMonitors(
            HDC::default(),
            None,
            Some(enum_monitors_callback),
            LPARAM(&mut monitors as *mut _ as isize),
        );

        if !monitors.is_empty() {
            return monitors;
        }
    }

    // Fallback nếu không đọc được Win32 API
    vec![DisplayMonitorInfo {
        device_name: "\\\\.\\DISPLAY1".into(),
        width: 1920,
        height: 1080,
        is_primary: true,
        resolution_str: "1920×1080".into(),
    }]
}
