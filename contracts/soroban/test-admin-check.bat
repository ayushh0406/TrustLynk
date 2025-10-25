@echo off
echo Testing admin check for your Freighter wallet...
echo.

REM Your Freighter wallet address
set WALLET_ADDRESS=GDDDHJQQ7QFXQUUGHJ3RLX2CMQLPKKW4BBL4VKWQ6AUEE56BKJX3M6HO
set CONTRACT_ID=CALJMLEKGXK3XJ26JGWZRLVQYYBYX6HSASF5UJ2PKYRDOQ2PYPAGSPQT

echo 1. Checking user role...
soroban contract invoke ^
  --id %CONTRACT_ID% ^
  --source default ^
  --network testnet ^
  -- ^
  get_user_role ^
  --user_address %WALLET_ADDRESS%

echo.
echo 2. Checking if contract is initialized...
soroban contract invoke ^
  --id %CONTRACT_ID% ^
  --source default ^
  --network testnet ^
  -- ^
  is_initialized

echo.
echo 3. Getting all admins list...
soroban contract invoke ^
  --id %CONTRACT_ID% ^
  --source default ^
  --network testnet ^
  -- ^
  get_all_admins

echo.
echo Done!
pause

