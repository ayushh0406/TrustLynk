@echo off
set CONTRACT_ID=CAXSVRMIEAMSMB47V2TLFT6YHCNDQNM67GKQ5LDRY7AH5PTJAV55IW7E
set USER_WALLET=GDDDHJQQ7QFXQUUGHJ3RLX2CMQLPKKW4BBL4VKWQ6AUEE56BKJX3M6HO

echo ====================================
echo Testing Debug Functions
echo ====================================
echo.

echo 1. First, register user as admin via frontend (user must self-register)
echo    You need to go to your app and complete registration with Freighter wallet
echo.
pause

echo.
echo 2. Checking user role...
soroban contract invoke ^
  --id %CONTRACT_ID% ^
  --source default ^
  --network testnet ^
  -- ^
  get_user_role ^
  --user_address %USER_WALLET%

echo.
echo 3. Testing check_admin_status debug function...
soroban contract invoke ^
  --id %CONTRACT_ID% ^
  --source default ^
  --network testnet ^
  -- ^
  check_admin_status ^
  --user %USER_WALLET%

echo.
echo 4. Testing test_create_policy_no_auth (should return true if admin check passes)...
soroban contract invoke ^
  --id %CONTRACT_ID% ^
  --source default ^
  --network testnet ^
  -- ^
  test_create_policy_no_auth ^
  --admin %USER_WALLET% ^
  --params "{ \"title\": \"Test\", \"description\": \"Test\", \"policy_type\": 1, \"monthly_premium\": \"100\", \"yearly_premium\": \"1000\", \"coverage_amount\": \"50000\", \"min_age\": 18, \"max_age\": 65, \"duration_days\": 365, \"waiting_period_days\": 30 }"

echo.
echo Done!
pause

