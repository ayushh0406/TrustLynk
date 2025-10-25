import { NextRequest, NextResponse } from "next/server"
import { getAllPolicies } from "./dummy-data"

export async function GET(request: NextRequest) {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800))

    const policies = getAllPolicies()

    return NextResponse.json({
      success: true,
      message: "Policies retrieved successfully",
      data: policies
    })

  } catch (error) {
    console.error("Policies fetch error:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch policies" 
      },
      { status: 500 }
    )
  }
}
