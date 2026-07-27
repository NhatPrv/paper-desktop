import { invoke, convertFileSrc } from '@tauri-apps/api/core'

export interface WorkerWStatus {
  progman_found: boolean
  workerw_hwnd: string
  message: string
}

export interface RealVirtualDesktop {
  id: number
  guid: string
  name: string
  is_current: boolean
}

export interface DisplayMonitorInfo {
  id: number
  device_name: string
  width: number
  height: number
  is_primary: boolean
  resolution_str: string
}

export interface DesktopSetting {
  id: number
  guid: string
  name: string
  wallpaper_path: string
  wallpaper_type: string
  volume: number
  paused: boolean
}

export interface AppConfig {
  global_active: boolean
  global_volume: number
  auto_pause_fullscreen: boolean
  desktops: DesktopSetting[]
}

export interface FullscreenStatus {
  is_fullscreen: boolean
  state_code: number
  description: string
}

export interface SystemMetrics {
  cpu_usage_percent: number
  ram_usage_mb: number
  fullscreen_detected: boolean
  fullscreen_description: string
}

/** Khởi tạo bóc tách cửa sổ WorkerW bằng Win32 API */
export async function initWorkerW(): Promise<WorkerWStatus> {
  try {
    return await invoke<WorkerWStatus>('init_workerw_engine')
  } catch (err) {
    console.warn('Tauri API không sẵn sàng (Browser Mode):', err)
    return {
      progman_found: true,
      workerw_hwnd: '0x0001024C (Web Simulation)',
      message: 'Browser Mode simulation running',
    }
  }
}

/** Đổi hình nền ĐỘC LẬP cho từng màn hình vật lý cụ thể (Monitor 1, Monitor 2...) qua Windows COM API IDesktopWallpaper */
export async function setMonitorWallpaper(monitorIndex: number, wallpaperPath: string): Promise<string> {
  try {
    return await invoke<string>('set_monitor_wallpaper', { monitorIndex, wallpaperPath })
  } catch (err) {
    console.error('Lỗi khi cài hình nền màn hình:', err)
    return String(err)
  }
}

/** Đổi hình nền toàn hệ thống */
export async function setRealOsWallpaper(wallpaperPath: string): Promise<string> {
  return setMonitorWallpaper(0, wallpaperPath)
}

/** Đọc danh sách Virtual Desktops thực tế từ Windows Registry */
export async function fetchRealVirtualDesktops(): Promise<RealVirtualDesktop[]> {
  try {
    return await invoke<RealVirtualDesktop[]>('fetch_real_virtual_desktops')
  } catch (err) {
    return [
      { id: 1, guid: 'E738B162-81D2-4822-B129-281C3058D101', name: 'Desktop 1', is_current: true },
      { id: 2, guid: 'A192B743-9821-4190-C823-912A8401E202', name: 'Desktop 2', is_current: false },
      { id: 3, guid: 'B823C910-1294-4712-D912-3841029F1303', name: 'Work', is_current: false },
    ]
  }
}

/** Đọc kích thước độ phân giải thực tế của tất cả màn hình kết nối qua Win32 EnumDisplayMonitors */
export async function fetchConnectedMonitors(): Promise<DisplayMonitorInfo[]> {
  try {
    return await invoke<DisplayMonitorInfo[]>('fetch_connected_monitors')
  } catch (err) {
    return [
      { id: 1, device_name: '\\\\.\\DISPLAY1', width: 2560, height: 1600, is_primary: true, resolution_str: '2560×1600' },
      { id: 2, device_name: '\\\\.\\DISPLAY2', width: 1280, height: 1024, is_primary: false, resolution_str: '1280×1024' },
    ]
  }
}

/** Đọc trực tiếp file ảnh local thành Base64 Data URL để hiển thị 100% không bị lỗi broken icon */
export async function readFileBase64(filePath: string): Promise<string> {
  if (!filePath) return ''
  try {
    return await invoke<string>('read_file_base64', { filePath })
  } catch (err) {
    console.error('Lỗi đọc base64 file:', err)
    return toAssetUrl(filePath)
  }
}

/** Chuyển đổi đường dẫn file đĩa cục bộ sang dạng URL asset an toàn cho Webview phát video/ảnh */
export function toAssetUrl(filePath: string): string {
  if (!filePath) return ''
  if (filePath.startsWith('http://') || filePath.startsWith('https://') || filePath.startsWith('data:')) {
    return filePath
  }
  try {
    return convertFileSrc(filePath)
  } catch (err) {
    return filePath
  }
}

/** Đọc cấu hình app từ AppData/PaperDesktop/config.json */
export async function getAppConfig(): Promise<AppConfig> {
  try {
    return await invoke<AppConfig>('get_app_config_cmd')
  } catch (err) {
    return {
      global_active: true,
      global_volume: 0,
      auto_pause_fullscreen: true,
      desktops: [
        { id: 1, guid: 'default-1', name: 'Desktop 1', wallpaper_path: '', wallpaper_type: 'none', volume: 0, paused: false },
        { id: 2, guid: 'default-2', name: 'Desktop 2', wallpaper_path: '', wallpaper_type: 'none', volume: 0, paused: false },
      ],
    }
  }
}

/** Lưu cấu hình app vào config.json */
export async function saveAppConfig(config: AppConfig): Promise<void> {
  try {
    await invoke('save_app_config_cmd', { config })
  } catch (err) {
    console.error('Lỗi khi lưu cấu hình:', err)
  }
}

/** Kiểm tra trực tiếp xem có ứng dụng/game nào đang chạy Fullscreen hay không */
export async function checkFullscreenStatus(): Promise<FullscreenStatus> {
  try {
    return await invoke<FullscreenStatus>('check_fullscreen_status')
  } catch (err) {
    return {
      is_fullscreen: false,
      state_code: 0,
      description: 'Web Simulation - Standby',
    }
  }
}

/** Mở Windows File Picker để người dùng chọn file Wallpaper (.mp4, .webm, .png, .jpg) */
export async function selectLocalWallpaperFile(): Promise<string | null> {
  try {
    return await invoke<string | null>('select_local_wallpaper_file')
  } catch (err) {
    console.warn('Browser Mode File Selection mock')
    return null
  }
}

/** Lấy thông số CPU/RAM thực tế từ Windows */
export async function fetchSystemMetrics(): Promise<SystemMetrics> {
  try {
    return await invoke<SystemMetrics>('get_system_metrics')
  } catch (err) {
    return {
      cpu_usage_percent: 1.8,
      ram_usage_mb: 42,
      fullscreen_detected: false,
      fullscreen_description: 'Active - Standby',
    }
  }
}
