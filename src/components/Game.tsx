'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'

interface GameProps {
  onGameEnd: (survivalTime: number, score: number) => void
  onSurvivalTimeUpdate: (time: number) => void
  onStopGame?: () => void
}

export default function Game({ onGameEnd, onSurvivalTimeUpdate, onStopGame }: GameProps) {
  const gameRef = useRef<HTMLDivElement>(null)
  const phaserGameRef = useRef<any>(null)
  const [gameStarted, setGameStarted] = useState(false)

  useEffect(() => {
    if (!gameRef.current || phaserGameRef.current) return

    // Dynamic import of Phaser to avoid SSR issues
    import('phaser').then((Phaser) => {
      // Create a custom scene class
      class OopSssScene extends Phaser.Scene {
        player: any = null
        playerBody: any[] = []
        playerVelocity = { x: 0, y: 0 }
        playerSpeed = 150
        
        aiSnakes: any[] = []
        aiSnakeCount = 6
        aiSnakeSpeed = 100
        
        food: any[] = []
        maxFood = 30
        
        cursors: any = null
        mouse: any = null
        
        gameStarted = false
        gameOver = false
        survivalTime = 0
        score = 0
        foodCollected = 0
        
        onGameEnd: (survivalTime: number, score: number) => void
        onSurvivalTimeUpdate: (time: number) => void

        constructor() {
          super({ key: 'OopSssScene' })
          this.onGameEnd = onGameEnd
          this.onSurvivalTimeUpdate = onSurvivalTimeUpdate
        }

        preload() {
          // Simple colored rectangles for game objects
          this.load.image('snake', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==')
          this.load.image('food', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==')
        }

        create() {
          const { width, height } = this.scale
          
          // Game state
          this.gameStarted = true
          this.gameOver = false
          this.survivalTime = 0
          this.score = 0
          this.foodCollected = 0
          
          // Create player snake head
          this.player = this.add.ellipse(width / 2, height / 2, 20, 15, 0xff0000)
          this.player.setStrokeStyle(2, 0xcc0000)
          this.physics.add.existing(this.player)
          this.player.body.setCollideWorldBounds(false)
          this.player.body.setBounce(0)
          this.player.body.setDrag(50)
          this.playerBody = [this.player]
          
          // Add eyes to player
          const leftEye = this.add.circle(this.player.x - 6, this.player.y - 4, 4, 0xffffff)
          const rightEye = this.add.circle(this.player.x + 6, this.player.y - 4, 4, 0xffffff)
          const leftPupil = this.add.circle(this.player.x - 6, this.player.y - 4, 2, 0x000000)
          const rightPupil = this.add.circle(this.player.x + 6, this.player.y - 4, 2, 0x000000)
          
          // Make eyes follow player
          this.player.setData('eyes', { leftEye, rightEye, leftPupil, rightPupil })
          
          // Create AI snakes
          this.createAISnakes()
          
          // Create food
          this.createFood()
          
          // Create background grid
          this.createBackgroundGrid()
          
          // Input controls
          this.cursors = this.input.keyboard.createCursorKeys()
          this.mouse = this.input.activePointer
          
          // Start game
          setGameStarted(true)
          
          // Game timer
          this.time.addEvent({
            delay: 100,
            callback: () => {
              if (this.gameStarted && !this.gameOver) {
                this.survivalTime += 100
                this.onSurvivalTimeUpdate(this.survivalTime)
              }
            },
            loop: true
          })
        }

        createAISnakes() {
          const { width, height } = this.scale
          const colors = [0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff, 0xff8000]
          
          for (let i = 0; i < this.aiSnakeCount; i++) {
            // Spawn AI snakes around the edges
            let x, y
            const side = i % 4
            const margin = 100
            
            switch (side) {
              case 0: // Top
                x = Phaser.Math.Between(margin, width - margin)
                y = margin
                break
              case 1: // Right
                x = width - margin
                y = Phaser.Math.Between(margin, height - margin)
                break
              case 2: // Bottom
                x = Phaser.Math.Between(margin, width - margin)
                y = height - margin
                break
              case 3: // Left
                x = margin
                y = Phaser.Math.Between(margin, height - margin)
                break
            }
            
            const aiSnake = {
              head: this.add.ellipse(x, y, 18, 13, colors[i % colors.length]),
              body: [],
              velocity: { x: 0, y: 0 },
              target: null,
              color: colors[i % colors.length],
              score: 3
            }
            
            aiSnake.head.setStrokeStyle(2, aiSnake.color)
            this.physics.add.existing(aiSnake.head)
            aiSnake.head.body.setCollideWorldBounds(false)
            aiSnake.head.body.setBounce(0)
            aiSnake.head.body.setDrag(50)
            aiSnake.body = [aiSnake.head]
            
            // Add eyes to AI snake
            const leftEye = this.add.circle(aiSnake.head.x - 5, aiSnake.head.y - 3, 3, 0xffffff)
            const rightEye = this.add.circle(aiSnake.head.x + 5, aiSnake.head.y - 3, 3, 0xffffff)
            const leftPupil = this.add.circle(aiSnake.head.x - 5, aiSnake.head.y - 3, 1.5, 0x000000)
            const rightPupil = this.add.circle(aiSnake.head.x + 5, aiSnake.head.y - 3, 1.5, 0x000000)
            
            aiSnake.head.setData('eyes', { leftEye, rightEye, leftPupil, rightPupil })
            
            this.aiSnakes.push(aiSnake)
          }
        }

        createFood() {
          const { width, height } = this.scale
          
          for (let i = 0; i < this.maxFood; i++) {
            const food = this.add.circle(
              Phaser.Math.Between(50, width - 50),
              Phaser.Math.Between(50, height - 50),
              Phaser.Math.Between(4, 8),
              Phaser.Math.Between(0xffff00, 0xff8000)
            )
            
            this.physics.add.existing(food)
            food.body.setImmovable(true)
            this.food.push(food)
          }
        }

        createBackgroundGrid() {
          const { width, height } = this.scale
          const gridSize = 40
          
          for (let x = 0; x < width; x += gridSize) {
            for (let y = 0; y < height; y += gridSize) {
              if ((x + y) % (gridSize * 2) === 0) {
                this.add.rectangle(x, y, gridSize, gridSize, 0x111111, 0.1)
              }
            }
          }
        }

        createNewFood() {
          const { width, height } = this.scale
          const food = this.add.circle(
            Phaser.Math.Between(50, width - 50),
            Phaser.Math.Between(50, height - 50),
            Phaser.Math.Between(4, 8),
            Phaser.Math.Between(0xffff00, 0xff8000)
          )
          
          this.physics.add.existing(food)
          food.body.setImmovable(true)
          this.food.push(food)
        }

        update() {
          if (!this.gameStarted || this.gameOver) return
          
          // Update player movement
          this.updatePlayerMovement()
          
          // Update AI snakes
          this.updateAISnakes()
          
          // Check collisions
          this.checkCollisions()
          
          // Update snake bodies
          this.updateSnakeBodies()
          
          // Update eyes
          this.updateEyes()
        }

        updatePlayerMovement() {
          const { width, height } = this.scale
          
          // Mouse movement
          if (this.mouse.isDown) {
            const angle = Phaser.Math.Angle.Between(
              this.player.x, this.player.y,
              this.mouse.x, this.mouse.y
            )
            this.playerVelocity.x = Math.cos(angle) * this.playerSpeed
            this.playerVelocity.y = Math.sin(angle) * this.playerSpeed
          }
          
          // Keyboard movement
          if (this.cursors.left.isDown) {
            this.playerVelocity.x = -this.playerSpeed
            this.playerVelocity.y = 0
          } else if (this.cursors.right.isDown) {
            this.playerVelocity.x = this.playerSpeed
            this.playerVelocity.y = 0
          } else if (this.cursors.up.isDown) {
            this.playerVelocity.x = 0
            this.playerVelocity.y = -this.playerSpeed
          } else if (this.cursors.down.isDown) {
            this.playerVelocity.x = 0
            this.playerVelocity.y = this.playerSpeed
          }
          
          // Apply velocity
          this.player.body.setVelocity(this.playerVelocity.x, this.playerVelocity.y)
          
          // Screen wrapping
          if (this.player.x < 0) this.player.x = width
          if (this.player.x > width) this.player.x = 0
          if (this.player.y < 0) this.player.y = height
          if (this.player.y > height) this.player.y = 0
        }

        updateAISnakes() {
          this.aiSnakes.forEach((aiSnake: any) => {
            // Simple AI: move towards nearest food
            let target = null
            let minDistance = Infinity
            
            // Find nearest food
            this.food.forEach((food: any) => {
              const distance = Phaser.Math.Distance.Between(aiSnake.head.x, aiSnake.head.y, food.x, food.y)
              if (distance < minDistance) {
                minDistance = distance
                target = food
              }
            })
            
            if (target) {
              const angle = Phaser.Math.Angle.Between(
                aiSnake.head.x, aiSnake.head.y,
                target.x, target.y
              )
              aiSnake.velocity.x = Math.cos(angle) * this.aiSnakeSpeed
              aiSnake.velocity.y = Math.sin(angle) * this.aiSnakeSpeed
            }
            
            // Apply velocity
            aiSnake.head.body.setVelocity(aiSnake.velocity.x, aiSnake.velocity.y)
            
            // Screen wrapping
            const { width, height } = this.scale
            if (aiSnake.head.x < 0) aiSnake.head.x = width
            if (aiSnake.head.x > width) aiSnake.head.x = 0
            if (aiSnake.head.y < 0) aiSnake.head.y = height
            if (aiSnake.head.y > height) aiSnake.head.y = 0
          })
        }

        checkCollisions() {
          // Player vs Food
          this.food.forEach((food: any, index: number) => {
            if (Phaser.Math.Distance.Between(this.player.x, this.player.y, food.x, food.y) < 20) {
              // Collect food
              this.score += 1
              this.foodCollected += 1
              
              // Add segment to player
              const newSegment = this.add.ellipse(
                this.player.x - this.playerBody.length * 15,
                this.player.y,
                15, 10, 0xff0000
              )
              newSegment.setStrokeStyle(1, 0xcc0000)
              this.physics.add.existing(newSegment)
              newSegment.body.setCollideWorldBounds(false)
              newSegment.body.setBounce(0)
              newSegment.body.setDrag(50)
              this.playerBody.push(newSegment)
              
              // Remove food and create new one
              food.destroy()
              this.food.splice(index, 1)
              this.createNewFood()
            }
          })
          
          // Player vs AI snakes (game over)
          this.aiSnakes.forEach((aiSnake: any) => {
            if (Phaser.Math.Distance.Between(this.player.x, this.player.y, aiSnake.head.x, aiSnake.head.y) < 25) {
              this.gameOver = true
              this.gameStarted = false
              this.onGameEnd(this.survivalTime, this.foodCollected)
            }
          })
          
          // AI snakes vs food
          this.aiSnakes.forEach((aiSnake: any) => {
            this.food.forEach((food: any, index: number) => {
              if (Phaser.Math.Distance.Between(aiSnake.head.x, aiSnake.head.y, food.x, food.y) < 20) {
                // AI collects food
                aiSnake.score += 1
                
                // Add segment to AI snake
                const newSegment = this.add.ellipse(
                  aiSnake.head.x - aiSnake.body.length * 12,
                  aiSnake.head.y,
                  12, 8, aiSnake.color
                )
                newSegment.setStrokeStyle(1, aiSnake.color)
                this.physics.add.existing(newSegment)
                newSegment.body.setCollideWorldBounds(false)
                newSegment.body.setBounce(0)
                newSegment.body.setDrag(50)
                aiSnake.body.push(newSegment)
                
                // Remove food and create new one
                food.destroy()
                this.food.splice(index, 1)
                this.createNewFood()
              }
            })
          })
        }

        updateSnakeBodies() {
          // Update player body
          for (let i = this.playerBody.length - 1; i > 0; i--) {
            const segment = this.playerBody[i]
            const prevSegment = this.playerBody[i - 1]
            
            if (Phaser.Math.Distance.Between(segment.x, segment.y, prevSegment.x, prevSegment.y) > 15) {
              segment.x = prevSegment.x
              segment.y = prevSegment.y
            }
          }
          
          // Update AI snake bodies
          this.aiSnakes.forEach((aiSnake: any) => {
            for (let i = aiSnake.body.length - 1; i > 0; i--) {
              const segment = aiSnake.body[i]
              const prevSegment = aiSnake.body[i - 1]
              
              if (Phaser.Math.Distance.Between(segment.x, segment.y, prevSegment.x, prevSegment.y) > 12) {
                segment.x = prevSegment.x
                segment.y = prevSegment.y
              }
            }
          })
        }

        updateEyes() {
          // Update player eyes
          const playerEyes = this.player.getData('eyes')
          if (playerEyes) {
            playerEyes.leftEye.x = this.player.x - 6
            playerEyes.leftEye.y = this.player.y - 4
            playerEyes.rightEye.x = this.player.x + 6
            playerEyes.rightEye.y = this.player.y - 4
            playerEyes.leftPupil.x = this.player.x - 6
            playerEyes.leftPupil.y = this.player.y - 4
            playerEyes.rightPupil.x = this.player.x + 6
            playerEyes.rightPupil.y = this.player.y - 4
          }
          
          // Update AI snake eyes
          this.aiSnakes.forEach((aiSnake: any) => {
            const eyes = aiSnake.head.getData('eyes')
            if (eyes) {
              eyes.leftEye.x = aiSnake.head.x - 5
              eyes.leftEye.y = aiSnake.head.y - 3
              eyes.rightEye.x = aiSnake.head.x + 5
              eyes.rightEye.y = aiSnake.head.y - 3
              eyes.leftPupil.x = aiSnake.head.x - 5
              eyes.leftPupil.y = aiSnake.head.y - 3
              eyes.rightPupil.x = aiSnake.head.x + 5
              eyes.rightPupil.y = aiSnake.head.y - 3
            }
          })
        }
      }

      const config: any = {
        type: Phaser.AUTO,
        width: window.innerWidth,
        height: window.innerHeight,
        parent: gameRef.current,
        backgroundColor: '#000000',
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { y: 0, x: 0 },
            debug: false
          }
        },
        scene: OopSssScene
      }

      phaserGameRef.current = new Phaser.Game(config)
      
    }).catch((error) => {
      console.error('Failed to load Phaser:', error)
    })

    return () => {
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true)
        phaserGameRef.current = null
      }
    }
  }, [])

  return (
    <div className="w-full h-screen relative">
      <div ref={gameRef} className="w-full h-full" />
      
      {/* Stop Game Button */}
      {gameStarted && (
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={() => {
              if (phaserGameRef.current && phaserGameRef.current.scene) {
                const scene = phaserGameRef.current.scene.scenes[0]
                if (scene && scene.survivalTime !== undefined) {
                  // End game with current score
                  onGameEnd(scene.survivalTime, scene.foodCollected || 0)
                }
              }
            }}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center space-x-2"
          >
            <span>⏹️</span>
            <span>Stop Game</span>
          </button>
        </div>
      )}
      
      {/* Game UI Overlay */}
      {gameStarted && (
        <div className="absolute top-4 left-4 z-10 text-white">
          <div className="bg-black/50 backdrop-blur-sm rounded-lg p-4">
            <div className="text-sm font-semibold mb-2">Food Collected: {phaserGameRef.current?.scene?.scenes[0]?.foodCollected || 0}</div>
            <div className="text-sm">Score: {phaserGameRef.current?.scene?.scenes[0]?.score || 0}</div>
          </div>
        </div>
      )}
      
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