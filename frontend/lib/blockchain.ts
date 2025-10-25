import * as StellarSdk from "stellar-sdk";
import { 
  isConnected as freighterIsConnected,
  getPublicKey,
  signTransaction,
} from "@stellar/freighter-api";

// Type declaration for Freighter wallet
declare global {
  interface Window {
    freighter: any;
  }
}

// Contract ID - Deployed to Stellar Testnet
export const CONTRACT_ID = "CAXSVRMIEAMSMB47V2TLFT6YHCNDQNM67GKQ5LDRY7AH5PTJAV55IW7E";

// Stellar Testnet configuration
export const STELLAR_NETWORK = StellarSdk.Networks.TESTNET;
export const HORIZON_URL = "https://horizon-testnet.stellar.org";
export const SOROBAN_RPC_URL = "https://soroban-testnet.stellar.org:443";

// Initialize Stellar SDK
const server = new StellarSdk.Horizon.Server(HORIZON_URL);
const sorobanServer = new StellarSdk.SorobanRpc.Server(SOROBAN_RPC_URL);

// Role constants - same as Aptos version
export const ROLE_UNREGISTERED = 0;
export const ROLE_POLICYHOLDER = 1;
export const ROLE_ADMIN = 2;

// Policy type constants
export const POLICY_TYPE_HEALTH = 1;
export const POLICY_TYPE_LIFE = 2;
export const POLICY_TYPE_AUTO = 3;
export const POLICY_TYPE_HOME = 4;
export const POLICY_TYPE_TRAVEL = 5;

// Policy status constants
export const POLICY_STATUS_ACTIVE = 1;
export const POLICY_STATUS_INACTIVE = 2;

// User policy status constants
export const USER_POLICY_STATUS_ACTIVE = 1;
export const USER_POLICY_STATUS_EXPIRED = 2;
export const USER_POLICY_STATUS_CANCELLED = 3;

export interface BlockchainPolicy {
  policy_id: string;
  title: string;
  description: string;
  policy_type: number;
  monthly_premium: string;
  yearly_premium: string;
  coverage_amount: string;
  min_age: string;
  max_age: string;
  duration_days: string;
  waiting_period_days: string;
  status: number;
  created_at: string;
  created_by: string;
}

export interface BlockchainUserPolicy {
  id: string;
  policy_id: string;
  user_address: string;
  purchase_date: string;
  expiry_date: string;
  premium_paid: string;
  status: number;
  token_id: string;
  metadata_uri: string;
}

export interface PolicyClaim {
  claim_id: string;
  policy_id: string;
  user_address: string;
  claim_amount: string;
  aggregate_score: number;
  status: number; // 1=APPROVED, 2=PENDING, 3=REJECTED
  claimed_at: string;
  processed_at: string;
}

export interface PolicyNFTMetadata {
  name: string;
  description: string;
  image_uri: string;
  coverage_amount: string;
  validity_start: string;
  validity_end: string;
  premium_amount: string;
  policy_type: number;
}

// Payment constants (XLM instead of APT)
export const XLM_DECIMALS = 10000000; // 1 XLM = 10^7 stroops
export const INR_TO_XLM_RATE = 1000000; // 1 XLM = 10 INR (simplified for demo)

/**
 * Convert INR to XLM (stroops)
 */
export function convertINRToXLM(inrAmount: number): number {
  return Math.floor((inrAmount * XLM_DECIMALS) / INR_TO_XLM_RATE);
}

/**
 * Convert XLM (stroops) to INR
 */
export function convertXLMToINR(xlmStroops: number): number {
  return Math.floor((xlmStroops * INR_TO_XLM_RATE) / XLM_DECIMALS);
}

/**
 * Format XLM amount for display
 */
export function formatXLM(stroops: number): string {
  return (stroops / XLM_DECIMALS).toFixed(4) + " XLM";
}

/**
 * Check if Freighter wallet is available
 */
export async function isFreighterAvailable(): Promise<boolean> {
  return await freighterIsConnected();
}

/**
 * Get connected wallet public key
 */
export async function getWalletPublicKey(): Promise<string> {
  try {
    const publicKey = await getPublicKey();
    return publicKey;
  } catch (error) {
    console.error("Error getting public key:", error);
    throw new Error("Failed to get wallet public key");
  }
}

/**
 * Build and sign a Soroban contract invocation
 */
