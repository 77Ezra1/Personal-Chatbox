# 下载并安装预编译的 better-sqlite3 二进制文件
Write-Host "正在为 better-sqlite3 下载预编译二进制文件..." -ForegroundColor Cyan

$nodeVersion = "127" # Node.js 22.x 使用 ABI 版本 127
$platform = "win32"
$arch = "x64"
$sqliteVersion = "9.6.0"

# 目标目录
$targetDir = "d:\Personal-Chatbox\node_modules\.pnpm\better-sqlite3@$sqliteVersion\node_modules\better-sqlite3"
$buildDir = Join-Path $targetDir "build\Release"

# 创建目录
New-Item -ItemType Directory -Force -Path $buildDir | Out-Null

# GitHub Release URL
$binaryName = "better_sqlite3.node"
$url = "https://github.com/WiseLibs/better-sqlite3/releases/download/v$sqliteVersion/better-sqlite3-v$sqliteVersion-napi-v6-$platform-$arch.tar.gz"

Write-Host "下载地址: $url" -ForegroundColor Gray

try {
    $tempFile = Join-Path $env:TEMP "better-sqlite3.tar.gz"
    $tempExtract = Join-Path $env:TEMP "better-sqlite3-extract"
    
    # 下载文件
    Write-Host "正在下载..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $url -OutFile $tempFile -UseBasicParsing
    
    # 解压 tar.gz (需要 tar 命令，Windows 10/11 自带)
    Write-Host "正在解压..." -ForegroundColor Yellow
    if (Test-Path $tempExtract) {
        Remove-Item $tempExtract -Recurse -Force
    }
    New-Item -ItemType Directory -Path $tempExtract | Out-Null
    
    tar -xzf $tempFile -C $tempExtract
    
    # 复制二进制文件
    $sourceBinary = Get-ChildItem -Path $tempExtract -Filter $binaryName -Recurse | Select-Object -First 1
    if ($sourceBinary) {
        Copy-Item $sourceBinary.FullName -Destination (Join-Path $buildDir $binaryName) -Force
        Write-Host "✅ better-sqlite3 二进制文件安装成功!" -ForegroundColor Green
        Write-Host "   位置: $buildDir\$binaryName" -ForegroundColor Gray
        
        # 清理临时文件
        Remove-Item $tempFile -Force
        Remove-Item $tempExtract -Recurse -Force
        
        return $true
    } else {
        throw "未找到二进制文件"
    }
} catch {
    Write-Host "Download failed: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Alternative options:" -ForegroundColor Yellow
    Write-Host "1. Check network connection" -ForegroundColor White
    Write-Host "2. Visit manually: https://github.com/WiseLibs/better-sqlite3/releases" -ForegroundColor White
    Write-Host "3. Continue using JSON Fallback mode (fully functional)" -ForegroundColor White
    return $false
}
