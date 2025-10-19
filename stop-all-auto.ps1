# ====================================
# Personal Chatbox 停止所有服务
# ====================================

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Personal Chatbox 停止服务" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# 查找并停止 Node.js 进程 (后端)
Write-Host "🔍 查找后端服务进程..." -ForegroundColor Yellow
$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue | Where-Object { 
    $_.CommandLine -like "*server/index.cjs*" 
}

if ($nodeProcesses) {
    foreach ($proc in $nodeProcesses) {
        Write-Host "  ⏹️  停止后端进程 (PID: $($proc.Id))..." -ForegroundColor Yellow
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    }
    Write-Host "  ✅ 后端服务已停止" -ForegroundColor Green
} else {
    Write-Host "  ℹ️  未找到运行中的后端服务" -ForegroundColor Gray
}

# 停止占用 3001 端口的进程
Write-Host "🔍 检查端口 3001..." -ForegroundColor Yellow
$port3001 = Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue
if ($port3001) {
    Write-Host "  ⏹️  停止占用端口 3001 的进程 (PID: $($port3001.OwningProcess))..." -ForegroundColor Yellow
    Stop-Process -Id $port3001.OwningProcess -Force -ErrorAction SilentlyContinue
    Write-Host "  ✅ 端口 3001 已释放" -ForegroundColor Green
} else {
    Write-Host "  ℹ️  端口 3001 未被占用" -ForegroundColor Gray
}

# 停止占用 5173 端口的进程 (前端)
Write-Host "🔍 检查端口 5173..." -ForegroundColor Yellow
$port5173 = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue
if ($port5173) {
    Write-Host "  ⏹️  停止占用端口 5173 的进程 (PID: $($port5173.OwningProcess))..." -ForegroundColor Yellow
    Stop-Process -Id $port5173.OwningProcess -Force -ErrorAction SilentlyContinue
    Write-Host "  ✅ 端口 5173 已释放" -ForegroundColor Green
} else {
    Write-Host "  ℹ️  端口 5173 未被占用" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "✅ 所有服务已停止" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "按任意键退出..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
