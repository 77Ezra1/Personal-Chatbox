import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        // ✅ 禁用代理缓冲以支持 SSE 流式响应
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // 设置 no-cache 避免缓冲
            if (req.url.includes('/api/chat')) {
              proxyReq.setHeader('Cache-Control', 'no-cache');
              proxyReq.setHeader('Connection', 'keep-alive');
            }
          });
        },
      },
    },
    watch: {
      ignored: [
        'data/**',
        '**/data/**',
        '**/uploads/**',
        '**/logs/**',
        '**/backup/**'
      ],
    },
    // 配置中间件以服务根目录下的HTML文件
    middlewareMode: false,
    // 添加自定义中间件
    async configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // 匹配 /*.html 请求（排除index.html以保护应用入口）
        const htmlMatch = req.url?.match(/^\/([^/]+\.html)$/)
        if (htmlMatch) {
          const fileName = htmlMatch[1]

          // ⚠️ 保护应用入口文件，防止被AI生成的文件覆盖
          if (fileName === 'index.html') {
            next()
            return
          }

          const filePath = path.join(rootDir, fileName)

          // 检查文件是否存在
          if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf-8')
            res.setHeader('Content-Type', 'text/html')
            res.end(content)
            return
          }
        }
        next()
      })
    },
  },
  build: {
    // 代码分割优化
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React 核心库
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) {
            return 'react-vendor'
          }

          // UI组件库 - Radix UI
          if (id.includes('node_modules/@radix-ui')) {
            return 'ui-vendor'
          }

          // Markdown渲染相关
          if (id.includes('node_modules/react-markdown') ||
              id.includes('node_modules/remark-') ||
              id.includes('node_modules/rehype-') ||
              id.includes('node_modules/katex')) {
            return 'markdown-vendor'
          }

          // 图表库
          if (id.includes('node_modules/recharts')) {
            return 'chart-vendor'
          }

          // 其他node_modules依赖
          if (id.includes('node_modules')) {
            return 'vendor'
          }
        },
        // 优化文件命名
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    // 压缩选项
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production', // 仅生产环境移除console
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.debug'], // 移除特定console方法
      },
      format: {
        comments: false, // 移除注释
      },
    },
    // chunk大小警告限制
    chunkSizeWarningLimit: 1000,
    // 启用 CSS 代码分割
    cssCodeSplit: true,
    // 构建输出目录
    outDir: 'dist',
    // 构建时清空输出目录
    emptyOutDir: true,
    // 启用源码映射（开发时）
    sourcemap: process.env.NODE_ENV !== 'production',
    // 资源内联限制 (小于4kb的资源将被内联为base64)
    assetsInlineLimit: 4096,
  },
  // 优化依赖预构建
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'react-markdown',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
    ],
  },
})
