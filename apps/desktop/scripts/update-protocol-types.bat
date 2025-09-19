@echo off
REM 更新 protocol 类型的脚本 (Windows 版本)

setlocal enabledelayedexpansion

echo 🔄 更新 Protocol TypeScript 类型...

REM 获取项目根目录
set "SCRIPT_DIR=%~dp0"
set "PROJECT_ROOT=%SCRIPT_DIR%..\..\..\"
set "DESKTOP_ROOT=%SCRIPT_DIR%.."
set "OUTPUT_DIR=%DESKTOP_ROOT%\src\shared\types"

echo 📁 项目根目录: %PROJECT_ROOT%
echo 📁 输出目录: %OUTPUT_DIR%

REM 确保输出目录存在
if not exist "%OUTPUT_DIR%\protocol" (
    mkdir "%OUTPUT_DIR%\protocol"
)

REM 检查 protocol-ts crate 是否存在
if not exist "%PROJECT_ROOT%\crates\protocol-ts" (
    echo ❌ 错误: 找不到 protocol-ts crate
    echo    请确保在正确的项目目录中运行此脚本
    pause
    exit /b 1
)

REM 检查是否已安装 prettier
set "PRETTIER_PATH=%DESKTOP_ROOT%\node_modules\.bin\prettier.cmd"
if not exist "%PRETTIER_PATH%" (
    echo ⚠️  警告: 找不到 prettier，将跳过代码格式化
    set "PRETTIER_PATH="
)

REM 运行 protocol-ts 生成器
echo 📦 运行 protocol-ts 生成器...
cd /d "%PROJECT_ROOT%\crates\protocol-ts"

if defined PRETTIER_PATH (
    cargo run --bin codex-protocol-ts -- --out "%OUTPUT_DIR%\protocol" --prettier "%PRETTIER_PATH%"
) else (
    cargo run --bin codex-protocol-ts -- --out "%OUTPUT_DIR%\protocol"
)

if %ERRORLEVEL% NEQ 0 (
    echo ❌ 类型生成失败
    pause
    exit /b 1
)

echo ✅ Protocol 类型更新完成!
echo 📁 生成的文件位于: %OUTPUT_DIR%\protocol\

echo.
echo 💡 提示:
echo    - 请检查生成的类型文件是否正确
echo    - 如需重新导出特定类型，请更新 src\shared\types\index.ts
echo    - 生成的类型会自动覆盖 protocol.ts 中的手动定义

pause