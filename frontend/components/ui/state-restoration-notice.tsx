"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, X, Info } from "lucide-react"
import { useWalletContext } from "@/context/wallet-context"

export function StateRestorationNotice() {
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const { isConnected, blockchainLoading, isAdmin, isPolicyholder } = useWalletContext()

  useEffect(() => {
    const hasSeenNotice = localStorage.getItem("chainsure-state-notice-seen")
    
    if (!hasSeenNotice && isConnected && !blockchainLoading && (isAdmin || isPolicyholder)) {
      setShow(true)
    }
  }, [isConnected, blockchainLoading, isAdmin, isPolicyholder])

  const handleDismiss = () => {
    setShow(false)
    setDismissed(true)
    localStorage.setItem("chainsure-state-notice-seen", "true")
  }

  if (!show || dismissed) return null

  return (
    <Card className="mb-6 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/10">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-800 dark:text-green-200">
                ✨ Blockchain State Restored!
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                Your registration status and platform data have been automatically restored from the blockchain. 
                No need to re-register after page refreshes!
              </p>
              <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                <Info className="h-3 w-3 inline mr-1" />
                Your wallet data is now persistent across sessions
              </div>
            </div>
          </div>
          <Button
            onClick={handleDismiss}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-green-600 hover:text-green-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
