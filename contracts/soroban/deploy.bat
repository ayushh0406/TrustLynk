@echo off
REM Stellar Soroban deployment script for Insurance Portal (Windows)
REM This script builds and deploys the insurance portal smart contract to Stellar Testnet

echo 🚀 Starting Insurance Portal deployment to Stellar Testnet...

REM Check if stellar-cli (soroban) is installed
where soroban >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ soroban CLI not found. Please install it first:
    echo cargo install --locked soroban-cli
    exit /b 1
)

REM Build the contract
echo 📦 Building Soroban contract...
soroban contract build
if %ERRORLEVEL% neq 0 (
    echo ❌ Build failed!
    pause
    exit /b 1
)

REM Optimize the WASM file
echo ⚡ Optimizing WASM...
soroban contract optimize --wasm target/wasm32v1-none/release/insurance_portal.wasm
if %ERRORLEVEL% neq 0 (
    echo ❌ Optimization failed!
    pause
    exit /b 1
)

REM Check if default identity exists and create if not
echo 🔑 Checking for identity...
soroban keys address default >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Creating default identity...
    soroban keys generate default --network testnet
    echo Identity created!
)

REM Get identity address
echo 📋 Getting identity address...
for /f "tokens=*" %%i in ('soroban keys address default') do set IDENTITY_ADDRESS=%%i

if "%IDENTITY_ADDRESS%"=="" (
    echo ❌ Failed to get identity address!
    pause
    exit /b 1
)

echo Identity Address: %IDENTITY_ADDRESS%

REM Fund the account on testnet
echo 💰 Funding account on testnet (this may take a moment)...
curl "https://friendbot.stellar.org?addr=%IDENTITY_ADDRESS%"
echo.

REM Wait a moment for friendbot to process
timeout /t 3 /nobreak >nul

REM Deploy the contract
echo 🚀 Deploying contract to Stellar Testnet...
for /f "tokens=*" %%i in ('soroban contract deploy --wasm target/wasm32v1-none/release/insurance_portal.wasm --source default --network testnet') do set CONTRACT_ID=%%i

if "%CONTRACT_ID%"=="" (
    echo ❌ Deployment failed!
    pause
    exit /b 1
)

echo ✅ Contract deployed successfully!
echo Contract ID: %CONTRACT_ID%

REM Save contract ID to file
echo %CONTRACT_ID% > contract-id.txt
echo 📝 Contract ID saved to contract-id.txt

REM Initialize the contract
echo 🔧 Initializing contract...
soroban contract invoke --id %CONTRACT_ID% --source default --network testnet -- initialize --admin %IDENTITY_ADDRESS%
if %ERRORLEVEL% neq 0 (
    echo ⚠️ Initialization may have failed, but contract is deployed.
)

echo.
echo ===================================
echo 📋 Deployment Summary
echo ===================================
echo Contract ID: %CONTRACT_ID%
echo Admin Address: %IDENTITY_ADDRESS%
echo Network: Stellar Testnet
echo ===================================
echo.
echo ✅ NEXT STEPS:
echo 1. Copy the Contract ID above
echo 2. Update frontend/lib/blockchain.ts:
echo    export const CONTRACT_ID = "%CONTRACT_ID%"
echo 3. Install frontend dependencies: npm install
echo 4. Run the frontend: npm run dev
echo.
echo 🎉 Deployment complete!
pause
