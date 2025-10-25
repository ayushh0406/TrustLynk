// Fraud Detection API Integration
// Based on format.json specification

export interface FraudAnalysisRequest {
  claim: {
    claim_id: string;
    abha_id: string;
    policy_id: string;
    claim_amount: number;
    claim_date: string;
    hospital_details: {
      name: string;
      address: string;
      registration_number: string;
      doctor_name: string;
      doctor_registration: string;
    };
    diagnosis: string;
    treatment: string;
    medications: string[];
    admission_date?: string;
    discharge_date?: string;
    claim_type: 'cashless' | 'reimbursement';
    documents: string[];
    ip_address?: string;
    device_info?: string;
  };
  abha_user: {
    abhaId: string;
    fullName: string;
    dob: string;
    gender: string;
    bloodGroup: string;
    address: {
      state: string;
      district: string;
      pincode: string;
      address: string;
    };
    phone: string;
    email: string;
    allergies: string[];
    medicalHistory: Array<{
      condition: string;
      diagnosedDate: string;
      treatment: string;
      medications: string[];
      status: string;
    }>;
    existingInsurance: Array<{
      provider: string;
      policyNumber: string;
      coverage: string;
      expiryDate: string;
    }>;
    emergencyContact: {
      name: string;
      relation: string;
      phone: string;
    };
    hasConsent: boolean;
  };
  policy: {
    coverage_amount: string;
    created_at: string;
    created_by: string;
    description: string;
    duration_days: string;
    max_age: string;
    min_age: string;
    monthly_premium: string;
    policy_id: string;
    policy_type: number;
    title: string;
    waiting_period_days: string;
    yearly_premium: string;
  };
}

export interface FraudAnalysisResponse {
  ai1_score: number;
  ai2_score: number;
  ai3_score: number;
  aggregate_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface ModelInfo {
  models: {
    ai1: {
      type: string;
      purpose: string;
      weight_in_aggregate: number;
      features_count: number;
    };
    ai2: {
      type: string;
      purpose: string;
      weight_in_aggregate: number;
      features_count: number;
    };
    ai3: {
      type: string;
      purpose: string;
      weight_in_aggregate: number;
      features_count: number;
    };
  };
  risk_thresholds: {
    LOW: string;
    MEDIUM: string;
    HIGH: string;
  };
  last_updated: string;
}

// API Configuration
const FRAUD_API_BASE_URL = process.env.NEXT_PUBLIC_FRAUD_API_URL || 'https://a75b00e6c7ab.ngrok-free.app';

class FraudDetectionAPI {
  private baseUrl: string;

  constructor(baseUrl: string = FRAUD_API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async analyzeFraudRisk(request: FraudAnalysisRequest): Promise<FraudAnalysisResponse> {
    try {
      console.log('🔍 Analyzing fraud risk:', {
        claim_id: request.claim.claim_id,
        policy_id: request.claim.policy_id,
        claim_amount: request.claim.claim_amount
      });

      const response = await fetch(`${this.baseUrl}/analyze-fraud-risk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Fraud API error: ${response.status} - ${errorText}`);
      }

      const result: FraudAnalysisResponse = await response.json();
      
      console.log('✅ Fraud analysis result:', result);
      return result;
    } catch (error) {
      console.error('❌ Fraud analysis failed:', error);
      throw error;
    }
  }

  async getModelInfo(): Promise<ModelInfo> {
    try {
      const response = await fetch(`${this.baseUrl}/model-info`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Model info API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Model info fetch failed:', error);
      throw error;
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        return false;
      }

      const health = await response.json();
      return health.status === 'healthy' && health.models_loaded;
    } catch (error) {
      console.error('❌ Health check failed:', error);
      return false;
    }
  }

  // Generate demo/mock fraud analysis for testing
  generateMockAnalysis(claimAmount: number, policyId: string): FraudAnalysisResponse {
    // Simple mock logic based on claim amount and policy
    const randomFactor = Math.random();
    const amountFactor = Math.min(claimAmount / 100000, 1); // Normalize to 0-1
    
    // Generate scores (higher claim amounts = higher risk)
    const ai1_score = Math.floor((amountFactor * 40 + randomFactor * 30));
    const ai2_score = Math.floor((amountFactor * 35 + randomFactor * 25));
    const ai3_score = Math.floor((amountFactor * 30 + randomFactor * 20));
    
    let aggregate_score = Math.floor((ai1_score * 0.3 + ai2_score * 0.4 + ai3_score * 0.3));
    
    // AVOID 31-70 range (PENDING status) - force to either APPROVED (≤30) or REJECTED (>70)
    if (aggregate_score > 30 && aggregate_score <= 70) {
      aggregate_score = Math.random() < 0.6 ? Math.floor(Math.random() * 31) : (71 + Math.floor(Math.random() * 29));
    }
    
    const risk_level: 'LOW' | 'MEDIUM' | 'HIGH' = 
      aggregate_score <= 30 ? 'LOW' : 'HIGH'; // No MEDIUM anymore

    console.log('🎭 Generated mock fraud analysis:', {
      policy_id: policyId,
      claim_amount: claimAmount,
      aggregate_score,
      risk_level
    });

    return {
      ai1_score,
      ai2_score,
      ai3_score,
      aggregate_score,
      risk_level
    };
  }
}

// Helper functions
export function getRiskLevelColor(riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'): string {
  switch (riskLevel) {
    case 'LOW':
      return '#10B981'; // Green
    case 'MEDIUM':
      return '#F59E0B'; // Yellow
    case 'HIGH':
      return '#EF4444'; // Red
    default:
      return '#6B7280'; // Gray
  }
}

export function getRiskLevelDescription(riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'): string {
  switch (riskLevel) {
    case 'LOW':
      return 'Safe to approve automatically';
    case 'MEDIUM':
      return 'Requires manual review';
    case 'HIGH':
      return 'High fraud risk, investigate thoroughly';
    default:
      return 'Unknown risk level';
  }
}

export function getClaimStatusFromScore(aggregateScore: number): 'APPROVED' | 'PENDING' | 'REJECTED' {
  if (aggregateScore <= 30) return 'APPROVED';
  if (aggregateScore <= 70) return 'PENDING';
  return 'REJECTED';
}

// Export singleton instance
export const fraudDetectionAPI = new FraudDetectionAPI();
export default fraudDetectionAPI;
