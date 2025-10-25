import { NextRequest, NextResponse } from "next/server"
import { findUserByAbhaId } from "../dummy-data"

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

    // Find user in dummy data
    const user = findUserByAbhaId(abhaId)
    
    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          error: "ABHA ID not found" 
        },
        { status: 404 }
      )
    }

    // Check if user has given consent
    if (!user.hasConsent) {
      return NextResponse.json(
        { 
          success: false, 
          error: "ABHA consent not provided. Please authorize access first." 
        },
        { status: 403 }
      )
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Return user's health data (excluding sensitive info)
    const userData = {
      abhaId: user.abhaId,
      fullName: user.fullName,
      dob: user.dob,
      gender: user.gender,
      bloodGroup: user.bloodGroup,
      address: user.address,
      phone: user.phone,
      email: user.email,
      allergies: user.allergies,
      medicalHistory: user.medicalHistory,
      existingInsurance: user.existingInsurance,
      emergencyContact: user.emergencyContact,
      hasConsent: user.hasConsent,
      consentDate: user.consentDate
    }

    return NextResponse.json({
      success: true,
      message: "ABHA data retrieved successfully",
      data: userData
    })

  } catch (error) {
    console.error("ABHA data retrieval error:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Internal server error" 
      },
      { status: 500 }
    )
  }
}
