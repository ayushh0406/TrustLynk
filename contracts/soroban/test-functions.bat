@echo off
REM Test basic contract functions

set /p CONTRACT_ID=<contract-id.txt
for /f "tokens=*" %%i in ('soroban keys address default') do set ADMIN_ADDRESS=%%i

echo Testing Insurance Portal Contract
echo ==================================
echo Contract ID: %CONTRACT_ID%
echo Admin Address: %ADMIN_ADDRESS%
echo.

echo Test 1: is_initialized
echo -----------------------
soroban contract invoke --id %CONTRACT_ID% --source default --network testnet -- is_initialized
echo.

echo Test 2: get_user_role (admin)
echo ------------------------------
soroban contract invoke --id %CONTRACT_ID% --source default --network testnet -- get_user_role --user_address %ADMIN_ADDRESS%
echo.

echo Test 3: get_all_policies
echo -------------------------
soroban contract invoke --id %CONTRACT_ID% --source default --network testnet -- get_all_policies
echo.

echo ✅ Tests complete!
pause

