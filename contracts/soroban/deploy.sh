#!/bin/bash

# Stellar Soroban deployment script for Insurance Portal
# This script builds and deploys the insurance portal smart contract to Stellar Testnet

set -e

echo "🚀 Starting Insurance Portal deployment to Stellar Testnet..."

# Check if stellar-cli (soroban) is installed
if ! command -v soroban &> /dev/null; then
    echo "❌ soroban CLI not found. Please install it first:"
    echo "cargo install --locked soroban-cli"
    exit 1
fi

# Build the contract
echo "📦 Building Soroban contract..."
soroban contract build

# Optimize the WASM file
echo "⚡ Optimizing WASM..."
soroban contract optimize --wasm target/wasm32v1-none/release/insurance_portal.wasm

# Check if default identity exists, create if not
echo "🔑 Checking for identity..."
if ! soroban keys address default &> /dev/null; then
    echo "Creating default identity..."
    soroban keys generate default --network testnet
fi

echo "📋 Getting identity address..."
IDENTITY_ADDRESS=$(soroban keys address default)

if [ -z "$IDENTITY_ADDRESS" ]; then
    echo "❌ Failed to get identity address!"
    exit 1
fi

echo "Identity Address: $IDENTITY_ADDRESS"

# Fund the account on testnet (if needed)
echo "💰 Funding account on testnet (this may take a moment)..."
curl "https://friendbot.stellar.org?addr=$IDENTITY_ADDRESS" || true
echo ""

# Wait a moment for friendbot
sleep 3

# Deploy the contract
echo "🚀 Deploying contract to Stellar Testnet..."
CONTRACT_ID=$(soroban contract deploy \
  --wasm target/wasm32v1-none/release/insurance_portal.wasm \
  --source default \
  --network testnet)

echo "✅ Contract deployed successfully!"
echo "Contract ID: $CONTRACT_ID"

# Save contract ID to file
echo "$CONTRACT_ID" > contract-id.txt
echo "📝 Contract ID saved to contract-id.txt"

# Initialize the contract
echo "🔧 Initializing contract..."
soroban contract invoke \
  --id "$CONTRACT_ID" \
  --source default \
  --network testnet \
  -- \
  initialize \
  --admin "$IDENTITY_ADDRESS" || echo "⚠️ Initialization may have failed, but contract is deployed."

echo ""
echo "==================================="
echo "📋 Deployment Summary"
echo "==================================="
echo "Contract ID: $CONTRACT_ID"
echo "Admin Address: $IDENTITY_ADDRESS"
echo "Network: Stellar Testnet"
echo "==================================="
echo ""
echo "✅ NEXT STEPS:"
echo "1. Copy the Contract ID above"
echo "2. Update frontend/lib/blockchain.ts:"
echo "   export const CONTRACT_ID = \"$CONTRACT_ID\""
echo "3. Install frontend dependencies: npm install"
echo "4. Run the frontend: npm run dev"
echo ""
echo "🎉 Deployment complete!"