async function invokeContract(
  functionName: string,
  args: StellarSdk.xdr.ScVal[],
  auth: boolean = true
): Promise<{ success: boolean; transactionHash?: string; result?: any; error?: string }> {
  try {
    const publicKey = await getWalletPublicKey();
    
    // Load account from Horizon (make sure account is funded)
    let sourceAccount;
    try {
      sourceAccount = await server.loadAccount(publicKey);
    } catch (error) {
      console.error("Failed to load account. Make sure your account is funded on Stellar Testnet.");
      console.log("Get testnet XLM at: https://laboratory.stellar.org/#account-creator");
      throw new Error("Account not found or not funded. Please fund your account with testnet XLM first.");
    }

    // Build the contract invocation operation
    const contract = new StellarSdk.Contract(CONTRACT_ID);
    const operation = contract.call(functionName, ...args);

    // Build transaction with higher fee for Soroban
    // Soroban transactions typically need much higher fees than BASE_FEE (100 stroops)
    // Use 100000 stroops (0.01 XLM) as base, prepareTransaction will adjust as needed
    let transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: "100000", // Higher fee for Soroban contract invocations
      networkPassphrase: STELLAR_NETWORK,
    })
      .addOperation(operation)
      .setTimeout(180) // Increased timeout for Soroban
      .build();

    // Prepare and simulate the transaction
    try {
      console.log("Transaction before prepare:", transaction);
      console.log("Source account:", publicKey);
      console.log("Operation:", operation);
      
      transaction = await sorobanServer.prepareTransaction(transaction);
      
      console.log("Transaction after prepare:", transaction);
      console.log("Transaction operations:", transaction.operations);
    } catch (error: any) {
      console.error("Failed to prepare transaction:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      
      // Try to extract more detailed error info
      if (error.response?.data) {
        try {
          const errorData = typeof error.response.data === 'string' 
            ? JSON.parse(error.response.data) 
            : error.response.data;
          console.error("Detailed error data:", errorData);
        } catch (e) {
          console.error("Raw error response:", error.response.data);
        }
      }
      
      throw new Error(`Failed to prepare transaction: ${error.message}`);
    }

    // Convert to XDR for signing
    const xdr = transaction.toXDR();

    // Sign with Freighter
    const signedXdr = await signTransaction(xdr, {
      network: "TESTNET",
      networkPassphrase: STELLAR_NETWORK,
    });

    // Submit the transaction
    const signedTx = StellarSdk.TransactionBuilder.fromXDR(signedXdr, STELLAR_NETWORK);
    const result = await sorobanServer.sendTransaction(signedTx);

    // Wait for confirmation
    if (result.status === "PENDING") {
      let attempts = 0;
      let getResponse;
      
      while (attempts < 10) {
        try {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          getResponse = await sorobanServer.getTransaction(result.hash);
          
          if (getResponse.status === "NOT_FOUND") {
            attempts++;
            continue;
          }
          
          if (getResponse.status === "SUCCESS") {
            console.log("✅ Transaction successful:", result.hash);
            console.log("Transaction response:", getResponse);
            
            // Try to get return value, but don't fail if parsing errors occur
            let returnValue;
            try {
              returnValue = getResponse.returnValue ? scValToNative(getResponse.returnValue) : undefined;
            } catch (parseError) {
              console.warn("Could not parse return value, but transaction succeeded:", parseError);
              returnValue = undefined;
            }
            
            return {
              success: true,
              transactionHash: result.hash,
              result: returnValue,
            };
          } else if (getResponse.status === "FAILED") {
            console.error("Transaction failed:", getResponse);
            return {
              success: false,
              error: `Transaction failed with status: ${getResponse.status}`,
            };
          }
          
          attempts++;
        } catch (pollError: any) {
          console.warn(`Error polling transaction (attempt ${attempts + 1}):`, pollError.message);
          attempts++;
          
          // If we've tried enough times, consider it successful since it was submitted
          if (attempts >= 10) {
            console.log("Transaction submitted but status unknown, considering successful:", result.hash);
            return {
              success: true,
              transactionHash: result.hash,
            };
          }
        }
      }
      
      // If we exhausted attempts but transaction was submitted
      console.log("Transaction submitted, status check timed out:", result.hash);
      return {
        success: true,
        transactionHash: result.hash,
      };
    }

    return {
      success: true,
      transactionHash: result.hash,
    };
  } catch (error: any) {
    console.error("Contract invocation error:", error);
    return {
      success: false,
      error: error.message || "Transaction failed",
    };
  }
}

