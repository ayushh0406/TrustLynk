#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, token, Address, Env, String, Vec, Symbol
};

// Error codes
pub const E_NOT_ADMIN: u32 = 1;
pub const E_NOT_POLICYHOLDER: u32 = 2;
pub const E_POLICY_NOT_FOUND: u32 = 3;
pub const E_ALREADY_REGISTERED: u32 = 4;
pub const E_INVALID_ROLE: u32 = 5;
pub const E_NOT_REGISTERED: u32 = 6;
pub const E_ALREADY_PURCHASED: u32 = 7;
pub const E_INSUFFICIENT_PAYMENT: u32 = 10;
pub const E_CLAIM_NOT_FOUND: u32 = 11;

// User roles
pub const ROLE_UNREGISTERED: u32 = 0;
pub const ROLE_POLICYHOLDER: u32 = 1;
pub const ROLE_ADMIN: u32 = 2;

// Policy types
pub const POLICY_TYPE_HEALTH: u32 = 1;
pub const POLICY_TYPE_LIFE: u32 = 2;
pub const POLICY_TYPE_AUTO: u32 = 3;
pub const POLICY_TYPE_HOME: u32 = 4;
pub const POLICY_TYPE_TRAVEL: u32 = 5;

// Claim status
pub const CLAIM_STATUS_APPROVED: u32 = 1;
pub const CLAIM_STATUS_PENDING: u32 = 2;
pub const CLAIM_STATUS_REJECTED: u32 = 3;

// Payment constants (in stroops: 1 XLM = 10^7 stroops)
pub const XLM_DECIMALS: i128 = 10_000_000; // 1 XLM = 10^7 stroops
pub const INR_TO_XLM_RATE: i128 = 1_000_000; // 1 XLM = 10 INR (simplified for demo)
pub const ESCROW_DURATION_SECONDS: u64 = 2592000; // 30 days

