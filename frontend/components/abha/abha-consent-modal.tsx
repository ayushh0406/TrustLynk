"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Shield, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useWalletContext } from "@/context/wallet-context"

interface AbhaConsentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AbhaConsentModal({ isOpen, onClose, onSuccess }: AbhaConsentModalProps) {
  const [abhaId, setAbhaId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<"consent" | "verify" | "success">("consent")
  const { setHasAbhaConsent } = useWalletContext()
  const { toast } = useToast()

  const handleAbhaSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!abhaId) {
      toast({
        title: "ABHA ID Required",
        description: "Please enter your ABHA ID to continue",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    setStep("verify")

    try {
      const response = await fetch("/api/abha/authorize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ abhaId }),
      })

      const data = await response.json()

      if (data.success) {
        setHasAbhaConsent(true)
        setStep("success")
        
        toast({
          title: "ABHA Consent Authorized",
          description: "Your health data access has been authorized successfully!",
        })

        // Auto close after 2 seconds and trigger success callback
        setTimeout(() => {
          onSuccess()
          onClose()
          resetModal()
        }, 2000)
      } else {
        throw new Error(data.error || "Authorization failed")
      }
    } catch (error) {
      toast({
        title: "Authorization Failed",
        description: error instanceof Error ? error.message : "Failed to authorize ABHA access",
        variant: "destructive"
      })
      setStep("consent")
    } finally {
      setIsLoading(false)
    }
  }

  const resetModal = () => {
    setAbhaId("")
    setStep("consent")
    setIsLoading(false)
  }

  const handleClose = () => {
    resetModal()
    onClose()
  }

  const formatAbhaId = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, "")
    
    // Limit to 14 digits
    const limited = digits.slice(0, 14)
    
    // Format as XX-XXXX-XXXX-XXXX
    if (limited.length <= 2) return limited
    if (limited.length <= 6) return `${limited.slice(0, 2)}-${limited.slice(2)}`
    if (limited.length <= 10) return `${limited.slice(0, 2)}-${limited.slice(2, 6)}-${limited.slice(6)}`
    return `${limited.slice(0, 2)}-${limited.slice(2, 6)}-${limited.slice(6, 10)}-${limited.slice(10)}`
  }

  const handleAbhaIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatAbhaId(e.target.value)
    setAbhaId(formatted)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            ABHA Authorization
          </DialogTitle>
          <DialogDescription>
            {step === "consent" && "Authorize access to your health data through ABHA"}
            {step === "verify" && "Verifying your ABHA ID..."}
            {step === "success" && "Authorization successful!"}
          </DialogDescription>
        </DialogHeader>

        {step === "consent" && (
          <form onSubmit={handleAbhaSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="abhaId">ABHA ID</Label>
              <Input
                id="abhaId"
                type="text"
                placeholder="XX-XXXX-XXXX-XXXX"
                value={abhaId}
                onChange={handleAbhaIdChange}
                maxLength={17} // XX-XXXX-XXXX-XXXX = 17 characters
                required
              />
              <p className="text-xs text-gray-500">
                Enter your 14-digit ABHA ID to authorize health data access
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <h4 className="font-medium text-sm mb-2">What data will be accessed?</h4>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Personal information (name, DOB, contact)</li>
                <li>• Medical history and conditions</li>
                <li>• Current medications and allergies</li>
                <li>• Existing insurance policies</li>
              </ul>
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Authorizing...
                  </>
                ) : (
                  "Authorize Access"
                )}
              </Button>
            </div>
          </form>
        )}

        {step === "verify" && (
          <div className="flex flex-col items-center space-y-4 py-8">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            <div className="text-center">
              <h3 className="font-medium">Verifying ABHA ID</h3>
              <p className="text-sm text-gray-500">
                Please wait while we verify your credentials...
              </p>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center space-y-4 py-8">
            <CheckCircle className="h-12 w-12 text-green-600" />
            <div className="text-center">
              <h3 className="font-medium text-green-600">Authorization Successful!</h3>
              <p className="text-sm text-gray-500">
                Your health data access has been authorized. Redirecting...
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
