/**
 * 模型警告横幅组件
 * 当模型不支持 Function Calling 时显示警告
 */

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { getModelCompatibility, FUNCTION_CALLING_SUPPORT } from '@/lib/modelCompatibility';

export default function ModelWarningBanner({ provider, model, onDismiss }) {
  const compat = getModelCompatibility(provider, model);

  // 如果模型支持 Function Calling，不显示警告
  if (!compat || compat.functionCalling === FUNCTION_CALLING_SUPPORT.FULL) {
    return null;
  }

  // 不支持的情况
  if (compat.functionCalling === FUNCTION_CALLING_SUPPORT.NONE) {
    return (
      <div className="mx-4 mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-red-900 dark:text-red-100">
            当前模型不支持工具调用
          </p>
          <p className="mt-1 text-xs text-red-700 dark:text-red-300">
            {model} 不支持 Function Calling，MCP 工具功能已禁用。
            建议切换到 GPT-4o-mini、Claude 3.5 Sonnet 等支持工具调用的模型。
          </p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  // 部分支持或实验性支持的情况
  return (
    <div className="mx-4 mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
          工具调用功能可能不稳定
        </p>
        <p className="mt-1 text-xs text-yellow-700 dark:text-yellow-300">
          {model} 对工具调用的支持不完善，可能会出现不调用工具或伪造答案的情况。
          建议切换到 GPT-4o-mini、Claude 3.5 Sonnet 等完全支持的模型以获得最佳体验。
        </p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

