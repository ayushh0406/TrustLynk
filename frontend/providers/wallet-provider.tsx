"use client"

import React from "react"

// Freighter wallet is a browser extension, no provider wrapper needed
// We'll use the freighter-api directly in the wallet context

interface WalletProviderProps {
  children: React.ReactNode
}

export function WalletProvider({ children }: WalletProviderProps) {
  return <>{children}</>
}
