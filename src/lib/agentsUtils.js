export function normalizeAgentStatus(status) {
  if (!status) return ''
  return String(status).toLowerCase()
}

export function getAgentStatusLabel(translate, status, fallbackKey = 'unknown') {
  const normalized = normalizeAgentStatus(status)
  const fallback =
    normalized ||
    translate('agents.selector.statusUnknown', 'unknown')

  return translate(`agents.status.${normalized || fallbackKey}`, fallback)
}