/**
 * Simulate a contract read (view function)
 */
async function simulateContract(
  functionName: string,
  args: StellarSdk.xdr.ScVal[]
): Promise<any> {
  try {
    console.log(`🔍 Simulating contract call: ${functionName}`, args);
    
    // Create a dummy source account for simulation (doesn't need to exist)
    const dummyKeypair = StellarSdk.Keypair.random();
    const dummyAccount = new StellarSdk.Account(dummyKeypair.publicKey(), "0");

    const contract = new StellarSdk.Contract(CONTRACT_ID);
    const operation = contract.call(functionName, ...args);

    const transaction = new StellarSdk.TransactionBuilder(dummyAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: STELLAR_NETWORK,
    })
      .addOperation(operation)
      .setTimeout(30)
      .build();

    console.log(`📡 Calling Soroban RPC: ${SOROBAN_RPC_URL}`);
    const simulated = await sorobanServer.simulateTransaction(transaction);

    console.log("Simulation result:", simulated);

    if (StellarSdk.SorobanRpc.Api.isSimulationSuccess(simulated)) {
      console.log("✅ Simulation successful");
      return simulated.result?.retval;
    } else {
      console.error("❌ Simulation failed with result:", JSON.stringify(simulated, null, 2));
      
      // Extract error details if available
      if ('error' in simulated) {
        throw new Error(`Simulation failed: ${simulated.error}`);
      }
      
      throw new Error(`Simulation failed: ${JSON.stringify(simulated)}`);
    }
  } catch (error: any) {
    console.error("Contract simulation error:", error);
    console.error("Error details:", error.message, error.stack);
    throw error;
  }
}

/**
 * Helper to convert JS values to ScVal
 */
function nativeToScVal(val: any, type?: string): StellarSdk.xdr.ScVal {
  try {
    if (type === "address") {
      return StellarSdk.Address.fromString(val).toScVal();
    } else if (type === "u32") {
      return StellarSdk.nativeToScVal(Number(val), { type: "u32" });
    } else if (type === "u64") {
      return StellarSdk.nativeToScVal(BigInt(val), { type: "u64" });
    } else if (type === "i128") {
      return StellarSdk.nativeToScVal(BigInt(val), { type: "i128" });
    } else if (type === "string") {
      return StellarSdk.nativeToScVal(val, { type: "string" });
    }
    return StellarSdk.nativeToScVal(val);
  } catch (error) {
    console.error(`Error converting value to ScVal:`, val, type, error);
    throw error;
  }
}

/**
 * Helper to convert ScVal to JS values
 */
function scValToNative(val: StellarSdk.xdr.ScVal): any {
  return StellarSdk.scValToNative(val);
}

/**
 * Register a new user with a role
 */
export async function registerUser(role: number): Promise<{ success: boolean; transactionHash?: string }> {
  try {
    const publicKey = await getWalletPublicKey();
    const args = [
      nativeToScVal(publicKey, "address"),
      nativeToScVal(role, "u32"),
    ];

    return await invokeContract("register_user", args);
  } catch (error) {
    console.error("Error registering user:", error);
    throw error;
  }
}

/**
 * Register as admin
 */
export async function registerAsAdmin(): Promise<{ success: boolean; transactionHash?: string }> {
  return registerUser(ROLE_ADMIN);
}

/**
 * Register as policyholder
 */
export async function registerAsPolicyholder(): Promise<{ success: boolean; transactionHash?: string }> {
  return registerUser(ROLE_POLICYHOLDER);
}

/**
 * Get user role from blockchain
 */
export async function getUserRole(walletAddress: string): Promise<number> {
  try {
    const args = [nativeToScVal(walletAddress, "address")];
    const result = await simulateContract("get_user_role", args);
    return scValToNative(result);
  } catch (error) {
    console.error("Error getting user role:", error);
    return ROLE_UNREGISTERED;
  }
}

/**
 * Create a new insurance policy (admin only)
 */
