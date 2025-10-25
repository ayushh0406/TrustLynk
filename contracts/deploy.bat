@echo off
REM Deploy script for Insurance Platform Move contract (Windows)

echo 🚀 Deploying Insurance Platform Move Contract to Aptos Devnet
echo ============================================================

REM Check if aptos CLI is installed
where aptos >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ❌ Aptos CLI is not installed. Please install it first.
    echo Visit: https://aptos.dev/tools/aptos-cli
    exit /b 1
)

REM Create devnet profile if it doesn't exist
echo 📋 Setting up Aptos devnet profile...
aptos init --profile devnet --network devnet 2>nul || echo Profile already exists

REM Compile the Move contract
echo 🔨 Compiling Move contract...
aptos move compile --profile devnet
if %ERRORLEVEL% neq 0 (
    echo ❌ Compilation failed
    exit /b 1
)

REM Deploy the contract
echo 📤 Publishing contract to devnet...
aptos move publish --profile devnet --assume-yes
if %ERRORLEVEL% neq 0 (
    echo ❌ Deployment failed
    exit /b 1
)

echo ✅ Contract deployed successfully!
echo.
echo 🔍 To get your contract address, run:
echo    aptos account lookup-address --profile devnet
echo.
echo 📋 Next steps:
echo 1. Update CONTRACT_ADDRESS in frontend/lib/blockchain.ts
echo 2. Run the frontend with npm run dev
echo 3. Connect Petra wallet and test the functionality
