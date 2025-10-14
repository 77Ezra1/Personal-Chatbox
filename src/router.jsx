import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// 懒加载页面组件
const LoginPage = lazy(() => import('./pages/LoginPage'));
const App = lazy(() => import('./App'));

// 加载中组件
function LoadingFallback() {
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      fontSize: '16px',
      color: '#666'
    }}>
      <div>加载中...</div>
    </div>
  );
}

// 路由守卫组件
function RouteGuard({ children, requireAuth }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh' 
      }}>
        <div>加载中...</div>
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!requireAuth && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// 路由配置
function AppRoutes() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* 公开路由 */}
        <Route 
          path="/login" 
          element={
            <RouteGuard requireAuth={false}>
              <LoginPage />
            </RouteGuard>
          } 
        />
        <Route 
          path="/register" 
          element={<Navigate to="/login" replace />}
        />

        {/* 受保护的路由 */}
        <Route 
          path="/*" 
          element={
            <RouteGuard requireAuth={true}>
              <App />
            </RouteGuard>
          } 
        />
      </Routes>
    </Suspense>
  );
}

// 根组件
export default function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

