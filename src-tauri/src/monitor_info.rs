use serde::Serialize;

#[cfg(target_os = "windows")]
use windows::core::PCWSTR;
#[cfg(target_os = "windows")]
use windows::Win32::Foundation::{BOOL, LPARAM, RECT};
#[cfg(target_os = "windows")]
use windows::Win32::Graphics::Gdi::{
    EnumDisplayDevicesW, EnumDisplayMonitors, EnumDisplaySettingsW, GetMonitorInfoW,
    DISPLAY_DEVICEW, DISPLAY_DEVICE_ATTACHED_TO_DESKTOP, DISPLAY_DEVICE_PRIMARY_DEVICE,
    ENUM_CURRENT_SETTINGS, HDC, HMONITOR, MONITORINFOEXW, DEVMODEW,
};

#[derive(Debug, Serialize, Clone)]
pub struct DisplayMonitorInfo {
    pub id: u32,
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
        let is_primary = (mi.monitorInfo.dwFlags & 1) != 0;

        let raw_name = String::from_utf16_lossy(&mi.szDevice);
        let device_name = raw_name.trim_matches('\0').trim().to_string();

        let list = &mut *(lparam.0 as *mut Vec<DisplayMonitorInfo>);
        let id = (list.len() + 1) as u32;

        list.push(DisplayMonitorInfo {
            id,
            device_name,
            width,
            height,
            is_primary,
            resolution_str: format!("{}×{}", width, height),
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
                    let is_primary = (dd.StateFlags & DISPLAY_DEVICE_PRIMARY_DEVICE) != 0;
                    let name = String::from_utf16_lossy(&dd.DeviceName).trim_matches('\0').trim().to_string();

                    monitors.push(DisplayMonitorInfo {
                        id: device_index + 1,
                        device_name: name,
                        width: w,
                        height: h,
                        is_primary,
                        resolution_str: format!("{}×{}", w, h),
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
            width: 2560,
            height: 1600,
            is_primary: true,
            resolution_str: "2560×1600".into(),
        },
        DisplayMonitorInfo {
            id: 2,
            device_name: "\\\\.\\DISPLAY2".into(),
            width: 1920,
            height: 1080,
            is_primary: false,
            resolution_str: "1920×1080".into(),
        },
    ]
}
