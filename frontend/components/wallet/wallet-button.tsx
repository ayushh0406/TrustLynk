"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { useWalletContext } from "@/context/wallet-context"
import { Wallet, LogOut, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface WalletButtonProps {
  className?: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
}

export function WalletButton({ className, variant = "default", size = "default" }: WalletButtonProps) {
  const { isConnected, address, connectWallet, disconnectWallet, isLoading } = useWalletContext()
  const { toast } = useToast()

  const handleConnect = async () => {
    try {
      await connectWallet()
      toast({
        title: "Wallet Connected",
        description: "Successfully connected to Freighter wallet!",
      })
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to Freighter wallet. Please make sure Freighter is installed.",
        variant: "destructive",
      })
    }
  }

  const handleDisconnect = async () => {
    try {
      await disconnectWallet()
      toast({
        title: "Wallet Disconnected",
        description: "Successfully disconnected from wallet.",
      })
    } catch (error) {
      toast({
        title: "Disconnection Failed",
        description: "Failed to disconnect wallet.",
        variant: "destructive",
      })
    }
  }

  // const formatAddress = (addr?: string) => {
  //   if (!addr || addr.length < 8) return addr || ""
  //   return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  // }

  if (isConnected && address) {
    return (
      <Button
        onClick={handleDisconnect}
        variant={variant}
        size={size}
        className={className}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <LogOut className="h-4 w-4 mr-2" />
        )}
        {/* {formatAddress(address)} */}
      </Button>
    )
  }

  return (
    <Button
      onClick={handleConnect}
      variant={variant}
      size={size}
      className={className}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Wallet className="h-4 w-4 mr-2" />
      )}
      Connect Freighter Wallet
    </Button>
  )
}
