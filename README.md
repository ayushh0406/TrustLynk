# Insurance Platform on Stellar Blockchain

A decentralized insurance platform built on Aptos blockchain with role-based access control, ABHA ID integration, and Petra wallet connectivity.

## 🏗️ Architecture

### Smart Contract (Move)
- **Location**: `contracts/sources/insurance_platform.move`
- **Features**: 
  - Role-based access control (Admin/User)
  - Policy creation and management
  - Policy purchasing with automatic verification
  - User registration and authentication
  - Event emission for transaction tracking

### Frontend (Next.js)
- **Technology**: Next.js 15, TypeScript, Tailwind CSS
- **Wallet Integration**: Petra Wallet via Aptos Wallet Adapter
- **Features**:
  - Admin dashboard for policy creation
  - User dashboard for policy purchasing
  - ABHA ID authorization flow
  - Real-time blockchain interaction

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Aptos CLI
- Petra Wallet browser extension

### 1. Install Dependencies

```bash
# Install frontend dependencies
cd frontend
npm install

# Install Aptos CLI (if not already installed)
curl -fsSL "https://aptos.dev/scripts/install_cli.py" | python3
```

### 2. Deploy Smart Contract

```bash
# Initialize Aptos CLI for devnet
aptos init --network devnet

cd contracts

# For Unix/Linux/Mac
chmod +x deploy.sh
./deploy.sh

# For Windows
deploy.bat
```

The deploy script will:
- Set up Aptos devnet profile  
- Compile the Move contract
- Deploy to Aptos devnet
- Provide the contract address

### 3. Update Contract Address

After deployment, update the contract address in:
- `frontend/lib/blockchain.ts` - Update `CONTRACT_ADDRESS` variable

### 4. Run Frontend

```bash
cd frontend
npm run dev
```

Visit `http://localhost:3000`

## 🔧 Usage

### Admin Flow
1. **Connect Petra Wallet** - Use wallet with admin privileges
2. **Initialize Platform** - First-time setup (admin only)
3. **Create Policies** - Add new insurance policies to the blockchain
4. **Monitor Policies** - View created policies and their status

### User Flow
1. **Connect Petra Wallet** - Connect user wallet
2. **Register as User** - Register on blockchain with user role
3. **ABHA Authorization** - Complete ABHA ID authorization (simulated)
4. **Browse Policies** - View available insurance policies
5. **Purchase Policies** - Buy policies using blockchain transactions
6. **Manage Policies** - View purchased policies and their status

## 📋 Smart Contract Functions

### Admin Functions
- `initialize()` - Initialize platform (one-time setup)
- `create_policy()` - Create new insurance policy
- `register_user()` - Register users with roles

### User Functions  
- `purchase_policy()` - Purchase an insurance policy
- `register_user()` - Self-register as user

### View Functions
- `get_user_role()` - Check user's role
- `get_policy()` - Get policy details
- `get_user_policies()` - Get user's purchased policies
- `is_initialized()` - Check if platform is initialized

## 🔒 Role Management

### Admin Role (`ROLE_ADMIN = 2`)
- Can initialize the platform
- Can create new policies
- Full administrative access

### User Role (`ROLE_USER = 1`)
- Can purchase policies
- Can view their purchased policies
- Must have ABHA consent for purchases

## 💾 Policy Types

The smart contract supports 5 policy types:
1. **Health** (`POLICY_TYPE_HEALTH = 1`)
2. **Life** (`POLICY_TYPE_LIFE = 2`) 
3. **Auto** (`POLICY_TYPE_AUTO = 3`)
4. **Home** (`POLICY_TYPE_HOME = 4`)
5. **Travel** (`POLICY_TYPE_TRAVEL = 5`)

## 🔄 Integration Points

### ABHA ID Integration
- Simulated ABHA authorization flow
- Consent verification before policy purchase
- Stored in localStorage for demo purposes

### Petra Wallet Integration
- Wallet connection management
- Transaction signing
- Address-based role mapping

### Blockchain Events
- Policy creation events
- Policy purchase events  
- User registration events

## 🛠️ Development

### Project Structure
```
├── contracts/                 # Move smart contracts
│   ├── sources/               # Contract source files
│   ├── Move.toml             # Move package configuration
│   ├── deploy.sh             # Unix deployment script
│   └── deploy.bat            # Windows deployment script
├── frontend/                  # Next.js frontend
│   ├── app/                  # App router pages
│   ├── components/           # React components
│   ├── lib/                  # Utility libraries
│   └── context/              # React contexts
└── README.md                 # This file
```

### Key Files
- `contracts/sources/insurance_platform.move` - Main smart contract
- `frontend/lib/blockchain.ts` - Blockchain integration functions
- `frontend/context/wallet-context.tsx` - Wallet state management
- `frontend/app/dashboard/admin/page.tsx` - Admin dashboard
- `frontend/app/dashboard/user/page.tsx` - User dashboard

## 🧪 Testing

### Manual Testing Flow
1. Deploy contract to devnet
2. Connect as admin wallet
3. Initialize platform
4. Create test policies
5. Switch to user wallet
6. Register as user
7. Authorize ABHA (simulated)
8. Purchase policy
9. Verify transaction on blockchain

### Test Accounts
The deployment script creates funded devnet accounts automatically.

## 🔍 Troubleshooting

### Common Issues

**1. Contract Address Mismatch**
- Ensure `CONTRACT_ADDRESS` in `blockchain.ts` matches deployed contract
- Get address with: `aptos account lookup-address --profile devnet`
- Use `aptos init --network devnet` for proper setup

**2. Wallet Connection Issues**
- Install Petra Wallet extension
- Switch to Aptos devnet in wallet settings
- Ensure wallet has devnet APT tokens

**3. Transaction Failures**
- Check user has correct role
- Verify ABHA consent is granted
- Ensure platform is initialized (admin only)

**4. Permission Denied**
- Verify user is registered with correct role
- Admin functions require `ROLE_ADMIN`
- User functions require `ROLE_USER`

### Getting Help
- Check console logs for detailed error messages
- Verify transaction status on Aptos Explorer (devnet)
- Ensure all prerequisites are installed

## 📈 Future Enhancements

- [ ] Real ABHA ID API integration
- [ ] Claims processing automation
- [ ] Premium payment scheduling
- [ ] Policy renewal notifications
- [ ] Integration with real insurance providers
- [ ] Mainnet deployment
- [ ] Mobile app support
- [ ] Advanced policy templates
- [ ] Risk assessment algorithms
- [ ] Multi-signature admin controls

## 📄 License

This project is for demonstration purposes. Please ensure compliance with local insurance regulations before production use.
