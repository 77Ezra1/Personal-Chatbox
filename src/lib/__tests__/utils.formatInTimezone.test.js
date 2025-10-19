/**
 * Tests for formatInTimezone utility function
 */

import { describe, it, expect } from 'vitest';
import { formatInTimezone, formatNowInTimezone, getCommonTimezones } from '../utils.js';

describe('formatInTimezone', () => {
  it('formats Date object correctly', () => {
    const date = new Date('2025-10-19T06:30:45Z');
    const result = formatInTimezone(date, 'Asia/Shanghai');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    expect(result).toBe('2025-10-19 14:30:45'); // UTC+8
  });

  it('formats ISO string correctly', () => {
    const result = formatInTimezone('2025-10-19T06:30:45Z', 'UTC');
    expect(result).toBe('2025-10-19 06:30:45');
  });

  it('formats timestamp correctly', () => {
    const timestamp = new Date('2025-10-19T06:30:45Z').getTime();
    const result = formatInTimezone(timestamp, 'America/New_York');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });

  it('uses default timezone when not specified', () => {
    const date = new Date('2025-10-19T06:30:45Z');
    const result = formatInTimezone(date);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });

  it('handles different timezones correctly', () => {
    const date = new Date('2025-10-19T12:00:00Z');
    
    const utc = formatInTimezone(date, 'UTC');
    expect(utc).toBe('2025-10-19 12:00:00');
    
    const shanghai = formatInTimezone(date, 'Asia/Shanghai');
    expect(shanghai).toBe('2025-10-19 20:00:00'); // UTC+8
    
    const tokyo = formatInTimezone(date, 'Asia/Tokyo');
    expect(tokyo).toBe('2025-10-19 21:00:00'); // UTC+9
  });

  it('handles invalid date input', () => {
    const result = formatInTimezone('invalid-date', 'UTC');
    expect(result).toBe('Invalid Date');
  });

  it('handles null/undefined input', () => {
    const resultNull = formatInTimezone(null, 'UTC');
    expect(resultNull).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/); // Uses current date
    
    const resultUndefined = formatInTimezone(undefined, 'UTC');
    expect(resultUndefined).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/); // Uses current date
  });

  it('formats midnight correctly', () => {
    const date = new Date('2025-10-19T00:00:00Z');
    const result = formatInTimezone(date, 'UTC');
    expect(result).toBe('2025-10-19 00:00:00');
  });

  it('formats date with single-digit values correctly', () => {
    const date = new Date('2025-01-05T03:05:09Z');
    const result = formatInTimezone(date, 'UTC');
    expect(result).toBe('2025-01-05 03:05:09'); // Should have leading zeros
  });
});

describe('formatNowInTimezone', () => {
  it('formats current time in specified timezone', () => {
    const result = formatNowInTimezone('UTC');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });

  it('uses default timezone when not specified', () => {
    const result = formatNowInTimezone();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });
});

describe('getCommonTimezones', () => {
  it('returns array of timezone objects', () => {
    const timezones = getCommonTimezones();
    expect(Array.isArray(timezones)).toBe(true);
    expect(timezones.length).toBeGreaterThan(0);
  });

  it('includes required properties for each timezone', () => {
    const timezones = getCommonTimezones();
    timezones.forEach(tz => {
      expect(tz).toHaveProperty('value');
      expect(tz).toHaveProperty('label');
      expect(tz).toHaveProperty('offset');
      expect(typeof tz.value).toBe('string');
      expect(typeof tz.label).toBe('string');
      expect(typeof tz.offset).toBe('string');
    });
  });

  it('includes common timezones', () => {
    const timezones = getCommonTimezones();
    const values = timezones.map(tz => tz.value);
    expect(values).toContain('Asia/Shanghai');
    expect(values).toContain('UTC');
    expect(values).toContain('America/New_York');
    expect(values).toContain('Europe/London');
  });
});
