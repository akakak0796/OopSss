'use client'

import { useAccount } from 'wagmi'
import { useState, useEffect } from 'react'

// Mock data for development - replace with actual contract integration
export function useSlitherToken() {
  const { address, isConnected } = useAccount()
  const [balance, setBalance] = useState('100')
  const [playerStats, setPlayerStats] = useState({
    balance: '100',
    totalEarned: '0',
    gamesPlayed: 0,
    currentStreak: 0,
    canClaimDaily: true,
  })
  const [dailyLeaderboard, setDailyLeaderboard] = useState([])
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  // Mock functions for development
  const claimDailyReward = async () => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate transaction
    setBalance(prev => (parseFloat(prev) + 2).toString())
    setPlayerStats(prev => ({
      ...prev,
      balance: (parseFloat(prev.balance) + 2).toString(),
      totalEarned: (parseFloat(prev.totalEarned) + 2).toString(),
      canClaimDaily: false
    }))
    setIsLoading(false)
  }

  const payEntryFee = async () => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate transaction
    setBalance(prev => (parseFloat(prev) - 5).toString())
    setPlayerStats(prev => ({
      ...prev,
      balance: (parseFloat(prev.balance) - 5).toString()
    }))
    setIsLoading(false)
  }

  const startGame = async () => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate transaction
    await payEntryFee()
    setIsLoading(false)
  }

  const endGame = async (args: { args: [bigint, bigint] }) => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate transaction
    const [gameId, survivalTime] = args.args
    const reward = Number(survivalTime) / 10000 // 1 $ST per 10 seconds
    setBalance(prev => (parseFloat(prev) + reward).toString())
    setPlayerStats(prev => ({
      ...prev,
      balance: (parseFloat(prev.balance) + reward).toString(),
      totalEarned: (parseFloat(prev.totalEarned) + reward).toString(),
      gamesPlayed: prev.gamesPlayed + 1
    }))
    setIsLoading(false)
  }

  // Mock refetch functions
  const refetchBalance = () => {
    console.log('Refetching balance...')
  }

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
        { player: address, score: 150, timestamp: Date.now() / 1000 },
        { player: '0x1234...5678', score: 120, timestamp: Date.now() / 1000 },
        { player: '0x9876...5432', score: 100, timestamp: Date.now() / 1000 },
      ])
      setWeeklyLeaderboard([
        { player: address, score: 500, timestamp: Date.now() / 1000 },
        { player: '0x1234...5678', score: 450, timestamp: Date.now() / 1000 },
        { player: '0x9876...5432', score: 400, timestamp: Date.now() / 1000 },
      ])
    }
  }, [isConnected, address])

  return {
    // Data
    balance,
    playerStats,
    dailyLeaderboard,
    weeklyLeaderboard,
    
    // Actions
    claimDailyReward,
    payEntryFee,
    startGame,
    endGame,
    
    // Loading states
    isClaimingDaily: isLoading,
    isPayingEntry: isLoading,
    isStartingGame: isLoading,
    isEndingGame: isLoading,
    
    // Refetch functions
    refetchBalance,
    refetchStats,
    refetchDailyLeaderboard,
    refetchWeeklyLeaderboard,
  }
}