export function isDeepThinkingSupported() {
  if (typeof window === 'undefined') return false
  return !!(window).ai
}
