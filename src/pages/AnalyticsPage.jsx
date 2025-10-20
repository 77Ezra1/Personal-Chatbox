import { useState, useEffect, useCallback } from 'react'
import {
  BarChart3,
  TrendingUp,
  MessageSquare,
  Zap,
  DollarSign,
  Download,
  Calendar,
  AlertCircle,
  RefreshCw,
  PieChart as PieChartIcon
} from 'lucide-react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/hooks/useTranslation'
import { createLogger } from '@/lib/logger'
import InsightsSection from '@/components/analytics/InsightsSection'
import './AnalyticsPage.css'

const logger = createLogger('AnalyticsPage')

// 图表配色方案
const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16']

/**
 * Enhanced Analytics Page
 * 完整的数据分析仪表板
 */
export default function AnalyticsPage() {
  const { translate } = useTranslation()
  const [overview, setOverview] = useState(null)
  const [trends, setTrends] = useState([])
  const [modelStats, setModelStats] = useState([])
  const [period, setPeriod] = useState('7d')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  // 加载数据
  const loadAnalyticsData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // 获取统计概览
      const overviewRes = await fetch('/api/analytics/overview', {
        credentials: 'include'
      })

      if (!overviewRes.ok) {
        throw new Error(`HTTP ${overviewRes.status}: ${overviewRes.statusText}`)
      }

      const overviewData = await overviewRes.json()

      if (!overviewData.success) {
        throw new Error(overviewData.error || 'Failed to load analytics data')
      }

      setOverview(overviewData.data)

      // 获取趋势数据
      const trendsRes = await fetch(`/api/analytics/trends?period=${period}`, {
        credentials: 'include'
      })

      if (trendsRes.ok) {
        const trendsData = await trendsRes.json()
        if (trendsData.success) {
          setTrends(trendsData.data || [])
        }
      }

      // 获取模型统计
      const modelsRes = await fetch('/api/analytics/models', {
        credentials: 'include'
      })

      if (modelsRes.ok) {
        const modelsData = await modelsRes.json()
        if (modelsData.success) {
          setModelStats(modelsData.data || [])
        }
      }

    } catch (err) {
      logger.error('加载分析数据失败:', err)
      setError(err.message || 'Failed to load analytics data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [period])

  useEffect(() => {
    loadAnalyticsData()
  }, [loadAnalyticsData])

  // 手动刷新
  const handleRefresh = () => {
    setRefreshing(true)
    loadAnalyticsData()
  }

  // 导出数据
  const handleExport = async (format = 'json') => {
    try {
      const response = await fetch(`/api/analytics/export?format=${format}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Export failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `analytics-export-${Date.now()}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      logger.error('导出数据失败:', err)
      alert('Export failed. Please try again.')
    }
  }

  // Loading state
  if (loading && !refreshing) {
    return (
      <div className="analytics-page loading">
        <div className="spinner" />
        <p>{translate('analytics.loading', 'Loading analytics...')}</p>
      </div>
    )
  }

  // Error state - 显示错误但仍尝试展示数据
  if (error && !overview) {
    return (
      <div className="analytics-page error">
        <AlertCircle className="w-12 h-12 text-yellow-500" />
        <h2>{translate('analytics.error', 'Error Loading Analytics')}</h2>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={handleRefresh} className="mt-4">
          <RefreshCw className="w-4 h-4 mr-2" />
          {translate('analytics.retry', 'Retry')}
        </Button>
      </div>
    )
  }

  // 默认数据（如果 API 返回为空）
  const safeOverview = overview || {
    conversations: 0,
    messages: 0,
    apiCalls: 0,
    tokens: { prompt: 0, completion: 0, total: 0 },
    cost: { total: 0, currency: 'USD', currencySymbol: '$' },
    todayMessages: 0,
    todayApiCalls: 0,
    topModels: []
  }

  return (
    <div className="analytics-page">
      {/* Header */}
      <div className="analytics-header">
        <div>
          <h1>{translate('analytics.title', '数据分析仪表板')}</h1>
          <p className="text-muted-foreground">
            {translate('analytics.subtitle', '追踪您的AI对话和使用情况')}
          </p>
        </div>

        <div className="header-actions">
          {/* Period Selector */}
          <div className="period-selector">
            <button
              className={period === '1d' ? 'active' : ''}
              onClick={() => setPeriod('1d')}
            >
              {translate('analytics.period.today', '今天')}
            </button>
            <button
              className={period === '7d' ? 'active' : ''}
              onClick={() => setPeriod('7d')}
            >
              {translate('analytics.period.last7d', '最近7天')}
            </button>
            <button
              className={period === '30d' ? 'active' : ''}
              onClick={() => setPeriod('30d')}
            >
              {translate('analytics.period.last30d', '最近30天')}
            </button>
            <button
              className={period === '90d' ? 'active' : ''}
              onClick={() => setPeriod('90d')}
            >
              {translate('analytics.period.last90d', '最近90天')}
            </button>
          </div>

          {/* Export Buttons */}
          <div className="export-buttons">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {translate('analytics.refresh', '刷新')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('json')}
            >
              <Download className="w-4 h-4 mr-2" />
              {translate('analytics.export', '导出')}
            </Button>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="overview-cards">
        <div className="stat-card">
          <div className="stat-icon blue">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div className="stat-content">
            <p className="stat-label">💬 {translate('analytics.totalConversations', '您与 AI 交流了')}</p>
            <p className="stat-value">{(safeOverview.conversations || 0).toLocaleString()} {translate('analytics.times', '次')}</p>
            <p className="stat-trend">📅 {translate('analytics.todayMessages', '今日消息')}: {safeOverview.todayMessages || 0}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">
            <Zap className="w-5 h-5" />
          </div>
          <div className="stat-content">
            <p className="stat-label">⚡ {translate('analytics.totalMessages', '总消息数')}</p>
            <p className="stat-value">{(safeOverview.messages || 0).toLocaleString()}</p>
            <p className="stat-trend">{translate('analytics.avgPerDay', '平均每天')}: {Math.round((safeOverview.messages || 0) / 30)}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="stat-content">
            <p className="stat-label">🚀 {translate('analytics.totalTokens', 'Token 使用量')}</p>
            <p className="stat-value">
              {(safeOverview.tokens?.total || 0).toLocaleString()}
            </p>
            <p className="stat-detail">
              📤 Prompt: {(safeOverview.tokens?.prompt || 0).toLocaleString()} |
              📥 回复: {(safeOverview.tokens?.completion || 0).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">
            <DollarSign className="w-5 h-5" />
          </div>
          <div className="stat-content">
            <p className="stat-label">💰 {translate('analytics.estimatedCost', '累计花费')}</p>
            <p className="stat-value">
              {safeOverview.cost?.currencySymbol || '¥'}{safeOverview.cost?.total || '0.0000'}
            </p>
            <p className="stat-detail">
              {safeOverview.cost?.currency || 'CNY'} ({translate('analytics.estimated', '预估值')})
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon red">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div className="stat-content">
            <p className="stat-label">📞 {translate('analytics.apiCalls', 'API 调用次数')}</p>
            <p className="stat-value">{(safeOverview.apiCalls || 0).toLocaleString()}</p>
            <p className="stat-trend">📊 {translate('analytics.todayApiCalls', '今日调用')}: {safeOverview.todayApiCalls || 0}</p>
          </div>
        </div>
      </div>

      {/* Token Usage by Source (按来源统计) */}
      {safeOverview.tokensBySource && safeOverview.tokensBySource.length > 0 && (
        <div className="chart-section">
          <div className="chart-header">
            <h2>
              <PieChartIcon className="w-5 h-5" />
              📊 Token 使用来源分布
            </h2>
            <p className="chart-description">不同功能的 Token 消耗统计</p>
          </div>
          <div className="source-stats-grid">
            {safeOverview.tokensBySource.map((source, index) => {
              const sourceNames = {
                'chat': '💬 对话',
                'notes': '📝 笔记',
                'documents': '📄 文档'
              };
              const sourceName = sourceNames[source.source] || source.source;

              return (
                <div key={source.source} className="source-stat-card">
                  <div className="source-header">
                    <h3>{sourceName}</h3>
                    <span className="source-badge" style={{
                      background: COLORS[index % COLORS.length] + '20',
                      color: COLORS[index % COLORS.length]
                    }}>
                      {source.messageCount} 次调用
                    </span>
                  </div>
                  <div className="source-tokens">
                    <div className="token-row">
                      <span>总 Token:</span>
                      <strong>{(source.tokens?.total || 0).toLocaleString()}</strong>
                    </div>
                    <div className="token-row secondary">
                      <span>📤 Prompt:</span>
                      <span>{(source.tokens?.prompt || 0).toLocaleString()}</span>
                    </div>
                    <div className="token-row secondary">
                      <span>📥 完成:</span>
                      <span>{(source.tokens?.completion || 0).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="source-cost">
                    <span>💰 预估成本:</span>
                    <strong>{source.cost?.currencySymbol || '¥'}{source.cost?.total || '0.0000'}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Trends Chart */}
      {trends.length > 0 && (
        <div className="chart-section">
          <div className="chart-header">
            <h2>
              <TrendingUp className="w-5 h-5" />
              {translate('analytics.usageTrends', '使用趋势')}
            </h2>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trends}>
                <defs>
                  <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorConversations" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis
                  dataKey="date"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem'
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="message_count"
                  name={translate('analytics.messages', '消息数')}
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorMessages)"
                />
                <Area
                  type="monotone"
                  dataKey="conversation_count"
                  name={translate('analytics.conversations', '对话数')}
                  stroke="#8b5cf6"
                  fillOpacity={1}
                  fill="url(#colorConversations)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Model Stats */}
      {modelStats.length > 0 && (
        <div className="charts-grid">
          {/* Pie Chart */}
          <div className="chart-section">
            <div className="chart-header">
              <h2>
                <PieChartIcon className="w-5 h-5" />
                {translate('analytics.modelDistribution', '模型使用分布')}
              </h2>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={modelStats.slice(0, 5)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="model"
                  >
                    {modelStats.slice(0, 5).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '0.5rem'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="chart-section">
            <div className="chart-header">
              <h2>
                <BarChart3 className="w-5 h-5" />
                {translate('analytics.topModels', 'TOP模型使用量')}
              </h2>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={modelStats.slice(0, 5)}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis
                    dataKey="model"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '0.5rem'
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill="#3b82f6"
                    name={translate('analytics.usageCount', '使用次数')}
                    radius={[8, 8, 0, 0]}
                  >
                    {modelStats.slice(0, 5).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Smart Insights Section */}
      <InsightsSection />

      {/* Top Models List */}
      {safeOverview.topModels && safeOverview.topModels.length > 0 && (
        <div className="chart-section">
          <div className="chart-header">
            <h2>{translate('analytics.topModelsDetail', '热门模型详情')}</h2>
          </div>
          <div className="top-models">
            {safeOverview.topModels.map((model, index) => (
              <div key={model.model} className="top-model-item">
                <div className="model-rank">{index + 1}</div>
                <div className="model-info">
                  <div className="model-name">{model.model || 'Unknown'}</div>
                  <div className="model-bar">
                    <div
                      className="model-bar-fill"
                      style={{
                        width: `${(model.count / safeOverview.topModels[0].count) * 100}%`,
                        background: COLORS[index % COLORS.length]
                      }}
                    />
                  </div>
                </div>
                <div className="model-count">{model.count} {translate('analytics.times', '次')}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && (!safeOverview || (safeOverview.conversations === 0 && safeOverview.messages === 0)) && (
        <div className="chart-section">
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <BarChart3 className="w-16 h-16 text-muted-foreground opacity-20 mx-auto mb-4" />
            <p className="text-muted-foreground">
              {translate('analytics.noData', '暂无数据，开始您的第一次对话吧！')}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
