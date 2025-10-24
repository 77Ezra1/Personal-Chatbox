/**
 * 推荐模型指南组件
 * 展示支持 Function Calling 的推荐模型列表
 */

import React, { useState } from 'react';
import { getRecommendedModelsForFunctionCalling, getFunctionCallingSupportLabel } from '@/lib/modelCompatibility';

export default function RecommendedModelsGuide() {
  const [isExpanded, setIsExpanded] = useState(true); // 默认展开
  const recommendedModels = getRecommendedModelsForFunctionCalling();

  // 按服务商分组
  const groupedModels = recommendedModels.reduce((acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  }, {});

  // 服务商显示名称映射
  const providerNames = {
    openai: 'OpenAI',
    anthropic: 'Anthropic Claude',
    google: 'Google Gemini',
    deepseek: 'DeepSeek',
    mistral: 'Mistral AI',
    groq: 'Groq',
    together: 'Together AI',
    volcengine: '火山引擎（字节跳动）'
  };

  return (
    <div className="mt-4 border border-blue-200 dark:border-blue-800 rounded-lg overflow-hidden">
      {/* 标题栏 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">💡</span>
          <span className="font-medium text-sm text-blue-900 dark:text-blue-100">
            推荐模型列表（支持工具调用）
          </span>
        </div>
        <span className="text-xs text-blue-600 dark:text-blue-400">
          {isExpanded ? '▲' : '▼'}
        </span>
      </button>

      {/* 内容区 */}
      {isExpanded && (
        <div className="p-4 bg-white dark:bg-gray-900 space-y-3">
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
            以下模型完全支持 Function Calling，可以稳定调用 MCP 工具
          </p>

          <div className="space-y-3">
            {Object.entries(groupedModels).map(([provider, models]) => (
              <div key={provider} className="space-y-1.5">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                  {providerNames[provider] || provider}
                </h4>
                <div className="pl-3.5 space-y-1.5">
                  {models.map((model) => (
                    <div
                      key={model.model}
                      className="flex items-start gap-2 group"
                    >
                      <span className="text-green-600 dark:text-green-400 text-xs mt-1">✓</span>
                      <div className="flex-1 min-w-0">
                        <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded font-mono text-gray-800 dark:text-gray-200">
                          {model.model}
                        </code>
                        {model.notes && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5 leading-relaxed">
                            {model.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700 space-y-1">
            <div className="flex items-start gap-2">
              <span className="text-xs">💰</span>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                <span className="font-medium">性价比推荐：</span>OpenAI GPT-4o-mini、Google Gemini 1.5 Flash
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xs">🎯</span>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                <span className="font-medium">质量优先：</span>OpenAI GPT-4o、Anthropic Claude 3.5 Sonnet
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

