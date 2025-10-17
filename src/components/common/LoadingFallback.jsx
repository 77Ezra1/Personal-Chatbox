/**
 * LoadingFallback Component
 * Modern loading indicator following v0.dev design principles
 * Clean, minimal, and performant
 */

import { memo } from 'react';
import './LoadingFallback.css';

/**
 * LoadingFallback - Clean loading indicator
 * @param {Object} props
 * @param {string} props.message - Optional loading message
 * @param {string} props.size - Size: 'sm', 'md', 'lg'
 * @param {boolean} props.fullScreen - Whether to show full screen loading
 */
const LoadingFallback = memo(({
  message = 'Loading...',
  size = 'md',
  fullScreen = false
}) => {
  const sizeClasses = {
    sm: 'loading-sm',
    md: 'loading-md',
    lg: 'loading-lg'
  };

  if (fullScreen) {
    return (
      <div className="loading-fallback-fullscreen">
        <div className="loading-content">
          <div className={`loading-spinner ${sizeClasses[size]}`}>
            <div className="spinner-circle"></div>
          </div>
          {message && (
            <p className="loading-message">{message}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="loading-fallback">
      <div className={`loading-spinner ${sizeClasses[size]}`}>
        <div className="spinner-circle"></div>
      </div>
      {message && (
        <p className="loading-message">{message}</p>
      )}
    </div>
  );
});

LoadingFallback.displayName = 'LoadingFallback';

export default LoadingFallback;

/**
 * Skeleton Loader Component
 * For content placeholders
 */
export const SkeletonLoader = memo(({
  count = 1,
  height = 20,
  className = ''
}) => {
  return (
    <div className={`skeleton-container ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="skeleton-line"
          style={{ height: `${height}px` }}
        />
      ))}
    </div>
  );
});

SkeletonLoader.displayName = 'SkeletonLoader';

/**
 * Inline Spinner Component
 * Minimal spinner for inline loading states
 */
export const InlineSpinner = memo(({ size = 16, className = '' }) => {
  return (
    <div
      className={`inline-spinner ${className}`}
      style={{ width: size, height: size }}
    >
      <div className="spinner-circle"></div>
    </div>
  );
});

InlineSpinner.displayName = 'InlineSpinner';