export async function createPolicy(
  policyData: {
    title: string;
    description: string;
    policyType: number;
    monthlyPremium: number;
    yearlyPremium: number;
    coverageAmount: number;
    minAge: number;
    maxAge: number;
    durationDays: number;
    waitingPeriodDays: number;
  }
): Promise<{ success: boolean; transactionHash?: string }> {
  try {
    const publicKey = await getWalletPublicKey();
    
    // Create PolicyParams struct as ScMap with named fields
    // Soroban structs with #[contracttype] are serialized as ScMap, not ScVec
    // IMPORTANT: Map entries MUST be sorted alphabetically by key
    const mapEntries = [
      new StellarSdk.xdr.ScMapEntry({
        key: StellarSdk.xdr.ScVal.scvSymbol("coverage_amount"),
        val: nativeToScVal(policyData.coverageAmount, "i128")
      }),
      new StellarSdk.xdr.ScMapEntry({
        key: StellarSdk.xdr.ScVal.scvSymbol("description"),
        val: nativeToScVal(policyData.description, "string")
      }),
      new StellarSdk.xdr.ScMapEntry({
        key: StellarSdk.xdr.ScVal.scvSymbol("duration_days"),
        val: nativeToScVal(policyData.durationDays, "u64")
      }),
      new StellarSdk.xdr.ScMapEntry({
        key: StellarSdk.xdr.ScVal.scvSymbol("max_age"),
        val: nativeToScVal(policyData.maxAge, "u64")
      }),
      new StellarSdk.xdr.ScMapEntry({
        key: StellarSdk.xdr.ScVal.scvSymbol("min_age"),
        val: nativeToScVal(policyData.minAge, "u64")
      }),
      new StellarSdk.xdr.ScMapEntry({
        key: StellarSdk.xdr.ScVal.scvSymbol("monthly_premium"),
        val: nativeToScVal(policyData.monthlyPremium, "i128")
      }),
      new StellarSdk.xdr.ScMapEntry({
        key: StellarSdk.xdr.ScVal.scvSymbol("policy_type"),
        val: nativeToScVal(policyData.policyType, "u32")
      }),
      new StellarSdk.xdr.ScMapEntry({
        key: StellarSdk.xdr.ScVal.scvSymbol("title"),
        val: nativeToScVal(policyData.title, "string")
      }),
      new StellarSdk.xdr.ScMapEntry({
        key: StellarSdk.xdr.ScVal.scvSymbol("waiting_period_days"),
        val: nativeToScVal(policyData.waitingPeriodDays, "u64")
      }),
      new StellarSdk.xdr.ScMapEntry({
        key: StellarSdk.xdr.ScVal.scvSymbol("yearly_premium"),
        val: nativeToScVal(policyData.yearlyPremium, "i128")
      }),
    ];

    // Create ScMap from entries
    const paramsStruct = StellarSdk.xdr.ScVal.scvMap(mapEntries);

    console.log("Creating policy with params:", policyData);
    console.log("Encoded struct:", paramsStruct);

    const args = [
      nativeToScVal(publicKey, "address"),
      paramsStruct,
    ];

    return await invokeContract("create_policy", args);
  } catch (error) {
    console.error("Error creating policy:", error);
    throw error;
  }
}

/**
 * Purchase a policy with payment and NFT minting
 */
export async function purchasePolicy(
  policyId: any,
  metadataUri: string,
  monthlyPremiumINR: number
): Promise<{ success: boolean; transactionHash?: string; paymentAmount?: number; paymentAmountINR?: number }> {
  try {
    const numericPolicyId = typeof policyId === "string" ? parseInt(policyId) : policyId;

    if (!metadataUri || metadataUri.trim() === "") {
      throw new Error("Invalid metadata URI");
    }
    if (isNaN(monthlyPremiumINR) || monthlyPremiumINR <= 0) {
      throw new Error("Invalid premium amount");
    }

    // Convert INR to XLM (in stroops)
    const monthlyPremiumXLM = convertINRToXLM(monthlyPremiumINR);

    console.log(`💰 Payment Details:
    - Policy ID: ${numericPolicyId}
    - Monthly Premium: ${monthlyPremiumINR} INR = ${formatXLM(monthlyPremiumXLM)}
    - XLM Amount (stroops): ${monthlyPremiumXLM}
    - Rate: 1 XLM = ${INR_TO_XLM_RATE / XLM_DECIMALS} INR`);

    const publicKey = await getWalletPublicKey();
    
    // Get native XLM token address (SAC - Stellar Asset Contract)
    const nativeToken = StellarSdk.Asset.native();
    const nativeTokenAddress = nativeToken.contractId(STELLAR_NETWORK);

    const args = [
      nativeToScVal(publicKey, "address"),
      nativeToScVal(numericPolicyId, "u64"),
      nativeToScVal(metadataUri, "string"),
      nativeToScVal(monthlyPremiumXLM, "i128"),
      nativeToScVal(nativeTokenAddress, "address"),
    ];

    const result = await invokeContract("purchase_policy", args);

    return {
      ...result,
      paymentAmount: monthlyPremiumXLM,
      paymentAmountINR: monthlyPremiumINR,
    };
  } catch (error) {
    console.error("Error purchasing policy:", error);
    throw error;
  }
}

