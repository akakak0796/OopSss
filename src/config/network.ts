// Network configuration for OopSss
export const NETWORK_CONFIG = {
  STORY_AENEID: {
    id: 1315,
    name: 'Story Aeneid Testnet',
    nativeCurrency: {
      decimals: 18,
      name: 'IP',
      symbol: 'IP',
    },
    rpcUrls: {
      default: {
        http: ['https://aeneid.storyrpc.io'],
      },
    },
    blockExplorers: {
      default: {
        name: 'Story Explorer',
        url: 'https://aeneid.storyscan.xyz',
      },
    },
  },
  CONTRACT_ADDRESS: '0x39Ab8225c635e888Ef2819791Cb38972ad0BB20F',
  DEFAULT_CHAIN_ID: 1315, // Story Aeneid Testnet
} as const

// Helper function to check if connected to Story Aeneid
export const isStoryAeneid = (chainId?: number) => {
  return chainId === NETWORK_CONFIG.DEFAULT_CHAIN_ID
}

// Helper function to get network name
export const getNetworkName = (chainId?: number) => {
  switch (chainId) {
    case 1315:
      return 'Story Aeneid Testnet'
    default:
      return `Unsupported Network (Chain ID: ${chainId || 'Unknown'})`
  }
}
