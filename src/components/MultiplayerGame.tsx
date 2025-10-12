'use client'

import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'

interface GameProps {
  onGameEnd: (score: number) => void
}

interface Player {
  id: string
  name: string
  x: number
  y: number
  segments: Array<{ x: number; y: number }>
  score: number
  alive: boolean
}

interface Food {
  id: number
  x: number
  y: number
  type: 'good' | 'poison'
  color: { color: number; type: string; value: number }
}

interface AISnake {
  id: string
  name: string
  x: number
  y: number
  segments: Array<{ x: number; y: number }>
  score: number
  alive: boolean
  color: { color: number; stroke: number }
}

interface GameState {
  players: Player[]
  aiSnakes: AISnake[]
  food: Food[]
  leaderboard: Array<{ id: string; name: string; score: number }>
  worldSize: { width: number; height: number }
}

interface Camera {
  x: number
  y: number
  targetX: number
  targetY: number
}

export default function MultiplayerGame({ onGameEnd }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const socketRef = useRef<Socket | null>(null)
  const animationRef = useRef<number>()
  const [gameStarted, setGameStarted] = useState(false)
  const [playerName, setPlayerName] = useState('')
  const [showNameInput, setShowNameInput] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  
  // Game state
  const gameStateRef = useRef<GameState | null>(null)
  const currentPlayerRef = useRef<Player | null>(null)
  const cameraRef = useRef<Camera>({ x: 0, y: 0, targetX: 0, targetY: 0 })
  const lastUpdateTimeRef = useRef<number>(0)
  
  console.log('🐍 MultiplayerGame component loaded')
  console.log('🔍 Debug info:', {
    canvasRef: canvasRef.current,
    showNameInput,
    gameStarted
  })

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    
    // Connect to Socket.IO server
    const socket = io('http://localhost:3001', {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    })
    socketRef.current = socket

    // Connection debugging
    socket.on('connect', () => {
      console.log('✅ Connected to server:', socket.id)
      setIsConnected(true)
    })

    socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from server:', reason)
      setIsConnected(false)
    })

    socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error)
      console.error('❌ Error details:', {
        message: error.message,
        description: error.description,
        context: error.context,
        type: error.type
      })
      setIsConnected(false)
      // Show user-friendly error message
      alert(`Failed to connect to game server: ${error.message}. Please make sure the server is running on port 3001.`)
    })

    socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Reconnected to server after', attemptNumber, 'attempts')
    })

    socket.on('reconnect_error', (error) => {
      console.error('❌ Reconnection error:', error)
    })

    // Game state handling
    socket.on('gameState', (state: GameState) => {
      console.log('🎮 Received game state:', {
        players: state.players.length,
        aiSnakes: state.aiSnakes.length,
        food: state.food.length,
        leaderboard: state.leaderboard.length
      })
      gameStateRef.current = state
      currentPlayerRef.current = state.players.find(p => p.id === socket.id) || null
      
      console.log('👤 Current player:', currentPlayerRef.current ? {
        id: currentPlayerRef.current.id,
        name: currentPlayerRef.current.name,
        alive: currentPlayerRef.current.alive,
        score: currentPlayerRef.current.score
      } : 'Not found')
      
      // Update camera target to follow current player
      if (currentPlayerRef.current) {
        cameraRef.current.targetX = currentPlayerRef.current.x
        cameraRef.current.targetY = currentPlayerRef.current.y
      }
        })

        socket.on('gameOver', (data: { score: number }) => {
      console.log('Game Over! Score:', data.score)
      onGameEnd(data.score)
        })

        socket.on('respawn', (data: { x: number; y: number }) => {
      console.log('Respawned at:', data)
    })

    // Input handling
    const handleMouseMove = (event: MouseEvent) => {
      if (!currentPlayerRef.current || !gameStateRef.current) return
      
      const rect = canvas.getBoundingClientRect()
      const mouseX = event.clientX - rect.left
      const mouseY = event.clientY - rect.top
      
      // Convert screen coordinates to world coordinates
      const worldX = mouseX + cameraRef.current.x - canvas.width / 2
      const worldY = mouseY + cameraRef.current.y - canvas.height / 2
      
      // Calculate direction from player to mouse
      const dx = worldX - currentPlayerRef.current.x
      const dy = worldY - currentPlayerRef.current.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (distance > 0) {
        const velocityX = (dx / distance) * 100
        const velocityY = (dy / distance) * 100
        socket.emit('move', { velocityX, velocityY })
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!currentPlayerRef.current) return
          
          const speed = 100
      let velocityX = 0
      let velocityY = 0
      
      switch (event.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          velocityY = -speed
          break
        case 'ArrowDown':
        case 's':
        case 'S':
          velocityY = speed
          break
        case 'ArrowLeft':
        case 'a':
        case 'A':
          velocityX = -speed
          break
        case 'ArrowRight':
        case 'd':
        case 'D':
          velocityX = speed
          break
        case ' ':
          // Boost
          socket.emit('boost', {})
          return
      }
      
      if (velocityX !== 0 || velocityY !== 0) {
          socket.emit('move', { velocityX, velocityY })
      }
    }

    // Add event listeners
    canvas.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('keydown', handleKeyDown)

    // Rendering functions
    const worldToScreen = (worldX: number, worldY: number) => {
      return {
        x: worldX - cameraRef.current.x + canvas.width / 2,
        y: worldY - cameraRef.current.y + canvas.height / 2
      }
    }

    const isInViewport = (worldX: number, worldY: number, radius: number = 0) => {
      const screen = worldToScreen(worldX, worldY)
      return screen.x + radius >= 0 && screen.x - radius <= canvas.width &&
             screen.y + radius >= 0 && screen.y - radius <= canvas.height
    }

    const drawSnake = (player: Player, isCurrentPlayer: boolean = false) => {
      if (!player.alive) return
      
      // Draw segments
      for (let i = 0; i < player.segments.length; i++) {
        const segment = player.segments[i]
        
        if (!isInViewport(segment.x, segment.y, 20)) continue
        
        const screen = worldToScreen(segment.x, segment.y)
        const radius = i === 0 ? 12 : 8 // Head is bigger
        
        // Snake body gradient
        const gradient = ctx.createRadialGradient(screen.x, screen.y, 0, screen.x, screen.y, radius)
        if (isCurrentPlayer) {
          gradient.addColorStop(0, '#ff4444')
          gradient.addColorStop(1, '#cc0000')
        } else {
          gradient.addColorStop(0, '#4488ff')
          gradient.addColorStop(1, '#0066cc')
        }
        
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2)
        ctx.fill()
        
        // Border
        ctx.strokeStyle = isCurrentPlayer ? '#ff0000' : '#0044aa'
        ctx.lineWidth = 2
        ctx.stroke()
        
        // Eyes for head
        if (i === 0) {
          ctx.fillStyle = '#ffffff'
          ctx.beginPath()
          ctx.arc(screen.x - 4, screen.y - 3, 3, 0, Math.PI * 2)
          ctx.fill()
          ctx.beginPath()
          ctx.arc(screen.x + 4, screen.y - 3, 3, 0, Math.PI * 2)
          ctx.fill()
          
          ctx.fillStyle = '#000000'
          ctx.beginPath()
          ctx.arc(screen.x - 4, screen.y - 3, 1.5, 0, Math.PI * 2)
          ctx.fill()
          ctx.beginPath()
          ctx.arc(screen.x + 4, screen.y - 3, 1.5, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }

    const drawAISnake = (aiSnake: AISnake) => {
      if (!aiSnake.alive) return
      
      // Draw segments
      for (let i = 0; i < aiSnake.segments.length; i++) {
        const segment = aiSnake.segments[i]
        
        if (!isInViewport(segment.x, segment.y, 25)) continue
        
        const screen = worldToScreen(segment.x, segment.y)
        const radius = i === 0 ? 16 : 10 // AI snakes are bigger
        
        // AI snake body gradient
        const gradient = ctx.createRadialGradient(screen.x, screen.y, 0, screen.x, screen.y, radius)
        const colorHex = `#${aiSnake.color.color.toString(16).padStart(6, '0')}`
        const strokeHex = `#${aiSnake.color.stroke.toString(16).padStart(6, '0')}`
        
        gradient.addColorStop(0, colorHex)
        gradient.addColorStop(1, strokeHex)
        
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2)
        ctx.fill()
        
        // Border
        ctx.strokeStyle = strokeHex
        ctx.lineWidth = 3
        ctx.stroke()
        
        // Eyes for head
        if (i === 0) {
          ctx.fillStyle = '#ffffff'
          ctx.beginPath()
          ctx.arc(screen.x - 5, screen.y - 4, 4, 0, Math.PI * 2)
          ctx.fill()
          ctx.beginPath()
          ctx.arc(screen.x + 5, screen.y - 4, 4, 0, Math.PI * 2)
          ctx.fill()
          
          ctx.fillStyle = '#000000'
          ctx.beginPath()
          ctx.arc(screen.x - 5, screen.y - 4, 2, 0, Math.PI * 2)
          ctx.fill()
          ctx.beginPath()
          ctx.arc(screen.x + 5, screen.y - 4, 2, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }

    const drawFood = (foodItem: Food) => {
      if (!isInViewport(foodItem.x, foodItem.y, 10)) return
      
      const screen = worldToScreen(foodItem.x, foodItem.y)
      const radius = 4
      
      // Food glow effect
      const gradient = ctx.createRadialGradient(screen.x, screen.y, 0, screen.x, screen.y, radius * 2)
      gradient.addColorStop(0, `rgba(${(foodItem.color.color >> 16) & 255}, ${(foodItem.color.color >> 8) & 255}, ${foodItem.color.color & 255}, 0.8)`)
      gradient.addColorStop(1, 'rgba(0,0,0,0)')
      
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(screen.x, screen.y, radius * 2, 0, Math.PI * 2)
      ctx.fill()
      
      // Food core
      ctx.fillStyle = `#${foodItem.color.color.toString(16).padStart(6, '0')}`
      ctx.beginPath()
      ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2)
      ctx.fill()
      
      // Pulsing animation
      const time = Date.now() * 0.003
      const pulse = Math.sin(time) * 0.3 + 1
      ctx.scale(pulse, pulse)
      ctx.beginPath()
      ctx.arc(screen.x / pulse, screen.y / pulse, radius, 0, Math.PI * 2)
      ctx.fill()
      ctx.setTransform(1, 0, 0, 1, 0, 0) // Reset transform
    }

    const drawUI = () => {
      if (!currentPlayerRef.current || !gameStateRef.current) return
      
      // Score display (top-left)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      ctx.fillRect(10, 10, 150, 40)
      ctx.fillStyle = '#ffffff'
      ctx.font = '18px Arial'
      ctx.fillText(`Score: ${currentPlayerRef.current.score}`, 20, 35)
      
      // Leaderboard (top-right)
      const leaderboardWidth = 250
      const leaderboardHeight = Math.min(300, gameStateRef.current.leaderboard.length * 25 + 40)
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
      ctx.fillRect(canvas.width - leaderboardWidth - 10, 10, leaderboardWidth, leaderboardHeight)
      
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 18px Arial'
      ctx.fillText('Leaderboard', canvas.width - leaderboardWidth / 2 - 10, 35)
      
      ctx.font = '14px Arial'
      gameStateRef.current.leaderboard.slice(0, 10).forEach((player, index) => {
        const isCurrentPlayer = player.id === socket.id
        ctx.fillStyle = isCurrentPlayer ? '#ffff00' : '#ffffff'
        ctx.fillText(
          `#${index + 1} ${player.name} ${player.score}`,
          canvas.width - leaderboardWidth + 10,
          60 + index * 25
        )
      })
    }

    const drawBackground = () => {
      // Dark background
      ctx.fillStyle = '#1a1a2e'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Grid pattern
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
      ctx.lineWidth = 1
      
      const gridSize = 50
      const startX = Math.floor(cameraRef.current.x / gridSize) * gridSize
      const startY = Math.floor(cameraRef.current.y / gridSize) * gridSize
      
      for (let x = startX; x < cameraRef.current.x + canvas.width; x += gridSize) {
        const screenX = x - cameraRef.current.x + canvas.width / 2
        if (screenX >= 0 && screenX <= canvas.width) {
          ctx.beginPath()
          ctx.moveTo(screenX, 0)
          ctx.lineTo(screenX, canvas.height)
          ctx.stroke()
        }
      }
      
      for (let y = startY; y < cameraRef.current.y + canvas.height; y += gridSize) {
        const screenY = y - cameraRef.current.y + canvas.height / 2
        if (screenY >= 0 && screenY <= canvas.height) {
          ctx.beginPath()
          ctx.moveTo(0, screenY)
          ctx.lineTo(canvas.width, screenY)
          ctx.stroke()
        }
      }
    }

    // Game loop
    const gameLoop = (currentTime: number) => {
      if (!ctx || !gameStateRef.current) {
        animationRef.current = requestAnimationFrame(gameLoop)
        return
      }
      
      const deltaTime = currentTime - lastUpdateTimeRef.current
      lastUpdateTimeRef.current = currentTime
      
      // Smooth camera following with improved interpolation
      const cameraSpeed = 0.08
      cameraRef.current.x += (cameraRef.current.targetX - cameraRef.current.x) * cameraSpeed
      cameraRef.current.y += (cameraRef.current.targetY - cameraRef.current.y) * cameraSpeed
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Draw background
      drawBackground()
      
      // Draw food
      gameStateRef.current.food.forEach(drawFood)
      
      // Draw AI snakes
      gameStateRef.current.aiSnakes.forEach(aiSnake => {
        drawAISnake(aiSnake)
      })
      
      // Draw players
      gameStateRef.current.players.forEach(player => {
        drawSnake(player, player.id === socket.id)
      })
      
      // Draw UI
      drawUI()
      
      animationRef.current = requestAnimationFrame(gameLoop)
    }

    // Start game loop
    animationRef.current = requestAnimationFrame(gameLoop)
    setGameStarted(true)

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
      canvas.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [onGameEnd])

  const handleNameSubmit = () => {
    if (!playerName.trim()) {
      alert('Please enter a name')
      return
    }
    
    if (!socketRef.current) {
      alert('Not connected to game server. Please wait a moment and try again.')
      return
    }
    
    if (!socketRef.current.connected) {
      alert('Connection to game server lost. Please refresh the page and try again.')
      return
    }
    
    console.log('🎮 Submitting name:', playerName.trim())
    socketRef.current.emit('setName', playerName.trim())
    setShowNameInput(false)
  }

  if (showNameInput) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 max-w-md mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-6">Enter Your Name</h2>
          
          {/* Connection Status */}
          <div className="mb-4">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
              isConnected 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${
                isConnected ? 'bg-green-400' : 'bg-red-400'
              }`}></div>
              {isConnected ? 'Connected to server' : 'Connecting to server...'}
            </div>
          </div>
          
          <div className="space-y-4">
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Your snake name..."
              className="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-gray-300 border border-white/30 focus:outline-none focus:border-white/50"
              onKeyPress={(e) => e.key === 'Enter' && handleNameSubmit()}
            />
            <button
              onClick={handleNameSubmit}
              disabled={!isConnected}
              className={`w-full font-bold py-3 px-6 rounded-lg transition-all duration-200 ${
                isConnected
                  ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:from-yellow-500 hover:to-orange-600'
                  : 'bg-gray-500 text-gray-300 cursor-not-allowed'
              }`}
            >
              {isConnected ? 'Join Game' : 'Connecting...'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-screen relative">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-none"
        style={{ background: '#1a1a2e' }}
      />
      {!gameStarted && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-white text-center">
            <h2 className="text-2xl font-bold mb-4">Loading Game...</h2>
            <p className="text-gray-300">Preparing your snake adventure</p>
          </div>
        </div>
      )}
    </div>
  )
}