/**
 * Get all available policies
 */
export async function getAllPolicies(): Promise<BlockchainPolicy[]> {
  try {
    const result = await simulateContract("get_all_policies", []);
    const policies = scValToNative(result);
    
    // Convert to expected format
    return policies.map((p: any) => ({
      policy_id: p.policy_id.toString(),
      title: p.title,
      description: p.description,
      policy_type: p.policy_type,
      monthly_premium: p.monthly_premium.toString(),
      yearly_premium: p.yearly_premium.toString(),
      coverage_amount: p.coverage_amount.toString(),
      min_age: p.min_age.toString(),
      max_age: p.max_age.toString(),
      duration_days: p.duration_days.toString(),
      waiting_period_days: p.waiting_period_days.toString(),
      status: POLICY_STATUS_ACTIVE,
      created_at: p.created_at.toString(),
      created_by: p.created_by,
    }));
  } catch (error) {
    console.error("Error getting all policies:", error);
    return [];
  }
}

/**
 * Get user's purchased policies
 */
export async function getUserPolicies(walletAddress: string): Promise<BlockchainUserPolicy[]> {
  try {
    const args = [nativeToScVal(walletAddress, "address")];
    const result = await simulateContract("get_my_policies", args);
    const policies = scValToNative(result);

    return policies.map((p: any) => ({
      id: p.policy_id.toString(),
      policy_id: p.policy_id.toString(),
      user_address: p.user_address,
      purchase_date: p.purchase_date.toString(),
      expiry_date: p.expiry_date.toString(),
      premium_paid: p.premium_paid_xlm.toString(),
      status: p.active ? USER_POLICY_STATUS_ACTIVE : USER_POLICY_STATUS_EXPIRED,
      token_id: p.token_id,
      metadata_uri: p.metadata_uri,
    }));
  } catch (error) {
    console.error("Error getting user policies:", error);
    return [];
  }
}

/**
 * Check if portal is initialized
 */
export async function isPortalInitialized(): Promise<boolean> {
  try {
    const result = await simulateContract("is_initialized", []);
    return scValToNative(result);
  } catch (error) {
    console.error("Error checking portal initialization:", error);
    return false;
  }
}

/**
 * Helper function to convert policy type number to string
 */
export function getPolicyTypeString(policyType: number): string {
  switch (policyType) {
    case POLICY_TYPE_HEALTH:
      return "Health";
    case POLICY_TYPE_LIFE:
      return "Life";
    case POLICY_TYPE_AUTO:
      return "Auto";
    case POLICY_TYPE_HOME:
      return "Home";
    case POLICY_TYPE_TRAVEL:
      return "Travel";
    default:
      return "Unknown";
  }
}

/**
 * Helper function to convert string policy type to number
 */
export function getPolicyTypeNumber(policyType: string): number {
  switch (policyType.toLowerCase()) {
    case "health":
      return POLICY_TYPE_HEALTH;
    case "life":
      return POLICY_TYPE_LIFE;
    case "auto":
      return POLICY_TYPE_AUTO;
    case "home":
      return POLICY_TYPE_HOME;
    case "travel":
      return POLICY_TYPE_TRAVEL;
    default:
      return POLICY_TYPE_HEALTH;
  }
}

/**
 * Helper function to format amounts
 */
export function formatAmount(amount: string): number {
  return parseInt(amount, 10);
}

/**
 * Helper function to format date
 */
export function formatDate(timestamp: string): string {
  const date = new Date(parseInt(timestamp, 10) * 1000);
  return date.toLocaleDateString();
}

