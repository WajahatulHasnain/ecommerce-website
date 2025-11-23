@echo off
echo 🔍 Checking deployment prerequisites...

REM Check if required files exist
if not exist "app.yaml" (
    echo ❌ app.yaml not found!
    pause
    exit /b 1
)

if not exist "package.json" (
    echo ❌ package.json not found!
    pause
    exit /b 1
)

if not exist "backend" (
    echo ❌ backend directory not found!
    pause
    exit /b 1
)

if not exist "frontend" (
    echo ❌ frontend directory not found!
    pause
    exit /b 1
)

echo ✅ All required files and directories found

REM Check if gcloud is installed
gcloud version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Google Cloud CLI not installed!
    echo 📥 Please install from: https://cloud.google.com/sdk/docs/install
    pause
    exit /b 1
)

echo ✅ Google Cloud CLI is installed

REM Check MongoDB URI in app.yaml
findstr "mongodb+srv://username:password" app.yaml >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠️  WARNING: Please update MongoDB URI in app.yaml with your actual credentials
)

findstr "your-super-secret-jwt-key-here" app.yaml >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠️  WARNING: Please update JWT_SECRET in app.yaml with a secure secret
)

echo.
echo 🚀 Ready to deploy!
echo 📝 Run: gcloud app deploy
echo.
pause