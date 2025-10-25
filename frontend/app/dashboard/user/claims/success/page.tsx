"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { CheckCircle } from "lucide-react"
import confetti from "canvas-confetti"

export const dynamic = 'force-dynamic'

export default function ClaimSuccessPage() {
  const router = useRouter()
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState(1)
  const [showConfetti, setShowConfetti] = useState(false)
  
  useEffect(() => {
    // Trigger confetti animation
    if (typeof window !== 'undefined') {
      setShowConfetti(true)
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      })
    }
    
    // Simulate blockchain verification progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 1
      })
    }, 30)
    
    // Update steps based on progress
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= 4) {
          clearInterval(stepInterval)
          return 4
        }
        return prev + 1
      })
    }, 1500)
    
    return () => {
      clearInterval(interval)
      clearInterval(stepInterval)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-3xl mx-auto text-center">
        <div className="mb-8">
          <div className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Claim Submitted Successfully!</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Your claim is being processed through our blockchain verification system
          </p>
        </div>

        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Verification Progress</span>
                  <span className="text-sm text-gray-500">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    currentStep >= 1 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <span className="text-sm">Claim details validated</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    currentStep >= 2 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <span className="text-sm">Documents verified on blockchain</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    currentStep >= 3 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <span className="text-sm">AI risk assessment completed</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    currentStep >= 4 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <span className="text-sm">Smart contract execution initiated</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-sm text-gray-500">
          You will receive updates about your claim status via email and SMS
        </p>
      </div>
    </div>
  )
}

