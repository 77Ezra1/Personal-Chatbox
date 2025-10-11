# Git 克隆加速指南

如果您在克隆 AI-Life-system 项目时遇到速度慢的问题,可以尝试以下方法。

---

## 🚀 方法1: 浅克隆 (推荐)

浅克隆只下载最新的提交历史,大幅减少下载量。

```bash
# 只克隆最新的提交
git clone --depth 1 https://github.com/77Ezra1/AI-Life-system.git

# 进入项目目录
cd AI-Life-system
```

**优点**:
- ✅ 速度快 5-10 倍
- ✅ 下载量小
- ✅ 适合只需要使用项目的场景

**缺点**:
- ⚠️ 没有完整的Git历史记录
- ⚠️ 不适合需要查看历史提交的场景

**如果后续需要完整历史**:
```bash
# 转换为完整克隆
git fetch --unshallow
```

---

## 🌐 方法2: 使用镜像加速 (中国大陆用户推荐)

### 2.1 使用 Gitee 镜像

如果项目在 Gitee 有镜像:

```bash
# 从 Gitee 克隆
git clone https://gitee.com/[镜像地址]/AI-Life-system.git
```

### 2.2 使用 GitHub 代理

#### FastGit (已停止服务)
```bash
# FastGit 已不可用
```

#### GitHub Proxy
```bash
# 使用 ghproxy.com
git clone https://ghproxy.com/https://github.com/77Ezra1/AI-Life-system.git
```

#### Gitclone
```bash
# 使用 gitclone.com
git clone https://gitclone.com/github.com/77Ezra1/AI-Life-system.git
```

**注意**: 代理服务可能不稳定,建议优先使用其他方法。

---

## 🔧 方法3: 配置 Git 代理

如果您有代理服务(如 VPN、Clash 等):

### HTTP/HTTPS 代理

```bash
# 设置全局代理 (假设代理在 127.0.0.1:7890)
git config --global http.proxy http://127.0.0.1:7890
git config --global https.proxy http://127.0.0.1:7890

# 克隆项目
git clone https://github.com/77Ezra1/AI-Life-system.git

# 克隆完成后取消代理
git config --global --unset http.proxy
git config --global --unset https.proxy
```

### SOCKS5 代理

```bash
# 设置 SOCKS5 代理
git config --global http.proxy socks5://127.0.0.1:7890
git config --global https.proxy socks5://127.0.0.1:7890

# 克隆项目
git clone https://github.com/77Ezra1/AI-Life-system.git

# 取消代理
git config --global --unset http.proxy
git config --global --unset https.proxy
```

### 只对 GitHub 设置代理

```bash
# 只对 GitHub 设置代理,不影响其他仓库
git config --global http.https://github.com.proxy http://127.0.0.1:7890

# 取消
git config --global --unset http.https://github.com.proxy
```

---

## 📦 方法4: 下载 ZIP 压缩包

最简单但不推荐的方法:

1. 访问: https://github.com/77Ezra1/AI-Life-system
2. 点击绿色的 **Code** 按钮
3. 选择 **Download ZIP**
4. 下载完成后解压

**缺点**:
- ❌ 没有 Git 版本控制
- ❌ 无法使用 `git pull` 更新
- ❌ 无法提交代码

**适用场景**: 只想快速试用项目

---

## 🛠️ 方法5: 使用 SSH 协议

SSH 协议有时比 HTTPS 更快:

### 5.1 配置 SSH 密钥

```bash
# 生成 SSH 密钥
ssh-keygen -t ed25519 -C "your_email@example.com"

# 查看公钥
cat ~/.ssh/id_ed25519.pub
```

### 5.2 添加到 GitHub

1. 复制公钥内容
2. 访问 GitHub → Settings → SSH and GPG keys
3. 点击 **New SSH key**
4. 粘贴公钥并保存

### 5.3 使用 SSH 克隆

```bash
# 使用 SSH 协议克隆
git clone git@github.com:77Ezra1/AI-Life-system.git
```

---

## ⚡ 方法6: 增加 Git 缓冲区

```bash
# 增加 Git 缓冲区大小
git config --global http.postBuffer 524288000  # 500MB

# 关闭压缩
git config --global core.compression 0

# 克隆项目
git clone https://github.com/77Ezra1/AI-Life-system.git

# 恢复默认设置
git config --global --unset http.postBuffer
git config --global --unset core.compression
```

---

## 🌍 方法7: 使用 GitHub CLI

GitHub CLI 有时比 git 命令更快:

### 7.1 安装 GitHub CLI

**Mac**:
```bash
brew install gh
```

**Windows**:
```bash
winget install --id GitHub.cli
```

