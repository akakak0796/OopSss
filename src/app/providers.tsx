'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit'
import { mainnet, polygon, arbitrum, optimism, base, sepolia } from 'wagmi/chains'
import { http } from 'viem'

// U2U Mainnet configuration
const u2uMainnet = {
  id: 2484,
  name: 'U2U Mainnet',
  nativeCurrency: {
    decimals: 18,
    name: 'U2U',
    symbol: 'U2U',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc-mainnet.uniultra.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'U2U Explorer',
      url: 'https://u2uscan.xyz',
    },
  },
}

const config = getDefaultConfig({
  appName: 'SlitherFi',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'your-project-id',
  chains: [u2uMainnet, mainnet, polygon, arbitrum, optimism, base, sepolia],
  transports: {
    [u2uMainnet.id]: http(),
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
    [base.id]: http(),
    [sepolia.id]: http(),
  },
})

const queryClient = new QueryClient()

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
