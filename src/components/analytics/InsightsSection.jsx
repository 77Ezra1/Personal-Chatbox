import { useState, useEffect } from 'react'
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  Target,
  Zap,
  Award,
  ArrowRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/hooks/useTranslation'
import { createLogger } from '@/lib/logger'
import './InsightsSection.css'

const logger = createLogger('InsightsSection')

/**
 * 智能洞察区域组件
 * v0.dev 风格：现代简约、卡片式、微交互
 */
export default function InsightsSection() {
  const { translate } = useTranslation()
  const [insights, setInsights] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInsights()
  }, [])

  const loadInsights = async () => {
    try {
      const response = await fetch('/api/analytics/insights', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setInsights(data.data)
        }
      }
    } catch (error) {
      logger.error('加载洞察数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="insights-section loading">
        <div className="insights-skeleton">
          <div className="skeleton-card"></div>
          <div className="skeleton-card"></div>
          <div className="skeleton-card"></div>
        </div>
      </div>
    )
  }

  if (!insights) return null

  const { savingTips, habits, trends, preferences } = insights

  return (
    <div className="insights-section">
      {/* Section Header */}
      <div className="insights-header">
        <div className="header-content">
          <Sparkles className="w-6 h-6 text-purple-500" />
          <h2>{translate('insights.title', '💡 为您推荐')}</h2>
        </div>
        <p className="header-subtitle">
          {translate('insights.subtitle', '基于您的使用习惯，为您提供个性化建议')}
        </p>
      </div>

      {/* Insights Grid */}
      <div className="insights-grid">
        
        {/* 省钱建议 */}
        {savingTips && savingTips.length > 0 && (
          <div className="insight-card savings-card">
            <div className="card-glow savings"></div>
            <div className="card-header">
              <div className="icon-wrapper savings">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3>{translate('insights.savings', '💰 省钱建议')}</h3>
                <span className="badge high">高效益</span>
              </div>
            </div>
            <div className="card-content">
              <p className="primary-text">{savingTips[0].description}</p>
              <div className="savings-highlight">
                <Zap className="w-4 h-4" />
                <span>预计可节省 <strong>85%</strong> 费用</span>
              </div>
            </div>
            <div className="card-footer">
              <Button 
                variant="ghost" 
                size="sm" 
                className="action-button"
              >
                了解详情
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* 使用习惯 */}
        <div className="insight-card habits-card">
          <div className="card-glow habits"></div>
          <div className="card-header">
            <div className="icon-wrapper habits">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3>{translate('insights.habits', '⏰ 您的使用习惯')}</h3>
              <span className="badge info">{habits.depthDescription}</span>
            </div>
          </div>
          <div className="card-content">
            {habits.peakHours && habits.peakHours.length > 0 && (
              <div className="habit-item">
                <span className="label">最活跃时段</span>
                <span className="value">
                  {habits.peakHours[0].time} {habits.peakHours[0].hour}:00
                  <span className="emoji">
                    {habits.peakHours[0].period === 'morning' && '🌅'}
                    {habits.peakHours[0].period === 'afternoon' && '☀️'}
                    {habits.peakHours[0].period === 'evening' && '🌙'}
                    {habits.peakHours[0].period === 'night' && '🌃'}
                  </span>
                </span>
              </div>
            )}
            <div className="habit-item">
              <span className="label">平均对话深度</span>
              <span className="value">
                {habits.avgConversationDepth} 轮
                {habits.depthType === 'deep' && ' 🔥'}
                {habits.depthType === 'moderate' && ' ✨'}
              </span>
            </div>
          </div>
          <div className="card-footer">
            <div className="insight-tip">
              💡 您喜欢深入交流，这很棒！
            </div>
          </div>
        </div>

        {/* 使用趋势 */}
        <div className="insight-card trends-card">
          <div className="card-glow trends"></div>
          <div className="card-header">
            <div className={`icon-wrapper trends ${trends.direction}`}>
              {trends.direction === 'up' ? (
                <TrendingUp className="w-5 h-5" />
              ) : trends.direction === 'down' ? (
                <TrendingDown className="w-5 h-5" />
              ) : (
                <Target className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3>{translate('insights.trends', '📈 本周趋势')}</h3>
              <span className={`badge ${trends.direction === 'up' ? 'success' : trends.direction === 'down' ? 'warning' : 'neutral'}`}>
                {trends.direction === 'up' && '活跃增长'}
                {trends.direction === 'down' && '使用下降'}
                {trends.direction === 'stable' && '保持稳定'}
              </span>
            </div>
          </div>
          <div className="card-content">
            <div className="trend-comparison">
              <div className="trend-item">
                <span className="label">本周</span>
                <span className="value large">{trends.thisWeek}</span>
              </div>
              <div className="trend-divider">vs</div>
              <div className="trend-item">
                <span className="label">上周</span>
                <span className="value">{trends.lastWeek}</span>
              </div>
            </div>
            {trends.weeklyChange !== 0 && (
              <div className={`change-badge ${trends.direction}`}>
                {trends.direction === 'up' && '↗️'}
                {trends.direction === 'down' && '↘️'}
                <span>{Math.abs(trends.weeklyChange)}%</span>
              </div>
            )}
          </div>
        </div>

        {/* 偏好分析 */}
        {preferences.favoriteModel && (
          <div className="insight-card preferences-card">
            <div className="card-glow preferences"></div>
            <div className="card-header">
              <div className="icon-wrapper preferences">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3>{translate('insights.preferences', '🤖 您的最爱')}</h3>
                <span className="badge premium">首选模型</span>
              </div>
            </div>
            <div className="card-content">
              <div className="model-favorite">
                <span className="model-name">{preferences.favoriteModel}</span>
                <div className="usage-bar">
                  <div 
                    className="usage-fill"
                    style={{ width: `${preferences.favoritePercentage}%` }}
                  ></div>
                </div>
                <span className="usage-text">
                  占您总使用量的 <strong>{preferences.favoritePercentage}%</strong>
                </span>
              </div>
              {preferences.modelDiversity > 1 && (
                <div className="diversity-note">
                  ✨ 您使用了 {preferences.modelDiversity} 个不同的 AI 模型
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
