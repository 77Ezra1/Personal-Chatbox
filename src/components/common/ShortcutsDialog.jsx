import { X, Keyboard } from 'lucide-react'
import { formatShortcut } from '@/hooks/useKeyboardShortcuts'

/**
 * 快捷键帮助对话框
 * 显示所有可用的快捷键
 */
export function ShortcutsDialog({ shortcuts, onClose, translate }) {
  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-content shortcuts-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <div className="dialog-title">
            <Keyboard size={20} />
            <h2>{translate('shortcuts.title', 'Keyboard Shortcuts')}</h2>
          </div>
          <button
            className="dialog-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="dialog-body">
          <div className="shortcuts-list">
            {Object.entries(shortcuts).map(([name, shortcut]) => (
              <div key={name} className="shortcut-item">
                <span className="shortcut-description">
                  {translate(`shortcuts.${name}`, shortcut.description)}
                </span>
                <kbd className="shortcut-key">
                  {formatShortcut(shortcut)}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        <div className="dialog-footer">
          <p className="shortcuts-tip">
            {translate(
              'shortcuts.tip',
              'Press Ctrl+/ to show this dialog anytime'
            )}
          </p>
        </div>
      </div>
    </div>
  )
}