**Linux**:
```bash
# Debian/Ubuntu
sudo apt install gh

# Fedora
sudo dnf install gh
```

### 7.2 克隆项目

```bash
# 使用 gh 克隆
gh repo clone 77Ezra1/AI-Life-system
```

---

## 📊 速度对比

| 方法 | 预计速度 | 难度 | 推荐度 |
|------|---------|------|--------|
| 浅克隆 | ⭐⭐⭐⭐⭐ | 简单 | ⭐⭐⭐⭐⭐ |
| 代理 | ⭐⭐⭐⭐ | 中等 | ⭐⭐⭐⭐ |
| SSH | ⭐⭐⭐⭐ | 中等 | ⭐⭐⭐⭐ |
| 镜像 | ⭐⭐⭐⭐ | 简单 | ⭐⭐⭐ |
| ZIP下载 | ⭐⭐⭐ | 简单 | ⭐⭐ |
| 增加缓冲 | ⭐⭐⭐ | 简单 | ⭐⭐ |

---

## 🎯 推荐方案

### 对于中国大陆用户:

**方案A: 浅克隆 + 代理** (最推荐)
```bash
# 1. 设置代理
git config --global http.proxy http://127.0.0.1:7890

# 2. 浅克隆
git clone --depth 1 https://github.com/77Ezra1/AI-Life-system.git

# 3. 取消代理
git config --global --unset http.proxy
```

**方案B: 使用 GitHub Proxy**
```bash
git clone --depth 1 https://ghproxy.com/https://github.com/77Ezra1/AI-Life-system.git
```

### 对于海外用户:

**直接浅克隆即可**
```bash
git clone --depth 1 https://github.com/77Ezra1/AI-Life-system.git
```

---

## 🔍 诊断克隆速度慢的原因

### 检查网络连接

```bash
# 测试 GitHub 连接速度
curl -o /dev/null -s -w "Time: %{time_total}s\n" https://github.com

# 测试 DNS 解析
nslookup github.com
```

### 查看克隆进度

```bash
# 显示详细进度
GIT_TRACE=1 git clone https://github.com/77Ezra1/AI-Life-system.git
```

---

## ⚠️ 常见问题

### Q1: 克隆到一半失败了怎么办?

**解决方案**:
```bash
# 进入未完成的目录
cd AI-Life-system

# 继续克隆
git fetch --all
```

### Q2: 代理设置后还是很慢?

**可能原因**:
1. 代理端口不正确
2. 代理服务未启动
3. 代理不支持 Git 流量

**解决方案**:
```bash
# 检查代理是否工作
curl -x http://127.0.0.1:7890 https://www.google.com

# 尝试不同的代理端口
git config --global http.proxy http://127.0.0.1:7891
```

### Q3: SSH 克隆报错 Permission denied?

**解决方案**:
```bash
# 测试 SSH 连接
ssh -T git@github.com

# 如果失败,检查 SSH 密钥是否添加到 GitHub
```

---

## 📝 克隆后的下一步

克隆完成后,继续按照 [GETTING_STARTED.md](./GETTING_STARTED.md) 进行:

```bash
# 1. 进入项目目录
cd AI-Life-system

# 2. 安装依赖
npm install --legacy-peer-deps

# 3. 启动项目
npm run start:backend  # 终端1
npm run dev            # 终端2
```

---

## 💡 额外提示

### 克隆大型仓库的最佳实践

1. **使用浅克隆**: 除非需要完整历史
2. **使用稳定网络**: 避免在移动网络下克隆
3. **避免高峰期**: 选择非高峰时段克隆
4. **使用有线连接**: WiFi 可能不稳定

### 如果经常需要克隆 GitHub 项目

**永久配置代理** (如果有稳定代理):
```bash
# 在 ~/.gitconfig 中添加
[http]
    proxy = http://127.0.0.1:7890
[https]
    proxy = http://127.0.0.1:7890
```

或者**使用 SSH 协议**:
```bash
# 配置 SSH 后,默认使用 SSH 克隆
git config --global url."git@github.com:".insteadOf "https://github.com/"
```

---

## 🎉 总结

**最快的克隆方法**:
```bash
# 组合使用浅克隆 + 代理
git config --global http.proxy http://127.0.0.1:7890
git clone --depth 1 https://github.com/77Ezra1/AI-Life-system.git
git config --global --unset http.proxy
```

**预计时间**:
- 无优化: 5-10 分钟
- 浅克隆: 1-2 分钟
- 浅克隆 + 代理: 30-60 秒

**如果还是很慢**: 考虑直接下载 ZIP 压缩包,虽然失去了 Git 功能,但可以快速开始使用项目。

---

**祝您克隆顺利!** 🚀

如有问题,欢迎反馈!

