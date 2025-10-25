// Dummy policy data for simulation
export interface Policy {
  id: string
  title: string
  description: string
  provider: string
  type: "Health" | "Life" | "Auto" | "Home" | "Travel"
  premium: {
    monthly: number
    yearly: number
  }
  coverage: {
    amount: number
    currency: string
  }
  features: string[]
  benefits: string[]
  eligibility: {
    minAge: number
    maxAge: number
    requirements: string[]
  }
  terms: {
    duration: string
    waitingPeriod: string
    claimProcess: string
  }
  isActive: boolean
  createdAt: string
  createdBy: string // wallet address of admin who created it
}

export interface UserPolicy {
  id: string
  policyId: string
  userWallet: string
  purchaseDate: string
  status: "Active" | "Expired" | "Claimed" | "Cancelled"
  premiumPaid: number
  nextPremiumDue?: string
  claimsHistory: {
    id: string
    date: string
    amount: number
    status: "Pending" | "Approved" | "Rejected"
    description: string
  }[]
}

export const dummyPolicies: Policy[] = [
  {
    id: "pol_001",
    title: "ChainHealth Comprehensive",
    description: "Complete health insurance coverage with AI-powered claim processing",
    provider: "ChainSure",
    type: "Health",
    premium: {
      monthly: 2500,
      yearly: 25000
    },
    coverage: {
      amount: 500000,
      currency: "₹"
    },
    features: [
      "Cashless hospitalization",
      "AI-powered instant claims",
      "No waiting period for accidents",
      "Telemedicine consultation",
      "Prescription drug coverage"
    ],
    benefits: [
      "100% coverage for emergencies",
      "90% coverage for planned treatments",
      "Free annual health checkup",
      "Mental health coverage included"
    ],
    eligibility: {
      minAge: 18,
      maxAge: 65,
      requirements: [
        "Valid ABHA ID required",
        "No critical pre-existing conditions",
        "BMI within normal range"
      ]
    },
    terms: {
      duration: "1 Year renewable",
      waitingPeriod: "30 days for illnesses, No waiting for accidents",
      claimProcess: "Instant processing via blockchain verification"
    },
    isActive: true,
    createdAt: "2024-01-15T10:00:00Z",
    createdBy: "0x1234567890abcdef1234567890abcdef12345678"
  },
  {
    id: "pol_002", 
    title: "ChainLife Secure",
    description: "Term life insurance with blockchain-based beneficiary management",
    provider: "ChainSure",
    type: "Life",
    premium: {
      monthly: 1200,
      yearly: 12000
    },
    coverage: {
      amount: 1000000,
      currency: "₹"
    },
    features: [
      "Automated claim disbursement",
      "Smart contract beneficiary management",
      "No medical examination up to 50 years",
      "Accidental death benefit",
      "Terminal illness benefit"
    ],
    benefits: [
      "100% sum assured on death",
      "200% for accidental death",
      "Living benefit for terminal illness",
      "Tax benefits under 80C"
    ],
    eligibility: {
      minAge: 18,
      maxAge: 60,
      requirements: [
        "Indian citizen",
        "Regular income proof",
        "No smoking (preferred rates)"
      ]
    },
    terms: {
      duration: "10-30 years",
      waitingPeriod: "2 years for suicide, No waiting for accidents",
      claimProcess: "Automated via death certificate verification"
    },
    isActive: true,
    createdAt: "2024-01-10T14:30:00Z",
    createdBy: "0x1234567890abcdef1234567890abcdef12345678"
  },
  {
    id: "pol_003",
    title: "ChainAuto Smart",
    description: "Vehicle insurance with IoT integration and instant claim settlement",
    provider: "ChainSure",
    type: "Auto",
    premium: {
      monthly: 800,
      yearly: 8000
    },
    coverage: {
      amount: 200000,
      currency: "₹"
    },
    features: [
      "IoT-based accident detection",
      "GPS tracking integration",
      "Instant damage assessment via AI",
      "24/7 roadside assistance",
      "Third-party liability coverage"
    ],
    benefits: [
      "100% IDV coverage",
      "Zero depreciation for new cars",
      "Personal accident cover",
      "Legal liability coverage"
    ],
    eligibility: {
      minAge: 18,
      maxAge: 70,
      requirements: [
        "Valid driving license",
        "Vehicle registration documents",
        "No major traffic violations"
      ]
    },
    terms: {
      duration: "1 Year",
      waitingPeriod: "No waiting period",
      claimProcess: "AI-powered instant settlement for minor damages"
    },
    isActive: true,
    createdAt: "2024-01-20T09:15:00Z",
    createdBy: "0x1234567890abcdef1234567890abcdef12345678"
  },
  {
    id: "pol_004",
    title: "ChainHome Protect",
    description: "Home insurance with smart sensors and real-time monitoring",
    provider: "ChainSure",
    type: "Home",
    premium: {
      monthly: 500,
      yearly: 5000
    },
    coverage: {
      amount: 1500000,
      currency: "₹"
    },
    features: [
      "Smart sensor integration",
      "Fire and flood detection",
      "Theft protection with alerts",
      "Natural disaster coverage",
      "Tenant liability protection"
    ],
    benefits: [
      "100% rebuilding cost coverage",
      "Temporary accommodation expenses",
      "Contents insurance included",
      "Legal liability coverage"
    ],
    eligibility: {
      minAge: 18,
      maxAge: 75,
      requirements: [
        "Property ownership/rental agreement",
        "Property valuation certificate",
        "No high-risk neighborhood"
      ]
    },
    terms: {
      duration: "1-3 Years",
      waitingPeriod: "15 days for standard claims",
      claimProcess: "Sensor-verified claims processed instantly"
    },
    isActive: true,
    createdAt: "2024-01-25T11:45:00Z",
    createdBy: "0x1234567890abcdef1234567890abcdef12345678"
  },
  {
    id: "pol_005",
    title: "ChainTravel Safe",
    description: "International travel insurance with global emergency support",
    provider: "ChainSure",
    type: "Travel",
    premium: {
      monthly: 300,
      yearly: 2500
    },
    coverage: {
      amount: 500000,
      currency: "₹"
    },
    features: [
      "Global emergency assistance",
      "Medical evacuation coverage",
      "Trip cancellation protection",
      "Lost baggage compensation",
      "Adventure sports coverage"
    ],
    benefits: [
      "Worldwide medical coverage",
      "Emergency dental treatment",
      "Repatriation of mortal remains",
      "24/7 helpline support"
    ],
    eligibility: {
      minAge: 1,
      maxAge: 75,
      requirements: [
        "Valid passport",
        "Travel itinerary",
        "No recent travel advisories"
      ]
    },
    terms: {
      duration: "Per trip or Annual",
      waitingPeriod: "24 hours from policy start",
      claimProcess: "Document upload with instant verification"
    },
    isActive: true,
    createdAt: "2024-01-30T16:20:00Z",
    createdBy: "0x1234567890abcdef1234567890abcdef12345678"
  }
]

