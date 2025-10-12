'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useBalance } from 'wagmi'
import { useState, useEffect } from 'react'
import { Play, Trophy, Coins, Zap, Users, Target, BarChart3 } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useOopSssToken } from '@/hooks/useOopSssToken'
import Link from 'next/link'

// Dynamic import of MultiplayerGame component to avoid SSR issues
const MultiplayerGame = dynamic(() => import('@/components/MultiplayerGame'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center bg-black">
      <div className="text-white text-center">
        <h2 className="text-2xl font-bold mb-4">Loading Game...</h2>
        <p className="text-gray-300">Preparing your snake adventure</p>
      </div>
    </div>
  )
})

export default function Home() {
  const { address, isConnected } = useAccount()
  const [showGame, setShowGame] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const { 
    balance, 
    playerStats, 
    claimDailyReward, 
    isClaimingDaily 
  } = useOopSssToken()

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (showGame) {
    return <GameInterface />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Navigation */}
      <nav className="flex justify-between items-center p-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">🐍</span>
          </div>
          <h1 className="text-2xl font-bold text-white">OopSss</h1>
        </div>
        <div className="flex items-center space-x-4">
          {isClient && isConnected && (
            <Link 
              href="/leaderboard"
              className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 text-white hover:bg-white/20 transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Leaderboard</span>
            </Link>
          )}
          <ConnectButton />
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-white mb-6">
            OopSss
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            The first SocialFi-GameFi snake game on U2U Mainnet. Play to earn $ST tokens, 
            compete with friends, and climb the leaderboards in this addictive multiplayer experience.
          </p>
          
          {isClient && (isConnected || true) ? (
            <div className="space-y-4">
              {/* Player Stats */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 max-w-2xl mx-auto">
                <h3 className="text-lg font-semibold text-white mb-4">Your Stats</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-400">{balance} $ST</p>
                    <p className="text-sm text-gray-300">Balance</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-400">{playerStats.totalEarned} $ST</p>
                    <p className="text-sm text-gray-300">Total Earned</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-400">{playerStats.gamesPlayed}</p>
                    <p className="text-sm text-gray-300">Games Played</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-400">{playerStats.currentStreak}</p>
                    <p className="text-sm text-gray-300">Day Streak</p>
                  </div>
                </div>
                
                {/* Daily Reward */}
                {playerStats.canClaimDaily && (
                  <div className="mb-4">
                    <button
                      onClick={() => claimDailyReward()}
                      disabled={isClaimingDaily}
                      className="w-full bg-gradient-to-r from-green-400 to-green-600 text-white font-bold py-2 px-4 rounded-lg hover:from-green-500 hover:to-green-700 transition-all duration-200 disabled:opacity-50"
                    >
                      {isClaimingDaily ? 'Claiming...' : '🎁 Claim Daily Reward (2 $ST)'}
                    </button>
                  </div>
                )}
                
                <div className="border-t border-white/20 pt-4">
                  <p className="text-gray-300 mb-4 text-center">
                    Entry Fee: 5 $ST | Earn: 1 $ST per 10 seconds survived
                  </p>
                  <button
                    onClick={() => setShowGame(true)}
                    className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold py-3 px-6 rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    <Play className="w-5 h-5" />
                    <span>Enter Match</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-white mb-4">Connect Your Wallet</h3>
              <p className="text-gray-300 mb-6">
                Connect your wallet to start playing and earning $ST tokens
              </p>
              <ConnectButton />
            </div>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
            <Coins className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Play to Earn</h3>
            <p className="text-gray-300">
              Earn $ST tokens based on survival time. The longer you survive, the more you earn!
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
            <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Leaderboards</h3>
            <p className="text-gray-300">
              Compete with players worldwide and climb the daily/weekly leaderboards.
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
            <Users className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">SocialFi</h3>
            <p className="text-gray-300">
              Connect with friends, share achievements, and participate in community challenges.
            </p>
          </div>
        </div>

        {/* Game Features */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h3 className="text-2xl font-semibold text-white mb-4 flex items-center">
              <Target className="w-6 h-6 mr-2" />
              Game Mechanics
            </h3>
            <ul className="space-y-2 text-gray-300">
              <li>• Control your snake with mouse (PC) or finger swipes (mobile)</li>
              <li>• Collect glowing orbs to grow longer</li>
              <li>• Avoid crashing into other snakes</li>
              <li>• Use speed boost with arrow keys (costs $ST)</li>
              <li>• Survive as long as possible to earn rewards</li>
            </ul>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h3 className="text-2xl font-semibold text-white mb-4 flex items-center">
              <Zap className="w-6 h-6 mr-2" />
              Tokenomics
            </h3>
            <ul className="space-y-2 text-gray-300">
              <li>• Entry Fee: 5 $ST per match</li>
              <li>• Rewards: 1 $ST per 10 seconds survived</li>
              <li>• Daily Login: 2 $ST base reward</li>
              <li>• Streak Bonuses: Increasing rewards for consecutive days</li>
              <li>• Leaderboard Rewards: Bonus $ST for top performers</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function GameInterface() {
  const [gameEnded, setGameEnded] = useState(false)
  const [finalScore, setFinalScore] = useState(0)

  const handleGameEnd = (score: number) => {
    setGameEnded(true)
    setFinalScore(score)
  }

  if (gameEnded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 max-w-md mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-6">Game Over!</h2>
          <div className="space-y-4">
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-yellow-400 font-bold">Final Score: {finalScore}</p>
            </div>
            <button
              onClick={() => {
                setGameEnded(false)
                setFinalScore(0)
              }}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold py-3 px-6 rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all duration-200"
            >
              Play Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gray-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-700 transition-all duration-200"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black relative">
      {/* Game Canvas */}
      <MultiplayerGame onGameEnd={handleGameEnd} />
    </div>
  )
}