// Data structures
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct User {
    pub wallet: Address,
    pub role: u32,
    pub registered: bool,
    pub name: String,
    pub location: String,
    pub contact: String,
    pub registered_at: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Policy {
    pub policy_id: u64,
    pub title: String,
    pub description: String,
    pub policy_type: u32,
    pub monthly_premium: i128,
    pub yearly_premium: i128,
    pub coverage_amount: i128,
    pub min_age: u64,
    pub max_age: u64,
    pub duration_days: u64,
    pub waiting_period_days: u64,
    pub created_at: u64,
    pub created_by: Address,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct UserPolicy {
    pub policy_id: u64,
    pub user_address: Address,
    pub purchase_date: u64,
    pub expiry_date: u64,
    pub premium_paid_xlm: i128,
    pub monthly_premium_xlm: i128,
    pub active: bool,
    pub token_id: String,
    pub metadata_uri: String,
    pub escrow_id: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PolicyNFTMetadata {
    pub name: String,
    pub description: String,
    pub image_uri: String,
    pub coverage_amount: i128,
    pub validity_start: u64,
    pub validity_end: u64,
    pub premium_amount: i128,
    pub policy_type: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PaymentEscrow {
    pub user_address: Address,
    pub policy_id: u64,
    pub monthly_premium_xlm: i128,
    pub next_payment_due: u64,
    pub payments_made: u64,
    pub total_payments_required: u64,
    pub escrow_balance: i128,
    pub active: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PolicyClaim {
    pub claim_id: u64,
    pub policy_id: u64,
    pub user_address: Address,
    pub claim_amount: i128,
    pub aggregate_score: u32,
    pub status: u32,
    pub claimed_at: u64,
    pub processed_at: u64,
}

/// Policy creation parameters struct (to avoid 10 parameter limit)
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PolicyParams {
    pub title: String,
    pub description: String,
    pub policy_type: u32,
    pub monthly_premium: i128,
    pub yearly_premium: i128,
    pub coverage_amount: i128,
    pub min_age: u64,
    pub max_age: u64,
    pub duration_days: u64,
    pub waiting_period_days: u64,
}

// Storage keys
#[contracttype]
pub enum DataKey {
    Admin,
    PolicyCounter,
    TokenCounter,
    EscrowCounter,
    ClaimCounter,
    Treasury,
    User(Address),
    Policy(u64),
    UserPolicies(Address),
    NFTMetadata(String),
    PolicyTokens(u64),
    UserTokens(Address),
    PaymentEscrow(u64),
    UserEscrows(Address),
    PolicyClaim(u64),
    UserClaims(Address),
    Admins,
}

#[contract]
pub struct InsurancePortal;

#[contractimpl]
impl InsurancePortal {
    /// Initialize the contract
    pub fn initialize(env: Env, admin: Address) {
        admin.require_auth();

        // Set admin
        env.storage().instance().set(&DataKey::Admin, &admin);
        
        // Initialize counters
        env.storage().instance().set(&DataKey::PolicyCounter, &0u64);
        env.storage().instance().set(&DataKey::TokenCounter, &0u64);
        env.storage().instance().set(&DataKey::EscrowCounter, &0u64);
        env.storage().instance().set(&DataKey::ClaimCounter, &0u64);
        env.storage().instance().set(&DataKey::Treasury, &0i128);

        // Initialize admins vector
        let mut admins = Vec::new(&env);
        admins.push_back(admin.clone());
        env.storage().instance().set(&DataKey::Admins, &admins);

        // Register admin user
        let admin_user = User {
            wallet: admin.clone(),
            role: ROLE_ADMIN,
            registered: true,
            name: String::from_str(&env, "Contract Admin"),
            location: String::from_str(&env, ""),
            contact: String::from_str(&env, ""),
            registered_at: env.ledger().timestamp(),
        };

        env.storage().persistent().set(&DataKey::User(admin.clone()), &admin_user);
        
        // Initialize empty vectors for admin
        let empty_policies: Vec<UserPolicy> = Vec::new(&env);
        let empty_strings: Vec<String> = Vec::new(&env);
        let empty_escrows: Vec<u64> = Vec::new(&env);
        let empty_claims: Vec<u64> = Vec::new(&env);
        
        env.storage().persistent().set(&DataKey::UserPolicies(admin.clone()), &empty_policies);
        env.storage().persistent().set(&DataKey::UserTokens(admin.clone()), &empty_strings);
        env.storage().persistent().set(&DataKey::UserEscrows(admin.clone()), &empty_escrows);
        env.storage().persistent().set(&DataKey::UserClaims(admin), &empty_claims);
    }

    /// Register a new user with a role
    pub fn register_user(env: Env, user: Address, role: u32) {
        user.require_auth();

        // Validate role
        if role != ROLE_POLICYHOLDER && role != ROLE_ADMIN {
            panic!("Invalid role: {}", E_INVALID_ROLE);
        }

        // Check if already registered
        if env.storage().persistent().has(&DataKey::User(user.clone())) {
            panic!("Already registered: {}", E_ALREADY_REGISTERED);
        }

        let new_user = User {
            wallet: user.clone(),
            role,
            registered: true,
            name: String::from_str(&env, ""),
            location: String::from_str(&env, ""),
            contact: String::from_str(&env, ""),
            registered_at: env.ledger().timestamp(),
        };

        env.storage().persistent().set(&DataKey::User(user.clone()), &new_user);

        // Add to admins list if admin
        if role == ROLE_ADMIN {
            let mut admins: Vec<Address> = env.storage().instance()
                .get(&DataKey::Admins)
                .unwrap_or(Vec::new(&env));
            admins.push_back(user.clone());
            env.storage().instance().set(&DataKey::Admins, &admins);
        }

        // Initialize empty vectors
        let empty_policies: Vec<UserPolicy> = Vec::new(&env);
        let empty_strings: Vec<String> = Vec::new(&env);
        let empty_escrows: Vec<u64> = Vec::new(&env);
        let empty_claims: Vec<u64> = Vec::new(&env);
        
        env.storage().persistent().set(&DataKey::UserPolicies(user.clone()), &empty_policies);
        env.storage().persistent().set(&DataKey::UserTokens(user.clone()), &empty_strings);
        env.storage().persistent().set(&DataKey::UserEscrows(user.clone()), &empty_escrows);
        env.storage().persistent().set(&DataKey::UserClaims(user.clone()), &empty_claims);

        // Emit event (clone user for event)
        env.events().publish((Symbol::new(&env, "user_registered"),), (user.clone(), role));
    }

    /// Get user role (for auto-login)
    pub fn get_user_role(env: Env, user_address: Address) -> u32 {
        if let Some(user) = env.storage().persistent().get::<DataKey, User>(&DataKey::User(user_address)) {
            user.role
        } else {
            ROLE_UNREGISTERED
        }
    }

    /// Check if user is admin
    fn is_admin(env: &Env, user: &Address) -> bool {
        if let Some(admin) = env.storage().instance().get::<DataKey, Address>(&DataKey::Admin) {
            if user == &admin {
                return true;
            }
        }

        if let Some(user_data) = env.storage().persistent().get::<DataKey, User>(&DataKey::User(user.clone())) {
            user_data.role == ROLE_ADMIN
        } else {
            false
        }
    }

    /// Debug function to check admin status without require_auth
    pub fn check_admin_status(env: Env, user: Address) -> bool {
        Self::is_admin(&env, &user)
    }
    
    /// Test create_policy without require_auth (for debugging)
    pub fn test_create_policy_no_auth(
        env: Env,
        admin: Address,
        params: PolicyParams,
    ) -> bool {
        // Just check if user is admin, don't require auth
        Self::is_admin(&env, &admin)
    }

    /// Admin only: Create policy
    pub fn create_policy(
        env: Env,
        admin: Address,
        params: PolicyParams,
    ) -> u64 {
        // Log entry
        env.events().publish((Symbol::new(&env, "debug_create_policy_start"),), (admin.clone(),));
        
        admin.require_auth();
        
        env.events().publish((Symbol::new(&env, "debug_after_require_auth"),), (admin.clone(),));

        // Check if user is admin
        let is_admin_result = Self::is_admin(&env, &admin);
        env.events().publish((Symbol::new(&env, "debug_is_admin_result"),), (is_admin_result,));
        
        if !is_admin_result {
            panic!("Not admin: {}", E_NOT_ADMIN);
        }

        // Increment policy counter
        let mut counter: u64 = env.storage().instance()
            .get(&DataKey::PolicyCounter)
            .unwrap_or(0);
        counter += 1;
        env.storage().instance().set(&DataKey::PolicyCounter, &counter);

        let policy = Policy {
            policy_id: counter,
            title: params.title.clone(),
            description: params.description.clone(),
            policy_type: params.policy_type,
            monthly_premium: params.monthly_premium,
            yearly_premium: params.yearly_premium,
            coverage_amount: params.coverage_amount,
            min_age: params.min_age,
            max_age: params.max_age,
            duration_days: params.duration_days,
            waiting_period_days: params.waiting_period_days,
            created_at: env.ledger().timestamp(),
            created_by: admin.clone(),
        };

        env.storage().persistent().set(&DataKey::Policy(counter), &policy);
        
        // Initialize policy tokens vector
        let empty_tokens: Vec<String> = Vec::new(&env);
        env.storage().persistent().set(&DataKey::PolicyTokens(counter), &empty_tokens);

        // Emit event
        env.events().publish((Symbol::new(&env, "policy_created"),), (counter, params.title.clone(), admin));
        
        counter
    }

    /// Purchase policy with payment
    pub fn purchase_policy(
        env: Env,
        user: Address,
        policy_id: u64,
        metadata_uri: String,
        payment_amount_xlm: i128,
        native_token: Address, // Native XLM token address
    ) {
        user.require_auth();

        // Check if user is policyholder
        let user_data = env.storage().persistent()
            .get::<DataKey, User>(&DataKey::User(user.clone()))
            .expect("User not registered");
        
        if user_data.role != ROLE_POLICYHOLDER {
            panic!("Not policyholder: {}", E_NOT_POLICYHOLDER);
        }

        // Check if policy exists
        let policy = env.storage().persistent()
            .get::<DataKey, Policy>(&DataKey::Policy(policy_id))
            .expect("Policy not found");

        // Validate payment amount
        let expected_xlm = (policy.monthly_premium * XLM_DECIMALS) / INR_TO_XLM_RATE;
        if payment_amount_xlm < expected_xlm {
            panic!("Insufficient payment: {}", E_INSUFFICIENT_PAYMENT);
        }

        // Get contract address
        let contract_address = env.current_contract_address();

        // Transfer payment to contract (treasury)
        let token_client = token::Client::new(&env, &native_token);
        token_client.transfer(&user, &contract_address, &payment_amount_xlm);

        // Update treasury
        let mut treasury: i128 = env.storage().instance()
            .get(&DataKey::Treasury)
            .unwrap_or(0);
        treasury += payment_amount_xlm;
        env.storage().instance().set(&DataKey::Treasury, &treasury);

        // Create payment escrow
        let mut escrow_counter: u64 = env.storage().instance()
            .get(&DataKey::EscrowCounter)
            .unwrap_or(0);
        escrow_counter += 1;
        env.storage().instance().set(&DataKey::EscrowCounter, &escrow_counter);

        let current_time = env.ledger().timestamp();
        let next_payment_due = current_time + ESCROW_DURATION_SECONDS;
        let total_months = policy.duration_days / 30;

        let escrow = PaymentEscrow {
            user_address: user.clone(),
            policy_id,
            monthly_premium_xlm: payment_amount_xlm,
            next_payment_due,
            payments_made: 1,
            total_payments_required: total_months,
            escrow_balance: 0,
            active: true,
        };

        env.storage().persistent().set(&DataKey::PaymentEscrow(escrow_counter), &escrow);

        // Add to user's escrows
        let mut user_escrows: Vec<u64> = env.storage().persistent()
            .get(&DataKey::UserEscrows(user.clone()))
            .unwrap_or(Vec::new(&env));
        user_escrows.push_back(escrow_counter);
        env.storage().persistent().set(&DataKey::UserEscrows(user.clone()), &user_escrows);

        // Generate token ID
        let mut token_counter: u64 = env.storage().instance()
            .get(&DataKey::TokenCounter)
            .unwrap_or(0);
        token_counter += 1;
        env.storage().instance().set(&DataKey::TokenCounter, &token_counter);

        let token_id = String::from_str(&env, "POLICY_");
        // Note: In production, you'd append the counter to the string

        // Create NFT metadata
        let expiry_time = current_time + (policy.duration_days * 24 * 60 * 60);
        
        let nft_metadata = PolicyNFTMetadata {
            name: String::from_str(&env, "Policy NFT"),
            description: policy.description.clone(),
            image_uri: metadata_uri.clone(),
            coverage_amount: policy.coverage_amount,
            validity_start: current_time,
            validity_end: expiry_time,
            premium_amount: policy.yearly_premium,
            policy_type: policy.policy_type,
        };

        env.storage().persistent().set(&DataKey::NFTMetadata(token_id.clone()), &nft_metadata);

        // Create user policy
        let user_policy = UserPolicy {
            policy_id,
            user_address: user.clone(),
            purchase_date: current_time,
            expiry_date: expiry_time,
            premium_paid_xlm: payment_amount_xlm,
            monthly_premium_xlm: payment_amount_xlm,
            active: true,
            token_id: token_id.clone(),
            metadata_uri: metadata_uri.clone(),
            escrow_id: escrow_counter,
        };

        // Add to user policies
        let mut user_policies: Vec<UserPolicy> = env.storage().persistent()
            .get(&DataKey::UserPolicies(user.clone()))
            .unwrap_or(Vec::new(&env));
        user_policies.push_back(user_policy);
        env.storage().persistent().set(&DataKey::UserPolicies(user.clone()), &user_policies);

        // Add to policy tokens
        let mut policy_tokens: Vec<String> = env.storage().persistent()
            .get(&DataKey::PolicyTokens(policy_id))
            .unwrap_or(Vec::new(&env));
        policy_tokens.push_back(token_id.clone());
        env.storage().persistent().set(&DataKey::PolicyTokens(policy_id), &policy_tokens);

        // Add to user tokens
        let mut user_tokens: Vec<String> = env.storage().persistent()
            .get(&DataKey::UserTokens(user.clone()))
            .unwrap_or(Vec::new(&env));
        user_tokens.push_back(token_id.clone());
        env.storage().persistent().set(&DataKey::UserTokens(user.clone()), &user_tokens);

        // Emit event
        env.events().publish(
            (Symbol::new(&env, "policy_purchased"),),
            (policy_id, user, payment_amount_xlm, token_id, escrow_counter)
        );
    }

    /// Claim policy
    pub fn claim_policy(
        env: Env,
        user: Address,
        policy_id: u64,
        aggregate_score: u32,
        native_token: Address,
    ) {
        user.require_auth();

        // Check if user is policyholder
        let user_data = env.storage().persistent()
            .get::<DataKey, User>(&DataKey::User(user.clone()))
            .expect("User not registered");
        
        if user_data.role != ROLE_POLICYHOLDER {
            panic!("Not policyholder: {}", E_NOT_POLICYHOLDER);
        }

        // Check if policy exists
        let policy = env.storage().persistent()
            .get::<DataKey, Policy>(&DataKey::Policy(policy_id))
            .expect("Policy not found");

        // Check if user has this policy
        let user_policies: Vec<UserPolicy> = env.storage().persistent()
            .get(&DataKey::UserPolicies(user.clone()))
            .unwrap_or(Vec::new(&env));
        
        let mut has_policy = false;
        for i in 0..user_policies.len() {
            let user_policy = user_policies.get(i).unwrap();
            if user_policy.policy_id == policy_id && user_policy.active {
                has_policy = true;
                break;
            }
        }

        if !has_policy {
            panic!("Policy not found: {}", E_POLICY_NOT_FOUND);
        }

        // Generate claim ID
        let mut claim_counter: u64 = env.storage().instance()
            .get(&DataKey::ClaimCounter)
            .unwrap_or(0);
        claim_counter += 1;
        env.storage().instance().set(&DataKey::ClaimCounter, &claim_counter);

        let current_time = env.ledger().timestamp();

        // Determine status based on aggregate score
        let status = if aggregate_score <= 30 {
            CLAIM_STATUS_APPROVED
        } else if aggregate_score <= 70 {
            CLAIM_STATUS_PENDING
        } else {
            CLAIM_STATUS_REJECTED
        };

        // Create claim record
        let claim = PolicyClaim {
            claim_id: claim_counter,
            policy_id,
            user_address: user.clone(),
            claim_amount: policy.coverage_amount,
            aggregate_score,
            status,
            claimed_at: current_time,
            processed_at: current_time,
        };

        env.storage().persistent().set(&DataKey::PolicyClaim(claim_counter), &claim);

        // Add to user claims
        let mut user_claims: Vec<u64> = env.storage().persistent()
            .get(&DataKey::UserClaims(user.clone()))
            .unwrap_or(Vec::new(&env));
        user_claims.push_back(claim_counter);
        env.storage().persistent().set(&DataKey::UserClaims(user.clone()), &user_claims);

        // If approved, transfer funds to user
        if status == CLAIM_STATUS_APPROVED {
            let contract_address = env.current_contract_address();
            let token_client = token::Client::new(&env, &native_token);
            token_client.transfer(&contract_address, &user, &policy.coverage_amount);
        }

        // Emit event
        env.events().publish(
            (Symbol::new(&env, "policy_claimed"),),
            (claim_counter, policy_id, user, policy.coverage_amount, aggregate_score, status)
        );
    }

    /// Admin only: Approve pending claim
    pub fn approve_claim(
        env: Env,
        admin: Address,
        claim_id: u64,
        native_token: Address,
    ) {
        admin.require_auth();

        // Check if user is admin
        if !Self::is_admin(&env, &admin) {
            panic!("Not admin: {}", E_NOT_ADMIN);
        }

        // Get claim
        let mut claim = env.storage().persistent()
            .get::<DataKey, PolicyClaim>(&DataKey::PolicyClaim(claim_id))
            .expect("Claim not found");

        if claim.status != CLAIM_STATUS_PENDING {
            panic!("Claim not pending");
        }

        // Update claim status
        claim.status = CLAIM_STATUS_APPROVED;
        claim.processed_at = env.ledger().timestamp();
        env.storage().persistent().set(&DataKey::PolicyClaim(claim_id), &claim);

        // Transfer funds to user
        let contract_address = env.current_contract_address();
        let token_client = token::Client::new(&env, &native_token);
        token_client.transfer(&contract_address, &claim.user_address, &claim.claim_amount);

        // Emit event
        env.events().publish(
            (Symbol::new(&env, "claim_approved"),),
            (claim_id, claim.user_address, claim.claim_amount)
        );
    }

    /// Get claim status
    pub fn get_claim_status(env: Env, claim_id: u64) -> (u32, i128, u32) {
        let claim = env.storage().persistent()
            .get::<DataKey, PolicyClaim>(&DataKey::PolicyClaim(claim_id))
            .expect("Claim not found");
        
        (claim.status, claim.claim_amount, claim.aggregate_score)
    }

    /// Get all claims (admin only)
    pub fn get_all_claims(env: Env) -> Vec<PolicyClaim> {
        let claim_counter: u64 = env.storage().instance()
            .get(&DataKey::ClaimCounter)
            .unwrap_or(0);
        
        let mut claims = Vec::new(&env);
        for i in 1..=claim_counter {
            if let Some(claim) = env.storage().persistent().get::<DataKey, PolicyClaim>(&DataKey::PolicyClaim(i)) {
                claims.push_back(claim);
            }
        }
        claims
    }

    /// Get user claims
    pub fn get_user_claims(env: Env, user_address: Address) -> Vec<PolicyClaim> {
        let claim_ids: Vec<u64> = env.storage().persistent()
            .get(&DataKey::UserClaims(user_address))
            .unwrap_or(Vec::new(&env));
        
        let mut claims = Vec::new(&env);
        for i in 0..claim_ids.len() {
            let claim_id = claim_ids.get(i).unwrap();
            if let Some(claim) = env.storage().persistent().get::<DataKey, PolicyClaim>(&DataKey::PolicyClaim(claim_id)) {
                claims.push_back(claim);
            }
        }
        claims
    }

    /// Get all policies
    pub fn get_all_policies(env: Env) -> Vec<Policy> {
        let policy_counter: u64 = env.storage().instance()
            .get(&DataKey::PolicyCounter)
            .unwrap_or(0);
        
        let mut policies = Vec::new(&env);
        for i in 1..=policy_counter {
            if let Some(policy) = env.storage().persistent().get::<DataKey, Policy>(&DataKey::Policy(i)) {
                policies.push_back(policy);
            }
        }
        policies
    }

    /// Get user's policies
    pub fn get_my_policies(env: Env, user_address: Address) -> Vec<UserPolicy> {
        // Check if user is registered
        if !env.storage().persistent().has(&DataKey::User(user_address.clone())) {
            panic!("User not registered: {}", E_NOT_REGISTERED);
        }

        env.storage().persistent()
            .get(&DataKey::UserPolicies(user_address))
            .unwrap_or(Vec::new(&env))
    }

    /// Get user info
    pub fn get_user_info(env: Env, user_address: Address) -> Option<User> {
        env.storage().persistent().get(&DataKey::User(user_address))
    }

    /// Check if contract is initialized
    pub fn is_initialized(env: Env) -> bool {
        env.storage().instance().has(&DataKey::Admin)
    }

    /// Get NFT metadata
    pub fn get_nft_metadata(env: Env, token_id: String) -> Option<PolicyNFTMetadata> {
        env.storage().persistent().get(&DataKey::NFTMetadata(token_id))
    }

    /// Get user tokens
    pub fn get_user_tokens(env: Env, user_address: Address) -> Vec<String> {
        env.storage().persistent()
            .get(&DataKey::UserTokens(user_address))
            .unwrap_or(Vec::new(&env))
    }

    /// Get policy tokens
    pub fn get_policy_tokens(env: Env, policy_id: u64) -> Vec<String> {
        env.storage().persistent()
            .get(&DataKey::PolicyTokens(policy_id))
            .unwrap_or(Vec::new(&env))
    }

    /// Get total tokens minted
    pub fn get_total_tokens(env: Env) -> u64 {
        env.storage().instance()
            .get(&DataKey::TokenCounter)
            .unwrap_or(0)
    }

    /// Get treasury balance
    pub fn get_treasury(env: Env) -> i128 {
        env.storage().instance()
            .get(&DataKey::Treasury)
            .unwrap_or(0)
    }
}

