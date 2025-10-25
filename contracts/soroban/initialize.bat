@echo off
REM Manual contract initialization script for Windows

echo 🔧 Initializing Insurance Portal Contract...

REM Read contract ID from file
if not exist contract-id.txt (
    echo ❌ contract-id.txt not found! Please deploy the contract first.
    pause
    exit /b 1
)

set /p CONTRACT_ID=<contract-id.txt
echo Contract ID: %CONTRACT_ID%

REM Get admin address
for /f "tokens=*" %%i in ('soroban keys address default') do set ADMIN_ADDRESS=%%i
echo Admin Address: %ADMIN_ADDRESS%

if "%ADMIN_ADDRESS%"=="" (
    echo ❌ Failed to get admin address!
    pause
    exit /b 1
)

REM Initialize the contract
echo.
echo Calling initialize function...
soroban contract invoke --id %CONTRACT_ID% --source default --network testnet -- initialize --admin %ADMIN_ADDRESS%

if %ERRORLEVEL% equ 0 (
    echo.
    echo ✅ Contract initialized successfully!
) else (
    echo.
    echo ⚠️ Initialization may have failed or contract is already initialized
)

echo.
echo Testing contract - checking if initialized...
soroban contract invoke --id %CONTRACT_ID% --network testnet -- is_initialized

echo.
echo 🎉 Initialization complete!
pause