/**
 * Get NFT metadata by token ID
 */
export async function getNFTMetadata(tokenId: string): Promise<PolicyNFTMetadata | null> {
  try {
    const args = [nativeToScVal(tokenId, "string")];
    const result = await simulateContract("get_nft_metadata", args);
    const metadata = scValToNative(result);

    return {
      name: metadata.name,
      description: metadata.description,
      image_uri: metadata.image_uri,
      coverage_amount: metadata.coverage_amount.toString(),
      validity_start: metadata.validity_start.toString(),
      validity_end: metadata.validity_end.toString(),
      premium_amount: metadata.premium_amount.toString(),
      policy_type: metadata.policy_type,
    };
  } catch (error) {
    console.error("Error getting NFT metadata:", error);
    return null;
  }
}

/**
 * Get all tokens owned by user
 */
export async function getUserTokens(walletAddress: string): Promise<string[]> {
  try {
    const args = [nativeToScVal(walletAddress, "address")];
    const result = await simulateContract("get_user_tokens", args);
    return scValToNative(result);
  } catch (error) {
    console.error("Error getting user tokens:", error);
    return [];
  }
}

/**
 * Get all tokens for a specific policy
 */
export async function getPolicyTokens(policyId: number): Promise<string[]> {
  try {
    const args = [nativeToScVal(policyId, "u64")];
    const result = await simulateContract("get_policy_tokens", args);
    return scValToNative(result);
  } catch (error) {
    console.error("Error getting policy tokens:", error);
    return [];
  }
}

/**
 * Get total tokens minted
 */
export async function getTotalTokens(): Promise<number> {
  try {
    const result = await simulateContract("get_total_tokens", []);
    return scValToNative(result);
  } catch (error) {
    console.error("Error getting total tokens:", error);
    return 0;
  }
}

/**
 * Generate metadata for policy NFT
 */
export function generatePolicyMetadata(policy: BlockchainPolicy, userAddress: string): any {
  return {
    name: `${policy.title} #${policy.policy_id}`,
    description: `${policy.description} - NFT Certificate for ChainSure Insurance Policy`,
    image: "https://chainsure.io/policy-nft.png",
    attributes: [
      {
        trait_type: "Coverage",
        value: `${formatAmount(policy.coverage_amount)} INR`,
      },
      {
        trait_type: "Premium",
        value: `${formatAmount(policy.yearly_premium)} INR/year`,
      },
      {
        trait_type: "Policy Type",
        value: getPolicyTypeString(policy.policy_type),
      },
      {
        trait_type: "Duration",
        value: `${policy.duration_days} days`,
      },
      {
        trait_type: "Minimum Age",
        value: policy.min_age,
      },
      {
        trait_type: "Maximum Age",
        value: policy.max_age,
      },
      {
        trait_type: "Policyholder",
        value: userAddress,
      },
      {
        trait_type: "Created At",
        value: formatDate(policy.created_at),
      },
    ],
    external_url: `https://chainsure.io/policy/${policy.policy_id}`,
    collection: {
      name: "ChainSure Insurance Policies",
      family: "ChainSure",
    },
  };
}

/**
 * Claim policy with fraud detection
 */
export async function claimPolicy(
  policyId: any,
  aggregateScore: number
): Promise<{ success: boolean; transactionHash?: string; claimAmount?: number }> {
  try {
    const numericPolicyId = parseInt(policyId);
    if (isNaN(numericPolicyId) || numericPolicyId <= 0) {
      throw new Error("Invalid policy ID");
    }

    console.log(`📋 Claiming policy:
    - Policy ID: ${numericPolicyId}
    - Aggregate Score: ${aggregateScore}
    - Expected Status: ${
      aggregateScore <= 30 ? "APPROVED" : aggregateScore <= 70 ? "PENDING" : "REJECTED"
    }`);

    const publicKey = await getWalletPublicKey();
    
    // Get native XLM token address
    const nativeToken = StellarSdk.Asset.native();
    const nativeTokenAddress = nativeToken.contractId(STELLAR_NETWORK);

    const args = [
      nativeToScVal(publicKey, "address"),
      nativeToScVal(numericPolicyId, "u64"),
      nativeToScVal(aggregateScore, "u32"),
      nativeToScVal(nativeTokenAddress, "address"),
    ];

    const result = await invokeContract("claim_policy", args);

    // Get policy details for claim amount
    const policies = await getAllPolicies();
    const policy = policies.find((p) => p.policy_id === numericPolicyId.toString());
    const claimAmount = policy ? parseInt(policy.coverage_amount) : 0;

    return {
      ...result,
      claimAmount,
    };
  } catch (error) {
    console.error("Error claiming policy:", error);
    throw error;
  }
}

