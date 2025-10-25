# Insurance Portal - Soroban Smart Contract

This directory contains the Stellar Soroban smart contract for the Insurance Portal platform, converted from Aptos Move.

## Prerequisites

1. Install Rust and Cargo:
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

2. Install Stellar CLI (soroban):
```bash
cargo install --locked soroban-cli
```

3. Add WASM target:
```bash
rustup target add wasm32-unknown-unknown
```

## Building the Contract

```bash
cd contracts/soroban
soroban contract build
```

## Deploying to Stellar Testnet

### On Linux/Mac:
```bash
chmod +x deploy.sh
./deploy.sh
```

### On Windows:
```bash
deploy.bat
```

The deployment script will:
1. Build and optimize the contract
2. Configure Stellar Testnet
3. Create/use an identity
4. Fund the account via Friendbot
5. Deploy the contract
6. Initialize the contract with admin
7. Save the contract ID to `contract-id.txt`

## Contract Functions

### User Management
- `initialize(admin: Address)` - Initialize the contract
- `register_user(user: Address, role: u32)` - Register a new user
- `get_user_role(user_address: Address)` - Get user's role
- `get_user_info(user_address: Address)` - Get user information

### Policy Management
- `create_policy(...)` - Create a new insurance policy (admin only)
- `get_all_policies()` - Get all available policies
- `get_my_policies(user_address: Address)` - Get user's purchased policies

### Purchase & NFT
- `purchase_policy(...)` - Purchase a policy with XLM payment
- `get_nft_metadata(token_id: String)` - Get NFT metadata
- `get_user_tokens(user_address: Address)` - Get user's NFT tokens
- `get_policy_tokens(policy_id: u64)` - Get tokens for a policy

### Claims
- `claim_policy(...)` - Submit an insurance claim
- `approve_claim(...)` - Approve a pending claim (admin only)
- `get_claim_status(claim_id: u64)` - Get claim status
- `get_all_claims()` - Get all claims (admin only)
- `get_user_claims(user_address: Address)` - Get user's claims

## Testing

```bash
cargo test
```

## Network Configuration

- **Network**: Stellar Testnet
- **RPC**: https://soroban-testnet.stellar.org:443
- **Passphrase**: "Test SDF Network ; September 2015"
- **Friendbot**: https://friendbot.stellar.org

## Payment Currency

The contract uses XLM (Stellar Lumens) for payments:
- 1 XLM = 10^7 stroops
- Conversion rate: 1 XLM = 10 INR (simplified for demo)

## Migration from Aptos

This contract is a direct port from Aptos Move to Soroban Rust with equivalent functionality:
- All data structures preserved
- Payment logic adapted for XLM instead of APT
- NFT metadata storage maintained
- Claim processing with fraud detection scores
- Role-based access control

