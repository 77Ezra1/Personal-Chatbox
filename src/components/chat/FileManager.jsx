import { useState, useEffect } from 'react';
import { Search, Filter, Grid, List, Trash2, Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { FilePreview } from './FilePreview';

/**
 * 文件管理器组件
 * @param {Object} props
 * @param {string} props.conversationId - 对话ID（可选）
 * @param {Function} props.onFileSelect - 文件选择回调
 * @param {boolean} props.showActions - 是否显示操作按钮
 */
export function FileManager({
  conversationId = null,
  onFileSelect,
  showActions = true
}) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [error, setError] = useState(null);

  // 加载文件列表
  const loadFiles = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (conversationId) params.append('conversationId', conversationId);
      if (filterType !== 'all') params.append('fileType', filterType);

      const response = await fetch(`/api/files?${params}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setFiles(data.files || []);
      } else {
        const errorData = await response.json();
        setError(errorData.message || '加载文件失败');
      }
    } catch (error) {
      console.error('加载文件失败:', error);
      setError('加载文件失败');
    } finally {
      setLoading(false);
    }
  };

  // 删除文件
  const handleDeleteFile = async (fileId) => {
    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setFiles(prev => prev.filter(file => file.id !== fileId));
        setSelectedFiles(prev => {
          const newSet = new Set(prev);
          newSet.delete(fileId);
          return newSet;
        });
      } else {
        const errorData = await response.json();
        setError(errorData.message || '删除文件失败');
      }
    } catch (error) {
      console.error('删除文件失败:', error);
      setError('删除文件失败');
    }
  };

  // 解析文件
  const handleParseFile = (fileId, result) => {
    setFiles(prev => prev.map(file =>
      file.id === fileId
        ? { ...file, status: 'parsed' }
        : file
    ));
  };

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedFiles.size === 0) return;

    if (window.confirm(`确定要删除选中的 ${selectedFiles.size} 个文件吗？`)) {
      const deletePromises = Array.from(selectedFiles).map(fileId =>
        fetch(`/api/files/${fileId}`, {
          method: 'DELETE',
          credentials: 'include'
        })
      );

      try {
        await Promise.all(deletePromises);
        setFiles(prev => prev.filter(file => !selectedFiles.has(file.id)));
        setSelectedFiles(new Set());
      } catch (error) {
        console.error('批量删除失败:', error);
        setError('批量删除失败');
      }
    }
  };

  // 下载文件
  const handleDownloadFile = (fileId, filename) => {
    const link = document.createElement('a');
    link.href = `/api/files/${fileId}/preview`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 批量下载
  const handleBatchDownload = () => {
    selectedFiles.forEach(fileId => {
      const file = files.find(f => f.id === fileId);
      if (file) {
        handleDownloadFile(fileId, file.originalName);
      }
    });
  };

  // 切换文件选择
  const toggleFileSelection = (fileId) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedFiles.size === filteredFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(filteredFiles.map(file => file.id)));
    }
  };

  // 过滤文件
  const filteredFiles = files.filter(file => {
    const matchesSearch = file.originalName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || file.type === filterType;
    return matchesSearch && matchesType;
  });

  // 初始化加载
  useEffect(() => {
    loadFiles();
  }, [conversationId, filterType]);

  return (
    <div className="space-y-4">
      {/* 工具栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="搜索文件..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="文件类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="docx">Word</SelectItem>
              <SelectItem value="xlsx">Excel</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="txt">文本</SelectItem>
              <SelectItem value="pptx">PPT</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSelectAll}
            disabled={filteredFiles.length === 0}
          >
            {selectedFiles.size === filteredFiles.length ? '取消全选' : '全选'}
          </Button>

          {selectedFiles.size > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBatchDownload}
              >
                <Download className="w-4 h-4 mr-1" />
                下载
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBatchDelete}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                删除
              </Button>
            </>
          )}

          <div className="flex items-center border rounded-lg">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 文件统计 */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>
          共 {filteredFiles.length} 个文件
          {selectedFiles.size > 0 && `，已选择 ${selectedFiles.size} 个`}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={loadFiles}
          disabled={loading}
        >
          {loading ? '加载中...' : '刷新'}
        </Button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* 文件列表 */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400 animate-pulse" />
            <p className="text-sm text-gray-500">加载中...</p>
          </div>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-500">
              {searchTerm ? '没有找到匹配的文件' : '暂无文件'}
            </p>
          </div>
        </div>
      ) : (
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
            : 'space-y-2'
        }>
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              className={`relative ${
                selectedFiles.has(file.id) ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <FilePreview
                file={file}
                onDelete={handleDeleteFile}
                onParse={handleParseFile}
                showActions={showActions}
              />

              {/* 选择框 */}
              <input
                type="checkbox"
                checked={selectedFiles.has(file.id)}
                onChange={() => toggleFileSelection(file.id)}
                className="absolute top-2 left-2 w-4 h-4"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
