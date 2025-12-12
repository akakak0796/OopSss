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

export function useOopSssToken() {
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

  const { data: playerStatsData, refetch: refetchStats } = useReadContract({
    address: CONTRACT_CONFIG.SNAKE_TOKEN_ADDRESS as `0x${string}`,
    abi: SnakeTokenABI.abi,
    functionName: 'getPlayerStats',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  })

  const { data: canClaimDaily, refetch: refetchCanClaim } = useReadContract({
    address: CONTRACT_CONFIG.SNAKE_TOKEN_ADDRESS as `0x${string}`,
    abi: SnakeTokenABI.abi,
    functionName: 'canClaimDailyReward',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  })

  const { data: lastLoginTime } = useReadContract({
    address: CONTRACT_CONFIG.SNAKE_TOKEN_ADDRESS as `0x${string}`,
    abi: SnakeTokenABI.abi,
    functionName: 'lastLoginTime',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  })

  // Local state
  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    balance: '0',
    totalEarned: '0',
    gamesPlayed: 0,
    currentStreak: 0,
    canClaimDaily: false
  })

  const [dailyLeaderboard, setDailyLeaderboard] = useState<LeaderboardEntry[]>([])
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [timeUntilNextClaim, setTimeUntilNextClaim] = useState<number>(0)

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

  // Update player stats from contract
  useEffect(() => {
    if (playerStatsData && Array.isArray(playerStatsData) && decimals) {
      const [balanceRaw, totalEarnedRaw, gamesPlayedRaw, currentStreakRaw, canClaimToday] = playerStatsData

      setPlayerStats({
        balance: (Number(balanceRaw) / Math.pow(10, Number(decimals))).toFixed(2),
        totalEarned: (Number(totalEarnedRaw) / Math.pow(10, Number(decimals))).toFixed(2),
        gamesPlayed: Number(gamesPlayedRaw),
        currentStreak: Number(currentStreakRaw),
        canClaimDaily: Boolean(canClaimToday)
      })
    }
  }, [playerStatsData, decimals])

  // Calculate time until next claim
  useEffect(() => {
    if (lastLoginTime && !canClaimDaily) {
      const updateTimer = () => {
        const lastLogin = Number(lastLoginTime)
        if (lastLogin === 0) {
          setTimeUntilNextClaim(0)
          return
        }

        const nextClaimTime = lastLogin + (24 * 60 * 60) // 24 hours in seconds
        const now = Math.floor(Date.now() / 1000)
        const timeLeft = nextClaimTime - now

        setTimeUntilNextClaim(timeLeft > 0 ? timeLeft : 0)
      }

      updateTimer()
      const interval = setInterval(updateTimer, 1000)
      return () => clearInterval(interval)
    } else {
      setTimeUntilNextClaim(0)
    }
  }, [lastLoginTime, canClaimDaily])

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
      const [gameId, survivalTime] = args.args
      const reward = Number(survivalTime) * CONTRACT_CONFIG.REWARD_PER_SECOND

      // Award survival reward through contract
      await writeContract({
        address: CONTRACT_CONFIG.SNAKE_TOKEN_ADDRESS as `0x${string}`,
        abi: SnakeTokenABI.abi,
        functionName: 'awardSurvivalReward',
        args: [address!, survivalTime],
      })

      // Wait for transaction confirmation
      if (hash) {
        await new Promise(resolve => setTimeout(resolve, 3000))
      }

      // Refresh data
      refetchBalance()
      refetchStats()
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
      // Call contract's claimDailyReward function
      await writeContract({
        address: CONTRACT_CONFIG.SNAKE_TOKEN_ADDRESS as `0x${string}`,
        abi: SnakeTokenABI.abi,
        functionName: 'claimDailyReward',
      })

      // Wait for transaction confirmation
      if (hash) {
        await new Promise(resolve => setTimeout(resolve, 3000))
      }

      // Refresh all data
      refetchBalance()
      refetchStats()
      refetchCanClaim()

      setIsLoading(false)
      return true
    } catch (error) {
      console.error('Failed to claim daily reward:', error)
      setIsLoading(false)
      throw error
    }
  }

  // Mock refetch functions (for compatibility)
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
    timeUntilNextClaim,

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
    rewardPerSecond: CONTRACT_CONFIG.REWARD_PER_SECOND,
  }
}