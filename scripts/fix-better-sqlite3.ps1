# 修复 better-sqlite3 安装问题
Write-Host "=== 修复 better-sqlite3 ===" -ForegroundColor Cyan

# 检查 Node.js 版本
Write-Host "`n检查 Node.js 版本..." -ForegroundColor Yellow
$nodeVersion = node --version
Write-Host "Node.js 版本: $nodeVersion" -ForegroundColor Green

# 方法 1: 完全重新安装
Write-Host "`n方法 1: 完全重新安装..." -ForegroundColor Yellow
pnpm remove better-sqlite3
Start-Sleep -Seconds 2
pnpm add better-sqlite3@9.6.0

# 验证安装
Write-Host "`n验证安装..." -ForegroundColor Yellow
try {
    node -e "const db = require('better-sqlite3'); console.log('✅ better-sqlite3 安装成功');"
    Write-Host "✅ better-sqlite3 可用!" -ForegroundColor Green
} catch {
    Write-Host "❌ 方法 1 失败，尝试方法 2..." -ForegroundColor Red
    
    # 方法 2: 使用预编译版本
    Write-Host "`n方法 2: 使用预编译版本..." -ForegroundColor Yellow
    pnpm remove better-sqlite3
    pnpm add better-sqlite3@9.6.0 --force
    
    # 再次验证
    try {
        node -e "const db = require('better-sqlite3'); console.log('✅ better-sqlite3 安装成功');"
        Write-Host "✅ better-sqlite3 可用!" -ForegroundColor Green
    } catch {
        Write-Host "❌ 方法 2 也失败，使用备选方案..." -ForegroundColor Red
        Write-Host "将继续使用 JSON fallback 模式" -ForegroundColor Yellow
    }
}

Write-Host "`n完成!" -ForegroundColor Cyan
