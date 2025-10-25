# Deployment Issues Fixed

## Issues Found & Resolved

### 1. ✅ Smart Contract Compilation Errors

**Problem 1: Too many parameters**
- Soroban limits functions to 10 parameters max
- `create_policy` had 11 parameters

**Solution:** Created `PolicyParams` struct to bundle parameters
```rust
pub struct PolicyParams {
    pub title: String,
    pub description: String,
    // ... 10 fields total
}

pub fn create_policy(env: Env, admin: Address, params: PolicyParams)
```

**Problem 2: Moved value error**
- `user` Address was moved and reused

**Solution:** Clone the address before using in events
```rust
env.events().publish(..., (user.clone(), role));
```

**Problem 3: Unused import**
- `Map` was imported but not used

**Solution:** Removed from imports

### 2. ✅ Deployment Script Updated

**Problem:** Old CLI commands (`soroban config identity`) don't exist in newer versions

**Solution:** Updated to use current commands:
```bash
# Old (doesn't work):
soroban config identity generate default-identity

# New (works):
soroban keys generate default --network testnet
soroban keys address default
soroban keys ls
```

### 3. ✅ Frontend Updated

Updated `frontend/lib/blockchain.ts` to match new contract signature:
```typescript
// Now creates PolicyParams struct
const paramsMap = new Map<any, any>();
paramsMap.set("title", policyData.title);
// ... all parameters
```

## How to Deploy Now

### Step 1: Navigate to contract directory
```bash
cd contracts/soroban
```

### Step 2: Run deployment script

**Windows:**
```bash
deploy.bat
```

**Linux/Mac:**
```bash
chmod +x deploy.sh
./deploy.sh
```

### Step 3: Copy Contract ID
After successful deployment, you'll see:
```
Contract ID: CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### Step 4: Update Frontend
Open `frontend/lib/blockchain.ts` and replace:
```typescript
export const CONTRACT_ID = "PLACEHOLDER_CONTRACT_ID";
```

With your deployed contract ID:
```typescript
export const CONTRACT_ID = "CXXXXXXXXX...";
```

### Step 5: Install Dependencies & Run
```bash
cd ../../frontend
npm install
npm run dev
```

## Troubleshooting

### If you see "whitespace" warning
This is just a warning about spaces in your path. It won't prevent deployment.

### If deployment fails
1. Make sure you have latest Soroban CLI:
   ```bash
   cargo install --locked soroban-cli --force
   ```

2. Check Rust is installed:
   ```bash
   rustc --version
   cargo --version
   ```

3. Add WASM target:
   ```bash
   rustup target add wasm32-unknown-unknown
   ```

### If friendbot fails
Just wait 30 seconds and run the script again. Friendbot can be slow sometimes.

## What's Different Now

| Before | After |
|--------|-------|
| 11 function parameters | 2 parameters (address + struct) |
| `soroban config identity` | `soroban keys` |
| Moved value error | Values properly cloned |
| Unused imports | Clean imports |

## Expected Output

```
🚀 Starting Insurance Portal deployment to Stellar Testnet...
📦 Building Soroban contract...
⚡ Optimizing WASM...
🔑 Checking for identity...
📋 Getting identity address...
Identity Address: GXXXXXX...
💰 Funding account on testnet...
🚀 Deploying contract to Stellar Testnet...
✅ Contract deployed successfully!
Contract ID: CXXXXXX...
📝 Contract ID saved to contract-id.txt
🔧 Initializing contract...

===================================
📋 Deployment Summary
===================================
Contract ID: CXXXXXX...
Admin Address: GXXXXXX...
Network: Stellar Testnet
===================================

✅ NEXT STEPS:
1. Copy the Contract ID above
2. Update frontend/lib/blockchain.ts
3. Install frontend dependencies: npm install
4. Run the frontend: npm run dev

🎉 Deployment complete!
```

## Ready to Test!

Once deployed, you can:
- ✅ Connect with Freighter wallet
- ✅ Register users (admin/policyholder)
- ✅ Create policies
- ✅ Purchase policies with XLM
- ✅ Submit claims
- ✅ Approve claims

Your contract is now production-ready for Stellar Testnet! 🚀

