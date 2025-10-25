#!/bin/bash

# Deploy script for Insurance Platform Move contract

echo "🚀 Deploying Insurance Platform Move Contract to Aptos Devnet"
echo "============================================================"

# Check if aptos CLI is installed
if ! command -v aptos &> /dev/null; then
    echo "❌ Aptos CLI is not installed. Please install it first."
    echo "Visit: https://aptos.dev/tools/aptos-cli"
    exit 1
fi

# Create devnet profile if it doesn't exist
echo "📋 Setting up Aptos devnet profile..."
aptos init --profile devnet --network devnet || echo "Profile already exists"

# Compile the Move contract
echo "🔨 Compiling Move contract..."
aptos move compile --profile devnet
if [ $? -ne 0 ]; then
    echo "❌ Compilation failed"
    exit 1
fi

# Deploy the contract
echo "📤 Publishing contract to devnet..."
aptos move publish --profile devnet --assume-yes
if [ $? -ne 0 ]; then
    echo "❌ Deployment failed"
    exit 1
fi

echo "✅ Contract deployed successfully!"
echo ""
echo "🔍 To get your contract address, run:"
echo "   aptos account lookup-address --profile devnet"
echo ""
echo "📋 Next steps:"
echo "1. Update CONTRACT_ADDRESS in frontend/lib/blockchain.ts"
echo "2. Run the frontend with npm run dev"
echo "3. Connect Petra wallet and test the functionality"
