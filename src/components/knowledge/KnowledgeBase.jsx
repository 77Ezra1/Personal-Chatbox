import { useState, useEffect } from 'react';
import { Plus, Search, BookOpen, FileText, BarChart3, Settings, Trash2, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

/**
 * 知识库管理组件
 * @param {Object} props
 * @param {Function} props.onKnowledgeBaseSelect - 选择知识库回调
 * @param {string} props.selectedKnowledgeBaseId - 选中的知识库ID
 * @param {Function} props.translate - 翻译函数
 */
export function KnowledgeBase({
  onKnowledgeBaseSelect,
  selectedKnowledgeBaseId,
  translate
}) {
  const [knowledgeBases, setKnowledgeBases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newKnowledgeBase, setNewKnowledgeBase] = useState({
    name: '',
    description: '',
    config: {
      chunkSize: 1000,
      chunkOverlap: 200,
      embeddingModel: 'text-embedding-3-small',
      retrievalTopK: 5,
      similarityThreshold: 0.7
    }
  });
  const [error, setError] = useState(null);

  // 加载知识库列表
  const loadKnowledgeBases = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/knowledge/bases', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setKnowledgeBases(data.knowledgeBases || []);
      } else {
        const errorData = await response.json();
        setError(errorData.message || translate('knowledge.loadFailed'));
      }
    } catch (error) {
      console.error('加载知识库失败:', error);
      setError(translate('knowledge.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  // 创建知识库
  const handleCreateKnowledgeBase = async () => {
    if (!newKnowledgeBase.name.trim()) {
      setError(translate('knowledge.nameRequired'));
      return;
    }

    try {
      const response = await fetch('/api/knowledge/bases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newKnowledgeBase),
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setKnowledgeBases(prev => [data.knowledgeBase, ...prev]);
        setNewKnowledgeBase({
          name: '',
          description: '',
          config: {
            chunkSize: 1000,
            chunkOverlap: 200,
            embeddingModel: 'text-embedding-3-small',
            retrievalTopK: 5,
            similarityThreshold: 0.7
          }
        });
        setIsCreateDialogOpen(false);
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.message || translate('knowledge.createFailed'));
      }
    } catch (error) {
      console.error('创建知识库失败:', error);
      setError(translate('knowledge.createFailed'));
    }
  };

  // 删除知识库
  const handleDeleteKnowledgeBase = async (knowledgeBaseId) => {
    if (!window.confirm(translate('knowledge.deleteConfirm'))) {
      return;
    }

    try {
      const response = await fetch(`/api/knowledge/bases/${knowledgeBaseId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setKnowledgeBases(prev => prev.filter(kb => kb.id !== knowledgeBaseId));
        if (selectedKnowledgeBaseId === knowledgeBaseId) {
          onKnowledgeBaseSelect?.(null);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || translate('knowledge.deleteFailed'));
      }
    } catch (error) {
      console.error('删除知识库失败:', error);
      setError(translate('knowledge.deleteFailed'));
    }
  };

  // 过滤知识库
  const filteredKnowledgeBases = knowledgeBases.filter(kb =>
    kb.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (kb.description && kb.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // 初始化加载
  useEffect(() => {
    loadKnowledgeBases();
  }, []);

  return (
    <div className="space-y-4">
      {/* 头部工具栏 */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center space-x-2">
          <BookOpen className="w-5 h-5" />
          <span>{translate('knowledge.knowledgeBase')}</span>
        </h2>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              {translate('knowledge.createKnowledgeBase')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{translate('knowledge.newKnowledgeBase')}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">{translate('knowledge.name')}</label>
                <Input
                  value={newKnowledgeBase.name}
                  onChange={(e) => setNewKnowledgeBase(prev => ({
                    ...prev,
                    name: e.target.value
                  }))}
                  placeholder={translate('knowledge.namePlaceholder')}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">{translate('knowledge.description')}</label>
                <Input
                  value={newKnowledgeBase.description}
                  onChange={(e) => setNewKnowledgeBase(prev => ({
                    ...prev,
                    description: e.target.value
                  }))}
                  placeholder={translate('knowledge.descriptionPlaceholder')}
                  className="mt-1"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  {translate('knowledge.cancel')}
                </Button>
                <Button onClick={handleCreateKnowledgeBase}>
                  {translate('knowledge.create')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 搜索框 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder={translate('knowledge.searchPlaceholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* 知识库列表 */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">{translate('knowledge.loading')}</p>
          </div>
        </div>
      ) : filteredKnowledgeBases.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-500">
              {searchTerm ? translate('knowledge.noMatchingKB') : translate('knowledge.noKB')}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredKnowledgeBases.map((kb) => (
            <Card
              key={kb.id}
              className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                selectedKnowledgeBaseId === kb.id
                  ? 'ring-2 ring-blue-500 bg-blue-50'
                  : 'hover:border-gray-300'
              }`}
              onClick={() => onKnowledgeBaseSelect?.(kb.id)}
            >
              <div className="space-y-3">
                {/* 知识库信息 */}
                <div>
                  <h3 className="font-medium text-sm truncate">{kb.name}</h3>
                  {kb.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {kb.description}
                    </p>
                  )}
                </div>

                {/* 配置信息 */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{translate('knowledge.embeddingModel')}</span>
                    <Badge variant="secondary" className="text-xs">
                      {kb.config.embeddingModel}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{translate('knowledge.chunkSize')}</span>
                    <span>{kb.config.chunkSize}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{translate('knowledge.retrievalCount')}</span>
                    <span>{kb.config.retrievalTopK}</span>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <FileText className="w-3 h-3" />
                    <span>{translate('knowledge.documents').replace('{count}', '0')}</span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: 编辑知识库
                      }}
                    >
                      <Edit3 className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteKnowledgeBase(kb.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
