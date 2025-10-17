import { useState } from 'react';
import { Star, Users, Clock, Edit3, Trash2, Copy, Heart, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PersonaEditor } from './PersonaEditor';

/**
 * 角色卡片组件
 * @param {Object} props
 * @param {Object} props.persona - 角色数据
 * @param {boolean} props.isSelected - 是否选中
 * @param {Function} props.onSelect - 选择回调
 * @param {Function} props.onUpdate - 更新回调
 * @param {Function} props.onDelete - 删除回调
 */
export function PersonaCard({
  persona,
  isSelected = false,
  onSelect,
  onUpdate,
  onDelete
}) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 处理角色选择
  const handleSelect = () => {
    onSelect?.(persona);
  };

  // 处理角色编辑
  const handleEdit = () => {
    setIsEditDialogOpen(true);
  };

  // 处理角色更新
  const handleUpdate = (updatedPersona) => {
    onUpdate?.(updatedPersona);
    setIsEditDialogOpen(false);
  };

  // 处理角色删除
  const handleDelete = async () => {
    if (!window.confirm(`确定要删除角色 "${persona.name}" 吗？`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/personas/${persona.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        onDelete?.(persona.id);
      } else {
        const errorData = await response.json();
        alert(errorData.message || '删除失败');
      }
    } catch (error) {
      console.error('删除角色失败:', error);
      alert('删除失败');
    } finally {
      setIsDeleting(false);
    }
  };

  // 处理角色复制
  const handleCopy = async () => {
    try {
      const response = await fetch(`/api/personas/${persona.id}/copy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: `${persona.name} (副本)`
        }),
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        onUpdate?.(data.persona);
      } else {
        const errorData = await response.json();
        alert(errorData.message || '复制失败');
      }
    } catch (error) {
      console.error('复制角色失败:', error);
      alert('复制失败');
    }
  };

  // 处理角色评分
  const handleRate = async (rating) => {
    try {
      const response = await fetch(`/api/personas/${persona.id}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rating }),
        credentials: 'include'
      });

      if (response.ok) {
        // 刷新角色数据
        const updatedPersona = { ...persona, rating: (persona.rating + rating) / 2 };
        onUpdate?.(updatedPersona);
      }
    } catch (error) {
      console.error('评分失败:', error);
    }
  };

  // 格式化评分
  const formatRating = (rating) => {
    return rating ? rating.toFixed(1) : '0.0';
  };

  // 获取角色分类图标
  const getCategoryIcon = (category) => {
    const icons = {
      assistant: '🤖',
      professional: '👔',
      creative: '🎨',
      entertainment: '🎭',
      custom: '⚙️'
    };
    return icons[category] || '📋';
  };

  // 获取角色分类名称
  const getCategoryName = (category) => {
    const names = {
      assistant: '助手',
      professional: '专业',
      creative: '创意',
      entertainment: '娱乐',
      custom: '自定义'
    };
    return names[category] || '其他';
  };

  return (
    <>
      <Card
        className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
          isSelected
            ? 'ring-2 ring-blue-500 bg-blue-50'
            : 'hover:border-gray-300'
        }`}
        onClick={handleSelect}
      >
        <div className="space-y-3">
          {/* 角色头部 */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              {/* 角色头像 */}
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                {persona.avatarUrl ? (
                  <img
                    src={persona.avatarUrl}
                    alt={persona.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  persona.name.charAt(0).toUpperCase()
                )}
              </div>

              {/* 角色信息 */}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm truncate">{persona.name}</h3>
                <p className="text-xs text-gray-500 truncate">
                  {persona.description || '暂无描述'}
                </p>
              </div>
            </div>

            {/* 操作菜单 */}
            {!persona.isBuiltin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(); }}>
                    <Edit3 className="w-4 h-4 mr-2" />
                    编辑
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleCopy(); }}>
                    <Copy className="w-4 h-4 mr-2" />
                    复制
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                    className="text-red-600"
                    disabled={isDeleting}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {isDeleting ? '删除中...' : '删除'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* 角色标签 */}
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-xs">
              {getCategoryIcon(persona.category)} {getCategoryName(persona.category)}
            </Badge>
            {persona.isBuiltin && (
              <Badge variant="outline" className="text-xs">
                内置
              </Badge>
            )}
            {persona.isPublic && (
              <Badge variant="outline" className="text-xs">
                公开
              </Badge>
            )}
          </div>

          {/* 角色标签 */}
          {persona.tags && persona.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {persona.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {persona.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{persona.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* 角色统计 */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <Star className="w-3 h-3" />
                <span>{formatRating(persona.rating)}</span>
                <span>({persona.ratingCount})</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="w-3 h-3" />
                <span>{persona.usageCount}</span>
              </div>
            </div>

            {/* 快速评分 */}
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRate(star);
                  }}
                  className="text-gray-300 hover:text-yellow-400 transition-colors"
                >
                  <Star className="w-3 h-3 fill-current" />
                </button>
              ))}
            </div>
          </div>

          {/* 角色预览 */}
          <div className="bg-gray-50 p-2 rounded text-xs text-gray-600 line-clamp-2">
            {persona.systemPrompt?.substring(0, 100)}
            {persona.systemPrompt?.length > 100 && '...'}
          </div>
        </div>
      </Card>

      {/* 编辑对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>编辑角色</DialogTitle>
          </DialogHeader>
          <PersonaEditor
            persona={persona}
            onSave={handleUpdate}
            onCancel={() => setIsEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
