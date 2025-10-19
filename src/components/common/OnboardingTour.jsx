import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { X, ArrowRight, MessageSquare, FileText, Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'

const ONBOARDING_STORAGE_KEY = 'personal-chatbox-onboarding-completed'

/**
 * 新用户引导组件
 * 在用户首次登录后显示功能引导
 */
export function OnboardingTour() {
  const navigate = useNavigate()
  const location = useLocation()
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  // 引导步骤
  const steps = [
    {
      title: '欢迎使用 Personal Chatbox!',
      description: '让我们快速了解一下主要功能',
      icon: MessageSquare,
      action: null
    },
    {
      title: 'AI 对话',
      description: '与多个 AI 模型对话,获得智能帮助',
      icon: MessageSquare,
      action: () => navigate('/')
    },
    {
      title: '笔记和文档',
      description: '使用笔记和文档功能,管理您的知识库',
      icon: FileText,
      action: () => navigate('/notes')
    },
    {
      title: 'AI 代理和工作流',
      description: '创建 AI 代理,自动化您的工作流程',
      icon: Bot,
      action: () => navigate('/agents')
    }
  ]

  // 检查是否需要显示引导
  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem(ONBOARDING_STORAGE_KEY)
    if (!hasCompletedOnboarding) {
      // 延迟显示,等待页面加载完成
      setTimeout(() => setIsVisible(true), 1000)
    }
  }, [])

  // 完成引导
  const completeOnboarding = () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true')
    setIsVisible(false)
  }

  // 下一步
  const handleNext = () => {
    const step = steps[currentStep]
    if (step.action) {
      step.action()
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      completeOnboarding()
    }
  }

  // 跳过引导
  const handleSkip = () => {
    completeOnboarding()
  }

  if (!isVisible) return null

  const currentStepData = steps[currentStep]
  const Icon = currentStepData.icon

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-lg w-full p-8 relative animate-in fade-in zoom-in duration-300">
        {/* 关闭按钮 */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 进度指示器 */}
        <div className="flex gap-2 mb-6">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                index <= currentStep
                  ? 'bg-blue-500'
                  : 'bg-neutral-200 dark:bg-neutral-700'
              }`}
            />
          ))}
        </div>

        {/* 图标 */}
        <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-6">
          <Icon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>

        {/* 标题和描述 */}
        <h2 className="text-2xl font-bold mb-3 text-neutral-900 dark:text-white">
          {currentStepData.title}
        </h2>
        <p className="text-neutral-600 dark:text-neutral-300 mb-8 leading-relaxed">
          {currentStepData.description}
        </p>

        {/* 按钮 */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleSkip}
            className="flex-1"
          >
            跳过引导
          </Button>
          <Button
            onClick={handleNext}
            className="flex-1 gap-2"
          >
            {currentStep === steps.length - 1 ? '完成' : '下一步'}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        {/* 步骤计数 */}
        <div className="text-center text-sm text-neutral-500 mt-4">
          {currentStep + 1} / {steps.length}
        </div>
      </div>
    </div>
  )
}

/**
 * 重置引导状态的工具函数
 * 用于开发测试或让用户重新观看引导
 */
export function resetOnboarding() {
  localStorage.removeItem(ONBOARDING_STORAGE_KEY)
}
