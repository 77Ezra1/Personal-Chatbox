@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM ========================================
REM Personal Chatbox 一键部署脚本 (Windows)
REM ========================================
REM 
REM 功能:
REM - 检查系统环境
REM - 安装项目依赖
REM - 配置环境变量
REM - 初始化数据库
REM - 启动前后端服务
REM 
REM 使用方法:
REM   双击运行 deploy.bat
REM   或在命令提示符中执行: deploy.bat
REM ========================================

echo.
echo ========================================
echo   Personal Chatbox 一键部署脚本
echo ========================================
echo.

REM 检查 Node.js
echo [INFO] 检查 Node.js 环境...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] 未检测到 Node.js，请先安装 Node.js 18.0.0 或更高版本
    echo [INFO] 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo [SUCCESS] Node.js 版本: %NODE_VERSION% ✓
echo.

REM 检查包管理器
echo [INFO] 检查包管理器...
where pnpm >nul 2>nul
if %errorlevel% equ 0 (
    set PACKAGE_MANAGER=pnpm
    for /f "tokens=*" %%i in ('pnpm -v') do set PKG_VERSION=%%i
    echo [SUCCESS] 使用 pnpm v!PKG_VERSION! ✓
) else (
    where npm >nul 2>nul
    if %errorlevel% equ 0 (
        set PACKAGE_MANAGER=npm
        for /f "tokens=*" %%i in ('npm -v') do set PKG_VERSION=%%i
        echo [SUCCESS] 使用 npm v!PKG_VERSION! ✓
    ) else (
        echo [ERROR] 未检测到 npm 或 pnpm
        pause
        exit /b 1
    )
)
echo.

REM 检查项目目录
echo [INFO] 检查项目目录...
if not exist "package.json" (
    echo [ERROR] 未找到 package.json，请确保在项目根目录运行此脚本
    pause
    exit /b 1
)
echo [SUCCESS] 项目目录验证通过 ✓
echo.

REM 安装依赖
echo [INFO] 安装项目依赖...
if "%PACKAGE_MANAGER%"=="pnpm" (
    echo [INFO] 执行: pnpm install
    call pnpm install
) else (
    echo [INFO] 执行: npm install --legacy-peer-deps
    call npm install --legacy-peer-deps
)

if %errorlevel% neq 0 (
    echo [ERROR] 依赖安装失败
    pause
    exit /b 1
)
echo [SUCCESS] 依赖安装完成 ✓
echo.

REM 配置环境变量
echo [INFO] 配置环境变量...
if exist ".env" (
    echo [WARNING] .env 文件已存在
    set /p OVERWRITE="是否要重新生成 .env 文件? (y/N): "
    if /i not "!OVERWRITE!"=="y" (
        echo [INFO] 保留现有 .env 文件
        goto skip_env
    )
)

if not exist ".env.example" (
    echo [ERROR] 未找到 .env.example 文件
    pause
    exit /b 1
)

copy /y .env.example .env >nul
echo [SUCCESS] .env 文件创建成功 ✓
echo.
echo [WARNING] 请编辑 .env 文件，填入必要的 API 密钥:
echo   - DEEPSEEK_API_KEY (必需，用于 AI 对话)
echo   - BRAVE_SEARCH_API_KEY (可选，用于搜索服务)
echo   - GITHUB_TOKEN (可选，用于 GitHub 集成)
echo.
set /p EDIT_ENV="是否现在编辑 .env 文件? (y/N): "
if /i "!EDIT_ENV!"=="y" (
    notepad .env
) else (
    echo [WARNING] 请稍后手动编辑 .env 文件
)

:skip_env
echo.

REM 初始化数据库
echo [INFO] 初始化数据库...
if exist "data\app.db" (
    echo [WARNING] 数据库文件已存在，跳过初始化
) else (
    if not exist "server\db\init.cjs" (
        echo [ERROR] 未找到数据库初始化脚本
        pause
        exit /b 1
    )
    
    node server\db\init.cjs
    if %errorlevel% neq 0 (
        echo [ERROR] 数据库初始化失败
        pause
        exit /b 1
    )
    echo [SUCCESS] 数据库初始化完成 ✓
)
echo.

REM 检查端口占用
echo [INFO] 检查端口占用...
netstat -ano | findstr ":3001" | findstr "LISTENING" >nul 2>nul
if %errorlevel% equ 0 (
    echo [WARNING] 端口 3001 已被占用
    set /p KILL_PORT="是否要停止占用端口的进程? (y/N): "
    if /i "!KILL_PORT!"=="y" (
        for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001" ^| findstr "LISTENING"') do (
            taskkill /F /PID %%a >nul 2>nul
        )
        echo [SUCCESS] 已停止占用端口的进程
        timeout /t 2 /nobreak >nul
    ) else (
        echo [ERROR] 请手动停止占用端口 3001 的进程后重试
        pause
        exit /b 1
    )
)

netstat -ano | findstr ":5173" | findstr "LISTENING" >nul 2>nul
if %errorlevel% equ 0 (
    echo [WARNING] 端口 5173 已被占用
    set /p KILL_PORT="是否要停止占用端口的进程? (y/N): "
    if /i "!KILL_PORT!"=="y" (
        for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173" ^| findstr "LISTENING"') do (
            taskkill /F /PID %%a >nul 2>nul
        )
        echo [SUCCESS] 已停止占用端口的进程
        timeout /t 2 /nobreak >nul
    ) else (
        echo [ERROR] 请手动停止占用端口 5173 的进程后重试
        pause
        exit /b 1
    )
)
echo.

REM 启动后端服务
echo [INFO] 启动后端服务...
if "%PACKAGE_MANAGER%"=="pnpm" (
    start /b cmd /c "pnpm run server > backend.log 2>&1"
) else (
    start /b cmd /c "npm run server > backend.log 2>&1"
)

echo [INFO] 后端服务启动中...
timeout /t 3 /nobreak >nul

REM 简单检查后端是否启动
curl -s http://localhost:3001/api/auth/verify >nul 2>nul
if %errorlevel% equ 0 (
    echo [SUCCESS] 后端服务启动成功 ✓
    echo [INFO] 后端地址: http://localhost:3001
) else (
    echo [WARNING] 后端服务可能未正常启动，请查看日志: backend.log
)
echo.

REM 启动前端服务
echo [INFO] 启动前端服务...
if "%PACKAGE_MANAGER%"=="pnpm" (
    start /b cmd /c "pnpm run dev > frontend.log 2>&1"
) else (
    start /b cmd /c "npm run dev > frontend.log 2>&1"
)

echo [INFO] 前端服务启动中...
timeout /t 5 /nobreak >nul
echo [SUCCESS] 前端服务启动成功 ✓
echo [INFO] 前端地址: http://localhost:5173
echo.

REM 打印部署信息
echo ========================================
echo   部署完成！
echo ========================================
echo.
echo 📝 访问地址:
echo   前端: http://localhost:5173
echo   后端: http://localhost:3001
echo.
echo 📊 查看日志:
echo   后端: type backend.log
echo   前端: type frontend.log
echo.
echo 🛑 停止服务:
echo   关闭命令提示符窗口
echo   或执行: taskkill /F /IM node.exe
echo.
echo 🔧 管理命令:
echo   查看邀请码: node scripts\manage-invite-codes.cjs list
echo   添加邀请码: node scripts\manage-invite-codes.cjs add CODE 10
echo.
echo ✨ 祝您使用愉快！
echo.
echo 按任意键在浏览器中打开应用...
pause >nul

REM 在浏览器中打开应用
start http://localhost:5173

endlocal

