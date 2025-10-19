import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Attachment ID generator
export const createAttachmentId = () => `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`

// File size formatter
export const formatFileSize = (bytes = 0) => {
  if (!bytes || Number.isNaN(bytes)) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = bytes
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }
  const formatted = unitIndex === 0 || size >= 10 ? Math.round(size) : Number(size.toFixed(1))
  return `${formatted} ${units[unitIndex]}`
}

// File reader
export const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    try {
      const reader = new FileReader()
      reader.onload = () => {
        resolve(typeof reader.result === 'string' ? reader.result : '')
      }
      reader.onerror = () => {
        reject(reader.error ?? new Error('Failed to read file'))
      }
      reader.onabort = () => reject(new Error('File reading aborted'))
      reader.readAsDataURL(file)
    } catch (error) {
      reject(error instanceof Error ? error : new Error('Failed to read file'))
    }
  })

// Number converter
export const toNumber = (value, fallback) => {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

// Deep clone
export const cloneState = (value) => JSON.parse(JSON.stringify(value ?? {}))

/**
 * Format date/time in timezone with unified format: YYYY-MM-DD HH:mm:ss
 * @param {Date|string|number} date - Date object, ISO string, or timestamp
 * @param {string} timezone - IANA timezone name (e.g., 'Asia/Shanghai', 'America/New_York')
 * @returns {string} Formatted date string in YYYY-MM-DD HH:mm:ss format
 * @example
 * formatInTimezone(new Date(), 'Asia/Shanghai')
 * // => '2025-10-19 14:30:45'
 * 
 * formatInTimezone('2025-10-19T06:30:45Z', 'America/New_York')
 * // => '2025-10-19 02:30:45'
 * 
 * formatInTimezone(1729334445000, 'UTC')
 * // => '2025-10-19 06:30:45'
 */
export const formatInTimezone = (date, timezone = 'Asia/Shanghai') => {
  try {
    // Convert input to Date object
    let dateObj;
    if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'string' || typeof date === 'number') {
      dateObj = new Date(date);
    } else {
      dateObj = new Date();
    }

    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      throw new Error('Invalid date');
    }

    // Format using Intl.DateTimeFormat for timezone conversion
    const options = {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    };

    const formatter = new Intl.DateTimeFormat('en-CA', options);
    const parts = formatter.formatToParts(dateObj);

    // Extract parts
    const partsMap = {};
    parts.forEach(part => {
      partsMap[part.type] = part.value;
    });

    // Construct YYYY-MM-DD HH:mm:ss format
    const year = partsMap.year;
    const month = partsMap.month;
    const day = partsMap.day;
    const hour = partsMap.hour;
    const minute = partsMap.minute;
    const second = partsMap.second;

    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
  } catch (error) {
    console.error('[formatInTimezone] Error formatting date:', error);
    return 'Invalid Date';
  }
}

/**
 * Format current time in timezone
 * @param {string} timezone - IANA timezone name
 * @returns {string} Current time in YYYY-MM-DD HH:mm:ss format
 */
export const formatNowInTimezone = (timezone = 'Asia/Shanghai') => {
  return formatInTimezone(new Date(), timezone);
}

/**
 * Get list of common timezones
 * @returns {Array<{value: string, label: string, offset: string}>}
 */
export const getCommonTimezones = () => {
  return [
    { value: 'Asia/Shanghai', label: 'China Standard Time (CST)', offset: 'UTC+8' },
    { value: 'UTC', label: 'Coordinated Universal Time (UTC)', offset: 'UTC+0' },
    { value: 'America/New_York', label: 'Eastern Time (ET)', offset: 'UTC-5/-4' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)', offset: 'UTC-8/-7' },
    { value: 'America/Chicago', label: 'Central Time (CT)', offset: 'UTC-6/-5' },
    { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)', offset: 'UTC+0/+1' },
    { value: 'Europe/Paris', label: 'Central European Time (CET)', offset: 'UTC+1/+2' },
    { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)', offset: 'UTC+9' },
    { value: 'Asia/Hong_Kong', label: 'Hong Kong Time (HKT)', offset: 'UTC+8' },
    { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)', offset: 'UTC+10/+11' }
  ];
}

/**
 * Format note timestamp with fallback logic
 * @param {string|null|undefined} timestamp - Primary timestamp (e.g., updated_at)
 * @param {string|null|undefined} fallbackTimestamp - Fallback timestamp (e.g., created_at)
 * @param {string} timezone - User's timezone
 * @returns {string} Formatted timestamp or default message
 */
