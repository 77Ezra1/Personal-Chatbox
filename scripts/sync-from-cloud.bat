@echo off
REM 从云盘恢复数据库（Windows）

setlocal enabledelayedexpansion

echo.
echo ☁️  从云盘获取备份...
echo.

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
    echo ❌ 未检测到云盘备份，请设置环境变量 CHATBOX_CLOUD_BACKUP
    echo.
    echo 示例：
    echo set CHATBOX_CLOUD_BACKUP=%%OneDrive%%\ChatboxBackup
    exit /b 1
)

set CLOUD_BACKUP=%CLOUD_PATH%\chatbox-latest.db

REM 检查云盘备份是否存在
if not exist "%CLOUD_BACKUP%" (
    echo ❌ 云盘中没有找到备份文件
    echo    路径: %CLOUD_BACKUP%
    echo.
    echo 请先在另一台电脑上运行: npm run sync:push
    exit /b 1
)

REM 创建本地备份目录
if not exist "data\backups" mkdir "data\backups"

REM 生成带时间戳的文件名
for /f "tokens=1-6 delims=/:. " %%a in ("%date% %time%") do (
    set TIMESTAMP=%%c-%%a-%%b%%T%%d-%%e-%%f
)

set LOCAL_BACKUP=data\backups\app-%TIMESTAMP%.db

REM 复制到本地
copy /Y "%CLOUD_BACKUP%" "%LOCAL_BACKUP%" >nul

REM 显示云盘备份信息
for %%A in ("%CLOUD_BACKUP%") do set FILE_SIZE=%%~zA
set /a FILE_SIZE_KB=%FILE_SIZE%/1024

echo.
echo ✅ 从云盘下载备份成功
echo.
echo 📁 云盘备份信息:
for %%A in ("%CLOUD_BACKUP%") do echo    修改时间: %%~tA
echo    文件大小: %FILE_SIZE_KB% KB
echo.

REM 恢复数据库
echo 🔄 正在恢复数据库...
call npm run db:restore %TIMESTAMP% >nul 2>&1

echo.
echo ✅ 数据库恢复完成
echo.
echo 💡 现在可以启动服务器: npm run dev
echo.

endlocal
