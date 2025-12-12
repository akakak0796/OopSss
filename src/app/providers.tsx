'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit'
import { http } from 'viem'
import { NETWORK_CONFIG } from '@/config/network'

// Use Story Aeneid testnet from network config
const storyAeneid = NETWORK_CONFIG.STORY_AENEID

const config = getDefaultConfig({
  appName: 'OopSss',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id',
  chains: [storyAeneid],
  transports: {
    [storyAeneid.id]: http('https://aeneid.storyrpc.io', {
      retryCount: 3,
      retryDelay: 1000,
    }),
  },
  ssr: false, // Disable SSR for wallet components
})

const queryClient = new QueryClient()

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          initialChain={storyAeneid}
          showRecentTransactions={true}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
