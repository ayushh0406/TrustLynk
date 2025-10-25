import { NextRequest, NextResponse } from "next/server"
import { findUserByAbhaId, updateUserConsent } from "../dummy-data"

export async function POST(request: NextRequest) {
  try {
    const { abhaId } = await request.json()

    if (!abhaId) {
      return NextResponse.json(
        { 
          success: false, 
          error: "ABHA ID is required" 
        },
        { status: 400 }
      )
    }

    // Validate ABHA ID format (XX-XXXX-XXXX-XXXX)
    const abhaRegex = /^\d{2}-\d{4}-\d{4}-\d{4}$/
    if (!abhaRegex.test(abhaId)) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid ABHA ID format. Please use XX-XXXX-XXXX-XXXX format." 
        },
        { status: 400 }
      )
    }

    // Find user in dummy data
    const user = findUserByAbhaId(abhaId)
    
    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          error: "ABHA ID not found in our records" 
        },
        { status: 404 }
      )
    }

    // Update consent status
    const updated = updateUserConsent(abhaId, true)
    
    if (!updated) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Failed to update consent" 
        },
        { status: 500 }
      )
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500))

    return NextResponse.json({
      success: true,
      message: "ABHA consent authorized successfully",
      data: {
        abhaId: user.abhaId,
        fullName: user.fullName,
        hasConsent: true,
        consentDate: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error("ABHA authorization error:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Internal server error" 
      },
      { status: 500 }
    )
  }
}
