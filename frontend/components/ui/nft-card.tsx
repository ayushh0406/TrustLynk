"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Shield, 
  ExternalLink, 
  Download, 
  Star,
  Calendar,
  DollarSign,
  Users
} from "lucide-react"
import Image from "next/image"

interface NFTCardProps {
  tokenId: string;
  policyName: string;
  description: string;
  imageUri: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  externalUrl?: string;
  onViewDetails?: () => void;
  onDownloadCertificate?: () => void;
}

export function NFTCard({
  tokenId,
  policyName,
  description,
  imageUri,
  attributes,
  externalUrl,
  onViewDetails,
  onDownloadCertificate
}: NFTCardProps) {
  const coverage = attributes.find(attr => attr.trait_type === "Coverage")?.value;
  const premium = attributes.find(attr => attr.trait_type === "Premium")?.value;
  const policyType = attributes.find(attr => attr.trait_type === "Policy Type")?.value;
  const duration = attributes.find(attr => attr.trait_type === "Duration")?.value;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-48 w-full">
        <Image
          src={imageUri || "/placeholder-nft.png"}
          alt={policyName}
          fill
          className="object-cover"
        />
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="bg-black/50 text-white">
            NFT #{tokenId.slice(-6)}
          </Badge>
        </div>
        <div className="absolute bottom-2 left-2">
          <Badge className="bg-green-600 text-white">
            <Shield className="h-3 w-3 mr-1" />
            Active Policy
          </Badge>
        </div>
      </div>
      
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg line-clamp-1">{policyName}</CardTitle>
            <CardDescription className="line-clamp-2">{description}</CardDescription>
          </div>
          <div className="text-right">
            <Badge variant="outline">{policyType}</Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Coverage</p>
              <p className="font-semibold text-sm">{coverage}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-blue-600" />
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Premium</p>
              <p className="font-semibold text-sm">{premium}</p>
            </div>
          </div>
        </div>

        {/* Attributes */}
        <div className="space-y-2">
          <p className="text-sm font-medium">NFT Attributes:</p>
          <div className="flex flex-wrap gap-1">
            {attributes.slice(0, 4).map((attr, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {attr.trait_type}: {attr.value}
              </Badge>
            ))}
            {attributes.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{attributes.length - 4} more
              </Badge>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={onViewDetails}
          >
            <Star className="h-3 w-3 mr-1" />
            Details
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onDownloadCertificate}
          >
            <Download className="h-3 w-3 mr-1" />
            Certificate
          </Button>
          {externalUrl && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open(externalUrl, '_blank')}
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
