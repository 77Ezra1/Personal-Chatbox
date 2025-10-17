import { useState, useRef, useCallback } from 'react';
import { Upload, File, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

/**
 * 文件上传组件
 * @param {Object} props
 * @param {Function} props.onFilesUploaded - 文件上传完成回调
 * @param {Array} props.files - 已上传的文件列表
 * @param {Function} props.onFileDelete - 删除文件回调
 * @param {boolean} props.disabled - 是否禁用
 * @param {number} props.maxFiles - 最大文件数量
 * @param {string} props.maxSize - 最大文件大小
 */
export function FileUpload({
  onFilesUploaded,
  files = [],
  onFileDelete,
  disabled = false,
  maxFiles = 10,
  maxSize = '50MB',
  translate
}) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);

  // 处理文件选择
  const handleFiles = useCallback(async (selectedFiles) => {
    if (disabled || uploading) return;

    const fileArray = Array.from(selectedFiles);

    // 验证文件数量
    if (files.length + fileArray.length > maxFiles) {
      setError(translate?.('fileUpload.maxFilesError', 'Maximum {count} files allowed').replace('{count}', maxFiles));
      return;
    }

    // 验证文件大小
    const maxSizeBytes = parseSize(maxSize);
    const oversizedFiles = fileArray.filter(file => file.size > maxSizeBytes);
    if (oversizedFiles.length > 0) {
      setError(translate?.('fileUpload.maxSizeError', 'File size cannot exceed {size}').replace('{size}', maxSize));
      return;
    }

    setError(null);
    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      fileArray.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || translate?.('fileUpload.uploadFailed', 'File upload failed'));
      }

      const result = await response.json();
      onFilesUploaded?.(result.files);

    } catch (error) {
      console.error('文件上传失败:', error);
      setError(error.message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [disabled, uploading, files.length, maxFiles, maxSize, onFilesUploaded]);

  // 处理拖拽
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  // 处理拖拽放下
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled || uploading) return;

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      handleFiles(droppedFiles);
    }
  }, [disabled, uploading, handleFiles]);

  // 处理文件选择
  const handleFileSelect = useCallback((e) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      handleFiles(selectedFiles);
    }
  }, [handleFiles]);

  // 打开文件选择器
  const openFileDialog = useCallback(() => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  }, [disabled, uploading]);

  // 删除文件
  const handleDeleteFile = useCallback(async (fileId) => {
    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        onFileDelete?.(fileId);
      } else {
        const errorData = await response.json();
        setError(errorData.message || translate?.('fileUpload.deleteFailed', 'Failed to delete file'));
      }
    } catch (error) {
      console.error('删除文件失败:', error);
      setError(translate?.('fileUpload.deleteFailed', 'Failed to delete file'));
    }
  }, [onFileDelete]);

  // 解析文件大小
  const parseSize = (sizeStr) => {
    const units = { B: 1, KB: 1024, MB: 1024 * 1024, GB: 1024 * 1024 * 1024 };
    const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)$/i);
    if (match) {
      const value = parseFloat(match[1]);
      const unit = match[2].toUpperCase();
      return value * units[unit];
    }
    return 50 * 1024 * 1024; // 默认50MB
  };

  // 格式化文件大小
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

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

  return (
    <div className="space-y-4">
      {/* 上传区域 */}
      <Card
        className={`p-6 border-2 border-dashed transition-all duration-200 ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <div className="text-center">
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium mb-2">
            {dragActive ? translate?.('fileUpload.dropFiles', 'Drop files to upload') : translate?.('fileUpload.dragHere', 'Drag files here or click to select')}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {translate?.('fileUpload.supportedFormats', 'Supports PDF, Word, Excel, CSV, PowerPoint, plain text files')}
          </p>
          <p className="text-xs text-gray-400">
            {translate?.('fileUpload.maxSize', 'Max {size}, up to {count} files').replace('{size}', maxSize).replace('{count}', maxFiles)}
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.xlsx,.csv,.txt,.ppt,.pptx"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || uploading}
        />
      </Card>

      {/* 上传进度 */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>{translate?.('fileUpload.uploading', 'Uploading...')}</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="w-full" />
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-sm text-red-600">{error}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setError(null)}
            className="ml-auto"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* 文件列表 */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">{translate?.('fileUpload.uploadedFiles', 'Uploaded Files ({count})').replace('{count}', files.length)}</h4>
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
              >
                <span className="text-2xl">{getFileIcon(file.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.originalName}</p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)} • {file.type.toUpperCase()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {file.status === 'uploaded' && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                  {file.status === 'parsing' && (
                    <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                  )}
                  {file.status === 'error' && (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteFile(file.id)}
                    disabled={uploading}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