export const formatNoteTime = (timestamp, fallbackTimestamp, timezone = 'Asia/Shanghai') => {
  // Try primary timestamp
  if (timestamp) {
    const formatted = formatInTimezone(timestamp, timezone);
    if (formatted !== 'Invalid Date') {
      return formatted;
    }
  }

  // Try fallback timestamp
  if (fallbackTimestamp) {
    const formatted = formatInTimezone(fallbackTimestamp, timezone);
    if (formatted !== 'Invalid Date') {
      return formatted;
    }
  }

  // Use current time as last resort
  return formatNowInTimezone(timezone);
}

/**
 * Normalize note object to ensure consistent data format
 * Handles:
 * - Tags: Ensures array format (parses JSON strings, converts comma-separated strings)
 * - Timestamps: Ensures ISO 8601 format for created_at and updated_at
 * - Missing fields: Provides sensible defaults
 * 
 * @param {Object} note - Raw note object from API/database
 * @returns {Object} Normalized note object with consistent format
 * @example
 * const normalized = normalizeNote({
 *   id: 1,
 *   title: 'Test',
 *   content: 'Content',
 *   tags: '["tag1","tag2"]', // JSON string
 *   created_at: 1729334445000 // timestamp
 * });
 * // => {
 * //   id: 1,
 * //   title: 'Test',
 * //   content: 'Content',
 * //   tags: ['tag1', 'tag2'], // Array
 * //   created_at: '2025-10-19T06:30:45.000Z', // ISO string
 * //   updated_at: '2025-10-19T06:30:45.000Z',
 * //   category: null,
 * //   is_favorite: false,
 * //   is_archived: false
 * // }
 */
export const normalizeNote = (note) => {
  if (!note || typeof note !== 'object') {
    console.warn('[normalizeNote] Invalid note object:', note);
    return null;
  }

  // Normalize tags to array
  let tags = [];
  if (note.tags) {
    if (Array.isArray(note.tags)) {
      // Already an array
      tags = note.tags.filter(tag => typeof tag === 'string' && tag.trim());
    } else if (typeof note.tags === 'string') {
      try {
        // Try parsing as JSON array
        const parsed = JSON.parse(note.tags);
        if (Array.isArray(parsed)) {
          tags = parsed.filter(tag => typeof tag === 'string' && tag.trim());
        } else {
          // Fallback: split by comma
          tags = note.tags.split(',').map(tag => tag.trim()).filter(Boolean);
        }
      } catch {
        // Not JSON, treat as comma-separated string
        tags = note.tags.split(',').map(tag => tag.trim()).filter(Boolean);
      }
    }
  }

  // Normalize timestamps to ISO 8601 format
  const normalizeTimestamp = (timestamp) => {
    if (!timestamp) return null;
    
    try {
      // If already ISO string, validate it
      if (typeof timestamp === 'string') {
        const date = new Date(timestamp);
        return isNaN(date.getTime()) ? null : date.toISOString();
      }
      
      // If number (unix timestamp), convert
      if (typeof timestamp === 'number') {
        const date = new Date(timestamp);
        return isNaN(date.getTime()) ? null : date.toISOString();
      }
      
      // If Date object
      if (timestamp instanceof Date) {
        return isNaN(timestamp.getTime()) ? null : timestamp.toISOString();
      }
      
      return null;
    } catch (error) {
      console.error('[normalizeNote] Error normalizing timestamp:', error);
      return null;
    }
  };

  const now = new Date().toISOString();
  const created_at = normalizeTimestamp(note.created_at) || now;
  const updated_at = normalizeTimestamp(note.updated_at) || created_at;

  // Return normalized note
  return {
    id: note.id,
    user_id: note.user_id,
    title: typeof note.title === 'string' ? note.title : '',
    content: typeof note.content === 'string' ? note.content : '',
    category: note.category || null,
    tags, // Normalized array
    is_favorite: Boolean(note.is_favorite),
    is_archived: Boolean(note.is_archived),
    created_at, // ISO 8601 string
    updated_at, // ISO 8601 string
    // Preserve any additional fields
    ...Object.fromEntries(
      Object.entries(note).filter(([key]) => 
        !['id', 'user_id', 'title', 'content', 'category', 'tags', 
          'is_favorite', 'is_archived', 'created_at', 'updated_at'].includes(key)
      )
    )
  };
}

/**
 * Normalize an array of notes
 * @param {Array<Object>} notes - Array of raw note objects
 * @returns {Array<Object>} Array of normalized notes (filters out invalid ones)
 */
export const normalizeNotes = (notes) => {
  if (!Array.isArray(notes)) {
    console.warn('[normalizeNotes] Input is not an array:', notes);
    return [];
  }
  
  return notes
    .map(note => normalizeNote(note))
    .filter(note => note !== null);
}
