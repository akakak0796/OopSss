'use client'

import { Trophy, Medal, Award } from 'lucide-react'

interface LeaderboardEntry {
  player: string
  score: number
  timestamp: number
}

interface LeaderboardProps {
  dailyLeaderboard: LeaderboardEntry[]
  weeklyLeaderboard: LeaderboardEntry[]
  playerAddress?: string
}

export default function Leaderboard({ 
  dailyLeaderboard, 
  weeklyLeaderboard, 
  playerAddress 
}: LeaderboardProps) {
  const formatAddress = (address: string) => {
    if (!address) return 'Unknown'
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatScore = (score: number) => {
    return `${Math.floor(score / 10)} $ST`
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(Number(timestamp) * 1000)
    return date.toLocaleDateString()
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-400" />
      case 2:
        return <Medal className="w-5 h-5 text-gray-300" />
      case 3:
        return <Award className="w-5 h-5 text-orange-400" />
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-gray-400">{rank}</span>
    }
  }

  const isPlayerEntry = (entry: LeaderboardEntry) => {
    return playerAddress && entry.player.toLowerCase() === playerAddress.toLowerCase()
  }

  return (
    <div className="grid md:grid-cols-2 gap-8">
      {/* Daily Leaderboard */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <Trophy className="w-5 h-5 mr-2 text-yellow-400" />
          Daily Leaderboard
        </h3>
        
        {dailyLeaderboard.length === 0 ? (
          <p className="text-gray-400 text-center py-4">No games played today</p>
        ) : (
          <div className="space-y-2">
            {dailyLeaderboard.slice(0, 10).map((entry, index) => (
              <div
                key={`${entry.player}-${entry.timestamp}`}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  isPlayerEntry(entry) 
                    ? 'bg-yellow-400/20 border border-yellow-400/30' 
                    : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {getRankIcon(index + 1)}
                  <div>
                    <p className={`font-medium ${
                      isPlayerEntry(entry) ? 'text-yellow-400' : 'text-white'
                    }`}>
                      {isPlayerEntry(entry) ? 'You' : formatAddress(entry.player)}
                    </p>
                    <p className="text-sm text-gray-400">
                      {formatTime(entry.timestamp)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-yellow-400">
                    {formatScore(entry.score)}
                  </p>
                  <p className="text-sm text-gray-400">
                    {Math.floor(entry.score / 10)}s
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Weekly Leaderboard */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <Award className="w-5 h-5 mr-2 text-purple-400" />
          Weekly Leaderboard
        </h3>
        
        {weeklyLeaderboard.length === 0 ? (
          <p className="text-gray-400 text-center py-4">No games played this week</p>
        ) : (
          <div className="space-y-2">
            {weeklyLeaderboard.slice(0, 10).map((entry, index) => (
              <div
                key={`${entry.player}-${entry.timestamp}`}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  isPlayerEntry(entry) 
                    ? 'bg-purple-400/20 border border-purple-400/30' 
                    : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {getRankIcon(index + 1)}
                  <div>
                    <p className={`font-medium ${
                      isPlayerEntry(entry) ? 'text-purple-400' : 'text-white'
                    }`}>
                      {isPlayerEntry(entry) ? 'You' : formatAddress(entry.player)}
                    </p>
                    <p className="text-sm text-gray-400">
                      {formatTime(entry.timestamp)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-purple-400">
                    {formatScore(entry.score)}
                  </p>
                  <p className="text-sm text-gray-400">
                    {Math.floor(entry.score / 10)}s
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
