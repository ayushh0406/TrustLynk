@echo off
set CONTRACT_ID=CAXSVRMIEAMSMB47V2TLFT6YHCNDQNM67GKQ5LDRY7AH5PTJAV55IW7E

echo ====================================
echo Checking All Policies
echo ====================================
echo.

echo Getting all policies from contract...
soroban contract invoke ^
  --id %CONTRACT_ID% ^
  --source default ^
  --network testnet ^
  -- ^
  get_all_policies

echo.
echo Done!
pause

