use serde::Serialize;

#[cfg(target_os = "windows")]
use windows::Win32::System::Registry::{
    RegCloseKey, RegOpenKeyExW, RegQueryValueExW, HKEY_CURRENT_USER, KEY_READ, REG_BINARY,
};

#[derive(Debug, Serialize, Clone)]
pub struct RealVirtualDesktop {
    pub id: u32,
    pub guid: String,
    pub name: String,
    pub is_current: bool,
}

/// Đọc Registry của Windows để lấy danh sách GUID của tất cả Virtual Desktop đang tồn tại
pub fn get_real_windows_virtual_desktops() -> Vec<RealVirtualDesktop> {
    #[cfg(target_os = "windows")]
    unsafe {
        let key_path = windows::core::w!("Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VirtualDesktops");
        let mut hkey = Default::default();

        if RegOpenKeyExW(HKEY_CURRENT_USER, key_path, 0, KEY_READ, &mut hkey).is_err() {
            return fallback_virtual_desktops();
        }

        // 1. Đọc CurrentVirtualDesktop GUID
        let mut current_guid_bytes = [0u8; 16];
        let mut type_reg = REG_BINARY;
        let mut buf_size = 16u32;
        let mut current_guid_str = String::new();

        if RegQueryValueExW(
            hkey,
            windows::core::w!("CurrentVirtualDesktop"),
            None,
            Some(&mut type_reg),
            Some(current_guid_bytes.as_mut_ptr()),
            Some(&mut buf_size),
        )
        .is_ok()
        {
            current_guid_str = format_guid_bytes(&current_guid_bytes);
        }

        // 2. Đọc danh sách VirtualDesktopIDs (Mỗi GUID 16 bytes)
        let mut ids_buf = vec![0u8; 1024];
        let mut ids_size = 1024u32;

        if RegQueryValueExW(
            hkey,
            windows::core::w!("VirtualDesktopIDs"),
            None,
            Some(&mut type_reg),
            Some(ids_buf.as_mut_ptr()),
            Some(&mut ids_size),
        )
        .is_ok()
        {
            let _ = RegCloseKey(hkey);

            let count = (ids_size as usize) / 16;
            if count > 0 {
                let mut desktops = Vec::new();
                for i in 0..count {
                    let slice = &ids_buf[i * 16..(i + 1) * 16];
                    let guid_str = format_guid_bytes(slice);
                    let is_curr = !current_guid_str.is_empty() && guid_str == current_guid_str;

                    desktops.push(RealVirtualDesktop {
                        id: (i + 1) as u32,
                        guid: guid_str,
                        name: format!("Desktop {}", i + 1),
                        is_current: if i == 0 && current_guid_str.is_empty() { true } else { is_curr },
                    });
                }
                return desktops;
            }
        } else {
            let _ = RegCloseKey(hkey);
        }
    }

    fallback_virtual_desktops()
}

#[cfg(target_os = "windows")]
fn format_guid_bytes(bytes: &[u8]) -> String {
    if bytes.len() < 16 {
        return String::new();
    }
    format!(
        "{:02X}{:02X}{:02X}{:02X}-{:02X}{:02X}-{:02X}{:02X}-{:02X}{:02X}-{:02X}{:02X}{:02X}{:02X}{:02X}{:02X}",
        bytes[3], bytes[2], bytes[1], bytes[0],
        bytes[5], bytes[4],
        bytes[7], bytes[6],
        bytes[8], bytes[9],
        bytes[10], bytes[11], bytes[12], bytes[13], bytes[14], bytes[15]
    )
}

fn fallback_virtual_desktops() -> Vec<RealVirtualDesktop> {
    vec![
        RealVirtualDesktop {
            id: 1,
            guid: "E738B162-81D2-4822-B129-281C3058D101".into(),
            name: "Desktop 1".into(),
            is_current: true,
        },
        RealVirtualDesktop {
            id: 2,
            guid: "A192B743-9821-4190-C823-912A8401E202".into(),
            name: "Desktop 2".into(),
            is_current: false,
        },
        RealVirtualDesktop {
            id: 3,
            guid: "B823C910-1294-4712-D912-3841029F1303".into(),
            name: "Work".into(),
            is_current: false,
        },
    ]
}
