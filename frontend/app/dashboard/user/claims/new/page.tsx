"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Upload,
  Camera,
  FileText,
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"

export const dynamic = 'force-dynamic'

export default function NewClaimPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationResult, setVerificationResult] = useState<null | {
    status: "success" | "warning" | "error"
    message: string
  }>(null)
  const [formData, setFormData] = useState({
    policyType: "health",
    policyNumber: "",
    incidentDate: "",
    incidentLocation: "",
    description: "",
    amount: "",
    documents: [] as string[],
    paymentMethod: "upi",
    upiId: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleFileUpload = () => {
    setIsUploading(true)
    setUploadProgress(0)

    // Simulate file upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsUploading(false)

          // Add a mock document to the list
          setFormData((prev) => ({
            ...prev,
            documents: [...prev.documents, "Medical_Report.pdf"],
          }))

          return 0
        }
        return prev + 5
      })
    }, 100)
  }

  const handleVerifyDocuments = () => {
    setIsVerifying(true)

    // Simulate document verification
    setTimeout(() => {
      setIsVerifying(false)
      setVerificationResult({
        status: "success",
        message: "Documents verified successfully. Your claim is eligible for processing.",
      })
    }, 2000)
  }

  const handleNextStep = () => {
    // Validate current step
    if (step === 1) {
      if (!formData.policyType || !formData.policyNumber || !formData.incidentDate || !formData.incidentLocation) {
        toast({
          title: "Missing information",
          description: "Please fill in all required fields",
          variant: "destructive",
        })
        return
      }
    } else if (step === 2) {
      if (!formData.description || !formData.amount) {
        toast({
          title: "Missing information",
          description: "Please fill in all required fields",
          variant: "destructive",
        })
        return
      }
    } else if (step === 3) {
      if (formData.documents.length === 0) {
        toast({
          title: "Missing documents",
          description: "Please upload at least one document",
          variant: "destructive",
        })
        return
      }
    }

    setStep(step + 1)
  }

  const handlePrevStep = () => {
    setStep(step - 1)
  }

  const handleSubmitClaim = () => {
    if (!formData.paymentMethod || (formData.paymentMethod === "upi" && !formData.upiId)) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false)
      toast({
        title: "Claim submitted successfully",
        description: "Your claim has been submitted and is being processed",
      })
      router.push("/dashboard/claims/success")
    }, 2000)
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/dashboard" className="inline-flex items-center text-[#07a6ec] hover:underline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold mt-2">File a New Claim</h1>
        <p className="text-muted-foreground">Complete the form below to submit your insurance claim</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center">
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step >= 1 ? "bg-[#fa6724] text-white" : "bg-gray-200 text-gray-500"
            }`}
          >
            1
          </div>
          <div className={`flex-1 h-1 mx-2 ${step >= 2 ? "bg-[#fa6724]" : "bg-gray-200"}`}></div>
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step >= 2 ? "bg-[#fa6724] text-white" : "bg-gray-200 text-gray-500"
            }`}
          >
            2
          </div>
          <div className={`flex-1 h-1 mx-2 ${step >= 3 ? "bg-[#fa6724]" : "bg-gray-200"}`}></div>
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step >= 3 ? "bg-[#fa6724] text-white" : "bg-gray-200 text-gray-500"
            }`}
          >
            3
          </div>
          <div className={`flex-1 h-1 mx-2 ${step >= 4 ? "bg-[#fa6724]" : "bg-gray-200"}`}></div>
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step >= 4 ? "bg-[#fa6724] text-white" : "bg-gray-200 text-gray-500"
            }`}
          >
            4
          </div>
        </div>
        <div className="flex justify-between mt-2 text-sm">
          <span className={step >= 1 ? "text-[#fa6724] font-medium" : "text-muted-foreground"}>Policy Details</span>
          <span className={step >= 2 ? "text-[#fa6724] font-medium" : "text-muted-foreground"}>Claim Details</span>
          <span className={step >= 3 ? "text-[#fa6724] font-medium" : "text-muted-foreground"}>Documents</span>
          <span className={step >= 4 ? "text-[#fa6724] font-medium" : "text-muted-foreground"}>Payment</span>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          {/* Step 1: Policy Details */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Policy Details</h2>
                <p className="text-muted-foreground">Select your policy type and provide basic information</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Policy Type</Label>
                  <Tabs
                    defaultValue={formData.policyType}
                    onValueChange={(value) => handleSelectChange("policyType", value)}
                    className="mt-2"
                  >
                    <TabsList className="grid grid-cols-2">
                      <TabsTrigger value="health">Health Insurance</TabsTrigger>
                      <TabsTrigger value="travel">Travel Insurance</TabsTrigger>
                    </TabsList>
                    <TabsContent value="health" className="mt-4">
                      <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                        <h3 className="font-medium flex items-center">
                          <FileText className="h-4 w-4 mr-2 text-[#07a6ec]" />
                          Health Insurance Claim
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          For medical expenses, hospitalization, and treatment costs
                        </p>
                      </div>
                    </TabsContent>
                    <TabsContent value="travel" className="mt-4">
                      <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg">
                        <h3 className="font-medium flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-purple-600" />
                          Travel Insurance Claim
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          For trip cancellations, delays, lost baggage, and medical emergencies during travel
                        </p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="policyNumber">Policy Number</Label>
                  <Input
                    id="policyNumber"
                    name="policyNumber"
                    value={formData.policyNumber}
                    onChange={handleChange}
                    placeholder={formData.policyType === "health" ? "HL-1234-5678" : "TR-5678-9012"}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="incidentDate">Date of Incident</Label>
                    <div className="relative">
                      <Input
                        id="incidentDate"
                        name="incidentDate"
                        type="date"
                        value={formData.incidentDate}
                        onChange={handleChange}
                      />
                      <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="incidentLocation">Location</Label>
                    <div className="relative">
                      <Input
                        id="incidentLocation"
                        name="incidentLocation"
                        value={formData.incidentLocation}
                        onChange={handleChange}
                        placeholder="City, State"
                      />
                      <MapPin className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleNextStep} className="bg-[#fa6724] hover:bg-[#e55613]">
                  Next Step
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Claim Details */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Claim Details</h2>
                <p className="text-muted-foreground">Provide information about your claim</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Description of Incident</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Please describe what happened..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Claim Amount (₹)</Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    value={formData.amount}
                    onChange={handleChange}
                    placeholder="Enter amount in INR"
                  />
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={handlePrevStep}>
                  Previous Step
                </Button>
                <Button onClick={handleNextStep} className="bg-[#fa6724] hover:bg-[#e55613]">
                  Next Step
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Documents */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Upload Documents</h2>
                <p className="text-muted-foreground">Upload supporting documents for your claim</p>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={handleFileUpload}
                  >
                    <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                    <h3 className="font-medium">Upload Files</h3>
                    <p className="text-sm text-muted-foreground mt-1">Click to upload documents, bills, or receipts</p>
                  </div>

                  <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors">
                    <Camera className="h-10 w-10 text-muted-foreground mb-2" />
                    <h3 className="font-medium">Scan Documents</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Use camera to scan documents with AI assistance
                    </p>
                  </div>
                </div>

                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}

                {formData.documents.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-medium">Uploaded Documents</h3>
                    <div className="space-y-2">
                      {formData.documents.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex items-center">
                            <FileText className="h-5 w-5 text-[#07a6ec] mr-2" />
                            <span>{doc}</span>
                          </div>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <span className="sr-only">Remove</span>
                            <AlertTriangle className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    <Button
                      onClick={handleVerifyDocuments}
                      disabled={isVerifying}
                      className="w-full bg-[#07a6ec] hover:bg-[#0695d3]"
                    >
                      {isVerifying ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verifying Documents...
                        </>
                      ) : (
                        <>Verify Documents with AI</>
                      )}
                    </Button>

                    {verificationResult && (
                      <div
                        className={`p-4 rounded-lg ${
                          verificationResult.status === "success"
                            ? "bg-green-50 dark:bg-green-950/20"
                            : verificationResult.status === "warning"
                              ? "bg-yellow-50 dark:bg-yellow-950/20"
                              : "bg-red-50 dark:bg-red-950/20"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {verificationResult.status === "success" ? (
                            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500 flex-shrink-0 mt-0.5" />
                          ) : verificationResult.status === "warning" ? (
                            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-500 flex-shrink-0 mt-0.5" />
                          )}
                          <div>
                            <p className="text-sm font-medium">
                              {verificationResult.status === "success"
                                ? "Verification Successful"
                                : verificationResult.status === "warning"
                                  ? "Verification Warning"
                                  : "Verification Failed"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">{verificationResult.message}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={handlePrevStep}>
                  Previous Step
                </Button>
                <Button
                  onClick={handleNextStep}
                  className="bg-[#fa6724] hover:bg-[#e55613]"
                  disabled={formData.documents.length === 0}
                >
                  Next Step
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Payment */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Payment Details</h2>
                <p className="text-muted-foreground">Specify how you would like to receive your claim payment</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <Label>Payment Method</Label>
                  <RadioGroup
                    value={formData.paymentMethod}
                    onValueChange={(value) => handleSelectChange("paymentMethod", value)}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                  >
                    <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="upi" id="upi" />
                      <Label htmlFor="upi" className="cursor-pointer flex-1">
                        <div className="font-medium">UPI</div>
                        <div className="text-xs text-muted-foreground">Instant transfer</div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="bank" id="bank" />
                      <Label htmlFor="bank" className="cursor-pointer flex-1">
                        <div className="font-medium">Bank Transfer</div>
                        <div className="text-xs text-muted-foreground">1-2 business days</div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="wallet" id="wallet" />
                      <Label htmlFor="wallet" className="cursor-pointer flex-1">
                        <div className="font-medium">Digital Wallet</div>
                        <div className="text-xs text-muted-foreground">Instant transfer</div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {formData.paymentMethod === "upi" && (
                  <div className="space-y-2">
                    <Label htmlFor="upiId">UPI ID</Label>
                    <Input
                      id="upiId"
                      name="upiId"
                      value={formData.upiId}
                      onChange={handleChange}
                      placeholder="name@upi"
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter your UPI ID to receive instant payment upon claim approval
                    </p>
                  </div>
                )}

                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                  <h3 className="font-medium flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-[#07a6ec]" />
                    Blockchain-Verified Instant Payments
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your claim will be processed through our blockchain network for secure and transparent verification.
                    Once approved, payment will be instantly transferred to your selected payment method.
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Claim Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Policy Type:</span>
                      <span className="font-medium">
                        {formData.policyType === "health" ? "Health Insurance" : "Travel Insurance"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Policy Number:</span>
                      <span className="font-medium">{formData.policyNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Incident Date:</span>
                      <span className="font-medium">{formData.incidentDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Claim Amount:</span>
                      <span className="font-medium">₹{formData.amount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Documents:</span>
                      <span className="font-medium">{formData.documents.length} files</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={handlePrevStep}>
                  Previous Step
                </Button>
                <Button onClick={handleSubmitClaim} className="bg-[#fa6724] hover:bg-[#e55613]" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>Submit Claim</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