/**
 * Get user claims
 */
export async function getUserClaims(userAddress: string): Promise<PolicyClaim[]> {
  try {
    const args = [nativeToScVal(userAddress, "address")];
    const result = await simulateContract("get_user_claims", args);
    const claims = scValToNative(result);

    return claims.map((claim: any) => ({
      claim_id: claim.claim_id.toString(),
      policy_id: claim.policy_id.toString(),
      user_address: claim.user_address,
      claim_amount: claim.claim_amount.toString(),
      aggregate_score: claim.aggregate_score,
      status: claim.status,
      claimed_at: claim.claimed_at.toString(),
      processed_at: claim.processed_at.toString(),
    }));
  } catch (error) {
    console.error("Error fetching user claims:", error);
    return [];
  }
}

/**
 * Get all claims (admin only)
 */
export async function getAllClaims(): Promise<PolicyClaim[]> {
  try {
    const result = await simulateContract("get_all_claims", []);
    const claims = scValToNative(result);

    return claims.map((claim: any) => ({
      claim_id: claim.claim_id.toString(),
      policy_id: claim.policy_id.toString(),
      user_address: claim.user_address,
      claim_amount: claim.claim_amount.toString(),
      aggregate_score: claim.aggregate_score,
      status: claim.status,
      claimed_at: claim.claimed_at.toString(),
      processed_at: claim.processed_at.toString(),
    }));
  } catch (error) {
    console.error("Error fetching all claims:", error);
    return [];
  }
}

/**
 * Get claim status
 */
export async function getClaimStatus(claimId: number): Promise<{
  status: number;
  amount: string;
  score: number;
} | null> {
  try {
    const args = [nativeToScVal(claimId, "u64")];
    const result = await simulateContract("get_claim_status", args);
    const [status, amount, score] = scValToNative(result);

    return {
      status,
      amount: amount.toString(),
      score,
    };
  } catch (error) {
    console.error("Error fetching claim status:", error);
    return null;
  }
}

/**
 * Approve claim (admin only)
 */
export async function approveClaim(claimId: number): Promise<{ success: boolean; transactionHash?: string }> {
  try {
    console.log(`✅ Approving claim ID: ${claimId}`);

    const publicKey = await getWalletPublicKey();
    
    // Get native XLM token address
    const nativeToken = StellarSdk.Asset.native();
    const nativeTokenAddress = nativeToken.contractId(STELLAR_NETWORK);

    const args = [
      nativeToScVal(publicKey, "address"),
      nativeToScVal(claimId, "u64"),
      nativeToScVal(nativeTokenAddress, "address"),
    ];

    return await invokeContract("approve_claim", args);
  } catch (error) {
    console.error("Error approving claim:", error);
    throw error;
  }
}

// Utility functions for claim status
export function getClaimStatusString(status: number): string {
  switch (status) {
    case 1:
      return "Approved";
    case 2:
      return "Pending Verification";
    case 3:
      return "Rejected";
    default:
      return "Unknown";
  }
}

export function getClaimStatusColor(status: number): string {
  switch (status) {
    case 1:
      return "text-green-600 bg-green-50";
    case 2:
      return "text-yellow-600 bg-yellow-50";
    case 3:
      return "text-red-600 bg-red-50";
    default:
      return "text-gray-600 bg-gray-50";
  }
}

// Helper function to get policy by ID (not in original but useful)
export async function getPolicy(policyId: string): Promise<BlockchainPolicy | null> {
  const policies = await getAllPolicies();
  return policies.find((p) => p.policy_id === policyId) || null;
}

// Collection info functions
export async function getCollectionInfo(): Promise<{
  name: string;
  description: string;
  uri: string;
} | null> {
  // Hardcoded for now as Soroban doesn't have built-in NFT collections like Aptos
  return {
    name: "ChainSure Insurance Policies",
    description: "NFT collection representing insurance policies on ChainSure platform",
    uri: "https://chainsure.io/collection.json",
  };
}

