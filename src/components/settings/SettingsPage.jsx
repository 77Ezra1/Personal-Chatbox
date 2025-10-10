import { useState } from 'react'
import { X, Settings as SettingsIcon, Palette, Globe, User, Info, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfigPanel } from '../config/ConfigPanel'
import { SystemPromptConfigNew } from '../config/SystemPromptConfigNew'
import './SettingsPage.css'

/**
 * 设置页面组件
 * 全屏Modal展示所有设置选项
 */
export function SettingsPage({
  isOpen,
  onClose,
  // 模型配置相关
  modelConfig,
  currentProvider,
  currentModel,
  providerModels,
  customModels,
  models = [], // 新增：完整的模型列表
  onProviderChange,
  onModelChange,
  onRemoveModel,
  onSaveConfig,
  // 系统提示词相关
  systemPrompt,
  onSystemPromptModeChange,
  onSystemPromptGlobalChange,
  onSystemPromptModelChange,
  // 主题和语言
  theme,
  onThemeChange,
  language,
  onLanguageChange,
  translate
}) {
  const [activeTab, setActiveTab] = useState('model')

  if (!isOpen) return null

  const tabs = [
    { id: 'model', icon: SettingsIcon, label: translate('settings.tabs.model', 'Model Configuration') },
    { id: 'systemPrompt', icon: MessageSquare, label: translate('settings.tabs.systemPrompt', 'System Prompt') },
    { id: 'appearance', icon: Palette, label: translate('settings.tabs.appearance', 'Appearance') },
    { id: 'language', icon: Globe, label: translate('settings.tabs.language', 'Language') },
    { id: 'profile', icon: User, label: translate('settings.tabs.profile', 'User Profile') },
    { id: 'about', icon: Info, label: translate('settings.tabs.about', 'About') }
  ]

  return (
    <div className="settings-overlay">
      <div className="settings-container">
        {/* 头部 */}
        <div className="settings-header">
          <h2 className="settings-title">
            {translate('settings.title', 'Settings')}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* 主体内容 */}
        <div className="settings-body">
          {/* 侧边栏 */}
          <div className="settings-sidebar">
            {tabs.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* 内容区域 */}
          <div className="settings-content">
            {activeTab === 'model' && (
              <div className="settings-section">
                <ConfigPanel
                  modelConfig={modelConfig}
                  currentProvider={currentProvider}
                  currentModel={currentModel}
                  providerModels={providerModels}
                  customModels={customModels}
                  onProviderChange={onProviderChange}
                  onModelChange={onModelChange}
                  onRemoveModel={onRemoveModel}
                  onSaveConfig={onSaveConfig}
                  onClose={onClose}
                  isOpen={true}
                  translate={translate}
                  language={language}
                  showHeader={false}
                />
              </div>
            )}

            {activeTab === 'systemPrompt' && (
              <div className="settings-section">
                <h3 className="settings-section-title">
                  {translate('settings.systemPrompt.title', 'System Prompt Configuration')}
                </h3>
                <p className="settings-section-description">
                  {translate('settings.systemPrompt.description', 'Configure system prompts to define the role and behavior of AI models')}
                </p>
                <SystemPromptConfigNew
                  systemPrompt={systemPrompt}
                  onModeChange={onSystemPromptModeChange}
                  onGlobalPromptChange={onSystemPromptGlobalChange}
                  onModelPromptsChange={onSystemPromptModelChange}
                  language={language}
                  translate={translate}
                  allModels={models}
                />
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="settings-section">
                <h3 className="settings-section-title">
                  {translate('settings.appearance.title', 'Theme')}
                </h3>
                <p className="settings-section-description">
                  {translate('settings.appearance.description', 'Choose your preferred color theme')}
                </p>
                <div className="theme-options">
                  <label className="theme-option">
                    <input
                      type="radio"
                      name="theme"
                      value="light"
                      checked={theme === 'light'}
                      onChange={(e) => onThemeChange(e.target.value)}
                    />
                    <span>{translate('settings.appearance.light', 'Light')}</span>
                  </label>
                  <label className="theme-option">
                    <input
                      type="radio"
                      name="theme"
                      value="dark"
                      checked={theme === 'dark'}
                      onChange={(e) => onThemeChange(e.target.value)}
                    />
                    <span>{translate('settings.appearance.dark', 'Dark')}</span>
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'language' && (
              <div className="settings-section">
                <h3 className="settings-section-title">
                  {translate('settings.language.title', 'Language')}
                </h3>
                <p className="settings-section-description">
                  {translate('settings.language.description', 'Choose your preferred language')}
                </p>
                <div className="language-options">
                  <label className="language-option">
                    <input
                      type="radio"
                      name="language"
                      value="zh"
                      checked={language === 'zh'}
                      onChange={(e) => onLanguageChange(e.target.value)}
                    />
                    <span>简体中文</span>
                  </label>
                  <label className="language-option">
                    <input
                      type="radio"
                      name="language"
                      value="en"
                      checked={language === 'en'}
                      onChange={(e) => onLanguageChange(e.target.value)}
                    />
                    <span>English</span>
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="settings-section">
                <h3 className="settings-section-title">
                  {translate('settings.profile.title', 'User Profile')}
                </h3>
                <p className="settings-section-description">
                  {translate('settings.profile.description', 'Manage your user profile and preferences')}
                </p>
                <div className="profile-placeholder">
                  <User className="w-16 h-16 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    {translate('settings.profile.comingSoon', 'User profile features coming soon')}
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'about' && (
              <div className="settings-section">
                <h3 className="settings-section-title">
                  {translate('settings.about.title', 'About')}
                </h3>
                <div className="about-content">
                  <div className="about-item">
                    <strong>{translate('settings.about.appName', 'Application Name')}:</strong>
                    <span>AI Life System</span>
                  </div>
                  <div className="about-item">
                    <strong>{translate('settings.about.version', 'Version')}:</strong>
                    <span>1.0.0</span>
                  </div>
                  <div className="about-item">
                    <strong>{translate('settings.about.description', 'Description')}:</strong>
                    <span>
                      {translate(
                        'settings.about.descriptionText',
                        'A multi-model AI chat application supporting various AI providers'
                      )}
                    </span>
                  </div>
                  <div className="about-item">
                    <strong>{translate('settings.about.repository', 'Repository')}:</strong>
                    <a 
                      href="https://github.com/77Ezra1/AI-Life-system" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="about-link"
                    >
                      GitHub
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

