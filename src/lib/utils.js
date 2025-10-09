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
