import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { generateAIResponse } from '@/lib/aiClient'

describe('generateAIResponse with Mistral models', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('uses the updated mistral model identifier in requests', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            choices: [
              {
                message: { content: 'ok' }
              }
            ]
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      )

    await generateAIResponse({
      messages: [{ role: 'user', content: 'Hi' }],
      modelConfig: {
        provider: 'mistral',
        model: 'mistral-medium-latest',
        apiKey: 'test-key'
      }
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [, requestInit] = fetchMock.mock.calls[0]
    const body = JSON.parse(requestInit.body)
    expect(body.model).toBe('mistral-medium-latest')
  })
})
