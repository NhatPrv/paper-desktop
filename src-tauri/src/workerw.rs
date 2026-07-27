#[cfg(target_os = "windows")]
use std::sync::atomic::{AtomicPtr, Ordering};
use serde::Serialize;

#[cfg(target_os = "windows")]
use windows::{
    core::PCWSTR,
    Win32::Foundation::{BOOL, HWND, LPARAM, WPARAM},
    Win32::UI::WindowsAndMessaging::{
        EnumWindows, FindWindowExW, FindWindowW, SendMessageTimeoutW, SetParent,
        SMTO_NORMAL,
    },
};

static WORKERW_HWND: AtomicPtr<std::ffi::c_void> = AtomicPtr::new(std::ptr::null_mut());

#[derive(Debug, Serialize, Clone)]
pub struct WorkerWStatus {
    pub progman_found: bool,
    pub workerw_hwnd: String,
    pub message: String,
}

#[cfg(target_os = "windows")]
unsafe extern "system" fn enum_windows_proc(hwnd: HWND, lparam: LPARAM) -> BOOL {
    let shell_dll = FindWindowExW(
        hwnd,
        HWND::default(),
        windows::core::w!("SHELLDLL_DefView"),
        PCWSTR::null(),
    );

    if let Ok(shell_hwnd) = shell_dll {
        if !shell_hwnd.0.is_null() {
            // Found SHELLDLL_DefView inside hwnd.
            // The next WorkerW sibling window is where wallpaper can be attached.
            let worker_w = FindWindowExW(
                HWND::default(),
                hwnd,
                windows::core::w!("WorkerW"),
                PCWSTR::null(),
            );

            if let Ok(w_hwnd) = worker_w {
                if !w_hwnd.0.is_null() {
                    let target_ptr = lparam.0 as *mut HWND;
                    *target_ptr = w_hwnd;
                    return BOOL(0); // Stop enumeration
                }
            }
        }
    }
    BOOL(1) // Continue enumeration
}

/// Gửi message 0x052C tới Progman để bắt hệ thống Windows sinh ra cửa sổ WorkerW
pub fn init_workerw() -> Result<WorkerWStatus, String> {
    #[cfg(target_os = "windows")]
    unsafe {
        let progman = FindWindowW(windows::core::w!("Progman"), PCWSTR::null())
            .map_err(|e| format!("Không tìm thấy cửa sổ Progman: {}", e))?;

        if progman.0.is_null() {
            return Err("Cửa sổ Progman không tồn tại".into());
        }

        let mut result: usize = 0;
        // Gửi Message 0x052C tới Progman với timeout 1000ms
        let _ = SendMessageTimeoutW(
            progman,
            0x052C,
            WPARAM(0x0D),
            LPARAM(1),
            SMTO_NORMAL,
            1000,
            Some(&mut result),
        );

        let mut target_workerw = HWND::default();
        let _ = EnumWindows(
            Some(enum_windows_proc),
            LPARAM(&mut target_workerw as *mut _ as isize),
        );

        if target_workerw.0.is_null() {
            // Nếu không tìm thấy qua EnumWindows, dùng WorkerW kế tiếp Progman
            if let Ok(worker_w) = FindWindowExW(
                HWND::default(),
                progman,
                windows::core::w!("WorkerW"),
                PCWSTR::null(),
            ) {
                target_workerw = worker_w;
            }
        }

        WORKERW_HWND.store(target_workerw.0, Ordering::Relaxed);

        let hwnd_str = format!("0x{:X}", target_workerw.0 as usize);
        Ok(WorkerWStatus {
            progman_found: true,
            workerw_hwnd: hwnd_str.clone(),
            message: format!("Đã khởi tạo thành công WorkerW HWND: {}", hwnd_str),
        })
    }

    #[cfg(not(target_os = "windows"))]
    {
        Ok(WorkerWStatus {
            progman_found: false,
            workerw_hwnd: "0x0".into(),
            message: "Hệ điều hành không phải Windows, chế độ Simulation active".into(),
        })
    }
}

/// Đưa cửa sổ con (Video Render Window) làm con của WorkerW
pub fn attach_to_workerw(child_hwnd_ptr: usize) -> Result<String, String> {
    #[cfg(target_os = "windows")]
    unsafe {
        let workerw_ptr = WORKERW_HWND.load(Ordering::Relaxed);
        if workerw_ptr.is_null() {
            return Err("WorkerW HWND chưa được khởi tạo. Hãy gọi init_workerw() trước.".into());
        }

        let workerw_hwnd = HWND(workerw_ptr);
        let child_hwnd = HWND(child_hwnd_ptr as *mut _);

        let old_parent = SetParent(child_hwnd, workerw_hwnd)
            .map_err(|e| format!("SetParent thất bại: {}", e))?;

        Ok(format!(
            "Gắn cửa sổ 0x{:X} vào WorkerW 0x{:X} thành công (Parent cũ: 0x{:X})",
            child_hwnd_ptr, workerw_ptr as usize, old_parent.0 as usize
        ))
    }

    #[cfg(not(target_os = "windows"))]
    {
        Ok(format!("Simulation: Gắn cửa sổ 0x{:X} vào WorkerW", child_hwnd_ptr))
    }
}
