"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Plus, 
  Shield, 
  Heart, 
  Car, 
  Home, 
  Plane, 
  TrendingUp,
  Users,
  CreditCard,
  FileText,
  Loader2,
  CheckCircle,
  Settings
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useWalletContext } from "@/context/wallet-context"
import DashboardHeader from "@/components/dashboard/dashboard-header"
import { StateRestorationNotice } from "@/components/ui/state-restoration-notice"
import { 
  createPolicy, 
  getUserRole, 
  getPolicyTypeNumber,
  getAllPolicies,
  getPolicyTypeString,
  ROLE_ADMIN 
} from "@/lib/blockchain"

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
  isActive: boolean
  createdAt: string
  createdBy: string
}

interface PolicyFormData {
  title: string
  description: string
  type: "Health" | "Life" | "Auto" | "Home" | "Travel" | ""
  monthlyPremium: string
  yearlyPremium: string
  coverageAmount: string
  features: string[]
  benefits: string[]
  minAge: string
  maxAge: string
  requirements: string[]
  duration: string
  waitingPeriod: string
  claimProcess: string
}

export const dynamic = 'force-dynamic'

export default function AdminDashboard() {
  const [policies, setPolicies] = useState<Policy[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [initializing, setInitializing] = useState(false)
  
  const { 
    address, 
    isAdmin, 
    blockchainLoading, 
    refreshBlockchainState 
  } = useWalletContext()
  const { toast } = useToast()

  const [formData, setFormData] = useState<PolicyFormData>({
    title: "",
    description: "",
    type: "",
    monthlyPremium: "",
    yearlyPremium: "",
    coverageAmount: "",
    features: [""],
    benefits: [""],
    minAge: "18",
    maxAge: "65",
    requirements: [""],
    duration: "1 Year renewable",
    waitingPeriod: "30 days",
    claimProcess: "Standard processing via blockchain verification"
  })

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Health": return <Heart className="h-5 w-5" />
      case "Life": return <Users className="h-5 w-5" />
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

  // These functions are now handled by wallet context
  // Remove the individual state management functions

  const fetchPolicies = async () => {
    try {
      const blockchainPolicies = await getAllPolicies();
      // Map blockchain policies to the Policy type used in the dashboard
      const mappedPolicies = blockchainPolicies.map((p) => ({
        id: p.id,
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
        features: [], // Add if available in contract
        benefits: [], // Add if available in contract
        isActive: p.status === 1,
        createdAt: p.created_at,
        createdBy: p.created_by,
      }));
      setPolicies(mappedPolicies);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load policies from blockchain",
        variant: "destructive"
      });
    }
  }

  const handleInputChange = (field: keyof PolicyFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleArrayChange = (field: 'features' | 'benefits' | 'requirements', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }))
  }

  const addArrayItem = (field: 'features' | 'benefits' | 'requirements') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], ""]
    }))
  }

  const removeArrayItem = (field: 'features' | 'benefits' | 'requirements', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      type: "",
      monthlyPremium: "",
      yearlyPremium: "",
      coverageAmount: "",
      features: [""],
      benefits: [""],
      minAge: "18",
      maxAge: "65",
      requirements: [""],
      duration: "1 Year renewable",
      waitingPeriod: "30 days",
      claimProcess: "Standard processing via blockchain verification"
    })
  }

  const handleCreatePolicy = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.description || !formData.type || !formData.yearlyPremium || !formData.coverageAmount) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    if (!address) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive"
      })
      return
    }

    if (!isAdmin) {
      toast({
        title: "Permission Denied",
        description: "Only admins can create policies",
        variant: "destructive"
      })
      return
    }

    setCreating(true)

    try {
      const policyData = {
        title: formData.title,
        description: formData.description,
        policyType: getPolicyTypeNumber(formData.type),
        monthlyPremium: parseInt(formData.monthlyPremium) || Math.round(parseInt(formData.yearlyPremium) / 12),
        yearlyPremium: parseInt(formData.yearlyPremium),
        coverageAmount: parseInt(formData.coverageAmount),
        minAge: parseInt(formData.minAge),
        maxAge: parseInt(formData.maxAge),
        durationDays: 365, // Default to 1 year
        waitingPeriodDays: 30, // Default waiting period
      }

      const result = await createPolicy(policyData)
      
      if (result.success) {
        toast({
          title: "Policy Created Successfully!",
          description: `Transaction Hash: ${result.transactionHash}`,
        })
        
        resetForm()
        setShowCreateForm(false)
        await fetchPolicies()
      }
    } catch (error) {
      toast({
        title: "Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create policy",
        variant: "destructive"
      })
    } finally {
      setCreating(false)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await fetchPolicies()
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
            <p>Loading admin dashboard...</p>
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
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create and manage insurance policies on the blockchain
          </p>
          
          {/* Platform Status */}
          <div className="mt-4 flex flex-wrap gap-2 items-center">
            <Badge variant={isAdmin ? "default" : "destructive"}>
              {isAdmin ? "Admin Verified" : "Not Admin"}
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

          {/* Not Admin Warning */}
          {!isAdmin && (
            <Card className="mt-4 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/10">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Shield className="h-5 w-5 text-red-600 mr-3" />
                  <div>
                    <h3 className="font-semibold text-red-800 dark:text-red-200">
                      Admin Access Required
                    </h3>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      You need admin privileges to access this dashboard. Please register as an admin or contact the platform administrator.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Policies</p>
                  <p className="text-2xl font-bold">{policies.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Policies</p>
                  <p className="text-2xl font-bold">{policies.filter(p => p.isActive).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CreditCard className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Coverage</p>
                  <p className="text-2xl font-bold">
                    ₹{policies.reduce((sum, p) => sum + p.coverage.amount, 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Premium</p>
                  <p className="text-2xl font-bold">
                    ₹{policies.length > 0 ? Math.round(policies.reduce((sum, p) => sum + p.premium.yearly, 0) / policies.length).toLocaleString() : 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="policies" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="policies">My Policies</TabsTrigger>
            <TabsTrigger value="create">Create Policy</TabsTrigger>
          </TabsList>
          
          <TabsContent value="policies" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Created Policies</h2>
              <Button 
                onClick={() => setShowCreateForm(true)}
                className="bg-[#fa6724] hover:bg-[#e55613]"
                disabled={!isAdmin}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Policy
              </Button>
            </div>
            
            {policies.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Policies Created</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Start creating insurance policies for users to purchase.
                  </p>
                  <Button 
                    onClick={() => {
                      const tabsTrigger = document.querySelector('[value="create"]') as HTMLElement
                      tabsTrigger?.click()
                    }}
                    className="bg-[#fa6724] hover:bg-[#e55613]"
                    disabled={!isAdmin}
                  >
                    Create First Policy
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {policies.map((policy) => (
                  <Card key={policy.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(policy.type)}
                          <Badge className={getTypeColor(policy.type)}>
                            {policy.type}
                          </Badge>
                        </div>
                        <Badge variant={policy.isActive ? "default" : "secondary"}>
                          {policy.isActive ? "Active" : "Inactive"}
                        </Badge>
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
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Created: {new Date(policy.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <FileText className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Settings className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="create" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create New Policy</CardTitle>
                <CardDescription>
                  Create a new insurance policy that will be deployed to the Aptos blockchain
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={handleCreatePolicy} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Policy Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => handleInputChange("title", e.target.value)}
                        placeholder="e.g., Comprehensive Health Insurance"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="type">Policy Type *</Label>
                      <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select policy type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Health">Health Insurance</SelectItem>
                          <SelectItem value="Life">Life Insurance</SelectItem>
                          <SelectItem value="Auto">Auto Insurance</SelectItem>
                          <SelectItem value="Home">Home Insurance</SelectItem>
                          <SelectItem value="Travel">Travel Insurance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      placeholder="Describe the policy coverage and benefits"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="coverageAmount">Coverage Amount (₹) *</Label>
                      <Input
                        id="coverageAmount"
                        type="number"
                        value={formData.coverageAmount}
                        onChange={(e) => handleInputChange("coverageAmount", e.target.value)}
                        placeholder="500000"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="yearlyPremium">Yearly Premium (₹) *</Label>
                      <Input
                        id="yearlyPremium"
                        type="number"
                        value={formData.yearlyPremium}
                        onChange={(e) => handleInputChange("yearlyPremium", e.target.value)}
                        placeholder="25000"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="monthlyPremium">Monthly Premium (₹)</Label>
                      <Input
                        id="monthlyPremium"
                        type="number"
                        value={formData.monthlyPremium}
                        onChange={(e) => handleInputChange("monthlyPremium", e.target.value)}
                        placeholder="Auto-calculated if empty"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <Label>Features</Label>
                    {formData.features.map((feature, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={feature}
                          onChange={(e) => handleArrayChange("features", index, e.target.value)}
                          placeholder="e.g., Cashless hospitalization"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => removeArrayItem("features", index)}
                          disabled={formData.features.length === 1}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addArrayItem("features")}
                    >
                      Add Feature
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <Label>Benefits</Label>
                    {formData.benefits.map((benefit, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={benefit}
                          onChange={(e) => handleArrayChange("benefits", index, e.target.value)}
                          placeholder="e.g., 100% coverage for emergencies"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => removeArrayItem("benefits", index)}
                          disabled={formData.benefits.length === 1}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addArrayItem("benefits")}
                    >
                      Add Benefit
                    </Button>
                  </div>
                  
                  <div className="flex gap-4 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetForm}
                      className="flex-1"
                    >
                      Reset Form
                    </Button>
                    <Button
                      type="submit"
                      disabled={creating}
                      className="flex-1 bg-[#fa6724] hover:bg-[#e55613]"
                    >
                      {creating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating Policy...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Create Policy
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
