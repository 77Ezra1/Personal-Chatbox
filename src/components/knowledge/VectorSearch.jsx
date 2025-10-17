import { useState, useEffect } from 'react';
import { Search, FileText, BookOpen, Quote, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

/**
 * 向量搜索组件
 * @param {Object} props
 * @param {string} props.knowledgeBaseId - 知识库ID
 * @param {Function} props.onSearchResult - 搜索结果回调
 * @param {boolean} props.disabled - 是否禁用
 */
export function VectorSearch({
  knowledgeBaseId,
  onSearchResult,
  disabled = false
}) {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [searchOptions, setSearchOptions] = useState({
    topK: 5,
    similarityThreshold: 0.7
  });

  // 执行搜索
  const handleSearch = async () => {
    if (!query.trim() || !knowledgeBaseId || searching) return;

    setSearching(true);
    setError(null);

    try {
      const response = await fetch('/api/knowledge/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          knowledgeBaseId,
          query: query.trim(),
          topK: searchOptions.topK,
          similarityThreshold: searchOptions.similarityThreshold
        }),
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
        onSearchResult?.(data.results || []);
      } else {
        const errorData = await response.json();
        setError(errorData.message || '搜索失败');
      }
    } catch (error) {
      console.error('搜索失败:', error);
      setError('搜索失败');
    } finally {
      setSearching(false);
    }
  };

  // 处理键盘事件
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  // 格式化相似度分数
  const formatSimilarity = (similarity) => {
    return (similarity * 100).toFixed(1) + '%';
  };

  // 获取相似度颜色
  const getSimilarityColor = (similarity) => {
    if (similarity >= 0.8) return 'text-green-600';
    if (similarity >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  // 截断文本
  const truncateText = (text, maxLength = 200) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="space-y-4">
      {/* 搜索输入 */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Search className="w-5 h-5 text-gray-400" />
            <h3 className="font-medium">向量搜索</h3>
          </div>

          <div className="flex space-x-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="输入搜索内容..."
              disabled={disabled || searching}
              className="flex-1"
            />
            <Button
              onClick={handleSearch}
              disabled={disabled || searching || !query.trim()}
            >
              {searching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* 搜索选项 */}
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <label>返回数量:</label>
              <select
                value={searchOptions.topK}
                onChange={(e) => setSearchOptions(prev => ({
                  ...prev,
                  topK: parseInt(e.target.value)
                }))}
                className="px-2 py-1 border rounded text-sm"
                disabled={disabled}
              >
                <option value={3}>3</option>
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <label>相似度阈值:</label>
              <select
                value={searchOptions.similarityThreshold}
                onChange={(e) => setSearchOptions(prev => ({
                  ...prev,
                  similarityThreshold: parseFloat(e.target.value)
                }))}
                className="px-2 py-1 border rounded text-sm"
                disabled={disabled}
              >
                <option value={0.5}>50%</option>
                <option value={0.6}>60%</option>
                <option value={0.7}>70%</option>
                <option value={0.8}>80%</option>
                <option value={0.9}>90%</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* 错误提示 */}
      {error && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-sm text-red-600">{error}</span>
        </div>
      )}

      {/* 搜索结果 */}
      {results.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">
              搜索结果 ({results.length})
            </h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setResults([]);
                onSearchResult?.([]);
              }}
            >
              清空
            </Button>
          </div>

          <div className="space-y-3">
            {results.map((result, index) => (
              <Card key={result.id} className="p-4">
                <div className="space-y-3">
                  {/* 结果头部 */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium">{result.filename}</span>
                      <Badge variant="secondary" className="text-xs">
                        {result.fileType.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-medium ${getSimilarityColor(result.similarity)}`}>
                        {formatSimilarity(result.similarity)}
                      </span>
                      <span className="text-xs text-gray-500">
                        #{index + 1}
                      </span>
                    </div>
                  </div>

                  {/* 相似度进度条 */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>相似度</span>
                      <span>{formatSimilarity(result.similarity)}</span>
                    </div>
                    <Progress
                      value={result.similarity * 100}
                      className="h-2"
                    />
                  </div>

                  {/* 内容预览 */}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-700">
                      {truncateText(result.content)}
                    </p>
                  </div>

                  {/* 元数据 */}
                  {result.metadata && Object.keys(result.metadata).length > 0 && (
                    <div className="text-xs text-gray-500">
                      <span>块索引: {result.chunkIndex}</span>
                      {result.metadata.start !== undefined && (
                        <span className="ml-2">
                          位置: {result.metadata.start}-{result.metadata.end}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 空状态 */}
      {!searching && results.length === 0 && query && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <Search className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-500">没有找到相关结果</p>
            <p className="text-xs text-gray-400 mt-1">
              尝试调整搜索词或降低相似度阈值
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