export const dummyUserPolicies: UserPolicy[] = [
  {
    id: "up_001",
    policyId: "pol_001",
    userWallet: "0xabcdef1234567890abcdef1234567890abcdef12",
    purchaseDate: "2024-02-01T10:00:00Z",
    status: "Active",
    premiumPaid: 25000,
    nextPremiumDue: "2025-02-01T10:00:00Z",
    claimsHistory: [
      {
        id: "claim_001",
        date: "2024-02-15T14:30:00Z",
        amount: 5000,
        status: "Approved",
        description: "Fever and consultation charges"
      }
    ]
  }
]

export function getAllPolicies(): Policy[] {
  return dummyPolicies.filter(policy => policy.isActive)
}

export function getPolicyById(id: string): Policy | null {
  return dummyPolicies.find(policy => policy.id === id) || null
}

export function getUserPolicies(walletAddress: string): UserPolicy[] {
  return dummyUserPolicies.filter(up => up.userWallet === walletAddress)
}

export function purchasePolicy(policyId: string, walletAddress: string): UserPolicy {
  const policy = getPolicyById(policyId)
  if (!policy) throw new Error("Policy not found")

  const userPolicy: UserPolicy = {
    id: `up_${Date.now()}`,
    policyId,
    userWallet: walletAddress,
    purchaseDate: new Date().toISOString(),
    status: "Active",
    premiumPaid: policy.premium.yearly,
    nextPremiumDue: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    claimsHistory: []
  }

  dummyUserPolicies.push(userPolicy)
  return userPolicy
}
