"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Shield, 
  Heart, 
  Car, 
  Home, 
  Plane, 
  ShoppingCart, 
  CheckCircle, 
  Clock,
  CreditCard,
  FileText,
  TrendingUp,
  User,
  Loader2
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { fraudDetectionAPI, getClaimStatusFromScore } from "@/lib/fraud-detection"
import { useWalletContext } from "@/context/wallet-context"
import DashboardHeader from "@/components/dashboard/dashboard-header"
import { StateRestorationNotice } from "@/components/ui/state-restoration-notice"
import { 
  purchasePolicy, 
  getUserPolicies as getBlockchainUserPolicies, 
  getUserRole, 
  getAllPolicies,
  getPolicyTypeString,
  generatePolicyMetadata,
  getUserTokens,
  getNFTMetadata,
  convertINRToXLM,
  formatXLM,
  registerAsPolicyholder,
  ROLE_POLICYHOLDER,
  claimPolicy,
  getUserClaims,
  getClaimStatusString,
  getClaimStatusColor
} from "@/lib/blockchain"

export const dynamic = 'force-dynamic'

interface Policy {
  id: string
  title: string
  description: string
  provider: string
  type: "Health" | "Life" | "Auto" | "Home" | "Travel"
  premium: {
    monthly: number
    yearly: number
  }
  coverage: {
    amount: number
    currency: string
  }
  features: string[]
  benefits: string[]
}

interface UserPolicy {
  id: string
  policyId: string
  userWallet: string
  purchaseDate: string
  status: "Active" | "Expired" | "Claimed" | "Cancelled"
  premiumPaid: number
  nextPremiumDue?: string
  policy?: Policy
  claimsHistory?: Array<{
    id: string
    date: string
    amount: number
    status: string
    description: string
  }>
}

