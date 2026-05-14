@echo off
chcp 65001 >nul
title 声影汇 SoundFlix 服务器
echo ========================================
echo   声影汇 SoundFlix 服务器启动中...
echo ========================================
echo.

set PATH=D:\影音\node-v20.11.0-win-x64;%PATH%
set PORT=80

cd /d D:\影音

echo [1/2] 检查前端构建...
if not exist "dist\index.html" (
    echo 正在构建前端...
    call npm run build
    echo.
)

echo [2/2] 启动服务器...
echo.
npx tsx server/server.ts

pause
