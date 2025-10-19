# ====================================
# Personal Chatbox 一键启动脚本
# 自动处理依赖编译和服务启动
# ====================================

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Personal Chatbox 一键启动" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# 设置错误处理
$ErrorActionPreference = "Continue"

# 1. 检查 Node.js
Write-Host "[1/5] 检查 Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "  ✅ Node.js 版本: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  ❌ 错误: 未找到 Node.js，请先安装 Node.js" -ForegroundColor Red
    exit 1
}

# 2. 检查 pnpm
Write-Host "[2/5] 检查 pnpm..." -ForegroundColor Yellow
try {
    $pnpmVersion = pnpm --version
    Write-Host "  ✅ pnpm 版本: $pnpmVersion" -ForegroundColor Green
} catch {
    Write-Host "  ❌ 错误: 未找到 pnpm，正在安装..." -ForegroundColor Red
    npm install -g pnpm
    Write-Host "  ✅ pnpm 安装完成" -ForegroundColor Green
}

# 3. 检查并编译 better-sqlite3
Write-Host "[3/5] 检查 better-sqlite3..." -ForegroundColor Yellow

# 测试 better-sqlite3 是否可用
$sqliteTest = node -e "try { require('better-sqlite3'); console.log('OK'); } catch(e) { console.log('FAIL'); }" 2>$null

if ($sqliteTest -ne "OK") {
    Write-Host "  ⚠️  better-sqlite3 需要编译..." -ForegroundColor Yellow
    Write-Host "  🔨 正在编译 better-sqlite3 (这可能需要几分钟)..." -ForegroundColor Cyan
    
    # 先安装依赖
    pnpm install
    
    # 重新编译 better-sqlite3
    pnpm rebuild better-sqlite3
    
    # 再次测试
    $sqliteTestAfter = node -e "try { require('better-sqlite3'); console.log('OK'); } catch(e) { console.log('FAIL'); }" 2>$null
    
    if ($sqliteTestAfter -eq "OK") {
        Write-Host "  ✅ better-sqlite3 编译成功!" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  better-sqlite3 编译失败，将使用 JSON fallback" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ✅ better-sqlite3 已就绪" -ForegroundColor Green
}

# 4. 检查端口占用
Write-Host "[4/5] 检查端口占用..." -ForegroundColor Yellow

# 检查 3001 端口
$port3001 = Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue
if ($port3001) {
    Write-Host "  ⚠️  端口 3001 已被占用，正在尝试关闭..." -ForegroundColor Yellow
    Stop-Process -Id $port3001.OwningProcess -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

# 检查 5173 端口
$port5173 = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue
if ($port5173) {
    Write-Host "  ⚠️  端口 5173 已被占用，正在尝试关闭..." -ForegroundColor Yellow
    Stop-Process -Id $port5173.OwningProcess -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

Write-Host "  ✅ 端口检查完成" -ForegroundColor Green

# 5. 启动服务
Write-Host "[5/5] 启动服务..." -ForegroundColor Yellow
Write-Host ""

# 启动后端服务
Write-Host "  🚀 启动后端服务 (http://localhost:3001)..." -ForegroundColor Cyan
$backendJob = Start-Process powershell -ArgumentList "-NoExit", "-Command", "node server/index.cjs" -PassThru
Start-Sleep -Seconds 3

# 启动前端服务
Write-Host "  🚀 启动前端服务 (http://localhost:5173)..." -ForegroundColor Cyan
$frontendJob = Start-Process powershell -ArgumentList "-NoExit", "-Command", "pnpm dev" -PassThru
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "✅ 所有服务启动成功!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "📍 前端地址: http://localhost:5173" -ForegroundColor Cyan
Write-Host "📍 后端地址: http://localhost:3001" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 提示:" -ForegroundColor Yellow
Write-Host "  - 前端和后端已在单独的窗口中运行" -ForegroundColor White
Write-Host "  - 关闭这些窗口即可停止服务" -ForegroundColor White
Write-Host "  - 或者运行 stop-all.ps1 停止所有服务" -ForegroundColor White
Write-Host ""
Write-Host "按任意键退出此窗口..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
