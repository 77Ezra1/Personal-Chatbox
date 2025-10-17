import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const ProfileSettings = () => {
  const { user, updateUserProfile } = useAuth();
  const [profile, setProfile] = useState({
    username: '',
    signature: '',
    theme: 'light',
    language: 'zh-CN',
    timezone: 'Asia/Shanghai',
    currency: 'CNY',
    dateFormat: 'YYYY-MM-DD'
  });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // 加载用户资料
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.profile) {
        setProfile({
          username: data.profile.username || '',
          signature: data.profile.signature || '',
          theme: data.profile.theme || 'light',
          language: data.profile.language || 'zh-CN',
          timezone: data.profile.timezone || 'Asia/Shanghai',
          currency: data.profile.currency || 'CNY',
          dateFormat: data.profile.date_format || 'YYYY-MM-DD'
        });
        if (data.profile.avatar_url) {
          setAvatarPreview(data.profile.avatar_url);
        }
      }
    } catch (error) {
      console.error('加载用户资料失败:', error);
      showMessage('加载用户资料失败', 'error');
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      showMessage('请选择图片文件', 'error');
      return;
    }

    // 验证文件大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showMessage('图片大小不能超过 5MB', 'error');
      return;
    }

    setAvatarFile(file);

    // 预览图片
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadAvatar = async () => {
    if (!avatarFile) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('avatar', avatarFile);

    try {
      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const data = await response.json();
      if (response.ok) {
        showMessage('头像上传成功', 'success');
        setAvatarFile(null);
        // 更新全局用户状态
        if (updateUserProfile) {
          updateUserProfile({ avatar_url: data.avatarUrl });
        }
      } else {
        showMessage(data.message || '上传失败', 'error');
      }
    } catch (error) {
      console.error('上传头像失败:', error);
      showMessage('上传头像失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!confirm('确定要删除头像吗?')) return;

    setLoading(true);
    try {
      const response = await fetch('/api/profile/avatar', {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();
      if (response.ok) {
        showMessage('头像已删除', 'success');
        setAvatarPreview(null);
        setAvatarFile(null);
        // 更新全局用户状态
        if (updateUserProfile) {
          updateUserProfile({ avatar_url: null });
        }
      } else {
        showMessage(data.message || '删除失败', 'error');
      }
    } catch (error) {
      console.error('删除头像失败:', error);
      showMessage('删除头像失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(profile)
      });

      const data = await response.json();
      if (response.ok) {
        showMessage('资料更新成功', 'success');
        // 更新全局用户状态
        if (updateUserProfile) {
          updateUserProfile(profile);
        }
        // 如果主题改变，应用新主题
        if (profile.theme !== document.documentElement.getAttribute('data-theme')) {
          document.documentElement.setAttribute('data-theme', profile.theme);
          localStorage.setItem('theme', profile.theme);
        }
      } else {
        showMessage(data.message || '更新失败', 'error');
      }
    } catch (error) {
      console.error('更新资料失败:', error);
      showMessage('更新资料失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">用户资料设置</h2>

      {message && (
        <div className={`mb-4 p-3 rounded ${
          message.type === 'success' ? 'bg-green-100 text-green-800' :
          message.type === 'error' ? 'bg-red-100 text-red-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* 头像部分 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">头像设置</h3>
        <div className="flex items-center space-x-6">
          <div className="relative">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="头像预览"
                className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-3xl text-gray-500">
                {user?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
              </div>
            )}
          </div>
          <div className="flex-1">
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="mb-2"
            />
            <p className="text-sm text-gray-500 mb-3">支持 JPG, PNG, GIF, WEBP 格式，最大 5MB</p>
            <div className="flex space-x-2">
              {avatarFile && (
                <button
                  onClick={handleUploadAvatar}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  上传头像
                </button>
              )}
              {avatarPreview && (
                <button
                  onClick={handleDeleteAvatar}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                >
                  删除头像
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 基本信息 */}
      <form onSubmit={handleUpdateProfile} className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">基本信息</h3>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">用户名</label>
          <input
            type="text"
            value={profile.username}
            onChange={(e) => setProfile({ ...profile, username: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="请输入用户名"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">个性签名</label>
          <textarea
            value={profile.signature}
            onChange={(e) => setProfile({ ...profile, signature: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="分享你的心情或个性宣言..."
            rows="3"
          />
        </div>

        {/* 主题设置 */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">主题模式</label>
          <select
            value={profile.theme}
            onChange={(e) => setProfile({ ...profile, theme: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="light">浅色模式 (Light)</option>
            <option value="dark">深色模式 (Dark)</option>
            <option value="auto">跟随系统</option>
          </select>
        </div>

        {/* 语言设置 */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">界面语言</label>
          <select
            value={profile.language}
            onChange={(e) => setProfile({ ...profile, language: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="zh-CN">简体中文</option>
            <option value="zh-TW">繁體中文</option>
            <option value="en-US">English (US)</option>
            <option value="en-GB">English (UK)</option>
            <option value="ja-JP">日本語</option>
            <option value="ko-KR">한국어</option>
          </select>
        </div>

        {/* 地区设置 */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">时区</label>
          <select
            value={profile.timezone}
            onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Asia/Shanghai">亚洲/上海 (UTC+8)</option>
            <option value="Asia/Hong_Kong">亚洲/香港 (UTC+8)</option>
            <option value="Asia/Taipei">亚洲/台北 (UTC+8)</option>
            <option value="Asia/Tokyo">亚洲/东京 (UTC+9)</option>
            <option value="America/New_York">美洲/纽约 (UTC-5)</option>
            <option value="America/Los_Angeles">美洲/洛杉矶 (UTC-8)</option>
            <option value="Europe/London">欧洲/伦敦 (UTC+0)</option>
            <option value="Europe/Paris">欧洲/巴黎 (UTC+1)</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">货币</label>
          <select
            value={profile.currency}
            onChange={(e) => setProfile({ ...profile, currency: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="CNY">人民币 (¥)</option>
            <option value="USD">美元 ($)</option>
            <option value="EUR">欧元 (€)</option>
            <option value="GBP">英镑 (£)</option>
            <option value="JPY">日元 (¥)</option>
            <option value="KRW">韩元 (₩)</option>
            <option value="HKD">港币 (HK$)</option>
            <option value="TWD">新台币 (NT$)</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">日期格式</label>
          <select
            value={profile.dateFormat}
            onChange={(e) => setProfile({ ...profile, dateFormat: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="YYYY-MM-DD">2025-01-15</option>
            <option value="MM/DD/YYYY">01/15/2025</option>
            <option value="DD/MM/YYYY">15/01/2025</option>
            <option value="YYYY年MM月DD日">2025年01月15日</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '保存中...' : '保存更改'}
        </button>
      </form>
    </div>
  );
};

export default ProfileSettings;
