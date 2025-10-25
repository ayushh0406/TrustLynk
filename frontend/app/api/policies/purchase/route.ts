import { NextRequest, NextResponse } from "next/server"
import { purchasePolicy, getPolicyById } from "../dummy-data"
import { findUserByAbhaId } from "../../abha/dummy-data"

export async function POST(request: NextRequest) {
  try {
    const { policyId, walletAddress, abhaId } = await request.json()

    if (!policyId || !walletAddress || !abhaId) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Policy ID, wallet address, and ABHA ID are required" 
        },
        { status: 400 }
      )
    }

    // Check if policy exists
    const policy = getPolicyById(policyId)
    if (!policy) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Policy not found" 
        },
        { status: 404 }
      )
    }

    // Check ABHA consent
    const user = findUserByAbhaId(abhaId)
    if (!user || !user.hasConsent) {
      return NextResponse.json(
        { 
          success: false, 
          error: "ABHA consent required. Please authorize your health data access first." 
        },
        { status: 403 }
      )
    }

    // Simulate blockchain transaction delay
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Purchase policy
    const userPolicy = purchasePolicy(policyId, walletAddress)

    return NextResponse.json({
      success: true,
      message: "Policy purchased successfully",
      data: {
        userPolicy,
        policy,
        transactionId: `tx_${Date.now()}`, // Simulate blockchain transaction ID
        blockNumber: Math.floor(Math.random() * 1000000) + 500000
      }
    })

  } catch (error) {
    console.error("Policy purchase error:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to purchase policy" 
      },
      { status: 500 }
    )
  }
}
