import { invoke } from '@tauri-apps/api/core'

export interface WorkerWStatus {
  progman_found: boolean
  workerw_hwnd: string
  message: string
}

export interface VirtualDesktopInfo {
  id: number
  name: string
  active: boolean
  wallpaper: string
}

export interface SystemMetrics {
  cpu_usage_percent: number
  ram_usage_mb: number
  fullscreen_detected: boolean
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

/** Lấy thông số CPU/RAM thực tế từ Windows */
export async function fetchSystemMetrics(): Promise<SystemMetrics> {
  try {
    return await invoke<SystemMetrics>('get_system_metrics')
  } catch (err) {
    return {
      cpu_usage_percent: 2.4,
      ram_usage_mb: 38,
      fullscreen_detected: false,
    }
  }
}

/** Lấy danh sách Virtual Desktops hiện có trên Windows */
export async function fetchVirtualDesktops(): Promise<VirtualDesktopInfo[]> {
  try {
    return await invoke<VirtualDesktopInfo[]>('get_virtual_desktops')
  } catch (err) {
    return [
      { id: 1, name: 'Desktop 1', active: true, wallpaper: 'Aurora Drift' },
      { id: 2, name: 'Desktop 2', active: false, wallpaper: 'Neon City Rain' },
      { id: 3, name: 'Desktop 3', active: false, wallpaper: 'Deep Ocean Flow' },
      { id: 4, name: 'Work', active: false, wallpaper: 'Minimal White Noise' },
      { id: 5, name: 'Gaming', active: false, wallpaper: 'Cyberpunk Alley' },
    ]
  }
}
