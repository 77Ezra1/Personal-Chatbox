import { useState, useEffect } from 'react';
import { MessageCircle, Send, Loader2, Quote, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

/**
 * 知识库问答组件
 * @param {Object} props
 * @param {string} props.knowledgeBaseId - 知识库ID
 * @param {Function} props.onQueryResult - 查询结果回调
 * @param {boolean} props.disabled - 是否禁用
 */
export function KnowledgeQuery({
  knowledgeBaseId,
  onQueryResult,
  disabled = false
}) {
  const [question, setQuestion] = useState('');
  const [querying, setQuerying] = useState(false);
  const [queryHistory, setQueryHistory] = useState([]);
  const [error, setError] = useState(null);
  const [queryOptions, setQueryOptions] = useState({
    topK: 5,
    includeCitations: true
  });

  // 执行问答查询
  const handleQuery = async () => {
    if (!question.trim() || !knowledgeBaseId || querying) return;

    setQuerying(true);
    setError(null);

    try {
      const response = await fetch('/api/knowledge/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          knowledgeBaseId,
          question: question.trim(),
          topK: queryOptions.topK,
          includeCitations: queryOptions.includeCitations
        }),
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();

        const queryResult = {
          id: data.queryId || Date.now().toString(),
          question: data.question,
          answer: data.answer,
          citations: data.citations || [],
          confidence: data.confidence || 0,
          timestamp: new Date().toISOString()
        };

        setQueryHistory(prev => [queryResult, ...prev]);
        onQueryResult?.(queryResult);
        setQuestion('');
      } else {
        const errorData = await response.json();
        setError(errorData.message || '查询失败');
      }
    } catch (error) {
      console.error('查询失败:', error);
      setError('查询失败');
    } finally {
      setQuerying(false);
    }
  };

  // 处理键盘事件
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleQuery();
    }
  };

  // 格式化置信度
  const formatConfidence = (confidence) => {
    return (confidence * 100).toFixed(1) + '%';
  };

  // 获取置信度颜色
  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  // 加载查询历史
  const loadQueryHistory = async () => {
    if (!knowledgeBaseId) return;

    try {
      const response = await fetch(`/api/knowledge/bases/${knowledgeBaseId}/queries?limit=10`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setQueryHistory(data.queries || []);
      }
    } catch (error) {
      console.error('加载查询历史失败:', error);
    }
  };

  // 初始化加载历史
  useEffect(() => {
    loadQueryHistory();
  }, [knowledgeBaseId]);

  return (
    <div className="space-y-4">
      {/* 问答输入 */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5 text-gray-400" />
            <h3 className="font-medium">知识库问答</h3>
          </div>

          <div className="flex space-x-2">
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="输入您的问题..."
              disabled={disabled || querying}
              className="flex-1"
            />
            <Button
              onClick={handleQuery}
              disabled={disabled || querying || !question.trim()}
            >
              {querying ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* 查询选项 */}
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <label>检索数量:</label>
              <select
                value={queryOptions.topK}
                onChange={(e) => setQueryOptions(prev => ({
                  ...prev,
                  topK: parseInt(e.target.value)
                }))}
                className="px-2 py-1 border rounded text-sm"
                disabled={disabled}
              >
                <option value={3}>3</option>
                <option value={5}>5</option>
                <option value={10}>10</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <label>
                <input
                  type="checkbox"
                  checked={queryOptions.includeCitations}
                  onChange={(e) => setQueryOptions(prev => ({
                    ...prev,
                    includeCitations: e.target.checked
                  }))}
                  disabled={disabled}
                  className="mr-1"
                />
                包含引用来源
              </label>
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

      {/* 查询历史 */}
      {queryHistory.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-sm">查询历史</h4>

          <div className="space-y-3">
            {queryHistory.map((query, index) => (
              <Card key={query.id} className="p-4">
                <div className="space-y-3">
                  {/* 问题 */}
                  <div className="flex items-start space-x-2">
                    <MessageCircle className="w-4 h-4 text-blue-500 mt-1" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{query.question}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(query.timestamp || query.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {query.confidence && (
                      <Badge
                        variant="secondary"
                        className={`text-xs ${getConfidenceColor(query.confidence)}`}
                      >
                        {formatConfidence(query.confidence)}
                      </Badge>
                    )}
                  </div>

                  {/* 回答 */}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {query.answer}
                    </p>
                  </div>

                  {/* 引用来源 */}
                  {query.citations && query.citations.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Quote className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium">引用来源</span>
                        <Badge variant="outline" className="text-xs">
                          {query.citations.length} 个
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        {query.citations.slice(0, 3).map((citation, idx) => (
                          <div key={idx} className="flex items-start space-x-2 p-2 bg-white border rounded">
                            <FileText className="w-3 h-3 text-gray-400 mt-1" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">
                                {citation.filename}
                              </p>
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {citation.content}
                              </p>
                              {citation.similarity && (
                                <p className="text-xs text-gray-400 mt-1">
                                  相似度: {(citation.similarity * 100).toFixed(1)}%
                                </p>
                              )}
                            </div>
                          </div>
                        ))}

                        {query.citations.length > 3 && (
                          <p className="text-xs text-gray-500 text-center">
                            还有 {query.citations.length - 3} 个引用来源...
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 空状态 */}
      {!querying && queryHistory.length === 0 && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-500">还没有查询记录</p>
            <p className="text-xs text-gray-400 mt-1">
              开始提问来获取基于知识库的智能回答
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
