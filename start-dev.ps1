# Personal Chatbox 开发环境启动脚本
# 同时启动前端和后端

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Personal Chatbox 开发环境启动中..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查 Node.js
Write-Host "检查 Node.js 版本..." -ForegroundColor Yellow
node --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "错误: 未找到 Node.js，请先安装 Node.js" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 启动后端
Write-Host "启动后端服务 (端口 3001)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run server"

# 等待2秒让后端启动
Start-Sleep -Seconds 2

# 启动前端
Write-Host "启动前端服务 (端口 5173)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✅ 服务启动完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "前端地址: http://localhost:5173" -ForegroundColor Yellow
Write-Host "后端地址: http://localhost:3001" -ForegroundColor Yellow
Write-Host ""
Write-Host "登录信息:" -ForegroundColor Yellow
Write-Host "  邮箱: test@example.com" -ForegroundColor White
Write-Host "  密码: test@example.com123" -ForegroundColor White
Write-Host ""
Write-Host "提示: 关闭新打开的窗口即可停止服务" -ForegroundColor Gray
Write-Host ""

