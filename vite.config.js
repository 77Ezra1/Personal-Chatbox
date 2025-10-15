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
      },
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
        manualChunks: {
          // React 核心库
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // UI组件库
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-scroll-area',
          ],
          // Markdown渲染相关
          'markdown-vendor': [
            'react-markdown',
            'remark-breaks',
            'remark-gfm',
            'remark-math',
            'rehype-katex',
          ],
          // 工具库
          'utils-vendor': ['axios', 'clsx', 'date-fns'],
        },
      },
    },
    // 压缩选项
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // 生产环境移除console
        drop_debugger: true,
      },
    },
    // chunk大小警告限制
    chunkSizeWarningLimit: 1000,
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
