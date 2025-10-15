import { useState, useEffect } from 'react'
import {
  BarChart3,
  TrendingUp,
  MessageSquare,
  Zap,
  DollarSign,
  Download,
  Calendar,
  PieChart as PieChartIcon
} from 'lucide-react'
import {
  LineChart,
  Line,
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
import { createLogger } from '@/lib/logger'
import './AnalyticsPage.css'

const logger = createLogger('AnalyticsPage')

// 图表颜色方案
const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1', '#14b8a6']

export default function AnalyticsPage() {
  const [overview, setOverview] = useState(null)
  const [trends, setTrends] = useState([])
  const [models, setModels] = useState([])
  const [tools, setTools] = useState([])
  const [period, setPeriod] = useState('7d')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // 加载数据
  useEffect(() => {
    loadAnalyticsData()
  }, [period])

  const loadAnalyticsData = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem('token')
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      // 并行请求所有数据
      const [overviewRes, trendsRes, modelsRes, toolsRes] = await Promise.all([
        fetch('/api/analytics/overview', { headers }),
        fetch(`/api/analytics/trends?period=${period}`, { headers }),
        fetch('/api/analytics/models', { headers }),
        fetch('/api/analytics/tools', { headers })
      ])

      const [overviewData, trendsData, modelsData, toolsData] = await Promise.all([
        overviewRes.json(),
        trendsRes.json(),
        modelsRes.json(),
        toolsRes.json()
      ])

      if (overviewData.success) setOverview(overviewData.data)
      if (trendsData.success) setTrends(trendsData.data)
      if (modelsData.success) setModels(modelsData.data)
      if (toolsData.success) setTools(toolsData.data)

    } catch (err) {
      logger.error('加载分析数据失败:', err)
      setError('加载数据失败，请刷新重试')
    } finally {
      setLoading(false)
    }
  }

  // 导出数据
  const handleExport = async (format) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/analytics/export?format=${format}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `analytics-export.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      logger.log(`数据已导出为 ${format.toUpperCase()}`)
    } catch (err) {
      logger.error('导出数据失败:', err)
      alert('导出失败，请重试')
    }
  }

  if (loading) {
    return (
      <div className="analytics-page loading">
        <div className="spinner"></div>
        <p>加载分析数据中...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="analytics-page error">
        <p>{error}</p>
        <Button onClick={loadAnalyticsData}>重试</Button>
      </div>
    )
  }

  return (
    <div className="analytics-page">
      {/* 页面头部 */}
      <div className="analytics-header">
        <div>
          <h1>📊 数据分析</h1>
          <p>深入了解您的使用情况和数据统计</p>
        </div>
        <div className="header-actions">
          <div className="period-selector">
            <button
              className={period === '7d' ? 'active' : ''}
              onClick={() => setPeriod('7d')}
            >
              最近7天
            </button>
            <button
              className={period === '30d' ? 'active' : ''}
              onClick={() => setPeriod('30d')}
            >
              最近30天
            </button>
            <button
              className={period === '90d' ? 'active' : ''}
              onClick={() => setPeriod('90d')}
            >
              最近90天
            </button>
          </div>
          <div className="export-buttons">
            <Button onClick={() => handleExport('json')} variant="outline">
              <Download size={16} />
              导出JSON
            </Button>
            <Button onClick={() => handleExport('csv')} variant="outline">
              <Download size={16} />
              导出CSV
            </Button>
          </div>
        </div>
      </div>

      {/* 统计概览卡片 */}
      {overview && (
        <div className="overview-cards">
          <div className="stat-card">
            <div className="stat-icon blue">
              <MessageSquare size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-label">总对话数</div>
              <div className="stat-value">{overview.conversations}</div>
              <div className="stat-trend">今日消息: {overview.todayMessages}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon purple">
              <BarChart3 size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-label">总消息数</div>
              <div className="stat-value">{overview.messages}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon green">
              <Zap size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-label">Token使用量</div>
              <div className="stat-value">{(overview.tokens.total / 1000).toFixed(1)}K</div>
              <div className="stat-detail">
                输入: {(overview.tokens.prompt / 1000).toFixed(1)}K | 
                输出: {(overview.tokens.completion / 1000).toFixed(1)}K
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon orange">
              <DollarSign size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-label">费用估算</div>
              <div className="stat-value">${overview.cost.total}</div>
              <div className="stat-detail">{overview.cost.currency}</div>
            </div>
          </div>
        </div>
      )}

      {/* 使用趋势图表 */}
      <div className="chart-section">
        <div className="chart-header">
          <h2>
            <TrendingUp size={20} />
            使用趋势
          </h2>
        </div>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="message_count"
                stroke="#3b82f6"
                name="消息数"
                strokeWidth={2}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="total_tokens"
                stroke="#8b5cf6"
                name="Token数"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 双列布局 */}
      <div className="charts-grid">
        {/* 模型使用分布 */}
        <div className="chart-section">
          <div className="chart-header">
            <h2>
              <PieChartIcon size={20} />
              模型使用分布
            </h2>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={models}
                  dataKey="count"
                  nameKey="model"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.model} (${entry.percentage}%)`}
                >
                  {models.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* 模型统计列表 */}
          <div className="model-stats">
            {models.slice(0, 5).map((model, index) => (
              <div key={index} className="model-stat-item">
                <div className="model-name">
                  <span
                    className="model-color"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  {model.model}
                </div>
                <div className="model-usage">
                  <span className="model-count">{model.count}次</span>
                  <span className="model-percentage">{model.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 工具调用统计 */}
        <div className="chart-section">
          <div className="chart-header">
            <h2>
              <Zap size={20} />
              工具调用统计
            </h2>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={tools}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 热门模型TOP5 */}
      {overview?.topModels && overview.topModels.length > 0 && (
        <div className="chart-section">
          <div className="chart-header">
            <h2>
              <BarChart3 size={20} />
              热门模型 TOP 5
            </h2>
          </div>
          <div className="top-models">
            {overview.topModels.map((model, index) => (
              <div key={index} className="top-model-item">
                <div className="model-rank">#{index + 1}</div>
                <div className="model-info">
                  <div className="model-name">{model.model}</div>
                  <div className="model-bar">
                    <div
                      className="model-bar-fill"
                      style={{
                        width: `${(model.count / overview.topModels[0].count) * 100}%`,
                        backgroundColor: COLORS[index % COLORS.length]
                      }}
                    />
                  </div>
                </div>
                <div className="model-count">{model.count}次</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

