import { NextRequest, NextResponse } from "next/server"
import { getUserPolicies, getPolicyById } from "../dummy-data"

export async function POST(request: NextRequest) {
  try {
    const { walletAddress } = await request.json()

    if (!walletAddress) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Wallet address is required" 
        },
        { status: 400 }
      )
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))

    const userPolicies = getUserPolicies(walletAddress)
    
    // Enrich with policy details
    const enrichedPolicies = userPolicies.map(userPolicy => {
      const policy = getPolicyById(userPolicy.policyId)
      return {
        ...userPolicy,
        policy
      }
    })

    return NextResponse.json({
      success: true,
      message: "User policies retrieved successfully",
      data: enrichedPolicies
    })

  } catch (error) {
    console.error("User policies fetch error:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch user policies" 
      },
      { status: 500 }
    )
  }
}
