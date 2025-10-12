import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Sparkles, Shield, ArrowRight } from 'lucide-react';

export default function WelcomePage() {
  const navigate = useNavigate();

  return (
    <div className="welcome-page">
      {/* 背景装饰 */}
      <div className="welcome-bg-decoration">
        <div className="welcome-bg-circle welcome-bg-circle-1"></div>
        <div className="welcome-bg-circle welcome-bg-circle-2"></div>
        <div className="welcome-bg-circle welcome-bg-circle-3"></div>
      </div>

      <div className="welcome-container">
        <div className="welcome-content">
          {/* Logo和标题 */}
          <div className="welcome-header">
            <div className="welcome-logo">
              <MessageSquare size={48} strokeWidth={2} />
            </div>
            <h1 className="welcome-title">
              Personal Chatbox
            </h1>
            <p className="welcome-subtitle">
              您的智能AI助手，支持多种MCP服务和工具
            </p>
          </div>
          
          {/* 特性卡片 */}
          <div className="welcome-features">
            <div className="feature-card">
              <div className="feature-icon-wrapper feature-icon-primary">
                <MessageSquare size={24} />
              </div>
              <h3 className="feature-title">智能对话</h3>
              <p className="feature-description">
                强大的AI对话能力，理解您的需求
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon-wrapper feature-icon-secondary">
                <Sparkles size={24} />
              </div>
              <h3 className="feature-title">多种工具</h3>
              <p className="feature-description">
                集成丰富的MCP服务和扩展工具
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon-wrapper feature-icon-accent">
                <Shield size={24} />
              </div>
              <h3 className="feature-title">数据安全</h3>
              <p className="feature-description">
                端到端加密，保护您的隐私安全
              </p>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="welcome-actions">
            <button 
              className="welcome-btn welcome-btn-primary"
              onClick={() => navigate('/login')}
            >
              <span>立即登录</span>
              <ArrowRight size={20} />
            </button>
            <button 
              className="welcome-btn welcome-btn-secondary"
              onClick={() => navigate('/register')}
            >
              <span>注册账号</span>
            </button>
          </div>

          {/* 底部提示 */}
          <div className="welcome-footer">
            <p className="welcome-footer-text">
              <Shield size={14} />
              <span>需要邀请码才能注册 · 请联系管理员获取</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

