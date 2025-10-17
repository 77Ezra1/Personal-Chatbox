import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Info, Sparkles, Zap, Brain, Eye } from 'lucide-react'

/**
 * 火山引擎豆包模型配置组件
 * 支持豆包1.5、1.6系列深度思考模型的配置
 */
const VolcEngineModelConfig = ({ value, onChange }) => {
  const [selectedModel, setSelectedModel] = useState(value?.model || '')
  const [apiKey, setApiKey] = useState(value?.apiKey || '')
  const [endpoint, setEndpoint] = useState(
    value?.endpoint || 'https://ark.cn-beijing.volces.com/api/v3/chat/completions'
  )
  const [thinkingEnabled, setThinkingEnabled] = useState(value?.thinkingEnabled ?? true)
  const [maxTokens, setMaxTokens] = useState(value?.maxTokens || 4096)
  const [temperature, setTemperature] = useState(value?.temperature || 0.7)

  // 火山引擎豆包模型列表
  const volcengineModels = {
    '1.6系列': [
      {
        id: 'doubao-seed-1.6',
        name: '豆包 Seed 1.6',
        description: 'All-in-One综合模型，支持深度思考、256K上下文',
        capabilities: ['深度思考', '多模态', '256K上下文'],
        contextWindow: '256K',
        thinkingSupport: true,
        icon: Sparkles
      },
      {
        id: 'doubao-seed-1.6-thinking',
        name: '豆包 Seed 1.6 Thinking',
        description: '强化深度思考版本，代码、数学、逻辑推理能力提升',
        capabilities: ['深度思考增强', '256K上下文', '逻辑推理'],
        contextWindow: '256K',
        thinkingSupport: true,
        icon: Brain
      },
      {
        id: 'doubao-seed-1.6-flash',
        name: '豆包 Seed 1.6 Flash',
        description: '极速版本，延迟仅10ms，支持深度思考',
        capabilities: ['极速响应', '深度思考', '256K上下文'],
        contextWindow: '256K',
        thinkingSupport: true,
        icon: Zap
      }
    ],
    '1.5系列': [
      {
        id: 'doubao-1.5-thinking-pro',
        name: '豆包 1.5 Thinking Pro',
        description: '数学、编程、科学推理专业模型',
        capabilities: ['深度思考', '专业推理', '128K上下文'],
        contextWindow: '128K',
        thinkingSupport: true,
        maxThinkingTokens: '32K',
        icon: Brain
      },
      {
        id: 'doubao-1.5-thinking-vision-pro',
        name: '豆包 1.5 Thinking Vision Pro',
        description: '多模态理解和推理，激活参数仅20B',
        capabilities: ['多模态', '视觉推理', '深度思考'],
        contextWindow: '128K',
        thinkingSupport: true,
        icon: Eye
      }
    ]
  }

  // 获取当前选中模型的详细信息
  const getModelInfo = (modelId) => {
    for (const series of Object.values(volcengineModels)) {
      const model = series.find(m => m.id === modelId)
      if (model) return model
    }
    return null
  }

  const currentModelInfo = getModelInfo(selectedModel)

  // 当配置变化时通知父组件
  useEffect(() => {
    if (onChange) {
      onChange({
        provider: 'volcengine',
        model: selectedModel,
        apiKey,
        endpoint,
        thinkingEnabled,
        maxTokens,
        temperature,
        supportsDeepThinking: currentModelInfo?.thinkingSupport || false
      })
    }
  }, [selectedModel, apiKey, endpoint, thinkingEnabled, maxTokens, temperature])

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-500" />
          火山引擎豆包模型配置
        </CardTitle>
        <CardDescription>
          配置火山引擎豆包大模型，支持深度思考和多模态能力
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* API配置 */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="volcengine-api-key">API密钥</Label>
            <Input
              id="volcengine-api-key"
              type="password"
              placeholder="输入火山引擎API密钥"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              在火山方舟平台获取API密钥：
              <a
                href="https://console.volcengine.com/ark"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline ml-1"
              >
                火山方舟控制台
              </a>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="volcengine-endpoint">API端点</Label>
            <Input
              id="volcengine-endpoint"
              type="text"
              placeholder="API端点地址"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
            />
          </div>
        </div>

        {/* 模型选择 */}
        <div className="space-y-2">
          <Label htmlFor="volcengine-model">选择模型</Label>
          <Accordion type="single" collapsible className="w-full">
            {Object.entries(volcengineModels).map(([series, models]) => (
              <AccordionItem key={series} value={series}>
                <AccordionTrigger className="text-sm font-medium">
                  {series}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    {models.map((model) => {
                      const Icon = model.icon
                      return (
                        <button
                          key={model.id}
                          onClick={() => setSelectedModel(model.id)}
                          className={`w-full p-3 text-left rounded-lg border transition-all ${
                            selectedModel === model.id
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                              : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Icon className="w-5 h-5 mt-0.5 text-blue-500" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">
                                  {model.name}
                                </span>
                                {model.thinkingSupport && (
                                  <Badge variant="secondary" className="text-xs">
                                    深度思考
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mb-2">
                                {model.description}
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {model.capabilities.map((cap) => (
                                  <Badge
                                    key={cap}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {cap}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* 当前选中模型信息 */}
        {currentModelInfo && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="space-y-2">
              <div className="font-medium">当前模型：{currentModelInfo.name}</div>
              <div className="text-sm space-y-1">
                <div>上下文窗口：{currentModelInfo.contextWindow}</div>
                {currentModelInfo.maxThinkingTokens && (
                  <div>最大思维链长度：{currentModelInfo.maxThinkingTokens}</div>
                )}
                {currentModelInfo.thinkingSupport && (
                  <div className="text-blue-600 dark:text-blue-400">
                    ✓ 支持深度思考模式（可通过thinking参数控制）
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* 高级参数 */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="advanced">
            <AccordionTrigger>高级参数</AccordionTrigger>
            <AccordionContent className="space-y-4">
              {/* 深度思考开关 */}
              {currentModelInfo?.thinkingSupport && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="thinking-enabled">深度思考模式</Label>
                    <Button
                      id="thinking-enabled"
                      variant={thinkingEnabled ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setThinkingEnabled(!thinkingEnabled)}
                    >
                      {thinkingEnabled ? '已开启' : '已关闭'}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {currentModelInfo.id.includes('1.5')
                      ? '豆包1.5模型默认开启深度思考，可通过此开关控制'
                      : '豆包1.6模型支持深度思考功能，建议开启以获得更好的推理效果'}
                  </p>
                </div>
              )}

              {/* Temperature */}
              <div className="space-y-2">
                <Label htmlFor="temperature">
                  Temperature: {temperature}
                </Label>
                <input
                  id="temperature"
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  控制输出的随机性，0为确定性输出，2为高度创造性
                </p>
              </div>

              {/* Max Tokens */}
              <div className="space-y-2">
                <Label htmlFor="max-tokens">最大输出Token数</Label>
                <Input
                  id="max-tokens"
                  type="number"
                  min="1"
                  max={currentModelInfo?.id.includes('1.5') ? 16384 : 32768}
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value) || 4096)}
                />
                <p className="text-xs text-muted-foreground">
                  {currentModelInfo?.id.includes('1.5')
                    ? '豆包1.5系列：默认4K，最大16K'
                    : '豆包1.6系列：默认4K，最大32K（1.6-thinking）'}
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* 使用提示 */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs space-y-1">
            <div className="font-medium mb-2">使用提示：</div>
            <ul className="list-disc list-inside space-y-1">
              <li>豆包1.6系列是国内首个支持256K上下文的思考模型</li>
              <li>豆包1.5-thinking-pro在AIME 2024等权威基准上达到业界一流水平</li>
              <li>thinking参数可控制是否开启深度思考模式</li>
              <li>边缘大模型网关提供500万免费tokens额度</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}

export default VolcEngineModelConfig
