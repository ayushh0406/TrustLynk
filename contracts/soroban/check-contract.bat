@echo off
REM Script to check contract status

echo 🔍 Checking Insurance Portal Contract Status...

REM Read contract ID from file
if not exist contract-id.txt (
    echo ❌ contract-id.txt not found! Please deploy the contract first.
    pause
    exit /b 1
)

set /p CONTRACT_ID=<contract-id.txt
echo Contract ID: %CONTRACT_ID%
echo.

echo 📊 Contract Functions:
echo ====================
echo.

echo 1. Checking if initialized...
soroban contract invoke --id %CONTRACT_ID% --network testnet -- is_initialized
echo.

echo 2. Getting admin identity address...
for /f "tokens=*" %%i in ('soroban keys address default') do set ADMIN_ADDRESS=%%i
echo Admin Address: %ADMIN_ADDRESS%
echo.

echo 3. Checking admin role...
soroban contract invoke --id %CONTRACT_ID% --network testnet -- get_user_role --user_address %ADMIN_ADDRESS%
echo.

echo 4. Getting all policies...
soroban contract invoke --id %CONTRACT_ID% --network testnet -- get_all_policies
echo.

echo ✅ Contract check complete!
pause

