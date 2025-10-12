'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit'
import { mainnet, polygon, arbitrum, optimism, base, sepolia } from 'wagmi/chains'
import { http } from 'viem'
import { NETWORK_CONFIG } from '@/config/network'

// Use U2U Mainnet from network config
const u2uMainnet = NETWORK_CONFIG.U2U_MAINNET

const config = getDefaultConfig({
  appName: 'OopSss',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id',
  chains: [u2uMainnet, mainnet, polygon, arbitrum, optimism, base, sepolia],
  transports: {
    [u2uMainnet.id]: http('https://rpc-mainnet.u2u.xyz', {
      retryCount: 3,
      retryDelay: 1000,
    }),
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
    [base.id]: http(),
    [sepolia.id]: http(),
  },
  ssr: false, // Disable SSR for wallet components
})

const queryClient = new QueryClient()

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          initialChain={u2uMainnet}
          showRecentTransactions={false}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
