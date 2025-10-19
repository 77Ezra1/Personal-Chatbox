/**
 * 笔记编辑器右侧面板
 * 包含：AI助手、大纲等功能
 */

import { useState } from 'react';
import './RightPanel.css';

export function RightPanel({ children, activeTab, onTabChange, tabs = [] }) {
  return (
    <div className="right-panel">
      {/* Tab 切换栏 */}
      <div className="right-panel-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`right-panel-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
            title={tab.label}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab 内容区域 */}
      <div className="right-panel-content">
        {children}
      </div>
    </div>
  );
}
