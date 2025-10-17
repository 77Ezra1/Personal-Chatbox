import { useState, useEffect } from 'react';
import { File, Download, Eye, Trash2, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/**
 * 文件预览组件
 * @param {Object} props
 * @param {Object} props.file - 文件对象
 * @param {Function} props.onDelete - 删除文件回调
 * @param {Function} props.onParse - 解析文件回调
 * @param {boolean} props.showActions - 是否显示操作按钮
 */
export function FilePreview({
  file,
  onDelete,
  onParse,
  showActions = true
}) {
  const [parsing, setParsing] = useState(false);
  const [parsedContent, setParsedContent] = useState(null);
  const [showContent, setShowContent] = useState(false);

  // 获取文件图标
  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'pdf':
        return '📄';
      case 'docx':
        return '📝';
      case 'xlsx':
        return '📊';
      case 'csv':
        return '📈';
      case 'txt':
        return '📄';
      case 'pptx':
      case 'ppt':
        return '📊';
      default:
        return '📄';
    }
  };

  // 格式化文件大小
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 格式化日期
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 获取状态图标
  const getStatusIcon = (status) => {
    switch (status) {
      case 'uploaded':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'parsing':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'parsed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <File className="w-4 h-4 text-gray-400" />;
    }
  };

  // 获取状态文本
  const getStatusText = (status) => {
    switch (status) {
      case 'uploaded':
        return '已上传';
      case 'parsing':
        return '解析中';
      case 'parsed':
        return '已解析';
      case 'error':
        return '解析失败';
      default:
        return '未知';
    }
  };

  // 解析文件
  const handleParse = async () => {
    if (parsing || file.status === 'parsing') return;

    setParsing(true);
    try {
      const response = await fetch(`/api/files/${file.id}/parse`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        setParsedContent(result.result);
        onParse?.(file.id, result);
      } else {
        const errorData = await response.json();
        console.error('解析失败:', errorData.message);
      }
    } catch (error) {
      console.error('解析文件失败:', error);
    } finally {
      setParsing(false);
    }
  };

  // 下载文件
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = `/api/files/${file.id}/preview`;
    link.download = file.originalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 删除文件
  const handleDelete = () => {
    if (window.confirm('确定要删除这个文件吗？')) {
      onDelete?.(file.id);
    }
  };

  // 渲染解析内容
  const renderParsedContent = () => {
    if (!parsedContent) return null;

    const { type, text, pages, sheets, data } = parsedContent;

    switch (type) {
      case 'pdf':
        return (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">页数: {pages}</p>
            <div className="max-h-40 overflow-y-auto">
              <p className="text-sm whitespace-pre-wrap">{text?.substring(0, 500)}...</p>
            </div>
          </div>
        );

      case 'docx':
      case 'txt':
        return (
          <div className="max-h-40 overflow-y-auto">
            <p className="text-sm whitespace-pre-wrap">{text?.substring(0, 500)}...</p>
          </div>
        );

      case 'xlsx':
        return (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">工作表: {Object.keys(sheets || {}).join(', ')}</p>
            <div className="max-h-40 overflow-y-auto">
              <pre className="text-xs">{JSON.stringify(sheets, null, 2).substring(0, 500)}...</pre>
            </div>
          </div>
        );

      case 'csv':
        return (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">行数: {data?.length || 0}</p>
            <div className="max-h-40 overflow-y-auto">
              <pre className="text-xs">{JSON.stringify(data?.slice(0, 5), null, 2)}...</pre>
            </div>
          </div>
        );

      default:
        return <p className="text-sm text-gray-500">内容预览不可用</p>;
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-start space-x-3">
        {/* 文件图标 */}
        <div className="text-3xl">{getFileIcon(file.type)}</div>

        {/* 文件信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <h4 className="text-sm font-medium truncate">{file.originalName}</h4>
            <Badge variant="secondary" className="text-xs">
              {file.type.toUpperCase()}
            </Badge>
          </div>

          <div className="flex items-center space-x-4 text-xs text-gray-500 mb-2">
            <span>{formatFileSize(file.size)}</span>
            <span>{formatDate(file.createdAt)}</span>
            <div className="flex items-center space-x-1">
              {getStatusIcon(file.status)}
              <span>{getStatusText(file.status)}</span>
            </div>
          </div>

          {/* 解析内容预览 */}
          {showContent && renderParsedContent()}
        </div>

        {/* 操作按钮 */}
        {showActions && (
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowContent(!showContent)}
              title="预览内容"
            >
              <Eye className="w-4 h-4" />
            </Button>

            {file.status === 'uploaded' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleParse}
                disabled={parsing}
                title="解析文件"
              >
                {parsing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <File className="w-4 h-4" />
                )}
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              title="下载文件"
            >
              <Download className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              title="删除文件"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
