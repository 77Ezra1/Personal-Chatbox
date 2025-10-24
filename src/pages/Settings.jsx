import React, { useState } from 'react';
import ApiConfig from '@/components/settings/ApiConfig';
import ProfileSettings from '@/components/settings/ProfileSettings';
import { AgentRuntimeConfig } from '@/components/settings/AgentRuntimeConfig';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* 标签导航 */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profile'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              用户资料
            </button>
            <button
              onClick={() => setActiveTab('api')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'api'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              API 配置
            </button>
            <button
              onClick={() => setActiveTab('agent')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'agent'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Agent 运行时
            </button>
          </nav>
        </div>

        {/* 标签内容 */}
        <div>
          {activeTab === 'profile' && <ProfileSettings />}
          {activeTab === 'api' && <ApiConfig />}
          {activeTab === 'agent' && <AgentRuntimeConfig />}
        </div>
      </div>
    </div>
  );
};

export default Settings;
