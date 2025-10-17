import { useState, useEffect } from 'react';
import { ChevronDown, Users, Clock, Star, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

/**
 * 角色切换器组件
 * @param {Object} props
 * @param {Object} props.currentPersona - 当前角色
 * @param {Function} props.onPersonaChange - 角色切换回调
 * @param {boolean} props.compact - 是否紧凑模式
 */
export function PersonaSwitcher({
  currentPersona,
  onPersonaChange,
  compact = false
}) {
  const [personas, setPersonas] = useState([]);
  const [recentPersonas, setRecentPersonas] = useState([]);
  const [loading, setLoading] = useState(false);

  // 加载角色列表
  const loadPersonas = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/personas?limit=20', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setPersonas(data.personas || []);
      }
    } catch (error) {
      console.error('加载角色失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 加载最近使用的角色
  const loadRecentPersonas = async () => {
    try {
      const response = await fetch('/api/personas/stats?limit=5', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setRecentPersonas(data.stats || []);
      }
    } catch (error) {
      console.error('加载最近角色失败:', error);
    }
  };

  // 处理角色切换
  const handlePersonaChange = async (persona) => {
    try {
      const response = await fetch(`/api/personas/${persona.id}/use`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({}),
        credentials: 'include'
      });

      if (response.ok) {
        onPersonaChange?.(persona);
        // 刷新最近使用的角色
        loadRecentPersonas();
      }
    } catch (error) {
      console.error('切换角色失败:', error);
    }
  };

  // 初始化加载
  useEffect(() => {
    loadPersonas();
    loadRecentPersonas();
  }, []);

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

  // 格式化评分
  const formatRating = (rating) => {
    return rating ? rating.toFixed(1) : '0.0';
  };

  if (compact) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="justify-between">
            <div className="flex items-center space-x-2">
              {currentPersona ? (
                <>
                  <span className="text-lg">
                    {getCategoryIcon(currentPersona.category)}
                  </span>
                  <span className="truncate max-w-32">
                    {currentPersona.name}
                  </span>
                </>
              ) : (
                <>
                  <Users className="w-4 h-4" />
                  <span>选择角色</span>
                </>
              )}
            </div>
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          {/* 最近使用 */}
          {recentPersonas.length > 0 && (
            <>
              <div className="px-2 py-1.5 text-xs font-medium text-gray-500">
                最近使用
              </div>
              {recentPersonas.slice(0, 3).map((persona) => (
                <DropdownMenuItem
                  key={persona.id}
                  onClick={() => handlePersonaChange(persona)}
                  className="flex items-center space-x-2"
                >
                  <span className="text-lg">
                    {getCategoryIcon(persona.category)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{persona.name}</div>
                    <div className="text-xs text-gray-500">
                      使用 {persona.usageCount} 次
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </>
          )}

          {/* 所有角色 */}
          <div className="px-2 py-1.5 text-xs font-medium text-gray-500">
            所有角色
          </div>
          {personas.slice(0, 10).map((persona) => (
            <DropdownMenuItem
              key={persona.id}
              onClick={() => handlePersonaChange(persona)}
              className="flex items-center space-x-2"
            >
              <span className="text-lg">
                {getCategoryIcon(persona.category)}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{persona.name}</div>
                <div className="text-xs text-gray-500 flex items-center space-x-2">
                  <span className="flex items-center space-x-1">
                    <Star className="w-3 h-3" />
                    <span>{formatRating(persona.rating)}</span>
                  </span>
                  <span>使用 {persona.usageCount} 次</span>
                </div>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* 当前角色 */}
        <div className="flex items-center justify-between">
          <h3 className="font-medium flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>当前角色</span>
          </h3>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                切换角色
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              {/* 最近使用 */}
              {recentPersonas.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-xs font-medium text-gray-500">
                    最近使用
                  </div>
                  {recentPersonas.slice(0, 5).map((persona) => (
                    <DropdownMenuItem
                      key={persona.id}
                      onClick={() => handlePersonaChange(persona)}
                      className="flex items-center space-x-3 p-3"
                    >
                      <span className="text-2xl">
                        {getCategoryIcon(persona.category)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{persona.name}</div>
                        <div className="text-xs text-gray-500">
                          使用 {persona.usageCount} 次 • 评分 {formatRating(persona.rating)}
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                </>
              )}

              {/* 所有角色 */}
              <div className="px-2 py-1.5 text-xs font-medium text-gray-500">
                所有角色
              </div>
              {personas.slice(0, 15).map((persona) => (
                <DropdownMenuItem
                  key={persona.id}
                  onClick={() => handlePersonaChange(persona)}
                  className="flex items-center space-x-3 p-3"
                >
                  <span className="text-2xl">
                    {getCategoryIcon(persona.category)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{persona.name}</div>
                    <div className="text-xs text-gray-500 flex items-center space-x-2">
                      <span className="flex items-center space-x-1">
                        <Star className="w-3 h-3" />
                        <span>{formatRating(persona.rating)}</span>
                      </span>
                      <span>使用 {persona.usageCount} 次</span>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* 当前角色信息 */}
        {currentPersona ? (
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                {currentPersona.avatarUrl ? (
                  <img
                    src={currentPersona.avatarUrl}
                    alt={currentPersona.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  getCategoryIcon(currentPersona.category)
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-medium truncate">{currentPersona.name}</h4>
                <p className="text-sm text-gray-500 truncate">
                  {currentPersona.description || '暂无描述'}
                </p>
              </div>
            </div>

            {/* 角色标签 */}
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">
                {getCategoryIcon(currentPersona.category)} {currentPersona.category}
              </Badge>
              {currentPersona.isBuiltin && (
                <Badge variant="outline" className="text-xs">
                  内置
                </Badge>
              )}
              {currentPersona.isPublic && (
                <Badge variant="outline" className="text-xs">
                  公开
                </Badge>
              )}
            </div>

            {/* 角色统计 */}
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4" />
                  <span>{formatRating(currentPersona.rating)}</span>
                  <span>({currentPersona.ratingCount})</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{currentPersona.usageCount}</span>
                </div>
              </div>

              <div className="flex items-center space-x-1 text-green-600">
                <Zap className="w-4 h-4" />
                <span className="text-xs">活跃</span>
              </div>
            </div>

            {/* 角色预览 */}
            <div className="bg-gray-50 p-3 rounded text-sm text-gray-600">
              {currentPersona.systemPrompt?.substring(0, 150)}
              {currentPersona.systemPrompt?.length > 150 && '...'}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-sm text-gray-500 mb-2">未选择角色</p>
            <p className="text-xs text-gray-400">
              选择一个角色开始对话
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
