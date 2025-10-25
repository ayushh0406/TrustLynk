/**
 * IPFS and Metadata handling for NFT policies
 */

export interface PolicyNFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  external_url?: string;
  collection?: {
    name: string;
    family: string;
  };
}

/**
 * Upload metadata to IPFS (demo version - in production use Pinata or similar)
 */
export async function uploadMetadataToIPFS(metadata: PolicyNFTMetadata): Promise<string> {
  // For demo purposes, we'll simulate an IPFS upload
  // In production, you would use Pinata or IPFS directly
  
  try {
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate a mock IPFS hash
    const mockHash = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    const ipfsUri = `ipfs://${mockHash}`;
    
    console.log("Mock metadata uploaded:", metadata);
    console.log("Mock IPFS URI:", ipfsUri);
    
    return ipfsUri;
  } catch (error) {
    console.error("Error uploading metadata:", error);
    throw new Error("Failed to upload metadata to IPFS");
  }
}

/**
 * Example metadata for different policy types
 */
export const EXAMPLE_METADATA: Record<string, Partial<PolicyNFTMetadata>> = {
  health: {
    image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=500",
    collection: {
      name: "ChainSure Health Policies",
      family: "ChainSure"
    }
  },
  life: {
    image: "https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=500",
    collection: {
      name: "ChainSure Life Policies", 
      family: "ChainSure"
    }
  },
  auto: {
    image: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=500",
    collection: {
      name: "ChainSure Auto Policies",
      family: "ChainSure"
    }
  },
  home: {
    image: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=500",
    collection: {
      name: "ChainSure Home Policies",
      family: "ChainSure"
    }
  },
  travel: {
    image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=500",
    collection: {
      name: "ChainSure Travel Policies",
      family: "ChainSure"
    }
  }
};
