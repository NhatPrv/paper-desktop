import { useState, useEffect } from 'react'
import {
  initWorkerW,
  fetchSystemMetrics,
  fetchRealVirtualDesktops,
  fetchConnectedMonitors,
  selectLocalWallpaperFile,
  getAppConfig,
  saveAppConfig,
  toAssetUrl,
  readFileBase64,
  setRealOsWallpaper,
  setMonitorWallpaper,
  WorkerWStatus,
  SystemMetrics,
  RealVirtualDesktop,
  DisplayMonitorInfo,
  AppConfig,
} from '@/services/tauri'
import {
  Monitor,
  Image,
  ListMusic,
  ShieldOff,
  Settings,
  Plus,
  Search,
  Play,
  Volume2,
  VolumeX,
  PauseCircle,
  PlayCircle,
  SkipForward,
  SkipBack,
  ChevronRight,
  Cpu,
  MemoryStick,
  Layers,
  Sparkles,
  LayoutGrid,
  Maximize2,
  Tag,
  Clock,
  Radio,
} from 'lucide-react'

// ─── Data ─────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: 'desktops', label: 'Virtual Desktops', icon: Monitor },
  { id: 'library', label: 'Wallpaper Library', icon: Image },
  { id: 'playlists', label: 'Playlists', icon: ListMusic },
  { id: 'autopause', label: 'Auto-Pause Rules', icon: ShieldOff },
  { id: 'settings', label: 'Settings', icon: Settings },
]

const DESKTOPS = [
  {
    id: 1,
    name: 'Desktop 1',
    wallpaper: 'Aurora Drift',
    resolution: '2560×1440',
    active: true,
    img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=480&h=270&fit=crop&auto=format',
  },
  {
    id: 2,
    name: 'Desktop 2',
    wallpaper: 'Neon City Rain',
    resolution: '2560×1440',
    active: false,
    img: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=480&h=270&fit=crop&auto=format',
  },
  {
    id: 3,
    name: 'Desktop 3',
    wallpaper: 'Deep Ocean Flow',
    resolution: '1920×1080',
    active: false,
    img: 'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=480&h=270&fit=crop&auto=format',
  },
  {
    id: 4,
    name: 'Work',
    wallpaper: 'Minimal White Noise',
    resolution: '3840×2160',
    active: false,
    img: 'https://images.unsplash.com/photo-1557682224-5b8590cd9ec5?w=480&h=270&fit=crop&auto=format',
  },
  {
    id: 5,
    name: 'Gaming',
    wallpaper: 'Cyberpunk Alley',
    resolution: '2560×1440',
    active: false,
    img: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=480&h=270&fit=crop&auto=format',
  },
]

const WALLPAPERS = [
  {
    id: 1,
    title: 'Aurora Drift',
    duration: '2:14',
    resolution: '4K',
    fps: '60FPS',
    tags: ['Nature', 'Abstract'],
    img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=640&h=360&fit=crop&auto=format',
    liked: true,
  },
  {
    id: 2,
    title: 'Neon City Rain',
    duration: '3:42',
    resolution: '4K',
    fps: '60FPS',
    tags: ['Cyberpunk', 'City'],
    img: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=640&h=360&fit=crop&auto=format',
    liked: false,
  },
  {
    id: 3,
    title: 'Sakura Loop',
    duration: '1:58',
    resolution: '1080p',
    fps: '30FPS',
    tags: ['Anime', 'Nature'],
    img: 'https://images.unsplash.com/photo-1552083375-1447ce886485?w=640&h=360&fit=crop&auto=format',
    liked: true,
  },
  {
    id: 4,
    title: 'Deep Ocean Flow',
    duration: '4:20',
    resolution: '4K',
    fps: '60FPS',
    tags: ['Nature', 'Abstract'],
    img: 'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=640&h=360&fit=crop&auto=format',
    liked: false,
  },
  {
    id: 5,
    title: 'Cyberpunk Alley',
    duration: '2:30',
    resolution: '4K',
    fps: '60FPS',
    tags: ['Cyberpunk', 'Anime'],
    img: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=640&h=360&fit=crop&auto=format',
    liked: false,
  },
  {
    id: 6,
    title: 'Geometric Pulse',
    duration: '1:12',
    resolution: '1080p',
    fps: '60FPS',
    tags: ['Abstract'],
    img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=640&h=360&fit=crop&auto=format',
    liked: true,
  },
  {
    id: 7,
    title: 'Mountain Mist',
    duration: '5:00',
    resolution: '4K',
    fps: '24FPS',
    tags: ['Nature'],
    img: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=640&h=360&fit=crop&auto=format',
    liked: false,
  },
  {
    id: 8,
    title: 'Synthwave Grid',
    duration: '3:00',
    resolution: '4K',
    fps: '60FPS',
    tags: ['Cyberpunk', 'Abstract'],
    img: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=640&h=360&fit=crop&auto=format',
    liked: false,
  },
]

