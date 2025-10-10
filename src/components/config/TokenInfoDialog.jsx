import { X, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MAX_TOKENS_PROS_CONS } from '@/lib/modelTokenLimits'

/**
 * Token数优劣势说明对话框组件
 */
export function TokenInfoDialog({ isOpen, onClose, language = 'zh' }) {
  if (!isOpen) return null

  const content = MAX_TOKENS_PROS_CONS[language] || MAX_TOKENS_PROS_CONS.zh

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-content token-info-dialog" onClick={(e) => e.stopPropagation()}>
        {/* 头部 */}
        <div className="dialog-header">
          <div className="dialog-title">
            <Info className="w-5 h-5" />
            <h2>{language === 'zh' ? 'Token数设置说明' : 'Token Settings Guide'}</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* 内容 */}
        <div className="dialog-body">
          {/* 最大Token数 */}
          <section className="token-info-section">
            <h3 className="token-info-section-title">{content.maxTokens.title}</h3>
            
            <div className="token-info-pros-cons">
              <div className="token-info-pros">
                <h4 className="token-info-subtitle pros">{content.maxTokens.pros.title}</h4>
                <ul className="token-info-list">
                  {content.maxTokens.pros.items.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="token-info-cons">
                <h4 className="token-info-subtitle cons">{content.maxTokens.cons.title}</h4>
                <ul className="token-info-list">
                  {content.maxTokens.cons.items.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* 默认Token数 */}
          <section className="token-info-section">
            <h3 className="token-info-section-title">{content.defaultTokens.title}</h3>
            
            <div className="token-info-pros-cons">
              <div className="token-info-pros">
                <h4 className="token-info-subtitle pros">{content.defaultTokens.pros.title}</h4>
                <ul className="token-info-list">
                  {content.defaultTokens.pros.items.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="token-info-cons">
                <h4 className="token-info-subtitle cons">{content.defaultTokens.cons.title}</h4>
                <ul className="token-info-list">
                  {content.defaultTokens.cons.items.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* 建议 */}
          <section className="token-info-section recommendation">
            <h3 className="token-info-section-title">{content.recommendation.title}</h3>
            <div className="token-info-recommendation">
              {content.recommendation.content.split('\n').map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>
          </section>
        </div>

        {/* 底部按钮 */}
        <div className="dialog-footer">
          <Button onClick={onClose}>
            {language === 'zh' ? '我知道了' : 'Got it'}
          </Button>
        </div>
      </div>
    </div>
  )
}

