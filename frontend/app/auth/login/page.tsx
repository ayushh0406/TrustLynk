"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Wallet, Shield, UserCheck } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Loader } from "@/components/ui/loader"
import { WalletButton } from "@/components/wallet/wallet-button"
import { useWalletContext } from "@/context/wallet-context"
import { AbhaConsentModal } from "@/components/abha/abha-consent-modal"
import { registerAsAdmin, registerAsPolicyholder } from "@/lib/blockchain"

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { 
    isConnected, 
    userType, 
    setUserType, 
    hasAbhaConsent,
    isAdmin,
    isPolicyholder,
    isRegistered,
    blockchainLoading,
    refreshBlockchainState
  } = useWalletContext()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [showAbhaModal, setShowAbhaModal] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [showRoleSelection, setShowRoleSelection] = useState(false)

  // Handle post-wallet connection logic
  useEffect(() => {
    if (isConnected && !blockchainLoading) {
      if (isRegistered) {
        // User is already registered, check ABHA for policyholders
        if (isPolicyholder && !hasAbhaConsent) {
          setShowAbhaModal(true)
          return
        }
        
        // Proceed to dashboard
        setIsTransitioning(true)
        setTimeout(() => {
          setIsTransitioning(false)
          toast({
            title: "Welcome Back!",
            description: "Auto-login successful!",
          })
          
          if (isAdmin) {
            router.push("/dashboard/admin")
          } else if (isPolicyholder) {
            router.push("/dashboard/user")
          }
        }, 1500)
      } else {
        // User not registered, show role selection
        setShowRoleSelection(true)
      }
    }
  }, [isConnected, blockchainLoading, isRegistered, isAdmin, isPolicyholder, hasAbhaConsent, router, toast])

  const handleAbhaConsentSuccess = () => {
    setShowAbhaModal(false)
    setIsTransitioning(true)
    
    setTimeout(() => {
      setIsTransitioning(false)
      toast({
        title: "Login Successful",
        description: "Welcome to ChainSure!",
      })
      router.push("/dashboard/user")
    }, 1500)
  }

  const handleRoleRegistration = async (role: "admin" | "policyholder") => {
    setIsRegistering(true)
    try {
      if (role === "admin") {
        await registerAsAdmin()
        setUserType("admin")
        toast({
          title: "Registration Successful!",
          description: "Welcome Admin! You can now create policies.",
        })
      } else {
        await registerAsPolicyholder()
        setUserType("user")
        toast({
          title: "Registration Successful!",
          description: "Welcome Policyholder! You can now purchase policies.",
        })
      }
      
      // Refresh blockchain state and redirect
      await refreshBlockchainState()
      setShowRoleSelection(false)
      
      setTimeout(() => {
        if (role === "admin") {
          router.push("/dashboard/admin")
        } else {
          router.push("/dashboard/user")
        }
      }, 1000)
      
    } catch (error) {
      console.error("Registration failed:", error)
      toast({
        title: "Registration Failed",
        description: "Please try again. Make sure you have enough gas.",
        variant: "destructive"
      })
    } finally {
      setIsRegistering(false)
    }
  }

  return (
    <>
      {isTransitioning && <Loader />}
      <AbhaConsentModal 
        isOpen={showAbhaModal}
        onClose={() => setShowAbhaModal(false)}
        onSuccess={handleAbhaConsentSuccess}
      />
      <div className="min-h-screen flex">
        {/* Left side - Form */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            {!isConnected ? (
              // Step 1: Wallet Connection
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <Image 
                    src="https://i.ibb.co/5Xn2hrY3/logo-white-bg.png"
                    alt="ChainSure Logo"
                    width={48}
                    height={48}
                    className="mx-auto rounded-xl mb-4"
                  />
                  <h1 className="text-2xl font-bold mb-2" onClick={() => router.push("/")}>Welcome to ChainSure</h1>
                  <p className="text-gray-600 dark:text-gray-400">Connect your Freighter wallet to get started</p>
                </div>

                <div className="space-y-6 text-center">
                  <div className="mx-auto w-32 h-32 rounded-full bg-gradient-to-br from-[#fa6724] to-[#07a6ec] p-1">
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                      <Image
                        src="https://i.ibb.co/8nHxb4zN/claimsaathi-snapping-winking.png"
                        alt="Claim Saathi"
                        width={120}
                        height={120}
                        className="rounded-full"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Connect Your Freighter Wallet</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm max-w-sm mx-auto">
                      Secure, decentralized authentication powered by Stellar blockchain. 
                      Your wallet is your identity on ChainSure.
                    </p>
                    
                    <div className="pt-4">
                      <WalletButton 
                        className="w-full h-12 text-base bg-[#fa6724] hover:bg-[#e55613]"
                        size="lg"
                      />
                    </div>
                    
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                      <p>Don't have Freighter wallet? 
                        <a 
                          href="https://www.freighter.app/" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[#07a6ec] hover:underline ml-1"
                        >
                          Download here
                        </a>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                    <p className="mb-2">🔐 Powered by Stellar blockchain</p>
                    <p>✅ No passwords • ✅ Secure • ✅ Decentralized</p>
                  </div>
                </div>
              </div>
            ) : blockchainLoading ? (
              // Step 2: Checking Registration Status
              <div className="space-y-6 text-center">
                <div className="text-center mb-8">
                  <Image 
                    src="https://i.ibb.co/5Xn2hrY3/logo-white-bg.png"
                    alt="ChainSure Logo"
                    width={48}
                    height={48}
                    className="mx-auto rounded-xl mb-4"
                  />
                  <h1 className="text-2xl font-bold mb-2">Checking Registration</h1>
                  <p className="text-gray-600 dark:text-gray-400">Verifying your account on the blockchain...</p>
                </div>
                <div className="flex items-center justify-center">
                  <Loader />
                </div>
              </div>
            ) : showRoleSelection ? (
              // Step 3: Role Selection for New Users
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <Image 
                    src="https://i.ibb.co/5Xn2hrY3/logo-white-bg.png"
                    alt="ChainSure Logo"
                    width={48}
                    height={48}
                    className="mx-auto rounded-xl mb-4"
                  />
                  <h1 className="text-2xl font-bold mb-2">Choose Your Role</h1>
                  <p className="text-gray-600 dark:text-gray-400">How would you like to use ChainSure?</p>
                </div>

                <div className="grid gap-4">
                  <Button
                    onClick={() => handleRoleRegistration("policyholder")}
                    disabled={isRegistering}
                    className="h-auto p-4 bg-gradient-to-r from-[#fa6724] to-[#fa8124] disabled:opacity-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center">
                        {isRegistering ? (
                          <Loader className="w-6 h-6" />
                        ) : (
                          <Shield className="w-6 h-6" />
                        )}
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold">I'm a Policyholder</h3>
                        <p className="text-sm text-white/80">Purchase and manage insurance policies</p>
                      </div>
                    </div>
                  </Button>

                  <Button
                    onClick={() => handleRoleRegistration("admin")}
                    disabled={isRegistering}
                    className="h-auto p-4 bg-gradient-to-r from-[#07a6ec] to-[#07c6ec] disabled:opacity-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center">
                        {isRegistering ? (
                          <Loader className="w-6 h-6" />
                        ) : (
                          <UserCheck className="w-6 h-6" />
                        )}
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold">I'm an Admin</h3>
                        <p className="text-sm text-white/80">Create and manage insurance policies</p>
                      </div>
                    </div>
                  </Button>
                </div>

                {isRegistering && (
                  <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                    <p>Registering on blockchain... This may take a few seconds.</p>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>

        {/* Right side - Image */}
        <div className="hidden md:block md:w-1/2 bg-gradient-to-br from-[#fa6724] to-[#07a6ec] relative">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute inset-0 flex items-center justify-center p-12">
            <div className="max-w-md text-white">
              <h2 className="text-3xl font-bold mb-4">Revolutionizing Insurance Claims</h2>
              <p className="text-lg mb-6">
                ChainSure reduces claim settlement time from 90 days to under 3 minutes with AI & blockchain
                technology.
              </p>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                    <Image
                      src="https://i.ibb.co/JFW8D5KV/claimsaathi-goodmood-happy.png"
                      alt="Claim Saathi"
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  </div>
                  <div className="bg-white/20 rounded-lg p-3">
                    <p className="text-sm">
                      "ChainSure processed my health insurance claim in just 2 hours! The blockchain verification gave
                      me confidence that everything was secure."
                    </p>
                  </div>
                </div>
                <p className="text-sm font-medium">Priya Sharma, Health Insurance Policyholder</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

