"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Link, useNavigate } from "react-router-dom"

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-white text-foreground">
      {/* Navigation Bar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white/80 backdrop-blur-xl border-b border-border" : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="text-2xl font-semibold tracking-tight hover:opacity-80 transition-opacity">
              Personal Chatbox
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <a href="#products" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                功能
              </a>
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                特色
              </a>
              <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                登录
              </Link>
              <Button size="sm" className="rounded-full" onClick={() => navigate('/login')}>
                开始使用
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 text-balance">
            Personal 生态
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto text-balance leading-relaxed">
            本地化数据管理 + AI 能力 + 安全隐私
          </p>
          <Button
            size="lg"
            className="rounded-full px-8 h-12 text-base font-medium hover:scale-105 transition-transform"
            onClick={() => navigate('/login')}
          >
            开始使用
          </Button>
        </div>
      </section>

      {/* Product Showcase */}
      <section id="products" className="py-20 px-6 lg:px-8 bg-secondary/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Product 1: AI 对话 */}
            <Card className="group p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-border bg-card">
              <div className="mb-6">
                <div className="w-12 h-12 rounded-2xl bg-primary mb-4 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-primary-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold mb-3">AI 智能对话</h3>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  与多个 AI 模型对话，支持 GPT-4、Claude、Deepseek 等，打造您的私人 AI 助手
                </p>
              </div>
              <Button
                variant="outline"
                className="rounded-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors bg-transparent"
                onClick={() => navigate('/login')}
              >
                了解更多
              </Button>
            </Card>

            {/* Product 2: 知识管理 */}
            <Card className="group p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-border bg-card">
              <div className="mb-6">
                <div className="w-12 h-12 rounded-2xl bg-primary mb-4 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-primary-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold mb-3">知识管理系统</h3>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  笔记、文档、密码保险箱，完整的本地数据管理工具集
                </p>
              </div>
              <Button
                variant="outline"
                className="rounded-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors bg-transparent"
                onClick={() => navigate('/login')}
              >
                了解更多
              </Button>
            </Card>

            {/* Product 3: 工作流 */}
            <Card className="group p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-border bg-card">
              <div className="mb-6">
                <div className="w-12 h-12 rounded-2xl bg-primary mb-4 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-primary-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold mb-3">智能工作流</h3>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  自定义 AI 工作流和智能代理，自动化您的日常任务
                </p>
              </div>
              <Button
                variant="outline"
                className="rounded-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors bg-transparent"
                onClick={() => navigate('/login')}
              >
                了解更多
              </Button>
            </Card>

            {/* Product 4: MCP 集成 */}
            <Card className="group p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-border bg-card">
              <div className="mb-6">
                <div className="w-12 h-12 rounded-2xl bg-primary mb-4 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-primary-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold mb-3">MCP 服务集成</h3>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  模型上下文协议集成，扩展 AI 能力边界
                </p>
              </div>
              <Button
                variant="outline"
                className="rounded-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors bg-transparent"
                onClick={() => navigate('/login')}
              >
                了解更多
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-balance">
            为什么选择 Personal Chatbox
          </h2>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-secondary mx-auto mb-6 flex items-center justify-center">
                <svg className="w-8 h-8 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">隐私安全</h3>
              <p className="text-muted-foreground leading-relaxed">
                数据完全本地化存储，您的隐私由您掌控
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-secondary mx-auto mb-6 flex items-center justify-center">
                <svg className="w-8 h-8 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">离线可用</h3>
              <p className="text-muted-foreground leading-relaxed">
                本地部署，无需网络连接即可访问您的数据
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-secondary mx-auto mb-6 flex items-center justify-center">
                <svg className="w-8 h-8 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">一体化生态</h3>
              <p className="text-muted-foreground leading-relaxed">
                多款功能无缝协作，打造完整的个人数字生态
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-6 lg:px-8 mt-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-sm text-muted-foreground">© 2025 Personal Chatbox. All rights reserved.</div>
            <div className="flex gap-8 text-sm">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                隐私政策
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                服务条款
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                联系方式
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
