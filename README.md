# AI Chat - Apple Design

一个基于Apple设计理念的AI对话应用前端界面，支持用户自主配置AI模型�?
## 设计理念

本项目严格遵循Apple Human Interface Guidelines的核心设计原则：

### Hierarchy（层次结构）
- 清晰的视觉层次，控件和界面元素提升并区分其下的内�?- 重要操作通过颜色和位置突出显�?- 使用阴影和模糊效果创造深度感

### Harmony（和谐）
- 统一的圆角设计（12px基准�?- 一致的间距系统�?px基准�?- 协调的色彩方�?- 流畅的动画效果和过渡

### Consistency（一致性）
- 统一的交互模�?- 标准的图标使用（Lucide Icons�?- 可预测的行为反馈
- 响应式布局适配

## 核心功能

### 1. �Ի�����
- ? ʵʱ AI �Ի�����
- ? ��ʽ�����ʾ�������ֶ�����?- ? ��Ϣ��ʷ��¼
- ? ��Ի�����?- ? �Ự�Զ��־û���ˢ�º�����Ի�?- ? �ֶ���ֹ���������״̬���?- ? ֧��չʾģ�� reasoning / ˼������
- ? ֧���ϴ�����������ǰԤ�����Ƴ�����Ϣ��չʾ�������أ�

### 2. ģ������
- ? ֧�ֶ��?AI �ṩ�̣�OpenAI��Anthropic��Google����ɽ���ۣ�
- ? ����л����Զ���ģ��?- ? API ��Կ����
- ? �������ڣ�Temperature��Max Tokens �ȣ�

### 3. �û�����### 3. 用户体验
- �?深色/浅色主题切换
- �?毛玻璃效果（Liquid Glass�?- �?流畅的动画过�?- �?响应式布局
- �?键盘快捷键（Enter发送）

## 技术栈

- **框架**: React 18
- **构建工具**: Vite
- **样式**: Tailwind CSS + 自定义CSS
- **UI组件**: shadcn/ui
- **图标**: Lucide Icons
- **动画**: CSS Animations + Framer Motion

## 安装和运�?
### 安装依赖
```bash
cd ai-chat-app
pnpm install
```

### 启动开发服务器
```bash
pnpm run dev
```

应用将在 `http://localhost:5173` 启动

### 构建生产版本
```bash
pnpm run build
```

## 项目结构

```
ai-chat-app/
├── public/              # 静态资�?├── src/
�?  ├── assets/         # 图片等资�?�?  ├── components/
�?  �?  └── ui/        # UI组件（shadcn/ui�?�?  ├── App.jsx        # 主应用组�?�?  ├── App.css        # 应用样式
�?  ├── main.jsx       # 入口文件
�?  └── index.css      # 全局样式
├── index.html         # HTML模板
├── package.json       # 项目配置
└── vite.config.js     # Vite配置
```

## 设计特色

### 色彩系统

#### 浅色模式
- 背景�?FFFFFF, #F5F5F7
- 文字�?1D1D1F, #6E6E73
- 主色调：#007AFF（Apple Blue�?- 边框�?D2D2D7

#### 深色模式
- 背景�?000000, #1C1C1E
- 文字�?FFFFFF, #EBEBF5
- 主色调：#0A84FF
- 边框�?38383A

### 毛玻璃效果（Liquid Glass�?- `backdrop-filter: blur(20px)`
- 半透明背景
- 应用于侧边栏和配置面�?- 创造深度和层次�?
### 动画效果
- 消息淡入动画（fadeIn�?- 打字指示器动画（typing�?- 配置面板滑入动画（slideIn�?- 按钮悬停效果
- 平滑的主题切�?
## 使用说明

### 创建新对�?1. 点击左上�?新对�?按钮
2. 新对话将出现在对话列表中
3. 系统自动切换到新对话并将历史记录保存到本�?
### 发送消�?1. 在底部输入框输入消息
2. 按Enter键或点击发送按�?3. 等待AI回复（带打字动画），如需中断可点击输入框旁的“停止”按�?4. 如果模型返回 reasoning，可展开回复中的「思考过程」查�?
### 配置AI模型
1. 点击右上角设置图�?2. 选择AI提供�?3. 选择具体模型
4. 输入API密钥
5. 调整参数（可选）
6. 点击"保存配置"

### 切换主题
- 点击左下角月�?太阳图标
- 即时切换深色/浅色模式
- 所有颜色自动适配

## 后续开发计�?
- [ ] 消息编辑和删�?- [ ] 对话导出功能
- [ ] 文件上传支持
- [ ] 语音输入
- [ ] 多语言支持

## 设计参�?
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Apple Design Resources](https://developer.apple.com/design/resources/)
- [SF Symbols](https://developer.apple.com/sf-symbols/)

## 许可�?
MIT License

## 作�?
AI-Life-system Project

## Recent Updates
- Added toolbar buttons for uploading files, images, and toggling deep thinking mode.
- Support drag-and-drop, picker, and paste-to-upload for images; drag-and-drop for other files.
- Deep thinking mode now enriches prompts and is visible in the chat transcript.
