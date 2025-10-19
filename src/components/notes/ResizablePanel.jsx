/**
 * 可调整大小的面板组件
 * 支持拖拽调整宽度，类似 VS Code 的侧边栏
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import './ResizablePanel.css';

export function ResizablePanel({
  children,
  side = 'left', // 'left' | 'right'
  defaultWidth = 280,
  minWidth = 200,
  maxWidth = 600,
  storageKey = 'panel-width',
  className = ''
}) {
  // 从 localStorage 读取保存的宽度
  const savedWidth = localStorage.getItem(storageKey);
  const [width, setWidth] = useState(savedWidth ? parseInt(savedWidth) : defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef(null);
  const startX = useRef(0);
  const startWidth = useRef(0);

  // 开始拖拽
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
    startX.current = e.clientX;
    startWidth.current = width;

    // 添加 body 样式防止选中文本
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [width]);

  // 拖拽中
  const handleMouseMove = useCallback((e) => {
    if (!isResizing) return;

    const deltaX = side === 'left'
      ? e.clientX - startX.current
      : startX.current - e.clientX;

    const newWidth = startWidth.current + deltaX;

    // 限制在 min-max 范围内
    const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
    setWidth(clampedWidth);
  }, [isResizing, side, minWidth, maxWidth]);

  // 结束拖拽
  const handleMouseUp = useCallback(() => {
    if (isResizing) {
      setIsResizing(false);

      // 保存到 localStorage
      localStorage.setItem(storageKey, width.toString());

      // 恢复 body 样式
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  }, [isResizing, width, storageKey]);

  // 监听鼠标事件
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // 双击重置宽度
  const handleDoubleClick = useCallback(() => {
    setWidth(defaultWidth);
    localStorage.setItem(storageKey, defaultWidth.toString());
  }, [defaultWidth, storageKey]);

  return (
    <div
      ref={panelRef}
      className={`resizable-panel resizable-panel-${side} ${className}`}
      style={{
        width: `${width}px`,
        flexShrink: 0,
        flexGrow: 0
      }}
    >
      {/* 内容区域 */}
      <div className="resizable-panel-content">
        {children}
      </div>

      {/* 拖拽手柄 */}
      <div
        className={`resize-handle resize-handle-${side} ${isResizing ? 'resizing' : ''}`}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        title="拖拽调整宽度，双击恢复默认"
      >
        <div className="resize-handle-line" />
      </div>
    </div>
  );
}
