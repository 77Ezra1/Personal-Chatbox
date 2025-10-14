import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createLogger } from '@/lib/logger'

describe('Logger', () => {
  let consoleSpy
  
  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation()
  })
  
  it('should create logger with context', () => {
    const logger = createLogger('TestContext')
    expect(logger.context).toBe('TestContext')
  })
  
  it('should format log messages correctly', () => {
    const logger = createLogger('Test')
    logger.log('test message')
    
    expect(consoleSpy).toHaveBeenCalled()
    const call = consoleSpy.mock.calls[0][0]
    expect(call).toContain('[Test]')
  })
})
