'use client'

import { useOopSssToken } from '@/hooks/useOopSssToken'
import Leaderboard from '@/components/Leaderboard'
import { useAccount } from 'wagmi'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function LeaderboardPage() {
  const { address } = useAccount()
  const { 
    dailyLeaderboard, 
    weeklyLeaderboard, 
    refetchDailyLeaderboard, 
    refetchWeeklyLeaderboard 
  } = useOopSssToken()

  const handleRefresh = () => {
    refetchDailyLeaderboard()
    refetchWeeklyLeaderboard()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Navigation */}
      <nav className="flex justify-between items-center p-6">
        <Link 
          href="/" 
          className="flex items-center space-x-2 text-white hover:text-gray-300 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Game</span>
        </Link>
        
        <button
          onClick={handleRefresh}
          className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 text-white hover:bg-white/20 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </nav>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            🏆 Leaderboards
          </h1>
          <p className="text-xl text-gray-300">
            Compete with players worldwide and climb the rankings
          </p>
        </div>

        {/* Leaderboards */}
        <Leaderboard 
          dailyLeaderboard={dailyLeaderboard}
          weeklyLeaderboard={weeklyLeaderboard}
          playerAddress={address}
        />

        {/* Rewards Info */}
        <div className="mt-12 bg-white/10 backdrop-blur-sm rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">🏅 Leaderboard Rewards</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🥇</span>
              </div>
              <h4 className="font-semibold text-white mb-2">1st Place</h4>
              <p className="text-gray-300">50 $ST Bonus</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🥈</span>
              </div>
              <h4 className="font-semibold text-white mb-2">2nd Place</h4>
              <p className="text-gray-300">30 $ST Bonus</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🥉</span>
              </div>
              <h4 className="font-semibold text-white mb-2">3rd Place</h4>
              <p className="text-gray-300">20 $ST Bonus</p>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-gray-300">
              Top 10 players receive bonus $ST rewards at the end of each day/week
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
