'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'

interface GameProps {
  onGameEnd: (survivalTime: number, score: number) => void
  onSurvivalTimeUpdate: (time: number) => void
}

export default function Game({ onGameEnd, onSurvivalTimeUpdate }: GameProps) {
  const gameRef = useRef<HTMLDivElement>(null)
  const phaserGameRef = useRef<any>(null)
  const [gameStarted, setGameStarted] = useState(false)

  useEffect(() => {
    if (!gameRef.current || phaserGameRef.current) return

    // Dynamic import of Phaser to avoid SSR issues
    import('phaser').then((Phaser) => {
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
        scene: {
          preload: preload,
          create: create,
          update: update
        }
      }

      phaserGameRef.current = new Phaser.Game(config)

      function preload(this: any) {
      // Create simple colored rectangles for game objects
      this.load.image('snake', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==')
      this.load.image('orb', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==')
    }

      function create(this: any) {
      const { width, height } = this.scale
      
      // Create snake head (player)
      const player = this.add.circle(width / 2, height / 2, 12, 0x00ff00)
      player.setStrokeStyle(2, 0x00cc00)
      this.physics.add.existing(player)
      player.body.setCollideWorldBounds(true)
      player.body.setBounce(0)
      player.body.setDrag(100)
      const snakeBody: any[] = [player]
      
      // Add subtle glow effect to player
      this.tweens.add({
        targets: player,
        alpha: 0.8,
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      })
      
      // Create glowing orbs (food)
      const orbs: any[] = []
      for (let i = 0; i < 15; i++) {
        const orb = this.add.circle(
          Phaser.Math.Between(50, width - 50),
          Phaser.Math.Between(50, height - 50),
          8, 0xffff00
        )
        orb.setStrokeStyle(2, 0xffaa00)
        // Add glow effect
        orb.setScale(1.2)
        this.physics.add.existing(orb)
        orb.body.setImmovable(true)
        orbs.push(orb)
        
        // Add pulsing animation to orbs
        this.tweens.add({
          targets: orb,
          scaleX: 1.5,
          scaleY: 1.5,
          duration: 1000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        })
      }

      // Create bot snakes with segments
      const botSnakes: any[] = []
      for (let i = 0; i < 3; i++) {
        const botHead = this.add.circle(
          Phaser.Math.Between(100, width - 100),
          Phaser.Math.Between(100, height - 100),
          12, 0xff0000
        )
        botHead.setStrokeStyle(2, 0xcc0000)
        this.physics.add.existing(botHead)
        botHead.body.setCollideWorldBounds(true)
        botHead.body.setBounce(0.5)
        botHead.body.setDrag(50)
        botSnakes.push(botHead)
      }

      // Game state
      let survivalTime = 0
      let gameOver = false
      let speed = 200
      let lastMoveTime = 0
      let moveInterval = 100
      let playerVelocity = { x: 0, y: 0 }
      let targetX = player.x
      let targetY = player.y

      // Mouse controls
      this.input.on('pointermove', (pointer: any) => {
        if (gameOver) return
        
        targetX = pointer.x
        targetY = pointer.y
        
        const angle = Phaser.Math.Angle.Between(
          player.x, player.y,
          pointer.x, pointer.y
        )
        
        playerVelocity.x = Math.cos(angle) * speed
        playerVelocity.y = Math.sin(angle) * speed
      })

      // Keyboard controls
      this.input.keyboard?.on('keydown-UP', () => {
        if (gameOver) return
        playerVelocity.x = 0
        playerVelocity.y = -speed
      })
      
      this.input.keyboard?.on('keydown-DOWN', () => {
        if (gameOver) return
        playerVelocity.x = 0
        playerVelocity.y = speed
      })
      
      this.input.keyboard?.on('keydown-LEFT', () => {
        if (gameOver) return
        playerVelocity.x = -speed
        playerVelocity.y = 0
      })
      
      this.input.keyboard?.on('keydown-RIGHT', () => {
        if (gameOver) return
        playerVelocity.x = speed
        playerVelocity.y = 0
      })

      // Speed boost (arrow keys)
      this.input.keyboard?.on('keydown-SPACE', () => {
        if (gameOver) return
        speed = 400
        setTimeout(() => { speed = 200 }, 2000)
      })

      // Collision detection
      this.physics.add.overlap(player, orbs, (player: any, orb: any) => {
        orb.destroy()
        orbs.splice(orbs.indexOf(orb), 1)
        
        // Add new body segment to snake
        const newSegment = this.add.circle(
          player.x - 20, player.y, 10, 0x00dd00
        )
        newSegment.setStrokeStyle(1, 0x00aa00)
        this.physics.add.existing(newSegment)
        newSegment.body.setImmovable(true)
        snakeBody.push(newSegment)
        
        // Add eating effect
        const particles = this.add.particles(player.x, player.y, 'orb', {
          speed: { min: 50, max: 100 },
          scale: { start: 0.5, end: 0 },
          lifespan: 300,
          quantity: 5
        })
        particles.explode()
        
        // Add grow effect to player
        this.tweens.add({
          targets: player,
          scaleX: 1.3,
          scaleY: 1.3,
          duration: 200,
          yoyo: true,
          ease: 'Back.easeOut'
        })
        
        // Add new orb
        const newOrb = this.add.circle(
          Phaser.Math.Between(50, width - 50),
          Phaser.Math.Between(50, height - 50),
          8, 0xffff00
        )
        newOrb.setStrokeStyle(2, 0xffaa00)
        newOrb.setScale(1.2)
        this.physics.add.existing(newOrb)
        newOrb.body.setImmovable(true)
        orbs.push(newOrb)
        
        // Add pulsing animation to new orb
        this.tweens.add({
          targets: newOrb,
          scaleX: 1.5,
          scaleY: 1.5,
          duration: 1000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        })
      })

      // Bot snake movement
      this.time.addEvent({
        delay: 1500,
        callback: () => {
          if (gameOver) return
          
          botSnakes.forEach(bot => {
            // Move towards player sometimes, random movement other times
            const shouldChase = Phaser.Math.Between(0, 100) < 30 // 30% chance to chase
            let angle
            
            if (shouldChase && snakeBody.length > 1) {
              // Chase the player
              angle = Phaser.Math.Angle.Between(bot.x, bot.y, player.x, player.y)
            } else {
              // Random movement
              angle = Phaser.Math.Between(0, Math.PI * 2)
            }
            
            bot.body.setVelocity(
              Math.cos(angle) * 120,
              Math.sin(angle) * 120
            )
          })
        },
        loop: true
      })

      // Player movement update
      this.time.addEvent({
        delay: 16, // ~60 FPS
        callback: () => {
          if (gameOver) return
          
          // Move player based on velocity
          player.x += playerVelocity.x * 0.016 // 16ms delta
          player.y += playerVelocity.y * 0.016
          
          // Keep player in bounds
          if (player.x < 20) player.x = 20
          if (player.x > width - 20) player.x = width - 20
          if (player.y < 20) player.y = 20
          if (player.y > height - 20) player.y = height - 20
        },
        loop: true
      })

      // Snake body movement
      this.time.addEvent({
        delay: 50,
        callback: () => {
          if (gameOver) return
          
          // Move snake body segments to follow the head
          for (let i = snakeBody.length - 1; i > 0; i--) {
            const segment = snakeBody[i]
            const prevSegment = snakeBody[i - 1]
            
            // Smooth movement towards previous segment
            this.tweens.add({
              targets: segment,
              x: prevSegment.x,
              y: prevSegment.y,
              duration: 100,
              ease: 'Power2'
            })
          }
        },
        loop: true
      })

      // Game loop
      this.time.addEvent({
        delay: 100,
        callback: () => {
          if (gameOver) return
          
          survivalTime += 100
          onSurvivalTimeUpdate(survivalTime)
          
          // Check collisions with bot snakes
          botSnakes.forEach(bot => {
            if (Phaser.Geom.Circle.Contains(bot.getBounds(), player.x, player.y)) {
              gameOver = true
              onGameEnd(survivalTime, Math.floor(survivalTime / 1000))
            }
          })
          
          // Check collisions with own body
          for (let i = 1; i < snakeBody.length; i++) {
            const segment = snakeBody[i]
            if (Phaser.Geom.Circle.Contains(segment.getBounds(), player.x, player.y)) {
              gameOver = true
              onGameEnd(survivalTime, Math.floor(survivalTime / 1000))
              break
            }
          }
          
          // Check wall collisions
          if (player.x < 20 || player.x > width - 20 || 
              player.y < 20 || player.y > height - 20) {
            gameOver = true
            onGameEnd(survivalTime, Math.floor(survivalTime / 1000))
          }
        },
        loop: true
      })

      setGameStarted(true)
    }

      function update(this: any) {
        // Game update logic
      }
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
    <div className="w-full h-screen">
      <div ref={gameRef} className="w-full h-full" />
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
