// Network configuration for SlitherFi
export const NETWORK_CONFIG = {
  U2U_MAINNET: {
    id: 39,
    name: 'U2U Solaris Mainnet',
    nativeCurrency: {
      decimals: 18,
      name: 'U2U',
      symbol: 'U2U',
    },
    rpcUrls: {
      default: {
        http: ['https://rpc-mainnet.u2u.xyz'],
      },
    },
    blockExplorers: {
      default: {
        name: 'U2U Explorer',
        url: 'https://u2uscan.xyz',
      },
    },
  },
  CONTRACT_ADDRESS: '0x5B60CF7edCCc82350C223eF591a4C951d64e74EF',
  DEFAULT_CHAIN_ID: 39, // U2U Solaris Mainnet
} as const

// Helper function to check if connected to U2U Mainnet
export const isU2UMainnet = (chainId?: number) => {
  return chainId === NETWORK_CONFIG.DEFAULT_CHAIN_ID
}

// Helper function to get network name
export const getNetworkName = (chainId?: number) => {
  switch (chainId) {
    case 39:
      return 'U2U Solaris Mainnet'
    case 1:
      return 'Ethereum Mainnet'
    case 137:
      return 'Polygon'
    case 42161:
      return 'Arbitrum'
    case 10:
      return 'Optimism'
    case 8453:
      return 'Base'
    case 11155111:
      return 'Sepolia'
    default:
      return 'Unknown Network'
  }
}
