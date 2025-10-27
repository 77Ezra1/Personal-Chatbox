const EVENT_NAME = 'mcp-services-updated'

export function emitMcpServicesUpdated(detail = {}) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { ...detail, timestamp: Date.now() } }))
}

export function subscribeMcpServicesUpdated(handler) {
  if (typeof window === 'undefined') {
    return () => {}
  }
  window.addEventListener(EVENT_NAME, handler)
  return () => window.removeEventListener(EVENT_NAME, handler)
}
