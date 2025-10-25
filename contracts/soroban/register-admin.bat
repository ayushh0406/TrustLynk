@echo off
REM Register a new admin using the deployment admin account

set /p CONTRACT_ID=<contract-id.txt
for /f "tokens=*" %%i in ('soroban keys address default') do set DEPLOYER_ADDRESS=%%i

echo 🔐 Admin Registration Tool
echo ========================
echo Contract ID: %CONTRACT_ID%
echo Deployer Address: %DEPLOYER_ADDRESS%
echo.

set /p NEW_ADMIN_ADDRESS="Enter the Freighter wallet address to register as admin: "

if "%NEW_ADMIN_ADDRESS%"=="" (
    echo ❌ No address provided!
    pause
    exit /b 1
)

echo.
echo Registering %NEW_ADMIN_ADDRESS% as admin...
echo.

soroban contract invoke ^
  --id %CONTRACT_ID% ^
  --source default ^
  --network testnet ^
  -- ^
  register_user ^
  --user %NEW_ADMIN_ADDRESS% ^
  --role 2

if %ERRORLEVEL% equ 0 (
    echo.
    echo ✅ Successfully registered as admin!
    echo.
    echo Verifying role...
    soroban contract invoke ^
      --id %CONTRACT_ID% ^
      --source default ^
      --network testnet ^
      -- ^
      get_user_role ^
      --user_address %NEW_ADMIN_ADDRESS%
) else (
    echo.
    echo ⚠️ Registration may have failed
)

echo.
echo Done!
pause

