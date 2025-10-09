import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import React from 'react'

import { formatShortcut } from '../useKeyboardShortcuts'
import { ShortcutsDialog } from '@/components/common/ShortcutsDialog'

describe('formatShortcut 在缺少 navigator 时的行为', () => {
  let originalNavigatorDescriptor

  const removeNavigator = () => {
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      get() {
        return undefined
      },
    })
  }

  beforeEach(() => {
    originalNavigatorDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator')
  })

  afterEach(() => {
    cleanup()

    if (originalNavigatorDescriptor) {
      Object.defineProperty(globalThis, 'navigator', originalNavigatorDescriptor)
    } else {
      delete globalThis.navigator
    }
  })

  it('在 navigator 不存在时返回非 Mac 格式且不抛出错误', () => {
    removeNavigator()

    const shortcut = { key: 'k', ctrl: true }

    expect(() => formatShortcut(shortcut)).not.toThrow()
    expect(formatShortcut(shortcut)).toBe('Ctrl+K')
  })

  it('渲染 ShortcutsDialog 时不会因为缺少 navigator 抛出错误', () => {
    removeNavigator()

    expect(() =>
      render(
        <ShortcutsDialog
          shortcuts={{
            SEARCH: {
              key: 'k',
              ctrl: true,
              description: '搜索对话',
            },
          }}
          onClose={() => {}}
          translate={(key, fallback) => fallback ?? key}
        />
      )
    ).not.toThrow()

    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument()
    expect(screen.getByText('Ctrl+K')).toBeInTheDocument()
  })
})