const TAG_COLORS: Record<string, string> = {
  Nature: 'rgba(34,197,94,0.15)',
  Abstract: 'rgba(168,85,247,0.15)',
  Cyberpunk: 'rgba(0,120,212,0.18)',
  Anime: 'rgba(236,72,153,0.15)',
  City: 'rgba(251,191,36,0.15)',
}

const TAG_TEXT: Record<string, string> = {
  Nature: '#4ade80',
  Abstract: '#c084fc',
  Cyberpunk: '#60a5fa',
  Anime: '#f472b6',
  City: '#fbbf24',
}

// ─── Toggle ────────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <div
      className="toggle-track"
      style={{
        background: checked ? 'rgba(0,120,212,0.7)' : 'rgba(255,255,255,0.08)',
        borderColor: checked ? 'rgba(0,120,212,0.5)' : 'rgba(255,255,255,0.12)',
      }}
      onClick={onChange}
    >
      <div
        className="toggle-thumb"
        style={{
          background: checked ? '#fff' : 'rgba(255,255,255,0.4)',
          left: checked ? '20px' : '3px',
          boxShadow: checked ? '0 0 8px rgba(0,120,212,0.6)' : 'none',
        }}
      />
    </div>
  )
}

// ─── Desktop Card ──────────────────────────────────────────────────────────────

function DesktopCard({
  desktop,
  isActive,
  onChangeWallpaper,
}: {
  desktop: any
  isActive: boolean
  onChangeWallpaper?: () => void
}) {
  const isVideo = desktop.wallpaper_path && (desktop.wallpaper_path.endsWith('.mp4') || desktop.wallpaper_path.endsWith('.webm'))
  const isCustomImage = Boolean(desktop.preview_url) || (desktop.wallpaper_path && (
    desktop.wallpaper_path.endsWith('.png') ||
    desktop.wallpaper_path.endsWith('.jpg') ||
    desktop.wallpaper_path.endsWith('.jpeg') ||
    desktop.wallpaper_path.endsWith('.webp')
  ))

  return (
    <div
      className="desktop-card"
      style={{ width: 200 }}
      data-active={isActive}
    >
      {/* Thumbnail */}
      <div style={{ position: 'relative', aspectRatio: '16/9', background: '#111' }}>
        {isVideo ? (
          <video
            src={toAssetUrl(desktop.wallpaper_path)}
            autoPlay
            loop
            muted
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : isCustomImage ? (
          <img
            src={desktop.preview_url || toAssetUrl(desktop.wallpaper_path)}
            alt={desktop.wallpaper}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <img
            src={desktop.img}
            alt={desktop.wallpaper}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        )}
        {/* Active indicator */}
        {isActive && (
          <div
            style={{
              position: 'absolute',
              top: 6,
              left: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: 'rgba(0,120,212,0.85)',
              borderRadius: 4,
              padding: '2px 7px',
              fontSize: 10,
              fontWeight: 600,
              color: '#fff',
              letterSpacing: '0.04em',
            }}
          >
            <span
              className="pulse-dot"
              style={{ width: 5, height: 5, borderRadius: '50%', background: '#7dd3fc', display: 'inline-block' }}
            />
            ACTIVE
          </div>
        )}
        {/* Resolution badge */}
        <div
          style={{
            position: 'absolute',
            bottom: 6,
            right: 6,
            background: 'rgba(0,0,0,0.65)',
            borderRadius: 4,
            padding: '2px 6px',
            fontSize: 10,
            fontWeight: 500,
            color: 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(4px)',
          }}
        >
          {desktop.resolution}
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '10px 12px',
          background: 'rgba(0,0,0,0.35)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div style={{ fontWeight: 600, fontSize: 13, color: 'rgba(255,255,255,0.88)', marginBottom: 2 }}>
          {desktop.name}
        </div>
        <div
          style={{
            fontSize: 11,
            color: 'rgba(255,255,255,0.4)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            marginBottom: 8,
          }}
        >
          {desktop.wallpaper}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onChangeWallpaper?.()
          }}
          style={{
            width: '100%',
            fontSize: 11.5,
            fontWeight: 500,
            padding: '5px 0',
            borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.06)',
            color: 'rgba(255,255,255,0.65)',
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            const el = e.currentTarget
            el.style.background = 'rgba(0,120,212,0.2)'
            el.style.borderColor = 'rgba(0,120,212,0.4)'
            el.style.color = '#60a5fa'
          }}
          onMouseLeave={e => {
            const el = e.currentTarget
            el.style.background = 'rgba(255,255,255,0.06)'
            el.style.borderColor = 'rgba(255,255,255,0.1)'
            el.style.color = 'rgba(255,255,255,0.65)'
          }}
        >
          Change Wallpaper
        </button>
      </div>
    </div>
  )
}

