import { Sun, Moon, Monitor } from 'lucide-react'

/**
 * v0 风格主题选择器组件
 * 提供视觉化的主题切换界面
 */
export function ThemeSelector({ theme, onThemeChange, translate }) {
  const themes = [
    {
      id: 'light',
      name: translate?.('settings.appearance.light', 'Light'),
      description: translate?.('settings.appearance.lightDesc', 'Bright and clean interface'),
      icon: Sun,
      preview: 'bg-white border-neutral-200'
    },
    {
      id: 'dark',
      name: translate?.('settings.appearance.dark', 'Dark'),
      description: translate?.('settings.appearance.darkDesc', 'Easy on the eyes'),
      icon: Moon,
      preview: 'bg-neutral-900 border-neutral-800'
    },
    {
      id: 'auto',
      name: translate?.('settings.appearance.auto', 'Auto'),
      description: translate?.('settings.appearance.autoDesc', 'Follow system preference'),
      icon: Monitor,
      preview: 'bg-gradient-to-br from-white to-neutral-900 border-neutral-400'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {themes.map((themeOption) => {
        const Icon = themeOption.icon
        const isActive = theme === themeOption.id

        return (
          <button
            key={themeOption.id}
            onClick={() => onThemeChange(themeOption.id)}
            className={`
              relative p-4 rounded-xl border-2 transition-all duration-200
              hover:shadow-md hover:scale-[1.02] active:scale-[0.98]
              ${isActive
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-border bg-card hover:border-primary/50'
              }
            `}
          >
            {/* 选中指示器 */}
            {isActive && (
              <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-primary animate-pulse" />
            )}

            {/* 主题预览 */}
            <div className={`
              w-full h-24 rounded-lg mb-3 border-2 ${themeOption.preview}
              flex items-center justify-center transition-transform
              ${isActive ? 'scale-105' : ''}
            `}>
              <Icon className={`
                w-8 h-8 transition-colors
                ${themeOption.id === 'light' ? 'text-amber-500' : ''}
                ${themeOption.id === 'dark' ? 'text-blue-500' : ''}
                ${themeOption.id === 'auto' ? 'text-neutral-500' : ''}
              `} />
            </div>

            {/* 主题信息 */}
            <div className="text-left">
              <h4 className={`
                font-semibold mb-1 transition-colors
                ${isActive ? 'text-primary' : 'text-foreground'}
              `}>
                {themeOption.name}
              </h4>
              <p className="text-sm text-muted-foreground">
                {themeOption.description}
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
