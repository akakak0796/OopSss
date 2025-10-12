'use client'

import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { CONTRACT_CONFIG } from '@/config/contract'
import SnakeTokenABI from '@/contracts/SnakeToken.json'

interface PlayerStats {
  balance: string
  totalEarned: string
  gamesPlayed: number
  currentStreak: number
  canClaimDaily: boolean
}

interface LeaderboardEntry {
  player: string
  score: number
  timestamp: number
}

export function useSlitherToken() {
  const { address, isConnected } = useAccount()
  const { writeContract, data: hash, isPending: isWriting } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  // Read contract data
  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: CONTRACT_CONFIG.SNAKE_TOKEN_ADDRESS as `0x${string}`,
    abi: SnakeTokenABI.abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  })

  const { data: symbol } = useReadContract({
    address: CONTRACT_CONFIG.SNAKE_TOKEN_ADDRESS as `0x${string}`,
    abi: SnakeTokenABI.abi,
    functionName: 'symbol',
  })

  const { data: decimals } = useReadContract({
    address: CONTRACT_CONFIG.SNAKE_TOKEN_ADDRESS as `0x${string}`,
    abi: SnakeTokenABI.abi,
    functionName: 'decimals',
  })

  // Local state
  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    balance: '0',
    totalEarned: '0',
    gamesPlayed: 0,
    currentStreak: 0,
    canClaimDaily: true
  })

  const [dailyLeaderboard, setDailyLeaderboard] = useState<LeaderboardEntry[]>([])
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Update balance when contract data changes
  useEffect(() => {
    if (balance && decimals) {
      const formattedBalance = (Number(balance) / Math.pow(10, Number(decimals))).toFixed(2)
      setPlayerStats(prev => ({
        ...prev,
        balance: formattedBalance
      }))
    }
  }, [balance, decimals])

  // Check daily claim eligibility
  useEffect(() => {
    if (isConnected && address) {
      const lastClaimKey = `daily_claim_${address}`
      const lastClaim = localStorage.getItem(lastClaimKey)
      const today = new Date().toDateString()
      
      setPlayerStats(prev => ({
        ...prev,
        canClaimDaily: lastClaim !== today
      }))
    }
  }, [isConnected, address])

  const payEntryFee = async () => {
    if (!address) throw new Error('Wallet not connected')
    
    try {
      await writeContract({
        address: CONTRACT_CONFIG.SNAKE_TOKEN_ADDRESS as `0x${string}`,
        abi: SnakeTokenABI.abi,
        functionName: 'transfer',
        args: [
          '0x000000000000000000000000000000000000dEaD', // Burn address
          BigInt(CONTRACT_CONFIG.ENTRY_FEE * Math.pow(10, Number(decimals) || 18))
        ],
      })
    } catch (error) {
      console.error('Failed to pay entry fee:', error)
      throw error
    }
  }

  const startGame = async () => {
    setIsLoading(true)
    try {
      await payEntryFee()
      // Wait for transaction confirmation
      if (hash) {
        await new Promise(resolve => setTimeout(resolve, 2000)) // Wait for confirmation
      }
      setIsLoading(false)
    } catch (error) {
      console.error('Failed to start game:', error)
      setIsLoading(false)
      throw error
    }
  }

  const endGame = async (args: { args: [bigint, bigint] }) => {
    setIsLoading(true)
    try {
      const [gameId, score] = args.args
      const reward = Number(score) * CONTRACT_CONFIG.REWARD_PER_FOOD
      
      // Mint tokens to player
      await writeContract({
        address: CONTRACT_CONFIG.SNAKE_TOKEN_ADDRESS as `0x${string}`,
        abi: SnakeTokenABI.abi,
        functionName: 'mint',
        args: [
          address!,
          BigInt(reward * Math.pow(10, Number(decimals) || 18))
        ],
      })

      // Update local stats
      setPlayerStats(prev => ({
        ...prev,
        totalEarned: (parseFloat(prev.totalEarned) + reward).toString(),
        gamesPlayed: prev.gamesPlayed + 1
      }))

      // Wait for transaction confirmation
      if (hash) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
      
      // Refresh balance
      refetchBalance()
      setIsLoading(false)
    } catch (error) {
      console.error('Failed to end game:', error)
      setIsLoading(false)
      throw error
    }
  }

  const claimDailyReward = async () => {
    if (!address) throw new Error('Wallet not connected')
    
    setIsLoading(true)
    try {
      // Mint daily reward tokens
      await writeContract({
        address: CONTRACT_CONFIG.SNAKE_TOKEN_ADDRESS as `0x${string}`,
        abi: SnakeTokenABI.abi,
        functionName: 'mint',
        args: [
          address,
          BigInt(CONTRACT_CONFIG.DAILY_REWARD * Math.pow(10, Number(decimals) || 18))
        ],
      })

      // Update local state
      const lastClaimKey = `daily_claim_${address}`
      localStorage.setItem(lastClaimKey, new Date().toDateString())
      
      setPlayerStats(prev => ({
        ...prev,
        canClaimDaily: false,
        currentStreak: prev.currentStreak + 1,
        totalEarned: (parseFloat(prev.totalEarned) + CONTRACT_CONFIG.DAILY_REWARD).toString()
      }))

      // Wait for transaction confirmation
      if (hash) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
      
      // Refresh balance
      refetchBalance()
      setIsLoading(false)
    } catch (error) {
      console.error('Failed to claim daily reward:', error)
      setIsLoading(false)
      throw error
    }
  }

  // Mock refetch functions (for compatibility)
  const refetchStats = () => {
    console.log('Refetching stats...')
  }

  const refetchDailyLeaderboard = () => {
    console.log('Refetching daily leaderboard...')
  }

  const refetchWeeklyLeaderboard = () => {
    console.log('Refetching weekly leaderboard...')
  }

  // Mock leaderboard data
  useEffect(() => {
    if (isConnected) {
      setDailyLeaderboard([
        { player: address || '0x0000...0000', score: 150, timestamp: Date.now() / 1000 },
        { player: '0x1234...5678', score: 120, timestamp: Date.now() / 1000 },
        { player: '0x9876...5432', score: 100, timestamp: Date.now() / 1000 },
      ])
      setWeeklyLeaderboard([
        { player: address || '0x0000...0000', score: 500, timestamp: Date.now() / 1000 },
        { player: '0x1234...5678', score: 450, timestamp: Date.now() / 1000 },
        { player: '0x9876...5432', score: 400, timestamp: Date.now() / 1000 },
      ])
    }
  }, [isConnected, address])

  return {
    // Data
    balance: playerStats.balance,
    playerStats,
    dailyLeaderboard,
    weeklyLeaderboard,
    
    // Actions
    startGame,
    endGame,
    claimDailyReward,
    payEntryFee,
    
    // Loading states
    isStartingGame: isLoading,
    isEndingGame: isLoading,
    isClaimingDaily: isLoading,
    isPayingEntry: isLoading,
    isWriting,
    isConfirming,
    isConfirmed,
    
    // Refetch functions
    refetchBalance,
    refetchStats,
    refetchDailyLeaderboard,
    refetchWeeklyLeaderboard,
    
    // Contract info
    contractAddress: CONTRACT_CONFIG.SNAKE_TOKEN_ADDRESS,
    tokenSymbol: symbol || 'ST',
    entryFee: CONTRACT_CONFIG.ENTRY_FEE,
    dailyReward: CONTRACT_CONFIG.DAILY_REWARD,
    rewardPerFood: CONTRACT_CONFIG.REWARD_PER_FOOD,
  }
}