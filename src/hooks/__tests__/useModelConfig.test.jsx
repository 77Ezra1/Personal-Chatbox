import { forwardRef, useImperativeHandle, createRef } from 'react'
import { render, cleanup, act, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useModelConfig } from '../useModelConfig'
import { CUSTOM_MODELS_KEY, MODEL_CONFIG_KEY } from '@/lib/constants'

const HookHarness = forwardRef((_, ref) => {
  const value = useModelConfig()
  useImperativeHandle(ref, () => value, [value])
  return null
})

HookHarness.displayName = 'HookHarness'

describe('useModelConfig custom model persistence', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    cleanup()
  })

  it('persists custom model selection and restores it after reload', async () => {
    const hookRef = createRef()
    const { unmount } = render(<HookHarness ref={hookRef} />)

    await waitFor(() => {
      expect(hookRef.current).toBeTruthy()
    })

    const provider = hookRef.current.currentProvider
    const customModel = 'my-custom-model'

    await act(async () => {
      hookRef.current.setModel(customModel)
    })

    await waitFor(() => {
      expect(hookRef.current.currentModel).toBe(customModel)
    })

    await waitFor(() => {
      const storedCustomModels = JSON.parse(window.localStorage.getItem(CUSTOM_MODELS_KEY))
      expect(storedCustomModels?.[provider]).toContain(customModel)
    })

    await waitFor(() => {
      const storedConfig = JSON.parse(window.localStorage.getItem(MODEL_CONFIG_KEY))
      expect(storedConfig?.providers?.[provider]?.activeModel).toBe(customModel)
    })

    unmount()

    const hookRefReload = createRef()
    const { unmount: unmountReload } = render(<HookHarness ref={hookRefReload} />)

    await waitFor(() => {
      expect(hookRefReload.current).toBeTruthy()
    })

    expect(hookRefReload.current.currentModel).toBe(customModel)
    expect(
      hookRefReload.current
        .getProviderModels(hookRefReload.current.currentProvider)
        .includes(customModel)
    ).toBe(true)

    unmountReload()
  })

  it('exposes updated mistral defaults and stores selection', async () => {
    const hookRef = createRef()
    render(<HookHarness ref={hookRef} />)

    await waitFor(() => {
      expect(hookRef.current).toBeTruthy()
    })

    await act(async () => {
      hookRef.current.setProvider('mistral')
    })

    await waitFor(() => {
      expect(hookRef.current.currentProvider).toBe('mistral')
    })

    const mistralDefaults = hookRef.current.getProviderModels('mistral')
    expect(mistralDefaults).toContain('mistral-medium-latest')

    await act(async () => {
      hookRef.current.setModel('mistral-medium-latest')
    })

    await waitFor(() => {
      expect(hookRef.current.currentModel).toBe('mistral-medium-latest')
    })

    const storedConfig = JSON.parse(window.localStorage.getItem(MODEL_CONFIG_KEY))
    expect(storedConfig?.providers?.mistral?.activeModel).toBe('mistral-medium-latest')
  })
})
