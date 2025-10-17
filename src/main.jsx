import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/themes.css'
import AppRouter from './router.jsx'
import './styles/auth.css'
import { initSentry, SentryErrorBoundary } from './lib/sentry.jsx'
import { initPerformanceMonitoring } from './lib/performance'
import { ThemeProvider } from './contexts/ThemeContext'

// 初始化 Sentry 错误追踪
initSentry()

// 初始化性能监控
initPerformanceMonitoring()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <SentryErrorBoundary
      fallback={({ error, resetError }) => (
        <div style={{ 
          padding: '2rem', 
          textAlign: 'center',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <h1 style={{ color: '#999' }}>😔 应用遇到了问题</h1>
          <p style={{ color: '#666', margin: '1rem 0' }}>
            我们已经记录了这个错误，将尽快修复。
          </p>
          <details style={{ 
            marginTop: '2rem', 
            textAlign: 'left',
            maxWidth: '600px',
            margin: '2rem auto',
            padding: '1rem',
            background: '#f0f0f0',
            borderRadius: '8px'
          }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
              错误详情
            </summary>
            <pre style={{ 
              marginTop: '1rem',
              padding: '1rem',
              background: '#fff',
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '0.875rem'
            }}>
              {error?.message || '未知错误'}
            </pre>
          </details>
          <button
            onClick={() => {
              resetError()
              window.location.href = '/'
            }}
            style={{
              padding: '0.75rem 2rem',
              background: '#333',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              cursor: 'pointer',
              marginTop: '1rem'
            }}
          >
            返回首页
          </button>
        </div>
      )}
      showDialog={false}
    >
      <AppRouter />
    </SentryErrorBoundary>
    </ThemeProvider>
  </StrictMode>,
)
