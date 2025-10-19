/**
 * Format a date using a specific timezone and returns a YYYY-MM-DD HH:mm:ss string.
 */
export function formatInTimezone(dateInput, timezone, locale) {
  if (!dateInput) {
    return '--';
  }

  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) {
    return '--';
  }

  const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const formatter = new Intl.DateTimeFormat(locale || undefined, {
    timeZone: tz,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const parts = formatter.formatToParts(date);
  const lookup = (type) => parts.find((part) => part.type === type)?.value || '00';

  return `${lookup('year')}-${lookup('month')}-${lookup('day')} ${lookup('hour')}:${lookup('minute')}:${lookup('second')}`;
}