export default function UserDashboard() {
  const [availablePolicies, setAvailablePolicies] = useState<Policy[]>([])
  const [userPolicies, setUserPolicies] = useState<UserPolicy[]>([])
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [registering, setRegistering] = useState(false)
  const [claiming, setClaiming] = useState<string | null>(null)
  const [userClaims, setUserClaims] = useState<any[]>([])
  
  const { 
    address, 
    isPolicyholder, 
    isRegistered, 
    hasAbhaConsent, 
    blockchainLoading, 
    refreshBlockchainState,
    isConnected 
  } = useWalletContext()
  const { toast } = useToast()

  // Debug wallet state
  useEffect(() => {
    console.log("🔗 Wallet State:", {
      address,
      isConnected,
      isPolicyholder,
      hasAbhaConsent
    })
  }, [address, isConnected, isPolicyholder, hasAbhaConsent])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Health": return <Heart className="h-5 w-5" />
      case "Life": return <User className="h-5 w-5" />
      case "Auto": return <Car className="h-5 w-5" />
      case "Home": return <Home className="h-5 w-5" />
      case "Travel": return <Plane className="h-5 w-5" />
      default: return <Shield className="h-5 w-5" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Health": return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
      case "Life": return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
      case "Auto": return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
      case "Home": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
      case "Travel": return "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
      default: return "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  const fetchPolicies = async () => {
    try {
      console.log("🔍 Fetching policies from blockchain...")
      const blockchainPolicies = await getAllPolicies();
      console.log("📋 Raw blockchain policies:", blockchainPolicies)
      
      if (!blockchainPolicies || blockchainPolicies.length === 0) {
        console.log("⚠️ No policies found on blockchain")
        setAvailablePolicies([]);
        return;
      }
      
      const mappedPolicies = blockchainPolicies.map((p) => {
        console.log("🔄 Mapping policy:", p)
        return {
          id: p.policy_id, // Use policy_id from blockchain (not id)
          title: p.title,
          description: p.description,
          provider: "ChainSure",
          type: getPolicyTypeString(Number(p.policy_type)) as "Health" | "Life" | "Auto" | "Home" | "Travel",
          premium: {
            monthly: parseInt(p.monthly_premium),
            yearly: parseInt(p.yearly_premium),
          },
          coverage: {
            amount: parseInt(p.coverage_amount),
            currency: "₹",
          },
          features: ["Blockchain-secured", "Smart contract automation", "NFT policy certificate"], 
          benefits: ["Transparent claims", "Instant verification", "Decentralized storage"],
        };
      });
      
      console.log("✅ Mapped policies for UI:", mappedPolicies)
      setAvailablePolicies(mappedPolicies);
    } catch (error) {
      console.error("❌ Error fetching policies:", error);
      setAvailablePolicies([]);
    }
  }

  // User status is now managed by wallet context

  const handleRegisterUser = async () => {
    if (!address) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive"
      })
      return
    }

    setRegistering(true)
    try {
      await registerAsPolicyholder()
      toast({
        title: "Registration Successful",
        description: "You have been registered as a policyholder and can now purchase policies",
      })
      await refreshBlockchainState()
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Failed to register as policyholder",
        variant: "destructive"
      })
    } finally {
      setRegistering(false)
    }
  }

  const fetchUserPolicies = async () => {
    if (!address) return;
    try {
      const blockchainUserPolicies = await getBlockchainUserPolicies(address);
      console.log("🔍 Blockchain user policies:", blockchainUserPolicies)
      
      if (!blockchainUserPolicies || blockchainUserPolicies.length === 0) {
        console.log("⚠️ No user policies found")
        setUserPolicies([]);
        return;
      }
      
      const allPolicies = await getAllPolicies();
      console.log("🔍 All policies for reference:", allPolicies)
      
      const formattedPolicies = blockchainUserPolicies.map((bp) => {
        console.log("🔍 Processing user policy:", bp)
        const policy = allPolicies.find((p) => p.policy_id === bp.policy_id);
        return {
          id: bp.id,
          policyId: bp.policy_id,
          userWallet: bp.user_address,
          purchaseDate: new Date(parseInt(bp.purchase_date) * 1000).toISOString(),
          status: (() => {
            // Check if policy is actually expired based on purchase date and duration
            const purchaseDate = new Date(parseInt(bp.purchase_date) * 1000);
            const policy = allPolicies.find((p) => p.policy_id === bp.policy_id);
            if (policy) {
              const durationDays = parseInt(policy.duration_days);
              const expiryDate = new Date(purchaseDate.getTime() + (durationDays * 24 * 60 * 60 * 1000));
              const now = new Date();
              
              if (now > expiryDate) {
                return "Expired";
              } else {
                return "Active";
              }
            }
            // Fallback to blockchain status if policy not found
            return (bp.status === 1 ? "Active" : "Expired") as "Active" | "Expired" | "Claimed" | "Cancelled";
          })(),
          premiumPaid: parseInt(bp.premium_paid),
          policy: policy
            ? {
                id: policy.policy_id,
                title: policy.title,
                description: policy.description,
                provider: "ChainSure",
                type: getPolicyTypeString(Number(policy.policy_type)) as "Health" | "Life" | "Auto" | "Home" | "Travel",
                premium: {
                  monthly: parseInt(policy.monthly_premium),
                  yearly: parseInt(policy.yearly_premium),
                },
                coverage: {
                  amount: parseInt(policy.coverage_amount),
                  currency: "₹",
                },
                features: [],
                benefits: [],
              }
            : undefined,
        };
      });
      console.log("✅ Formatted user policies:", formattedPolicies)
      setUserPolicies(formattedPolicies);
    } catch (error) {
      console.error("❌ Error fetching user policies:", error);
      setUserPolicies([]);
    }
  }

  const handlePurchasePolicy = async (policyId: string) => {
    console.log("🚀 PURCHASE BUTTON CLICKED - Policy ID:", policyId, "Type:", typeof policyId)
    
    if (!policyId) {
      console.error("❌ Policy ID is undefined or empty!")
      toast({
        title: "Error",
        description: "Policy ID is missing. Please refresh the page and try again.",
        variant: "destructive"
      })
      return
    }

    // Temporarily disable ABHA check for testing
    // if (!hasAbhaConsent) {
    //   toast({
    //     title: "ABHA Consent Required",
    //     description: "Please authorize your ABHA data access before purchasing policies",
    //     variant: "destructive"
    //   })
    //   return
    // }

    if (!address) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to purchase policies",
        variant: "destructive"
      })
      return
    }

    console.log("✅ All checks passed, starting purchase process...")
    setPurchasing(policyId)

    try {
      // First, find the policy in our current available policies (which includes demo policies)
      console.log("🔍 Available policies:", availablePolicies.map(p => ({ id: p.id, title: p.title })))
      const policy = availablePolicies.find(p => p.id === policyId)
      
      if (!policy) {
        console.error("❌ Policy not found in available policies")
        console.log("Available policy IDs:", availablePolicies.map(p => p.id))
        toast({
          title: "Policy Not Found",
          description: "The selected policy could not be found. Please refresh and try again.",
          variant: "destructive"
        })
        return
      }

      console.log("✅ Found policy:", policy.title)
      
      // Process blockchain purchase
      console.log("🔗 Processing blockchain purchase for policy:", policy.title)
      
      try {
        const blockchainPolicies = await getAllPolicies()
        console.log("🔍 Blockchain policies raw data:", blockchainPolicies)
        console.log("🔍 Looking for policy ID:", policyId, "Type:", typeof policyId)
        console.log("🔍 Available blockchain policy IDs:", blockchainPolicies.map(p => ({ policy_id: p.policy_id, title: p.title })))
        
        // Find the policy by policy_id (try both string and number comparison)
        const blockchainPolicy = blockchainPolicies.find(p => 
          p.policy_id === policyId || 
          p.policy_id === parseInt(policyId).toString()
        )
        
        if (!blockchainPolicy) {
          console.error("❌ Policy not found. Available policies:", blockchainPolicies.map(p => ({ 
            policy_id: p.policy_id, 
            title: p.title 
          })))
          throw new Error(`Policy ${policyId} not found on blockchain. Available IDs: ${blockchainPolicies.map(p => p.policy_id).join(', ')}`)
        }

        console.log("✅ Found blockchain policy:", blockchainPolicy.title)

        // Generate NFT metadata using blockchain policy
        const metadata = generatePolicyMetadata(blockchainPolicy, address)
        const metadataUri = `https://chainsure.io/metadata/${policyId}-${Date.now()}.json`
        const monthlyPremiumINR = parseInt(blockchainPolicy.monthly_premium)
        
        console.log("💰 Initiating blockchain transaction:", {
          policyId,
          monthlyPremiumINR,
          userAddress: address
        })
        
        // This should open the wallet for signature
        const result = await purchasePolicy(policyId, metadataUri, monthlyPremiumINR)
        
        if (result.success) {
          const xlmAmount = convertINRToXLM(monthlyPremiumINR)
          toast({
            title: "🎉 Policy NFT Minted Successfully!",
            description: `Payment: ₹${monthlyPremiumINR} processed. NFT Certificate created! TX: ${result.transactionHash.slice(0, 8)}...`,
          })
          
          console.log("🎊 Real purchase completed:", result.transactionHash)
          await fetchUserPolicies()
        }
      } catch (blockchainError) {
        console.error("❌ Blockchain purchase failed:", blockchainError)
        throw blockchainError
      }
      
    } catch (error) {
      console.error("❌ Purchase error:", error)
      toast({
        title: "Purchase Failed",
        description: error instanceof Error ? error.message : "Failed to purchase policy",
        variant: "destructive"
      })
    } finally {
      setPurchasing(null)
    }
  }

  const fetchUserClaims = async () => {
    if (!address) return;
    try {
      const claims = await getUserClaims(address);
      console.log("🔍 User claims:", claims);
      setUserClaims(claims);
    } catch (error) {
      console.error("❌ Error fetching user claims:", error);
      setUserClaims([]);
    }
  }

  const handleClaimPolicy = async (policyId: string) => {
    console.log("📋 CLAIM BUTTON CLICKED - Policy ID:", policyId)
    
    if (!address) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to claim policies",
        variant: "destructive"
      })
      return
    }

    // Check if policy already has a claim
    const existingClaim = userClaims.find(claim => claim.policy_id === policyId)
    if (existingClaim) {
      toast({
        title: "Claim Already Exists",
        description: "You can only make one claim per policy. This policy already has a claim.",
        variant: "destructive"
      })
      return
    }

    setClaiming(policyId)

    try {
      // Find the policy details
      const userPolicy = userPolicies.find(p => p.policyId === policyId)
      if (!userPolicy || !userPolicy.policy) {
        throw new Error("Policy not found")
      }

      const claimAmountINR = userPolicy.policy.coverage.amount

      // Call server route to run AI scoring and transfer funds (if APPROVED)
      const res = await fetch("/api/claims/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          policyId,
          userAddress: address,
          claimAmountINR,
        }),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || "Claim submission failed")
      }

      const data = await res.json() as {
        success: boolean
        policyId: string
        userAddress: string
        claimAmountINR: number
        aggregateScore: number
        status: "APPROVED" | "PENDING" | "REJECTED"
        requiresTransfer: boolean
        transferAmount: number
      }

      let txHash: string | null = null;

      // If APPROVED, trigger admin-to-user transfer
      if (data.status === "APPROVED" && data.requiresTransfer) {
        const fundRes = await fetch("/api/admin/fund-claim", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userAddress: address,
            amountOctas: data.transferAmount,
          }),
        });

        if (fundRes.ok) {
          const fundData = await fundRes.json();
          txHash = fundData.txHash;
        } else {
          console.error("❌ Admin funding failed:", await fundRes.text());
        }
      }

      const statusCode = data.status === 'APPROVED' ? 1 : data.status === 'REJECTED' ? 3 : 2
      const statusMessage = data.status === 'APPROVED'
        ? `🎯 Claim APPROVED! Funds transferred${txHash ? ` (TX: ${txHash.slice(0, 10)}...)` : ''}`
        : data.status === 'REJECTED'
        ? '❌ Claim REJECTED - High fraud risk detected'
        : '⏳ Claim PENDING - Awaiting admin review'

      toast({
        title: `Claim ${data.status}`,
        description: `Fraud Score: ${data.aggregateScore}/100 | ${statusMessage}`,
      })

      // Add claim to local state
      const newClaim = {
        claim_id: (txHash || `claim_${Date.now()}`),
        policy_id: policyId,
        user_address: address,
        claim_amount: claimAmountINR.toString(),
        aggregate_score: data.aggregateScore,
        status: statusCode,
        claimed_at: new Date().toISOString(),
        processed_at: new Date().toISOString(),
      }

      setUserClaims(prev => [...prev, newClaim])
      await fetchUserPolicies()

    } catch (error) {
      console.error("❌ Claim error:", error)
      toast({
        title: "Claim Failed",
        description: error instanceof Error ? error.message : "Failed to process claim",
        variant: "destructive"
      })
    } finally {
      setClaiming(null)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchPolicies(), fetchUserPolicies(), fetchUserClaims()])
      setLoading(false)
    }
    
    if (address && !blockchainLoading) {
      loadData()
    }
  }, [address, blockchainLoading])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <DashboardHeader />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading your dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardHeader />
      
      <div className="container mx-auto p-6">
        <StateRestorationNotice />
        
                 {/* Welcome Section */}
         <div className="mb-8">
           <h1 className="text-3xl font-bold mb-2">Welcome to Your Policy Dashboard</h1>
           <p className="text-gray-600 dark:text-gray-400">
             Manage your insurance policies and explore new coverage options
           </p>
           
                       {/* Claim System Status Notice */}
            <Card className="mt-4 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/10">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-green-600 mr-3" />
                  <div>
                    <h3 className="font-semibold text-green-800 dark:green-200">
                      ✅ Claim System Active!
                    </h3>
                    <p className="text-sm text-green-700 dark:green-300">
                      The AI-powered claim system with fraud detection is now working! 
                      Click "Make Claim" on active policies to test the complete fraud analysis and claim process.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          
          {/* User Status */}
          <div className="mt-4 flex flex-wrap gap-2 items-center">
            <Badge variant={isPolicyholder ? "default" : "destructive"}>
              {isPolicyholder ? "Policyholder Registered" : "Not Registered"}
            </Badge>
            <Badge variant={hasAbhaConsent ? "default" : "secondary"}>
              {hasAbhaConsent ? "ABHA Authorized" : "ABHA Not Authorized"}
            </Badge>
            {blockchainLoading && (
              <Badge variant="outline" className="animate-pulse">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Syncing...
              </Badge>
            )}
            <Button
              onClick={refreshBlockchainState}
              disabled={blockchainLoading}
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
            >
              🔄 Refresh
            </Button>
          </div>

          {/* Registration status - FarmAssure style */}
          {!isRegistered && (
            <Card className="mt-4 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/10">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <User className="h-5 w-5 text-orange-600 mr-3" />
                  <div>
                    <h3 className="font-semibold text-orange-800 dark:text-orange-200">
                      Registration Required
                    </h3>
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                      Please register as a policyholder to purchase insurance policies.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {isPolicyholder && (
            <Card className="mt-4 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/10">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <User className="h-5 w-5 text-green-600 mr-3" />
                  <div>
                    <h3 className="font-semibold text-green-800 dark:text-green-200">
                      Ready to Purchase Policies
                    </h3>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      You're registered as a policyholder. Browse and purchase insurance policies!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Policies</p>
                  <p className="text-2xl font-bold">{userPolicies.filter(p => p.status === "Active").length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CreditCard className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Coverage</p>
                  <p className="text-2xl font-bold">
                    ₹{userPolicies.reduce((sum, p) => sum + (p.policy?.coverage?.amount || 0), 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Premium Paid</p>
                  <p className="text-2xl font-bold">
                    ₹{userPolicies.reduce((sum, p) => sum + p.premiumPaid, 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Claims Made</p>
                  <p className="text-2xl font-bold">
                    {userClaims.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Claim Amount</p>
                  <p className="text-2xl font-bold">
                    ₹{userClaims.reduce((sum, c) => sum + parseInt(c.claim_amount), 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="available" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="available">Available Policies</TabsTrigger>
            <TabsTrigger value="my-policies">My Policies</TabsTrigger>
          </TabsList>
          
          <TabsContent value="available" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availablePolicies.map((policy) => (
                <Card key={policy.id} className="h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(policy.type)}
                        <Badge className={getTypeColor(policy.type)}>
                          {policy.type}
                        </Badge>
                      </div>
                    </div>
                    <CardTitle className="text-lg">{policy.title}</CardTitle>
                    <CardDescription>{policy.description}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Coverage</p>
                        <p className="text-xl font-bold text-green-600">
                          {policy.coverage.currency}{policy.coverage.amount.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Premium</p>
                        <p className="text-lg font-semibold">
                          ₹{policy.premium.yearly.toLocaleString()}/year
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          {formatXLM(convertINRToXLM(Math.floor(policy.premium.yearly / 12)))} XLM/month
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium mb-2">Key Features:</p>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        {policy.features.slice(0, 2).map((feature, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            {feature}
                          </li>
                        ))}
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-purple-500" />
                          <span className="font-medium text-purple-600">🎨 NFT Certificate included</span>
                        </li>
                      </ul>
                    </div>
                    
                    <Button 
                      onClick={() => {
                        console.log("🖱️ Button clicked for policy:", policy ,  policy.id, policy.title)
                        handlePurchasePolicy(policy.id)
                      }}
                      disabled={purchasing === policy.id}
                      className="w-full"
                    >
                      {purchasing === policy.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Minting NFT & Processing Payment...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Pay ₹{Math.floor(policy.premium.yearly / 12).toLocaleString()} & Get NFT
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="my-policies" className="space-y-6">
            {userPolicies.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Policies Yet</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    You haven't purchased any policies yet. Explore our available policies to get started.
                  </p>
                  <Button onClick={() => {
                    const tabsTrigger = document.querySelector('[value="available"]') as HTMLElement
                    tabsTrigger?.click()
                  }}>
                    Browse Policies
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {userPolicies.map((userPolicy) => (
                  <Card key={userPolicy.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(userPolicy.policy?.type || "Health")}
                          <Badge className={getTypeColor(userPolicy.policy?.type || "Health")}>
                            {userPolicy.policy?.type}
                          </Badge>
                        </div>
                        <Badge variant={userPolicy.status === "Active" ? "default" : "secondary"}>
                          {userPolicy.status}
                        </Badge>
                      </div>
                      <CardTitle>{userPolicy.policy?.title}</CardTitle>
                      <CardDescription>
                        Purchased on {new Date(userPolicy.purchaseDate).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Coverage</p>
                          <p className="font-semibold">
                            {userPolicy.policy?.coverage?.currency}{userPolicy.policy?.coverage?.amount.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Premium Paid</p>
                          <p className="font-semibold">₹{userPolicy.premiumPaid.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Policy Status</p>
                          <p className="font-semibold">{userPolicy.status}</p>
                        </div>
                      </div>
                      
                      {userPolicy.nextPremiumDue && (
                        <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900 rounded-lg">
                          <Clock className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm">
                            Next premium due: {new Date(userPolicy.nextPremiumDue).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      
                      {userPolicy.status === "Expired" && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900 rounded-lg">
                          <Clock className="h-4 w-4 text-red-600" />
                          <span className="text-sm text-red-600 dark:text-red-400">
                            Policy expired. Claims cannot be made on expired policies.
                          </span>
                        </div>
                      )}
                      
                      {/* Show claim history if any */}
                      {userClaims.filter(claim => claim.policy_id === userPolicy.policyId).length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Claim History:</p>
                          {userClaims
                            .filter(claim => claim.policy_id === userPolicy.policyId)
                            .map((claim, index) => (
                              <div key={claim.claim_id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-500">Claim #{claim.claim_id}</span>
                                  <Badge 
                                    variant="outline" 
                                    className={getClaimStatusColor(claim.status)}
                                  >
                                    {getClaimStatusString(claim.status)}
                                  </Badge>
                                </div>
                                <span className="text-xs text-gray-500">
                                  Score: {claim.aggregate_score}/100
                                </span>
                              </div>
                            ))}
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <FileText className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                                                                         <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          disabled={
                            userPolicy.status !== "Active" || 
                            claiming === userPolicy.policyId ||
                            userClaims.some(claim => claim.policy_id === userPolicy.policyId)
                          }
                          onClick={() => handleClaimPolicy(userPolicy.policyId)}
                        >
                           {claiming === userPolicy.policyId ? (
                             <>
                               <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                               Processing Claim...
                             </>
                           ) : userClaims.some(claim => claim.policy_id === userPolicy.policyId) ? (
                             <>
                               <FileText className="h-4 w-4 mr-2" />
                               Claim Submitted
                             </>
                           ) : (
                             <>
                               <FileText className="h-4 w-4 mr-2" />
                               Make Claim
                             </>
                           )}
                         </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}