import { useState } from 'react'
import { X, Settings as SettingsIcon, Palette, Globe, User, Info, MessageSquare, Plug, Key, Wifi, Keyboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfigPanel } from '../config/ConfigPanel'
import { SystemPromptConfigNew } from '../config/SystemPromptConfigNew'
import McpServicesPanel from '../mcp/McpServicesPanel'
import { ApiKeysConfig } from './ApiKeysConfig'
import ProxyConfig from './ProxyConfig'
import { ShortcutSettings } from './ShortcutSettings'
import ProfileSettings from './ProfileSettings'
import { ThemeSelector } from './ThemeSelector'
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
    { id: 'apiKeys', icon: Key, label: translate('settings.tabs.apiKeys', 'API Keys') },
    { id: 'shortcuts', icon: Keyboard, label: translate('settings.tabs.shortcuts', 'Shortcuts') },
    { id: 'proxy', icon: Wifi, label: translate('settings.tabs.proxy', 'Proxy Settings') },
    { id: 'mcpServices', icon: Plug, label: translate('settings.tabs.mcpServices', 'MCP Services') },
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

            {activeTab === 'apiKeys' && (
              <div className="settings-section">
                <ApiKeysConfig
                  translate={translate}
                />
              </div>
            )}

            {activeTab === 'shortcuts' && (
              <div className="settings-section">
                <ShortcutSettings />
              </div>
            )}

            {activeTab === 'mcpServices' && (
              <div className="settings-section">
                <h3 className="settings-section-title">
                  {translate('settings.mcpServices.title', 'MCP Services')}
                </h3>
                <p className="settings-section-description">
                  {translate('settings.mcpServices.description', 'Configure external services to enhance AI capabilities with real-time information')}
                </p>
                <McpServicesPanel
                  language={language}
                  translate={translate}
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
                <ThemeSelector
                  theme={theme}
                  onThemeChange={onThemeChange}
                  translate={translate}
                />
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

            {activeTab === 'proxy' && (
              <div className="settings-section">
                <ProxyConfig translate={translate} />
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="settings-section">
                <ProfileSettings />
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
                    <span>Personal Chatbox</span>
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

