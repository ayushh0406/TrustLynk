"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { 
  isConnected as freighterIsConnected,
  getPublicKey,
  isAllowed,
  setAllowed,
} from "@stellar/freighter-api"
import { getUserRole, ROLE_ADMIN, ROLE_POLICYHOLDER, ROLE_UNREGISTERED } from "@/lib/blockchain"

interface WalletContextType {
  isConnected: boolean
  address: string | null
  userType: "user" | "admin" | null
  setUserType: (type: "user" | "admin" | null) => void
  connectWallet: () => Promise<void>
  disconnectWallet: () => Promise<void>
  isLoading: boolean
  hasAbhaConsent: boolean
  setHasAbhaConsent: (consent: boolean) => void
  // Blockchain state
  isAdmin: boolean
  isPolicyholder: boolean
  isRegistered: boolean
  blockchainLoading: boolean
  refreshBlockchainState: () => Promise<void>
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletContextProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  const [address, setAddress] = useState<string | null>(null)
  const [userType, setUserType] = useState<"user" | "admin" | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasAbhaConsent, setHasAbhaConsent] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isPolicyholder, setIsPolicyholder] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)
  const [blockchainLoading, setBlockchainLoading] = useState(false)
  const router = useRouter()

  // Check if Freighter is connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const connected = await freighterIsConnected()
        if (connected) {
          const allowed = await isAllowed()
          if (allowed) {
            const publicKey = await getPublicKey()
            setIsConnected(true)
            setAddress(publicKey)
          }
        }
      } catch (error) {
        console.error("Error checking Freighter connection:", error)
      }
    }
    
    checkConnection()
  }, [])

  const connectWallet = async () => {
    try {
      setIsLoading(true)
      
      // Check if Freighter is installed
      const connected = await freighterIsConnected()
      if (!connected) {
        throw new Error("Freighter wallet is not installed. Please install it from https://www.freighter.app/")
      }

      // Request access
      const allowed = await isAllowed()
      if (!allowed) {
        await setAllowed()
      }

      // Get public key
      const publicKey = await getPublicKey()
      setIsConnected(true)
      setAddress(publicKey)
    } catch (error: any) {
      console.error("Failed to connect wallet:", error)
      throw new Error(error.message || "Failed to connect to Freighter wallet")
    } finally {
      setIsLoading(false)
    }
  }

  const disconnectWallet = async () => {
    try {
      setIsLoading(true)
      setIsConnected(false)
      setAddress(null)
      setUserType(null)
      setIsAdmin(false)
      setIsPolicyholder(false)
      setIsRegistered(false)
      router.push("/auth/login")
    } catch (error) {
      console.error("Failed to disconnect wallet:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Check blockchain state for connected wallet
  const refreshBlockchainState = async () => {
    if (!address) {
      setIsAdmin(false)
      setIsPolicyholder(false)
      setIsRegistered(false)
      return
    }

    setBlockchainLoading(true)
    try {
      console.log("Checking blockchain state for address:", address)
      
      // Check user role directly
      const role = await getUserRole(address)
      const adminStatus = role === ROLE_ADMIN
      const policyholderStatus = role === ROLE_POLICYHOLDER
      const registeredStatus = role !== ROLE_UNREGISTERED
      
      setIsAdmin(adminStatus)
      setIsPolicyholder(policyholderStatus)
      setIsRegistered(registeredStatus)
      
      // Auto-update userType based on blockchain role
      if (adminStatus) {
        setUserType("admin")
      } else if (policyholderStatus) {
        setUserType("user")
      } else {
        setUserType(null)
      }

      console.log("Blockchain state refreshed:", {
        address,
        role,
        isAdmin: adminStatus,
        isPolicyholder: policyholderStatus,
        isRegistered: registeredStatus
      })
    } catch (error) {
      console.error("Error checking blockchain state:", error)
      // On error, reset to safe defaults
      setIsAdmin(false)
      setIsPolicyholder(false)
      setIsRegistered(false)
    } finally {
      setBlockchainLoading(false)
    }
  }

  // Store user type in localStorage
  useEffect(() => {
    if (userType) {
      localStorage.setItem("chainsure-user-type", userType)
    } else {
      localStorage.removeItem("chainsure-user-type")
    }
  }, [userType])

  // Restore user type and ABHA consent from localStorage
  useEffect(() => {
    const storedUserType = localStorage.getItem("chainsure-user-type")
    const storedAbhaConsent = localStorage.getItem("chainsure-abha-consent")
    
    if (storedUserType && (storedUserType === "user" || storedUserType === "admin")) {
      setUserType(storedUserType)
    }
    
    if (storedAbhaConsent === "true") {
      setHasAbhaConsent(true)
    }
  }, [])

  // Store ABHA consent in localStorage
  useEffect(() => {
    if (hasAbhaConsent) {
      localStorage.setItem("chainsure-abha-consent", "true")
    } else {
      localStorage.removeItem("chainsure-abha-consent")
    }
  }, [hasAbhaConsent])

  // Refresh blockchain state when wallet connects/reconnects
  useEffect(() => {
    if (isConnected && address) {
      // Small delay to ensure wallet is fully connected
      setTimeout(() => {
        refreshBlockchainState()
      }, 1000)
    } else {
      // Reset blockchain state when disconnected
      setIsAdmin(false)
      setIsPolicyholder(false)
      setIsRegistered(false)
    }
  }, [isConnected, address])

  const value: WalletContextType = {
    isConnected,
    address,
    userType,
    setUserType,
    connectWallet,
    disconnectWallet,
    isLoading,
    hasAbhaConsent,
    setHasAbhaConsent,
    // Blockchain state
    isAdmin,
    isPolicyholder,
    isRegistered,
    blockchainLoading,
    refreshBlockchainState,
  }

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWalletContext() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error("useWalletContext must be used within a WalletContextProvider")
  }
  return context
}
