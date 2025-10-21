@echo off
REM 自动备份并同步到云盘（Windows）

setlocal enabledelayedexpansion

echo.
echo 📦 开始备份数据库...
echo.

REM 创建备份
call npm run db:backup >nul 2>&1

REM 获取最新备份文件
for /f "delims=" %%i in ('dir /b /o-d data\backups\app-*.db 2^>nul') do (
    set LATEST_BACKUP=%%i
    goto :found
)

echo ❌ 没有找到备份文件
exit /b 1

:found

REM 检测云盘路径
set CLOUD_PATH=

REM 检查环境变量
if defined CHATBOX_CLOUD_BACKUP (
    set CLOUD_PATH=%CHATBOX_CLOUD_BACKUP%
) else if exist "%OneDrive%\ChatboxBackup" (
    set CLOUD_PATH=%OneDrive%\ChatboxBackup
) else if exist "%UserProfile%\OneDrive\ChatboxBackup" (
    set CLOUD_PATH=%UserProfile%\OneDrive\ChatboxBackup
) else if exist "%UserProfile%\Google Drive\ChatboxBackup" (
    set CLOUD_PATH=%UserProfile%\Google Drive\ChatboxBackup
) else if exist "%UserProfile%\Dropbox\ChatboxBackup" (
    set CLOUD_PATH=%UserProfile%\Dropbox\ChatboxBackup
) else (
    echo ❌ 未检测到云盘，请设置环境变量 CHATBOX_CLOUD_BACKUP
    echo.
    echo 示例：
    echo set CHATBOX_CLOUD_BACKUP=%%OneDrive%%\ChatboxBackup
    exit /b 1
)

REM 创建云盘目录（如果不存在）
if not exist "%CLOUD_PATH%" mkdir "%CLOUD_PATH%"

REM 复制到云盘
copy /Y "data\backups\%LATEST_BACKUP%" "%CLOUD_PATH%\chatbox-latest.db" >nul

REM 显示信息
echo.
echo ✅ 备份成功同步到云盘
echo.
echo 📁 备份信息:
echo    文件: %LATEST_BACKUP%

REM 获取文件大小
for %%A in ("data\backups\%LATEST_BACKUP%") do set FILE_SIZE=%%~zA
set /a FILE_SIZE_KB=%FILE_SIZE%/1024
echo    大小: %FILE_SIZE_KB% KB
echo    云盘路径: %CLOUD_PATH%\chatbox-latest.db
echo.
echo 💡 在另一台电脑上运行: npm run sync:pull
echo.

endlocal
