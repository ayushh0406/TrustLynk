@echo off
echo Testing create_policy from CLI...
echo.

set WALLET_ADDRESS=GDDDHJQQ7QFXQUUGHJ3RLX2CMQLPKKW4BBL4VKWQ6AUEE56BKJX3M6HO
set CONTRACT_ID=CALJMLEKGXK3XJ26JGWZRLVQYYBYX6HSASF5UJ2PKYRDOQ2PYPAGSPQT

echo Creating a test policy...
echo.

REM First, let's check if we can create a policy using the default identity
echo Using default identity to create policy...
soroban contract invoke ^
  --id %CONTRACT_ID% ^
  --source default ^
  --network testnet ^
  -- ^
  create_policy ^
  --admin %WALLET_ADDRESS% ^
  --params "{ \"title\": \"Test Policy\", \"description\": \"Test Description\", \"policy_type\": 1, \"monthly_premium\": \"100\", \"yearly_premium\": \"1000\", \"coverage_amount\": \"50000\", \"min_age\": 18, \"max_age\": 65, \"duration_days\": 365, \"waiting_period_days\": 30 }"

echo.
echo Done!
pause

