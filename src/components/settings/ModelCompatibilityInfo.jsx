/**
 * 模型兼容性信息组件
 * 显示当前选择模型的功能支持情况
 */

import React from 'react';
import {
  getModelCompatibility,
  getFunctionCallingSupportLabel,
  FUNCTION_CALLING_SUPPORT
} from '@/lib/modelCompatibility';

export default function ModelCompatibilityInfo({ provider, model }) {
  const compat = getModelCompatibility(provider, model);

  // 如果没有找到兼容性信息，显示未知提示
  if (!compat) {
    return (
      <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-start gap-2">
          <span className="text-lg">ℹ️</span>
          <div className="flex-1">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              暂无此模型的详细兼容性信息
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 根据 Function Calling 支持级别决定背景色
  const getBgColor = () => {
    switch (compat.functionCalling) {
      case FUNCTION_CALLING_SUPPORT.FULL:
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case FUNCTION_CALLING_SUPPORT.PARTIAL:
      case FUNCTION_CALLING_SUPPORT.EXPERIMENTAL:
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case FUNCTION_CALLING_SUPPORT.NONE:
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      default:
        return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  return (
    <div className={`mt-3 p-4 rounded-lg border ${getBgColor()}`}>
      <div className="space-y-3">
        {/* Function Calling 支持 - 更突出的显示 */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
              工具调用 (Function Calling)
            </div>
            <div className="text-lg font-bold">
              {getFunctionCallingSupportLabel(compat.functionCalling)}
            </div>
          </div>
        </div>

        {/* 其他功能支持 - 使用更清晰的卡片式布局 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
            <span className="text-lg">{compat.reasoning ? '✅' : '—'}</span>
            <span className="text-sm text-gray-700 dark:text-gray-300">推理模式</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
            <span className="text-lg">{compat.multimodal ? '✅' : '—'}</span>
            <span className="text-sm text-gray-700 dark:text-gray-300">多模态</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
            <span className="text-lg">{compat.streaming ? '✅' : '—'}</span>
            <span className="text-sm text-gray-700 dark:text-gray-300">流式输出</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
            <span className="text-lg">📊</span>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {(compat.contextWindow / 1000).toFixed(0)}K 上下文
            </span>
          </div>
        </div>

        {/* 额外说明 - 使用信息框样式 */}
        {compat.notes && (
          <div className="p-3 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-2">
              <span className="text-blue-500 dark:text-blue-400 text-sm mt-0.5">ℹ️</span>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {compat.notes}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