// ─── Wallpaper Card ────────────────────────────────────────────────────────────

function WallpaperCard({ w }: { w: (typeof WALLPAPERS)[0] }) {
  return (
    <div className="wallpaper-card" style={{ background: '#0d0d14' }}>
      <img
        src={w.img}
        alt={w.title}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
      {/* Play overlay */}
      <div className="play-overlay">
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'rgba(0,120,212,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(0,120,212,0.6)',
          }}
        >
          <Play size={18} color="#fff" fill="#fff" />
        </div>
      </div>

      {/* Bottom meta */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '20px 10px 10px',
          background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: '#fff', marginBottom: 4 }}>
              {w.title}
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {w.tags.map(tag => (
                <span
                  key={tag}
                  style={{
                    fontSize: 9.5,
                    fontWeight: 600,
                    padding: '1px 5px',
                    borderRadius: 3,
                    background: TAG_COLORS[tag] || 'rgba(255,255,255,0.1)',
                    color: TAG_TEXT[tag] || '#fff',
                    letterSpacing: '0.03em',
                    textTransform: 'uppercase',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
            <span
              style={{
                fontSize: 9.5,
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: 3,
                background: 'rgba(0,120,212,0.5)',
                color: '#93c5fd',
                letterSpacing: '0.04em',
              }}
            >
              {w.resolution}
            </span>
            <span
              style={{
                fontSize: 9.5,
                fontWeight: 600,
                padding: '2px 6px',
                borderRadius: 3,
                background: 'rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.6)',
              }}
            >
              {w.fps}
            </span>
          </div>
        </div>
      </div>

      {/* Duration badge */}
      <div
        style={{
          position: 'absolute',
          top: 8,
          left: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          background: 'rgba(0,0,0,0.6)',
          borderRadius: 4,
          padding: '2px 7px',
          fontSize: 10,
          color: 'rgba(255,255,255,0.75)',
          backdropFilter: 'blur(4px)',
        }}
      >
        <Clock size={9} />
        {w.duration}
      </div>
    </div>
  )
}

// ─── Floating Player ───────────────────────────────────────────────────────────

function FloatingPlayer({
  wallpaperPaused,
  onTogglePause,
}: {
  wallpaperPaused: boolean
  onTogglePause: () => void
}) {
  const [muted, setMuted] = useState(false)
  const [minimized, setMinimized] = useState(false)

  return (
    <div className="floating-player" style={{ padding: minimized ? '10px 14px' : '14px 16px' }}>
      {minimized ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Radio size={13} color="#60a5fa" />
          <span style={{ fontSize: 12, fontWeight: 500, color: '#60a5fa' }}>Paper Desktop</span>
          <button
            className="icon-btn"
            onClick={() => setMinimized(false)}
            style={{ width: 22, height: 22, borderRadius: 5 }}
            title="Expand"
          >
            <Maximize2 size={11} />
          </button>
        </div>
      ) : (
        <>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Radio size={12} color="#60a5fa" />
              <span style={{ fontSize: 11, fontWeight: 600, color: '#60a5fa', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Quick Controls
              </span>
            </div>
            <button
              className="icon-btn"
              onClick={() => setMinimized(true)}
              style={{ width: 22, height: 22, borderRadius: 5 }}
              title="Minimize"
            >
              <ChevronRight size={11} style={{ transform: 'rotate(90deg)' }} />
            </button>
          </div>

          {/* Now playing */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 12,
              padding: '8px 10px',
              borderRadius: 10,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 7,
                overflow: 'hidden',
                border: '1px solid rgba(96,165,250,0.3)',
                flexShrink: 0,
              }}
            >
              <img
                src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=72&h=72&fit=crop&auto=format"
                alt="Aurora Drift"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: 'rgba(255,255,255,0.88)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Aurora Drift
              </div>
              <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.38)', marginTop: 1 }}>Desktop 1 · 4K 60FPS</div>
            </div>
            {/* Animated equalizer */}
            {!wallpaperPaused && (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, marginLeft: 'auto', height: 16 }}>
                {[8, 14, 10, 16, 11].map((h, i) => (
                  <div
                    key={i}
                    style={{
                      width: 2.5,
                      height: h,
                      borderRadius: 1,
                      background: '#60a5fa',
                      opacity: 0.7,
                      animation: `pulse-dot ${0.6 + i * 0.15}s ease-in-out infinite`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div
            style={{
              height: 3,
              borderRadius: 2,
              background: 'rgba(255,255,255,0.08)',
              marginBottom: 12,
              overflow: 'hidden',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                height: '100%',
                width: wallpaperPaused ? '38%' : '38%',
                background: 'linear-gradient(to right, #0078D4, #60a5fa)',
                borderRadius: 2,
              }}
            />
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button className="icon-btn" title="Previous">
                <SkipBack size={13} />
              </button>
              <button
                className={`icon-btn ${!wallpaperPaused ? 'active' : ''}`}
                onClick={onTogglePause}
                title={wallpaperPaused ? 'Play' : 'Pause'}
                style={{ width: 36, height: 36, borderRadius: 9 }}
              >
                {wallpaperPaused ? <PlayCircle size={18} /> : <PauseCircle size={18} />}
              </button>
              <button className="icon-btn" title="Next">
                <SkipForward size={13} />
              </button>
            </div>
            <button
              className={`icon-btn ${muted ? 'active' : ''}`}
              onClick={() => setMuted(m => !m)}
              title={muted ? 'Unmute' : 'Mute'}
            >
              {muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ─── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [activeNav, setActiveNav] = useState('desktops')
  const [wallpaperActive, setWallpaperActive] = useState(true)
  const [wallpaperPaused, setWallpaperPaused] = useState(false)
  const [activeDesktop, setActiveDesktop] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const [workerWStatus, setWorkerWStatus] = useState<WorkerWStatus | null>(null)
  const [desktopsList, setDesktopsList] = useState(DESKTOPS)
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    cpu_usage_percent: 1.8,
    ram_usage_mb: 42,
    fullscreen_detected: false,
    fullscreen_description: 'Active - Standby',
  })

  const [monitors, setMonitors] = useState<DisplayMonitorInfo[]>([])

  useEffect(() => {
    initWorkerW().then(status => {
      setWorkerWStatus(status)
      console.log('WorkerW Engine Status:', status)
    })
    fetchSystemMetrics().then(m => setSystemMetrics(m))

    // Tự động phát hiện màn hình thực tế và load cấu hình
    Promise.all([fetchRealVirtualDesktops(), fetchConnectedMonitors(), getAppConfig()]).then(
      async ([realList, monList, appCfg]) => {
        if (monList && monList.length > 0) {
          setMonitors(monList)
        }

        const primaryRes = monList && monList.length > 0 ? monList[0].resolution_str : '1920×1080'

        if (realList && realList.length > 0) {
          const listWithBase64 = await Promise.all(
            realList.map(async (rd, index) => {
              const savedSetting = appCfg?.desktops?.find(d => d.id === rd.id || d.guid === rd.guid)
              const wallpaperName = savedSetting?.wallpaper_path
                ? savedSetting.wallpaper_path.split(/[\\/]/).pop() || savedSetting.wallpaper_path
                : DESKTOPS[index % DESKTOPS.length].wallpaper

              let previewUrl = ''
              if (savedSetting?.wallpaper_path && !savedSetting.wallpaper_path.endsWith('.mp4') && !savedSetting.wallpaper_path.endsWith('.webm')) {
                previewUrl = await readFileBase64(savedSetting.wallpaper_path)
              }

              return {
                id: rd.id,
                guid: rd.guid,
                name: rd.name,
                wallpaper: wallpaperName,
                wallpaper_path: savedSetting?.wallpaper_path || '',
                preview_url: previewUrl,
                resolution: primaryRes,
                active: rd.is_current,
                img: DESKTOPS[index % DESKTOPS.length].img,
              }
            })
          )
          setDesktopsList(listWithBase64)
        }
      }
    )
  }, [])

  const handleSelectWallpaperFile = async (desktopId: number) => {
    const filePath = await selectLocalWallpaperFile()
    if (filePath) {
      // 1. Đổi ngay hình nền thật của Windows OS qua Win32 SystemParametersInfoW API
      setRealOsWallpaper(filePath).then(res => console.log('Win32 OS Wallpaper Result:', res))

      const fileName = filePath.split(/[\\/]/).pop() || filePath
      const isImg = !filePath.endsWith('.mp4') && !filePath.endsWith('.webm')
      const previewUrl = isImg ? await readFileBase64(filePath) : ''

      setDesktopsList(prev => {
        const updated = prev.map(d => (d.id === desktopId ? { ...d, wallpaper: fileName, wallpaper_path: filePath, preview_url: previewUrl } : d))

        getAppConfig().then(cfg => {
          const newDesktops = updated.map(d => ({
            id: d.id,
            guid: (d as any).guid || `desktop-${d.id}`,
            name: d.name,
            wallpaper_path: (d as any).wallpaper_path || '',
            wallpaper_type: isImg ? 'image' : 'video',
            volume: 0,
            paused: false,
          }))
          saveAppConfig({ ...cfg, desktops: newDesktops })
        })

        return updated
      })
    }
  }

  const handleSelectMonitorWallpaperFile = async (monitorIndex: number) => {
    const filePath = await selectLocalWallpaperFile()
    if (filePath) {
      const res = await setMonitorWallpaper(monitorIndex, filePath)
      console.log(`Set Monitor ${monitorIndex + 1} Wallpaper Result:`, res)

      const isImg = !filePath.endsWith('.mp4') && !filePath.endsWith('.webm')
      const previewUrl = isImg ? await readFileBase64(filePath) : ''
      const fileName = filePath.split(/[\\/]/).pop() || filePath

      setMonitors(prev =>
        prev.map((m, idx) =>
          idx === monitorIndex
            ? ({ ...m, wallpaper: fileName, wallpaper_path: filePath, preview_url: previewUrl } as any)
            : m
        )
      )
    }
  }

  const filteredWallpapers = WALLPAPERS.filter(w => {
    const matchQuery = w.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchFilter = activeFilter === 'All' || w.tags.includes(activeFilter)
    return matchQuery && matchFilter
  })

  const filters = ['All', 'Nature', 'Cyberpunk', 'Anime', 'Abstract', 'City']

  // Noise background overlay for mica texture
  const noiseStyle = {
    position: 'fixed' as const,
    inset: 0,
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
    pointerEvents: 'none' as const,
    zIndex: 0,
  }

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        position: 'relative',
        background: 'radial-gradient(ellipse at 20% 50%, rgba(0,78,160,0.12) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(96,165,250,0.06) 0%, transparent 50%), #0c0c10',
      }}
    >
      {/* Noise texture */}
      <div style={noiseStyle} />

      {/* ── Sidebar ──────────────────────────────────────── */}
      <aside
        className="mica-bg"
        style={{
          width: 220,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid rgba(255,255,255,0.07)',
          flexShrink: 0,
          zIndex: 10,
          position: 'relative',
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: '22px 18px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                background: 'linear-gradient(135deg, #0078D4 0%, #60a5fa 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px rgba(0,120,212,0.5)',
                flexShrink: 0,
              }}
            >
              <Layers size={17} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.92)', lineHeight: 1.2 }}>
                Paper Desktop
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>v2.4.1 Pro</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '12px 10px', flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '4px 6px', marginBottom: 4 }}>
            Navigation
          </div>
          {NAV_ITEMS.map(item => (
            <div
              key={item.id}
              className={`nav-item ${activeNav === item.id ? 'active' : ''}`}
              onClick={() => setActiveNav(item.id)}
            >
              <item.icon size={16} />
              <span>{item.label}</span>
              {activeNav === item.id && (
                <ChevronRight size={12} style={{ marginLeft: 'auto', opacity: 0.6 }} />
              )}
            </div>
          ))}

          <div
            style={{
              margin: '16px 0',
              height: 1,
              background: 'rgba(255,255,255,0.06)',
            }}
          />

          {/* Wallpaper Active Status */}
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 8,
              background: wallpaperActive
                ? 'rgba(0,120,212,0.1)'
                : 'rgba(255,255,255,0.04)',
              border: `1px solid ${wallpaperActive ? 'rgba(0,120,212,0.2)' : 'rgba(255,255,255,0.07)'}`,
              marginBottom: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: wallpaperActive ? '#60a5fa' : 'rgba(255,255,255,0.45)' }}>
                Live Wallpaper
              </span>
              <Toggle checked={wallpaperActive} onChange={() => setWallpaperActive(v => !v)} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: wallpaperActive ? '#4ade80' : '#6b7280',
                  display: 'inline-block',
                  boxShadow: wallpaperActive ? '0 0 6px rgba(74,222,128,0.7)' : 'none',
                }}
              />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)' }}>
                {wallpaperActive ? '5 desktops active' : 'All paused'}
              </span>
            </div>
          </div>
        </nav>

        {/* System Status */}
        <div
          style={{
            padding: '12px 14px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>
            System Status
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <div
              style={{
                flex: 1,
                padding: '6px 8px',
                borderRadius: 8,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                <Cpu size={10} color="#60a5fa" />
                <span style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>CPU</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#60a5fa' }}>{systemMetrics.cpu_usage_percent}%</div>
              <div style={{ marginTop: 4, height: 2, borderRadius: 1, background: 'rgba(255,255,255,0.08)' }}>
                <div style={{ width: `${Math.min(systemMetrics.cpu_usage_percent * 5, 100)}%`, height: '100%', background: '#60a5fa', borderRadius: 1 }} />
              </div>
            </div>
            <div
              style={{
                flex: 1,
                padding: '6px 8px',
                borderRadius: 8,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                <MemoryStick size={10} color="#a78bfa" />
                <span style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>RAM</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa' }}>{systemMetrics.ram_usage_mb}<span style={{ fontSize: 9, fontWeight: 500 }}>MB</span></div>
              <div style={{ marginTop: 4, height: 2, borderRadius: 1, background: 'rgba(255,255,255,0.08)' }}>
                <div style={{ width: `${Math.min((systemMetrics.ram_usage_mb / 200) * 100, 100)}%`, height: '100%', background: '#a78bfa', borderRadius: 1 }} />
              </div>
            </div>
          </div>
          {/* Fullscreen Auto-Pause status badge */}
          <div
            style={{
              padding: '6px 8px',
              borderRadius: 6,
              background: systemMetrics.fullscreen_detected
                ? 'rgba(239,68,68,0.15)'
                : 'rgba(34,197,94,0.1)',
              border: `1px solid ${systemMetrics.fullscreen_detected ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.2)'}`,
              fontSize: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: systemMetrics.fullscreen_detected ? '#ef4444' : '#22c55e',
                display: 'inline-block',
              }}
            />
            <span style={{ color: systemMetrics.fullscreen_detected ? '#fca5a5' : '#86efac', fontWeight: 500 }}>
              {systemMetrics.fullscreen_detected ? 'Auto-Pause: Game/Fullscreen' : 'Auto-Pause: Standby (Active)'}
            </span>
          </div>
        </div>
      </aside>

      {/* ── Main Content ──────────────────────────────────── */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Header */}
        <header
          className="mica-bg"
          style={{
            padding: '16px 28px',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
            gap: 16,
          }}
        >
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: 'rgba(255,255,255,0.92)', margin: 0, lineHeight: 1.2 }}>
              Virtual Desktops Manager
            </h1>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: '3px 0 0' }}>
              {desktopsList.length} Virtual Desktops · {monitors.length > 0 ? `Display: ${monitors.map(m => `${m.resolution_str}${m.is_primary ? ' (Primary)' : ''}`).join(', ')}` : 'Detecting hardware...'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search
                size={13}
                color="rgba(255,255,255,0.3)"
                style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                className="search-input"
                placeholder="Search wallpapers…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Global toggle */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '7px 12px',
                borderRadius: 8,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <span style={{ fontSize: 12.5, fontWeight: 500, color: 'rgba(255,255,255,0.5)' }}>
                {wallpaperPaused ? 'Paused' : 'Active'}
              </span>
              <Toggle
                checked={!wallpaperPaused}
                onChange={() => setWallpaperPaused(v => !v)}
              />
            </div>

            {/* Add button */}
            <button
              className="glow-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 8,
                border: 'none',
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                fontFamily: 'inherit',
                cursor: 'pointer',
              }}
            >
              <Plus size={15} />
              Add New Desktop
            </button>
          </div>
        </header>

        {/* Scrollable body */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 28px',
        }}
      >
        {/* ── Connected Physical Displays ── */}
        <section style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Monitor size={15} color="#38bdf8" />
            <h2 style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.85)', margin: 0, letterSpacing: '0.01em' }}>
              Connected Physical Displays
            </h2>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                padding: '2px 7px',
                borderRadius: 4,
                background: 'rgba(56,189,248,0.15)',
                color: '#38bdf8',
                marginLeft: 4,
              }}
            >
              {monitors.length} Displays Connected
            </span>
          </div>

          {/* Cards container */}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {monitors.map((m, idx) => (
              <div
                key={m.device_name || idx}
                className="desktop-card"
                style={{
                  width: 220,
                  borderRadius: 12,
                  overflow: 'hidden',
                  background: 'rgba(0,0,0,0.35)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div style={{ position: 'relative', aspectRatio: '16/9', background: '#111' }}>
                  {(m as any).preview_url ? (
                    <img
                      src={(m as any).preview_url}
                      alt={m.device_name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, rgba(30,41,59,0.8), rgba(15,23,42,0.9))',
                        color: 'rgba(255,255,255,0.5)',
                        fontSize: 12,
                        gap: 4,
                      }}
                    >
                      <Monitor size={24} color="#64748b" />
                      <span>{m.resolution_str}</span>
                    </div>
                  )}
                  {m.is_primary && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 6,
                        left: 6,
                        background: 'rgba(56,189,248,0.85)',
                        borderRadius: 4,
                        padding: '2px 6px',
                        fontSize: 10,
                        fontWeight: 600,
                        color: '#000',
                      }}
                    >
                      PRIMARY
                    </div>
                  )}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 6,
                      right: 6,
                      background: 'rgba(0,0,0,0.65)',
                      borderRadius: 4,
                      padding: '2px 6px',
                      fontSize: 10,
                      fontWeight: 500,
                      color: 'rgba(255,255,255,0.8)',
                    }}
                  >
                    {m.resolution_str}
                  </div>
                </div>
                <div style={{ padding: '10px 12px' }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'rgba(255,255,255,0.9)', marginBottom: 2 }}>
                    Display {idx + 1} {m.is_primary ? '(Main Monitor)' : '(Secondary Monitor)'}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {(m as any).wallpaper || m.device_name}
                  </div>
                  <button
                    onClick={() => handleSelectMonitorWallpaperFile(idx)}
                    style={{
                      width: '100%',
                      fontSize: 11.5,
                      fontWeight: 600,
                      padding: '6px 0',
                      borderRadius: 6,
                      border: '1px solid rgba(56,189,248,0.3)',
                      background: 'rgba(56,189,248,0.1)',
                      color: '#38bdf8',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    Set Wallpaper Display {idx + 1}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Active Desktops ── */}
        <section style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Monitor size={15} color="#60a5fa" />
            <h2 style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.75)', margin: 0, letterSpacing: '0.01em' }}>
              Active Virtual Desktops
            </h2>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                padding: '2px 7px',
                borderRadius: 4,
                background: 'rgba(0,120,212,0.18)',
                color: '#60a5fa',
                marginLeft: 4,
              }}
            >
              {desktopsList.length}
            </span>
          </div>

          {/* Horizontal scroll carousel */}
          <div
            style={{
              display: 'flex',
              gap: 14,
              overflowX: 'auto',
              paddingBottom: 8,
              cursor: 'grab',
            }}
          >
              {desktopsList.map(d => (
                <div
                  key={d.id}
                  onClick={() => setActiveDesktop(d.id)}
                  style={{
                    flexShrink: 0,
                    borderRadius: 12,
                    overflow: 'hidden',
                    border: `1px solid ${activeDesktop === d.id ? 'rgba(0,120,212,0.6)' : 'rgba(255,255,255,0.07)'}`,
                    boxShadow: activeDesktop === d.id
                      ? '0 0 0 1px rgba(0,120,212,0.3), 0 0 20px rgba(0,120,212,0.15)'
                      : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <DesktopCard
                    desktop={d}
                    isActive={activeDesktop === d.id}
                    onChangeWallpaper={() => handleSelectWallpaperFile(d.id)}
                  />
                </div>
              ))}

              {/* Add Desktop placeholder */}
              <div
                style={{
                  width: 200,
                  flexShrink: 0,
                  borderRadius: 12,
                  border: '1.5px dashed rgba(255,255,255,0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  minHeight: 160,
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget
                  el.style.borderColor = 'rgba(0,120,212,0.35)'
                  el.style.background = 'rgba(0,120,212,0.05)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget
                  el.style.borderColor = 'rgba(255,255,255,0.1)'
                  el.style.background = 'transparent'
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    border: '1.5px dashed rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Plus size={16} color="rgba(255,255,255,0.3)" />
                </div>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>
                  New Desktop
                </span>
              </div>
            </div>
          </section>

          {/* ── Wallpaper Library ── */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={15} color="#60a5fa" />
                <h2 style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.75)', margin: 0 }}>
                  Live Wallpaper Library
                </h2>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 600,
                    padding: '2px 7px',
                    borderRadius: 4,
                    background: 'rgba(168,85,247,0.18)',
                    color: '#c084fc',
                    marginLeft: 4,
                  }}
                >
                  {filteredWallpapers.length} wallpapers
                </span>
              </div>

              {/* View toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div className="icon-btn active">
                  <LayoutGrid size={14} />
                </div>
              </div>
            </div>

            {/* Filter pills */}
            <div style={{ display: 'flex', gap: 7, marginBottom: 16, flexWrap: 'wrap' }}>
              {filters.map(f => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    padding: '5px 12px',
                    borderRadius: 20,
                    border: `1px solid ${activeFilter === f ? 'rgba(0,120,212,0.5)' : 'rgba(255,255,255,0.1)'}`,
                    background: activeFilter === f ? 'rgba(0,120,212,0.2)' : 'rgba(255,255,255,0.04)',
                    color: activeFilter === f ? '#60a5fa' : 'rgba(255,255,255,0.45)',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  {f !== 'All' && (
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: TAG_TEXT[f] || '#60a5fa',
                        display: 'inline-block',
                      }}
                    />
                  )}
                  {f}
                </button>
              ))}

              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Tag size={11} color="rgba(255,255,255,0.3)" />
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)' }}>Filter by tag</span>
              </div>
            </div>

            {/* Grid */}
            {filteredWallpapers.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                  gap: 14,
                  paddingBottom: 80,
                }}
              >
                {filteredWallpapers.map(w => (
                  <WallpaperCard key={w.id} w={w} />
                ))}
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '60px 0',
                  color: 'rgba(255,255,255,0.25)',
                  gap: 10,
                }}
              >
                <Search size={32} strokeWidth={1} />
                <span style={{ fontSize: 14 }}>No wallpapers found</span>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* ── Floating Quick Control ── */}
      <FloatingPlayer
        wallpaperPaused={wallpaperPaused}
        onTogglePause={() => setWallpaperPaused(v => !v)}
      />
    </div>
  )
}
