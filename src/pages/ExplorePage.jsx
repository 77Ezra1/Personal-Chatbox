import { useNavigate } from "react-router-dom"
import {
  MessageSquare,
  FileText,
  FolderOpen,
  Key,
  Workflow,
  Bot,
  BarChart3,
  Settings,
  Puzzle
} from "lucide-react"
import { Card } from "@/components/ui/card"

export default function ExplorePage() {
  const navigate = useNavigate()

  const products = [
    {
      icon: MessageSquare,
      title: "AI 对话",
      description: "与多个 AI 模型对话，打造您的私人 AI 助手",
      href: "/",
      color: "bg-blue-500",
      available: true
    },
    {
      icon: FileText,
      title: "笔记管理",
      description: "Markdown 笔记编辑，支持分类、标签和搜索",
      href: "/notes",
      color: "bg-green-500",
      available: true
    },
    {
      icon: FolderOpen,
      title: "文档管理",
      description: "文档的增删改查，分类和标签系统",
      href: "/documents",
      color: "bg-purple-500",
      available: true
    },
    {
      icon: Key,
      title: "密码保险箱",
      description: "安全存储密码和敏感信息，本地加密",
      href: "/vault",
      color: "bg-red-500",
      available: true
    },
    {
      icon: Workflow,
      title: "智能工作流",
      description: "自定义 AI 工作流，自动化您的任务",
      href: "/workflows",
      color: "bg-orange-500",
      available: true
    },
    {
      icon: Bot,
      title: "AI 代理",
      description: "创建专属 AI 代理，执行复杂任务",
      href: "/agents",
      color: "bg-cyan-500",
      available: true
    },
    {
      icon: Puzzle,
      title: "MCP 服务",
      description: "模型上下文协议集成，扩展 AI 能力",
      href: "/mcp",
      color: "bg-indigo-500",
      available: true
    },
    {
      icon: BarChart3,
      title: "数据分析",
      description: "使用统计和可视化图表",
      href: "/analytics",
      color: "bg-pink-500",
      available: true
    },
    {
      icon: Settings,
      title: "系统设置",
      description: "配置 API 密钥、主题、快捷键等",
      href: "/settings",
      color: "bg-gray-500",
      available: true
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section */}
      <section className="bg-neutral-50 border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <h1 className="text-4xl font-bold mb-4">探索 Personal Chatbox</h1>
          <p className="text-lg text-neutral-600">
            发现所有功能模块，打造您的个人数字工作空间
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => {
            const Icon = product.icon
            return (
              <Card
                key={product.href}
                onClick={() => product.available && navigate(product.href)}
                className={`group p-6 border border-neutral-200 rounded-xl bg-white hover:shadow-lg hover:border-neutral-300 transition-all duration-200 ${
                  product.available ? 'cursor-pointer' : 'opacity-60 cursor-not-allowed'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl ${product.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-neutral-900 mb-2">
                  {product.title}
                  {!product.available && (
                    <span className="ml-2 text-xs text-neutral-500 font-normal">
                      (即将推出)
                    </span>
                  )}
                </h2>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  {product.description}
                </p>
              </Card>
            )
          })}
        </div>

        {/* Stats Section */}
        <section className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
            <div className="text-3xl font-bold text-blue-900 mb-2">9+</div>
            <div className="text-sm text-blue-700">功能模块</div>
          </div>
          <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
            <div className="text-3xl font-bold text-green-900 mb-2">100%</div>
            <div className="text-sm text-green-700">本地化存储</div>
          </div>
          <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
            <div className="text-3xl font-bold text-purple-900 mb-2">安全</div>
            <div className="text-sm text-purple-700">端到端加密</div>
          </div>
        </section>

        {/* Features Highlight */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold mb-8 text-center">核心特性</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-2">隐私优先</h3>
                <p className="text-sm text-neutral-600">
                  所有数据本地存储，密码采用 AES-256 加密，您的隐私完全由您掌控
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-2">快速响应</h3>
                <p className="text-sm text-neutral-600">
                  本地部署，毫秒级响应，无需担心网络延迟问题
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-2">模块化设计</h3>
                <p className="text-sm text-neutral-600">
                  功能模块独立，可按需使用，不强制绑定
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-2">高度可定制</h3>
                <p className="text-sm text-neutral-600">
                  支持自定义主题、快捷键、工作流，打造专属工作环境
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
