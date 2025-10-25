import { NextRequest, NextResponse } from "next/server"
import { dummyPolicies } from "../dummy-data"

export async function POST(request: NextRequest) {
  try {
    const { 
      title, 
      description, 
      type, 
      monthlyPremium, 
      yearlyPremium, 
      coverageAmount, 
      features, 
      benefits, 
      minAge, 
      maxAge, 
      requirements, 
      duration, 
      waitingPeriod, 
      claimProcess,
      adminWallet 
    } = await request.json()

    // Validate required fields
    if (!title || !description || !type || !yearlyPremium || !coverageAmount || !adminWallet) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Missing required fields" 
        },
        { status: 400 }
      )
    }

    // Create new policy
    const newPolicy = {
      id: `pol_${Date.now()}`,
      title,
      description,
      provider: "ChainSure",
      type,
      premium: {
        monthly: monthlyPremium || Math.round(yearlyPremium / 12),
        yearly: yearlyPremium
      },
      coverage: {
        amount: coverageAmount,
        currency: "₹"
      },
      features: features || [],
      benefits: benefits || [],
      eligibility: {
        minAge: minAge || 18,
        maxAge: maxAge || 65,
        requirements: requirements || []
      },
      terms: {
        duration: duration || "1 Year renewable",
        waitingPeriod: waitingPeriod || "30 days",
        claimProcess: claimProcess || "Standard processing"
      },
      isActive: true,
      createdAt: new Date().toISOString(),
      createdBy: adminWallet
    }

    // Add to dummy data (in real app, this would go to blockchain)
    dummyPolicies.push(newPolicy)

    // Simulate blockchain transaction delay
    await new Promise(resolve => setTimeout(resolve, 2000))

    return NextResponse.json({
      success: true,
      message: "Policy created successfully",
      data: {
        policy: newPolicy,
        transactionId: `tx_${Date.now()}`,
        blockNumber: Math.floor(Math.random() * 1000000) + 500000
      }
    })

  } catch (error) {
    console.error("Policy creation error:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to create policy" 
      },
      { status: 500 }
    )
  }
}
