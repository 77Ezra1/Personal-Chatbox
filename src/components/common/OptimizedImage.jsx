import { memo } from 'react'
import { cn } from '@/lib/utils'

/**
 * 优化的图片组件
 * 
 * 功能：
 * - 自动懒加载
 * - 支持 WebP 格式（带回退）
 * - 异步解码
 * - 响应式图片
 * 
 * @param {string} src - 图片源路径
 * @param {string} alt - 替代文本
 * @param {string} className - CSS类名
 * @param {string} webpSrc - WebP格式图片路径（可选）
 * @param {Object} responsive - 响应式图片配置
 */
export const OptimizedImage = memo(function OptimizedImage({
  src,
  alt = '',
  className,
  webpSrc,
  responsive,
  loading = 'lazy',
  decoding = 'async',
  ...props
}) {
  // 如果提供了WebP源，使用picture元素
  if (webpSrc || responsive) {
    return (
      <picture className={cn('optimized-image-wrapper', className)}>
        {/* WebP格式 */}
        {webpSrc && (
          <source srcSet={webpSrc} type="image/webp" />
        )}
        
        {/* 响应式图片 */}
        {responsive?.srcSet && (
          <>
            {responsive.webp && (
              <source 
                srcSet={responsive.webp}
                type="image/webp"
                sizes={responsive.sizes}
              />
            )}
            <source 
              srcSet={responsive.srcSet}
              sizes={responsive.sizes}
            />
          </>
        )}
        
        {/* 回退图片 */}
        <img
          src={src}
          alt={alt}
          loading={loading}
          decoding={decoding}
          className={cn('optimized-image', className)}
          {...props}
        />
      </picture>
    )
  }

  // 简单图片
  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      decoding={decoding}
      className={cn('optimized-image', className)}
      {...props}
    />
  )
})

/**
 * 背景图片组件
 * 使用CSS背景图片，支持懒加载
 */
export const OptimizedBackground = memo(function OptimizedBackground({
  src,
  webpSrc,
  children,
  className,
  style,
  ...props
}) {
  const backgroundImage = webpSrc 
    ? `url(${webpSrc}), url(${src})`
    : `url(${src})`

  return (
    <div
      className={cn('optimized-background', className)}
      style={{
        ...style,
        backgroundImage,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
      {...props}
    >
      {children}
    </div>
  )
})

/**
 * 头像图片组件
 * 针对头像优化的图片组件
 */
export const OptimizedAvatar = memo(function OptimizedAvatar({
  src,
  alt = '',
  size = 40,
  className,
  ...props
}) {
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      className={cn('optimized-avatar', 'rounded-full object-cover', className)}
      style={{ width: size, height: size }}
      {...props}
    />
  )
})

/**
 * 工具函数：将普通图片URL转换为WebP URL
 * 假设WebP文件与原文件同名，只是扩展名不同
 */
export function getWebPUrl(originalUrl) {
  if (!originalUrl) return null
  return originalUrl.replace(/\.(jpg|jpeg|png)$/i, '.webp')
}

/**
 * 工具函数：生成响应式图片srcSet
 * @param {string} baseUrl - 基础URL（不含尺寸后缀）
 * @param {Array<number>} sizes - 尺寸数组 [400, 800, 1200]
 * @param {string} ext - 文件扩展名
 */
export function generateSrcSet(baseUrl, sizes = [400, 800, 1200], ext = 'jpg') {
  return sizes
    .map(size => `${baseUrl}-${size}w.${ext} ${size}w`)
    .join(', ')
}

/**
 * 工具函数：预加载关键图片
 * @param {string|Array<string>} urls - 图片URL或URL数组
 */
export function preloadImages(urls) {
  const urlArray = Array.isArray(urls) ? urls : [urls]
  
  urlArray.forEach(url => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = url
    document.head.appendChild(link)
  })
}

export default OptimizedImage
