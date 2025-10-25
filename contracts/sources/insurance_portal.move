module insurance_platform::insurance_portal {
    use std::error;
    use std::signer;
    use std::string::{Self, String};
    use std::vector;
    use std::option::{Self, Option};
    use aptos_framework::timestamp;
    use aptos_framework::object::{Self, Object};
    use aptos_framework::event::{Self, EventHandle};
    use aptos_framework::account::{Self, SignerCapability};
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_std::table::{Self, Table};
    use aptos_token_objects::collection::{Self, Collection};
    use aptos_token_objects::token::{Self, Token};
    use aptos_token_objects::property_map::{Self, PropertyMap};

    /// Errors
    const E_NOT_ADMIN: u64 = 1;
    const E_NOT_POLICYHOLDER: u64 = 2;
    const E_POLICY_NOT_FOUND: u64 = 3;
    const E_ALREADY_REGISTERED: u64 = 4;
    const E_INVALID_ROLE: u64 = 5;
    const E_NOT_REGISTERED: u64 = 6;
    const E_ALREADY_PURCHASED: u64 = 7;
    const E_COLLECTION_NOT_FOUND: u64 = 8;
    const E_TOKEN_NOT_FOUND: u64 = 9;
    const E_INSUFFICIENT_PAYMENT: u64 = 10;
    const E_ESCROW_NOT_FOUND: u64 = 11;

    /// User roles - similar to FarmAssure
    const ROLE_UNREGISTERED: u8 = 0;
    const ROLE_POLICYHOLDER: u8 = 1;
    const ROLE_ADMIN: u8 = 2;

    /// Policy types
    const POLICY_TYPE_HEALTH: u8 = 1;
    const POLICY_TYPE_LIFE: u8 = 2;
    const POLICY_TYPE_AUTO: u8 = 3;
    const POLICY_TYPE_HOME: u8 = 4;
    const POLICY_TYPE_TRAVEL: u8 = 5;

    /// Payment constants
    const APT_DECIMALS: u64 = 100000000; // 1 APT = 10^8 Octas
    const INR_TO_APT_RATE: u64 = 1000000; // 1 APT = 10 INR (simplified for demo)
    const ESCROW_DURATION_SECONDS: u64 = 2592000; // 30 days in seconds

    /// User struct - similar to FarmAssure User
    struct User has store, copy, drop {
        wallet: address,
        role: u8,
        registered: bool,
        name: String,
        location: String,
        contact: String,
        registered_at: u64,
    }

    /// Insurance Policy struct
    struct Policy has store, copy, drop {
        policy_id: u64,
        title: String,
        description: String,
        policy_type: u8,
        monthly_premium: u64,
        yearly_premium: u64,
        coverage_amount: u64,
        min_age: u64,
        max_age: u64,
        duration_days: u64,
        waiting_period_days: u64,
        created_at: u64,
        created_by: address,
    }

    /// User's purchased policy (now includes NFT data and payment info)
    struct UserPolicy has store, copy, drop {
        policy_id: u64,
        user_address: address,
        purchase_date: u64,
        expiry_date: u64,
        premium_paid_apt: u64,   // Premium paid in APT (Octas)
        monthly_premium_apt: u64, // Monthly premium in APT
        active: bool,
        token_id: String,        // NFT token ID
        metadata_uri: String,    // IPFS metadata URI
        escrow_id: u64,          // Reference to escrow
    }

    /// NFT Metadata for policies
    struct PolicyNFTMetadata has store, copy, drop {
        name: String,
        description: String,
        image_uri: String,
        coverage_amount: u64,
        validity_start: u64,
        validity_end: u64,
        premium_amount: u64,
        policy_type: u8,
    }

    /// Collection info for insurance policies
    struct PolicyCollection has store, copy, drop {
        collection_name: String,
        collection_description: String,
        collection_uri: String,
        collection_object: Object<Collection>,
    }

    /// Escrow for monthly payments
    struct PaymentEscrow has store, copy, drop {
        user_address: address,
        policy_id: u64,
        monthly_premium_apt: u64,  // Monthly premium in APT (Octas)
        next_payment_due: u64,     // Timestamp for next payment
        payments_made: u64,        // Number of payments made
        total_payments_required: u64, // Total payments for policy duration
        escrow_balance: u64,       // Current escrow balance in APT
        active: bool,
    }

    /// Global state - like FarmAssure's mappings
    struct InsurancePortal has key {
        users: Table<address, User>,
        policies: Table<u64, Policy>,
        user_policies: Table<address, vector<UserPolicy>>,
        nft_metadata: Table<String, PolicyNFTMetadata>,     // token_id -> metadata
        policy_tokens: Table<u64, vector<String>>,          // policy_id -> token_ids
        user_tokens: Table<address, vector<String>>,        // user -> token_ids
        payment_escrows: Table<u64, PaymentEscrow>,         // escrow_id -> escrow
        user_escrows: Table<address, vector<u64>>,          // user -> escrow_ids
        policy_claims: Table<u64, PolicyClaim>,             // claim_id -> claim
        user_claims: Table<address, vector<u64>>,           // user -> claim_ids
        admins: vector<address>,
        policy_counter: u64,
        token_counter: u64,
        escrow_counter: u64,
        claim_counter: u64,
        collection_info: Option<PolicyCollection>,
        signer_cap: SignerCapability,
        treasury: u64,                                      // Platform treasury in APT
        // Event handles
        policy_purchased_events: EventHandle<PolicyPurchasedEvent>,
        policy_created_events: EventHandle<PolicyCreatedEvent>,
        user_registered_events: EventHandle<UserRegisteredEvent>,
        payment_events: EventHandle<PaymentEvent>,
        policy_claimed_events: EventHandle<PolicyClaimedEvent>,
    }

    /// Events
    struct UserRegisteredEvent has drop, store {
        user: address,
        role: u8,
        timestamp: u64,
    }

    struct PolicyCreatedEvent has drop, store {
        policy_id: u64,
        title: String,
        created_by: address,
        timestamp: u64,
    }

    struct PolicyPurchasedEvent has drop, store {
        policy_id: u64,
        user: address,
        premium_paid_apt: u64,      // Premium paid in APT (Octas)
        monthly_premium_apt: u64,   // Monthly premium in APT
        token_id: String,           // NFT token ID
        metadata_uri: String,       // IPFS metadata URI
        token_object: Object<Token>, // Token object reference
        escrow_id: u64,             // Escrow ID for monthly payments
        timestamp: u64,
    }

    struct PaymentEvent has drop, store {
        user: address,
        policy_id: u64,
        escrow_id: u64,
        amount_apt: u64,            // Amount paid in APT (Octas)
        payment_type: String,       // "initial" or "monthly"
        next_payment_due: u64,      // Next payment timestamp
        timestamp: u64,
    }

    /// Claim status constants
    const CLAIM_STATUS_APPROVED: u8 = 1;
    const CLAIM_STATUS_PENDING: u8 = 2;
    const CLAIM_STATUS_REJECTED: u8 = 3;

    /// Policy claim struct
    struct PolicyClaim has store, copy, drop {
        claim_id: u64,
        policy_id: u64,
        user_address: address,
        claim_amount: u64,
        aggregate_score: u8,
        status: u8,
        claimed_at: u64,
        processed_at: u64,
    }

    struct PolicyClaimedEvent has drop, store {
        claim_id: u64,
        policy_id: u64,
        user: address,
        claim_amount: u64,
        aggregate_score: u8,
        status: u8,
        timestamp: u64,
    }

    /// Initialize the portal (called once)
    fun init_module(admin: &signer) {
        // Create resource account for NFT minting
        let (resource_signer, signer_cap) = account::create_resource_account(admin, b"insurance_nft_seed");
        
        // Create NFT collection
        let collection_name = string::utf8(b"ChainSure Insurance Policies");
        let collection_description = string::utf8(b"NFT collection representing insurance policies on ChainSure platform");
        let collection_uri = string::utf8(b"https://chainsure.io/collection.json");
        
        let collection_constructor_ref = collection::create_unlimited_collection(
            &resource_signer,
            collection_description,
            collection_name,
            option::none(),
            collection_uri,
        );
        let collection_object = object::object_from_constructor_ref<Collection>(&collection_constructor_ref);

        let collection_info = PolicyCollection {
            collection_name,
            collection_description,
            collection_uri,
            collection_object,
        };

        let portal = InsurancePortal {
            users: table::new(),
            policies: table::new(),
            user_policies: table::new(),
            nft_metadata: table::new(),
            policy_tokens: table::new(),
            user_tokens: table::new(),
            payment_escrows: table::new(),
            user_escrows: table::new(),
            policy_claims: table::new(),
            user_claims: table::new(),
            admins: vector::singleton(signer::address_of(admin)),
            policy_counter: 0,
            token_counter: 0,
            escrow_counter: 0,
            claim_counter: 0,
            collection_info: option::some(collection_info),
            signer_cap,
            treasury: 0,
            policy_purchased_events: account::new_event_handle<PolicyPurchasedEvent>(&resource_signer),
            policy_created_events: account::new_event_handle<PolicyCreatedEvent>(&resource_signer),
            user_registered_events: account::new_event_handle<UserRegisteredEvent>(&resource_signer),
            payment_events: account::new_event_handle<PaymentEvent>(&resource_signer),
            policy_claimed_events: account::new_event_handle<PolicyClaimedEvent>(&resource_signer),
        };
        
        // Register the deployer as admin user
        let admin_addr = signer::address_of(admin);
        let admin_user = User {
            wallet: admin_addr,
            role: ROLE_ADMIN,
            registered: true,
            name: string::utf8(b"Contract Admin"),
            location: string::utf8(b""),
            contact: string::utf8(b""),
            registered_at: timestamp::now_seconds(),
        };
        
        table::add(&mut portal.users, admin_addr, admin_user);
        table::add(&mut portal.user_policies, admin_addr, vector::empty<UserPolicy>());
        table::add(&mut portal.user_tokens, admin_addr, vector::empty<String>());
        table::add(&mut portal.user_escrows, admin_addr, vector::empty<u64>());
        table::add(&mut portal.user_claims, admin_addr, vector::empty<u64>());
        
        move_to(admin, portal);
    }

    /// Register user with role (like FarmAssure registerUser)
    public entry fun register_user(user: &signer, role: u8) acquires InsurancePortal {
        let user_addr = signer::address_of(user);
        assert!(role == ROLE_POLICYHOLDER || role == ROLE_ADMIN, error::invalid_argument(E_INVALID_ROLE));
        
        let portal = borrow_global_mut<InsurancePortal>(@insurance_platform);
        assert!(!table::contains(&portal.users, user_addr), error::already_exists(E_ALREADY_REGISTERED));

        let new_user = User {
            wallet: user_addr,
            role,
            registered: true,
            name: string::utf8(b""),
            location: string::utf8(b""),
            contact: string::utf8(b""),
            registered_at: timestamp::now_seconds(),
        };

        table::add(&mut portal.users, user_addr, new_user);

        // Add to admins list if admin
        if (role == ROLE_ADMIN) {
            vector::push_back(&mut portal.admins, user_addr);
        };

        // Initialize user policies, tokens, escrows, and claims vectors
        table::add(&mut portal.user_policies, user_addr, vector::empty<UserPolicy>());
        table::add(&mut portal.user_tokens, user_addr, vector::empty<String>());
        table::add(&mut portal.user_escrows, user_addr, vector::empty<u64>());
        table::add(&mut portal.user_claims, user_addr, vector::empty<u64>());

        // Emit event
        event::emit_event(&mut portal.user_registered_events, UserRegisteredEvent {
            user: user_addr,
            role,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Get user role (key function for auto-login)
    #[view]
    public fun get_user_role(user_address: address): u8 acquires InsurancePortal {
        let portal = borrow_global<InsurancePortal>(@insurance_platform);
        if (table::contains(&portal.users, user_address)) {
            let user = table::borrow(&portal.users, user_address);
            user.role
        } else {
            ROLE_UNREGISTERED
        }
    }

    /// Admin only: Create policy
    public entry fun create_policy(
        admin: &signer,
        title: String,
        description: String,
        policy_type: u8,
        monthly_premium: u64,
        yearly_premium: u64,
        coverage_amount: u64,
        min_age: u64,
        max_age: u64,
        duration_days: u64,
        waiting_period_days: u64,
    ) acquires InsurancePortal {
        let admin_addr = signer::address_of(admin);
        let portal = borrow_global_mut<InsurancePortal>(@insurance_platform);
        
        // Check if user is admin or deployer
        if (admin_addr != @insurance_platform) {
            assert!(table::contains(&portal.users, admin_addr), error::not_found(E_NOT_ADMIN));
            let user = table::borrow(&portal.users, admin_addr);
            assert!(user.role == ROLE_ADMIN, error::permission_denied(E_NOT_ADMIN));
        };

        // Create policy
        portal.policy_counter = portal.policy_counter + 1;
        let policy_id = portal.policy_counter;

        let policy = Policy {
            policy_id,
            title,
            description,
            policy_type,
            monthly_premium,
            yearly_premium,
            coverage_amount,
            min_age,
            max_age,
            duration_days,
            waiting_period_days,
            created_at: timestamp::now_seconds(),
            created_by: admin_addr,
        };

        table::add(&mut portal.policies, policy_id, policy);
        
        // Initialize policy tokens vector
        table::add(&mut portal.policy_tokens, policy_id, vector::empty<String>());

        // Emit event
        event::emit_event(&mut portal.policy_created_events, PolicyCreatedEvent {
            policy_id,
            title,
            created_by: admin_addr,
            timestamp: timestamp::now_seconds(),
        });
    }

    /// Policyholder only: Purchase policy with payment and NFT minting
    public entry fun purchase_policy(
        user: &signer,
        policy_id: u64,
        metadata_uri: String,  // IPFS metadata URI
        payment_amount_apt: u64,  // Payment amount in Octas (APT)
    ) acquires InsurancePortal {
        let user_addr = signer::address_of(user);
        let portal = borrow_global_mut<InsurancePortal>(@insurance_platform);
        
        // Check if user is policyholder
        assert!(table::contains(&portal.users, user_addr), error::not_found(E_NOT_POLICYHOLDER));
        let user_info = table::borrow(&portal.users, user_addr);
        assert!(user_info.role == ROLE_POLICYHOLDER, error::permission_denied(E_NOT_POLICYHOLDER));

        // Check if policy exists
        assert!(table::contains(&portal.policies, policy_id), error::not_found(E_POLICY_NOT_FOUND));
        let policy = table::borrow(&portal.policies, policy_id);

        // Validate payment amount matches policy premium
        let monthly_premium_inr = policy.monthly_premium;
        let expected_apt = (monthly_premium_inr * APT_DECIMALS) / INR_TO_APT_RATE;
        assert!(payment_amount_apt >= expected_apt, error::invalid_argument(E_INSUFFICIENT_PAYMENT));

        // Transfer payment to module/treasury account instead of destroying coins
        // This avoids "Cannot destroy non-zero coins" simulation error.
        // Keep an accounting tally in `portal.treasury` as before.
        coin::transfer<AptosCoin>(user, @insurance_platform, payment_amount_apt);
        let payment_amount = payment_amount_apt;
        portal.treasury = portal.treasury + payment_amount;

        // Create payment escrow for monthly payments
        portal.escrow_counter = portal.escrow_counter + 1;
        let escrow_id = portal.escrow_counter;
        let current_time = timestamp::now_seconds();
        let next_payment_due = current_time + ESCROW_DURATION_SECONDS;
        
        let total_months = policy.duration_days / 30; // Approximate months
        let escrow = PaymentEscrow {
            user_address: user_addr,
            policy_id,
            monthly_premium_apt: payment_amount_apt,
            next_payment_due,
            payments_made: 1, // First payment already made
            total_payments_required: total_months,
            escrow_balance: 0, // Can be used for future prepayments
            active: true,
        };
        
        table::add(&mut portal.payment_escrows, escrow_id, escrow);
        
        // Add escrow to user's escrow list
        let user_escrows = table::borrow_mut(&mut portal.user_escrows, user_addr);
        vector::push_back(user_escrows, escrow_id);

        // Generate unique token ID
        portal.token_counter = portal.token_counter + 1;
        let token_id = string::utf8(b"POLICY_");
        string::append(&mut token_id, u64_to_string(portal.token_counter));

        // Get resource signer for NFT minting
        let resource_signer = account::create_signer_with_capability(&portal.signer_cap);
        
        // Create NFT metadata
        let expiry_time = current_time + (policy.duration_days * 24 * 60 * 60);
        
        let token_name = string::utf8(b"Policy #");
        string::append(&mut token_name, u64_to_string(policy_id));
        
        let token_description = policy.description;
        string::append(&mut token_description, string::utf8(b" - NFT Certificate"));

        // Mint NFT to user (simplified version)
        let collection_name = string::utf8(b"ChainSure Insurance Policies");
        let constructor_ref = token::create_named_token(
            &resource_signer,
            collection_name,
            token_description,
            token_name,
            option::none(),  // Simplified - no properties for now
            metadata_uri,
        );

        // Get token object and transfer to user
        let token_obj = object::object_from_constructor_ref<Token>(&constructor_ref);
        object::transfer(&resource_signer, token_obj, user_addr);

        // Store NFT metadata
        let nft_metadata = PolicyNFTMetadata {
            name: token_name,
            description: token_description,
            image_uri: metadata_uri,
            coverage_amount: policy.coverage_amount,
            validity_start: current_time,
            validity_end: expiry_time,
            premium_amount: policy.yearly_premium,
            policy_type: policy.policy_type,
        };
        table::add(&mut portal.nft_metadata, token_id, nft_metadata);

        // Create user policy with NFT data and payment info
        let user_policy = UserPolicy {
            policy_id,
            user_address: user_addr,
            purchase_date: current_time,
            expiry_date: expiry_time,
            premium_paid_apt: payment_amount,
            monthly_premium_apt: payment_amount_apt,
            active: true,
            token_id,
            metadata_uri,
            escrow_id,
        };

        // Add to user policies
        let user_policies = table::borrow_mut(&mut portal.user_policies, user_addr);
        vector::push_back(user_policies, user_policy);

        // Add token to tracking tables
        let policy_tokens = table::borrow_mut(&mut portal.policy_tokens, policy_id);
        vector::push_back(policy_tokens, token_id);
        
        let user_tokens = table::borrow_mut(&mut portal.user_tokens, user_addr);
        vector::push_back(user_tokens, token_id);

        // Emit events
        event::emit_event(&mut portal.policy_purchased_events, PolicyPurchasedEvent {
            policy_id,
            user: user_addr,
            premium_paid_apt: payment_amount,
            monthly_premium_apt: payment_amount_apt,
            token_id,
            metadata_uri,
            token_object: token_obj,
            escrow_id,
            timestamp: current_time,
        });

        event::emit_event(&mut portal.payment_events, PaymentEvent {
            user: user_addr,
            policy_id,
            escrow_id,
            amount_apt: payment_amount,
            payment_type: string::utf8(b"initial"),
            next_payment_due,
            timestamp: current_time,
        });
    }

    /// Policyholder only: Claim policy with fraud detection
    public entry fun claim_policy(
        user: &signer,
        policy_id: u64,
        aggregate_score: u8,
    ) acquires InsurancePortal {
        let user_addr = signer::address_of(user);
        let portal = borrow_global_mut<InsurancePortal>(@insurance_platform);
        
        // Check if user is policyholder
        assert!(table::contains(&portal.users, user_addr), error::not_found(E_NOT_POLICYHOLDER));
        let user_info = table::borrow(&portal.users, user_addr);
        assert!(user_info.role == ROLE_POLICYHOLDER, error::permission_denied(E_NOT_POLICYHOLDER));

        // Check if policy exists
        assert!(table::contains(&portal.policies, policy_id), error::not_found(E_POLICY_NOT_FOUND));
        let policy = table::borrow(&portal.policies, policy_id);

        // Check if user has this policy
        let user_policies = table::borrow(&portal.user_policies, user_addr);
        let has_policy = false;
        let policy_coverage = 0u64;
        let i = 0;
        while (i < vector::length(user_policies)) {
            let user_policy = vector::borrow(user_policies, i);
            if (user_policy.policy_id == policy_id && user_policy.active) {
                has_policy = true;
                policy_coverage = policy.coverage_amount;
                break
            };
            i = i + 1;
        };
        assert!(has_policy, error::not_found(E_POLICY_NOT_FOUND));

        // Generate claim ID
        portal.claim_counter = portal.claim_counter + 1;
        let claim_id = portal.claim_counter;
        let current_time = timestamp::now_seconds();

        // Determine status based on aggregate score
        let status = if (aggregate_score <= 30) {
            CLAIM_STATUS_APPROVED
        } else if (aggregate_score <= 70) {
            CLAIM_STATUS_PENDING
        } else {
            CLAIM_STATUS_REJECTED
        };

        // Create claim record
        let claim = PolicyClaim {
            claim_id,
            policy_id,
            user_address: user_addr,
            claim_amount: policy_coverage,
            aggregate_score,
            status,
            claimed_at: current_time,
            processed_at: current_time,
        };

        // Store claim
        table::add(&mut portal.policy_claims, claim_id, claim);
        
        // Add to user claims
        let user_claims = table::borrow_mut(&mut portal.user_claims, user_addr);
        vector::push_back(user_claims, claim_id);

        // If approved (score 0-30), transfer funds from admin to user
        if (status == CLAIM_STATUS_APPROVED) {
            // Get resource signer for transfers
            let resource_signer = account::create_signer_with_capability(&portal.signer_cap);
            // Transfer coverage amount from admin account to user
            coin::transfer<AptosCoin>(&resource_signer, user_addr, policy_coverage);
        };

        // Emit event
        event::emit_event(&mut portal.policy_claimed_events, PolicyClaimedEvent {
            claim_id,
            policy_id,
            user: user_addr,
            claim_amount: policy_coverage,
            aggregate_score,
            status,
            timestamp: current_time,
        });
    }

    /// Admin only: Approve pending claim manually
    public entry fun approve_claim(
        admin: &signer,
        claim_id: u64,
    ) acquires InsurancePortal {
        let admin_addr = signer::address_of(admin);
        let portal = borrow_global_mut<InsurancePortal>(@insurance_platform);
        
        // Check if user is admin or deployer
        if (admin_addr != @insurance_platform) {
            assert!(table::contains(&portal.users, admin_addr), error::not_found(E_NOT_ADMIN));
            let user = table::borrow(&portal.users, admin_addr);
            assert!(user.role == ROLE_ADMIN, error::permission_denied(E_NOT_ADMIN));
        };

        // Check if claim exists and is pending
        assert!(table::contains(&portal.policy_claims, claim_id), error::not_found(E_POLICY_NOT_FOUND));
        let claim = table::borrow_mut(&mut portal.policy_claims, claim_id);
        assert!(claim.status == CLAIM_STATUS_PENDING, error::invalid_argument(E_INVALID_ROLE));

        // Update claim status
        claim.status = CLAIM_STATUS_APPROVED;
        claim.processed_at = timestamp::now_seconds();

        // Transfer funds from admin to user
        let resource_signer = account::create_signer_with_capability(&portal.signer_cap);
        coin::transfer<AptosCoin>(&resource_signer, claim.user_address, claim.claim_amount);

        // Emit event
        event::emit_event(&mut portal.policy_claimed_events, PolicyClaimedEvent {
            claim_id,
            policy_id: claim.policy_id,
            user: claim.user_address,
            claim_amount: claim.claim_amount,
            aggregate_score: claim.aggregate_score,
            status: CLAIM_STATUS_APPROVED,
            timestamp: claim.processed_at,
        });
    }

    /// Get claim status
    #[view]
    public fun get_claim_status(claim_id: u64): (u8, u64, u8) acquires InsurancePortal {
        let portal = borrow_global<InsurancePortal>(@insurance_platform);
        assert!(table::contains(&portal.policy_claims, claim_id), error::not_found(E_POLICY_NOT_FOUND));
        let claim = table::borrow(&portal.policy_claims, claim_id);
        (claim.status, claim.claim_amount, claim.aggregate_score)
    }

    /// Get all claims for admin
    #[view]
    public fun get_all_claims(): vector<PolicyClaim> acquires InsurancePortal {
        let portal = borrow_global<InsurancePortal>(@insurance_platform);
        let claims = vector::empty<PolicyClaim>();
        let i = 1;
        while (i <= portal.claim_counter) {
            if (table::contains(&portal.policy_claims, i)) {
                let claim = table::borrow(&portal.policy_claims, i);
                vector::push_back(&mut claims, *claim);
            };
            i = i + 1;
        };
        claims
    }

    /// Get user claims
    #[view]
    public fun get_user_claims(user_address: address): vector<PolicyClaim> acquires InsurancePortal {
        let portal = borrow_global<InsurancePortal>(@insurance_platform);
        let claims = vector::empty<PolicyClaim>();
        
        if (table::contains(&portal.user_claims, user_address)) {
            let user_claim_ids = table::borrow(&portal.user_claims, user_address);
            let i = 0;
            while (i < vector::length(user_claim_ids)) {
                let claim_id = *vector::borrow(user_claim_ids, i);
                if (table::contains(&portal.policy_claims, claim_id)) {
                    let claim = table::borrow(&portal.policy_claims, claim_id);
                    vector::push_back(&mut claims, *claim);
                };
                i = i + 1;
            };
        };
        claims
    }

    /// Get all policies (for display)
    #[view]
    public fun get_all_policies(): vector<Policy> acquires InsurancePortal {
        let portal = borrow_global<InsurancePortal>(@insurance_platform);
        let policies = vector::empty<Policy>();
        let i = 1;
        while (i <= portal.policy_counter) {
            if (table::contains(&portal.policies, i)) {
                let policy = *table::borrow(&portal.policies, i);
                vector::push_back(&mut policies, policy);
            };
            i = i + 1;
        };
        policies
    }

    /// Policyholder only: Get my policies
    #[view] 
    public fun get_my_policies(user_address: address): vector<UserPolicy> acquires InsurancePortal {
        let portal = borrow_global<InsurancePortal>(@insurance_platform);
        
        // Check if user is registered
        assert!(table::contains(&portal.users, user_address), error::not_found(E_NOT_REGISTERED));
        
        if (table::contains(&portal.user_policies, user_address)) {
            *table::borrow(&portal.user_policies, user_address)
        } else {
            vector::empty<UserPolicy>()
        }
    }

    /// Get user info
    #[view]
    public fun get_user_info(user_address: address): (String, String, String, u8, bool, u64) acquires InsurancePortal {
        let portal = borrow_global<InsurancePortal>(@insurance_platform);
        if (table::contains(&portal.users, user_address)) {
            let user = table::borrow(&portal.users, user_address);
            (user.name, user.location, user.contact, user.role, user.registered, user.registered_at)
        } else {
            (string::utf8(b""), string::utf8(b""), string::utf8(b""), ROLE_UNREGISTERED, false, 0)
        }
    }

    /// Check if portal is initialized
    #[view]
    public fun is_initialized(): bool {
        exists<InsurancePortal>(@insurance_platform)
    }

    /// Get NFT metadata by token ID
    #[view]
    public fun get_nft_metadata(token_id: String): PolicyNFTMetadata acquires InsurancePortal {
        let portal = borrow_global<InsurancePortal>(@insurance_platform);
        *table::borrow(&portal.nft_metadata, token_id)
    }

    /// Get all tokens owned by user
    #[view]
    public fun get_user_tokens(user_address: address): vector<String> acquires InsurancePortal {
        let portal = borrow_global<InsurancePortal>(@insurance_platform);
        if (table::contains(&portal.user_tokens, user_address)) {
            *table::borrow(&portal.user_tokens, user_address)
        } else {
            vector::empty<String>()
        }
    }

    /// Get all tokens for a specific policy
    #[view]
    public fun get_policy_tokens(policy_id: u64): vector<String> acquires InsurancePortal {
        let portal = borrow_global<InsurancePortal>(@insurance_platform);
        if (table::contains(&portal.policy_tokens, policy_id)) {
            *table::borrow(&portal.policy_tokens, policy_id)
        } else {
            vector::empty<String>()
        }
    }

    /// Get collection information
    #[view]
    public fun get_collection_info(): (String, String, String) acquires InsurancePortal {
        let portal = borrow_global<InsurancePortal>(@insurance_platform);
        let collection = option::borrow(&portal.collection_info);
        (collection.collection_name, collection.collection_description, collection.collection_uri)
    }

    /// Get total tokens minted
    #[view]
    public fun get_total_tokens(): u64 acquires InsurancePortal {
        let portal = borrow_global<InsurancePortal>(@insurance_platform);
        portal.token_counter
    }

    /// Helper function to convert u64 to string
    fun u64_to_string(value: u64): String {
        if (value == 0) {
            return string::utf8(b"0")
        };
        
        let digits = vector::empty<u8>();
        let temp_value = value;
        
        while (temp_value > 0) {
            let digit = ((temp_value % 10) as u8) + 48; // Convert to ASCII
            vector::push_back(&mut digits, digit);
            temp_value = temp_value / 10;
        };
        
        vector::reverse(&mut digits);
        string::utf8(digits)
    }

    /// Get detailed policy info with NFT data
    #[view]
    public fun get_policy_with_nfts(policy_id: u64): (Policy, vector<String>) acquires InsurancePortal {
        let portal = borrow_global<InsurancePortal>(@insurance_platform);
        let policy = *table::borrow(&portal.policies, policy_id);
        let tokens = if (table::contains(&portal.policy_tokens, policy_id)) {
            *table::borrow(&portal.policy_tokens, policy_id)
        } else {
            vector::empty<String>()
        };
        (policy, tokens)
    }
}
