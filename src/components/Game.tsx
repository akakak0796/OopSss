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
      
      // Create snake head (player) with OopSss.io style
      const player = this.add.ellipse(width / 2, height / 2, 20, 15, 0xff0000)
      player.setStrokeStyle(2, 0xcc0000)
      this.physics.add.existing(player)
      player.body.setCollideWorldBounds(false) // Disable world bounds for wrapping
      player.body.setBounce(0)
      player.body.setDrag(100)
      const snakeBody: any[] = [player]
      
      // Add large cartoon eyes like OopSss.io
      const leftEye = this.add.circle(player.x - 6, player.y - 4, 4, 0xffffff)
      const rightEye = this.add.circle(player.x + 6, player.y - 4, 4, 0xffffff)
      const leftPupil = this.add.circle(player.x - 6, player.y - 4, 2, 0x000000)
      const rightPupil = this.add.circle(player.x + 6, player.y - 4, 2, 0x000000)
      
      leftEye.setDepth(1)
      rightEye.setDepth(1)
      leftPupil.setDepth(2)
      rightPupil.setDepth(2)
      
      // Add subtle glow effect to player
      this.tweens.add({
        targets: player,
        alpha: 0.8,
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      })
      
      // Create animated hexagonal grid background like OopSss.io
      const hexSize = 40
      const hexWidth = hexSize * Math.sqrt(3)
      const hexHeight = hexSize * 2
      const hexGrid: any[] = []
      
      // Create hexagonal grid
      const background = this.add.graphics()
      background.fillStyle(0x1a1a2e)
      background.fillRect(0, 0, width, height)
      
      // Draw hexagonal pattern
      for (let x = 0; x < width + hexWidth; x += hexWidth * 0.75) {
        for (let y = 0; y < height + hexHeight; y += hexHeight * 0.5) {
          const hexX = x + (y % (hexHeight) === 0 ? 0 : hexWidth * 0.375)
          const hexY = y
          
          // Create hexagon
          const hex = this.add.graphics()
          hex.lineStyle(1, 0x2a2a3e, 0.3)
          hex.fillStyle(0x1e1e2e)
          hex.beginPath()
          
          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i
            const hx = hexX + Math.cos(angle) * hexSize
            const hy = hexY + Math.sin(angle) * hexSize
            if (i === 0) {
              hex.moveTo(hx, hy)
            } else {
              hex.lineTo(hx, hy)
            }
          }
          hex.closePath()
          hex.strokePath()
          hex.fillPath()
          hexGrid.push(hex)
        }
      }
      
      // Animate background movement
      this.time.addEvent({
        delay: 50,
        callback: () => {
          hexGrid.forEach(hex => {
            hex.x += 0.5
            hex.y += 0.3
            if (hex.x > width + hexWidth) hex.x = -hexWidth
            if (hex.y > height + hexHeight) hex.y = -hexHeight
          })
        },
        loop: true
      })

      // Create glowing orbs (food) and poison food
      const orbs: any[] = []
      const poisonFood: any[] = []
      
      // Regular food (yellow) - smaller glowing dots
      for (let i = 0; i < 30; i++) {
        const orb = this.add.circle(
          Phaser.Math.Between(50, width - 50),
          Phaser.Math.Between(50, height - 50),
          4, 0xffff00
        )
        orb.setStrokeStyle(1, 0xffaa00)
        orb.setScale(1.5)
        orb.foodType = 'good'
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
      
      // Green food (extra good) - smaller
      for (let i = 0; i < 12; i++) {
        const greenOrb = this.add.circle(
          Phaser.Math.Between(50, width - 50),
          Phaser.Math.Between(50, height - 50),
          5, 0x00ff00
        )
        greenOrb.setStrokeStyle(1, 0x00cc00)
        greenOrb.setScale(1.6)
        greenOrb.foodType = 'good'
        this.physics.add.existing(greenOrb)
        greenOrb.body.setImmovable(true)
        orbs.push(greenOrb)
        
        // Add special pulsing animation
        this.tweens.add({
          targets: greenOrb,
          scaleX: 1.6,
          scaleY: 1.6,
          duration: 800,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        })
      }
      
      // Blue food (medium good) - smaller
      for (let i = 0; i < 15; i++) {
        const blueOrb = this.add.circle(
          Phaser.Math.Between(50, width - 50),
          Phaser.Math.Between(50, height - 50),
          3, 0x0088ff
        )
        blueOrb.setStrokeStyle(1, 0x0066cc)
        blueOrb.setScale(1.4)
        blueOrb.foodType = 'good'
        this.physics.add.existing(blueOrb)
        blueOrb.body.setImmovable(true)
        orbs.push(blueOrb)
        
        // Add gentle pulsing
        this.tweens.add({
          targets: blueOrb,
          scaleX: 1.3,
          scaleY: 1.3,
          duration: 1200,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        })
      }
      
      // Purple food (special good) - smaller
      for (let i = 0; i < 8; i++) {
        const purpleOrb = this.add.circle(
          Phaser.Math.Between(50, width - 50),
          Phaser.Math.Between(50, height - 50),
          6, 0xaa00ff
        )
        purpleOrb.setStrokeStyle(2, 0x8800cc)
        purpleOrb.setScale(1.7)
        purpleOrb.foodType = 'good'
        this.physics.add.existing(purpleOrb)
        purpleOrb.body.setImmovable(true)
        orbs.push(purpleOrb)
        
        // Add special rotating pulsing
        this.tweens.add({
          targets: purpleOrb,
          scaleX: 1.7,
          scaleY: 1.7,
          duration: 1000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        })
        
        this.tweens.add({
          targets: purpleOrb,
          rotation: Math.PI * 2,
          duration: 3000,
          repeat: -1,
          ease: 'Linear'
        })
      }
      
      // Poison food (red with skull effect) - reduced amount
      for (let i = 0; i < 4; i++) {
        const poison = this.add.circle(
          Phaser.Math.Between(50, width - 50),
          Phaser.Math.Between(50, height - 50),
          10, 0xff0000
        )
        poison.setStrokeStyle(3, 0xcc0000)
        poison.setScale(1.3)
        poison.foodType = 'poison'
        this.physics.add.existing(poison)
        poison.body.setImmovable(true)
        poisonFood.push(poison)
        
        // Add dangerous pulsing animation
        this.tweens.add({
          targets: poison,
          scaleX: 1.8,
          scaleY: 1.8,
          duration: 800,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        })
        
        // Add rotation effect to make it look dangerous
        this.tweens.add({
          targets: poison,
          rotation: Math.PI * 2,
          duration: 2000,
          repeat: -1,
          ease: 'Linear'
        })
      }

      // Create bot snakes with different colors
      const botSnakes: any[] = []
      const botColors = [
        { color: 0xff0000, stroke: 0xcc0000, name: 'Red Bot' },
        { color: 0x0000ff, stroke: 0x0000cc, name: 'Blue Bot' },
        { color: 0xff00ff, stroke: 0xcc00cc, name: 'Purple Bot' },
        { color: 0x00ffff, stroke: 0x00cccc, name: 'Cyan Bot' },
        { color: 0xff8800, stroke: 0xcc6600, name: 'Orange Bot' }
      ]
      
      for (let i = 0; i < 5; i++) {
        const botHead = this.add.ellipse(
          Phaser.Math.Between(100, width - 100),
          Phaser.Math.Between(100, height - 100),
          35, 28, botColors[i].color
        )
        botHead.setStrokeStyle(4, botColors[i].stroke)
        this.physics.add.existing(botHead)
        botHead.body.setCollideWorldBounds(false) // Disable for wrapping
        botHead.body.setBounce(0.5)
        botHead.body.setDrag(50)
        botHead.botName = botColors[i].name
        botHead.botBody = [] // Bot snake body
        botHead.botTarget = null // Current target food
        botHead.botSpeed = 80 + (i * 20) // Different speeds for each bot
        botHead.botIntelligence = 0.3 + (i * 0.1) // Intelligence level
        botHead.botSize = 1 + Math.floor(Math.random() * 3) // Random initial size
        botSnakes.push(botHead)
        
        // Add cartoon eyes to bot snakes (bigger)
        const botLeftEye = this.add.circle(botHead.x - 7, botHead.y - 5, 5, 0xffffff)
        const botRightEye = this.add.circle(botHead.x + 7, botHead.y - 5, 5, 0xffffff)
        const botLeftPupil = this.add.circle(botHead.x - 7, botHead.y - 5, 2.5, 0x000000)
        const botRightPupil = this.add.circle(botHead.x + 7, botHead.y - 5, 2.5, 0x000000)
        
        botLeftEye.setDepth(1)
        botRightEye.setDepth(1)
        botLeftPupil.setDepth(2)
        botRightPupil.setDepth(2)
        botHead.eyes = [botLeftEye, botRightEye, botLeftPupil, botRightPupil]
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

      // Collision detection for all good food
      this.physics.add.overlap(player, orbs, (player: any, orb: any) => {
        orb.destroy()
        orbs.splice(orbs.indexOf(orb), 1)
        
        // Determine how many segments to add based on food type
        let segmentsToAdd = 1
        let particleColor = 0xffff00
        let effectScale = 1.3
        
        // Special effects based on food color
        if (orb.fillColor === 0x00ff00) { // Green food
          segmentsToAdd = 2
          particleColor = 0x00ff00
          effectScale = 1.5
        } else if (orb.fillColor === 0x0088ff) { // Blue food
          segmentsToAdd = 1
          particleColor = 0x0088ff
          effectScale = 1.2
        } else if (orb.fillColor === 0xaa00ff) { // Purple food
          segmentsToAdd = 3
          particleColor = 0xaa00ff
          effectScale = 1.8
        }
        
        // Add body segments
        for (let i = 0; i < segmentsToAdd; i++) {
          const newSegment = this.add.circle(
            player.x - (20 + i * 15), player.y, 10, 0x00dd00
          )
          newSegment.setStrokeStyle(1, 0x00aa00)
          this.physics.add.existing(newSegment)
          newSegment.body.setImmovable(true)
          snakeBody.push(newSegment)
        }
        
        // Add eating effect with color matching food
        const particles = this.add.particles(player.x, player.y, 'orb', {
          speed: { min: 50, max: 100 },
          scale: { start: 0.5, end: 0 },
          lifespan: 300,
          quantity: 5,
          tint: particleColor
        })
        particles.explode()
        
        // Add grow effect to player
        this.tweens.add({
          targets: player,
          scaleX: effectScale,
          scaleY: effectScale,
          duration: 200,
          yoyo: true,
          ease: 'Back.easeOut'
        })
        
        // Add new orb (random type) - smaller sizes
        const foodTypes = [
          { color: 0xffff00, stroke: 0xffaa00, scale: 1.5, size: 4 }, // Yellow
          { color: 0x00ff00, stroke: 0x00cc00, scale: 1.6, size: 5 }, // Green
          { color: 0x0088ff, stroke: 0x0066cc, scale: 1.4, size: 3 }, // Blue
          { color: 0xaa00ff, stroke: 0x8800cc, scale: 1.7, size: 6 } // Purple
        ]
        
        const randomType = Phaser.Math.Between(0, foodTypes.length - 1)
        const foodType = foodTypes[randomType]
        
        const newOrb = this.add.circle(
          Phaser.Math.Between(50, width - 50),
          Phaser.Math.Between(50, height - 50),
          foodType.size, foodType.color
        )
        newOrb.setStrokeStyle(2, foodType.stroke)
        newOrb.setScale(foodType.scale)
        newOrb.foodType = 'good'
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

      // Bot snake collision detection with food
      botSnakes.forEach(bot => {
        // Bot collision with good food
        this.physics.add.overlap(bot, orbs, (bot: any, orb: any) => {
          orb.destroy()
          orbs.splice(orbs.indexOf(orb), 1)
          
          // Add body segment to bot
          const newBotSegment = this.add.circle(
            bot.x - 20, bot.y, 8, bot.fillColor
          )
          newBotSegment.setStrokeStyle(1, bot.strokeColor)
          this.physics.add.existing(newBotSegment)
          newBotSegment.body.setImmovable(true)
          bot.botBody.push(newBotSegment)
          
          // Add new food
          const foodTypes = [
            { color: 0xffff00, stroke: 0xffaa00, scale: 1.2, size: 8 },
            { color: 0x00ff00, stroke: 0x00cc00, scale: 1.3, size: 10 },
            { color: 0x0088ff, stroke: 0x0066cc, scale: 1.1, size: 7 },
            { color: 0xaa00ff, stroke: 0x8800cc, scale: 1.4, size: 12 }
          ]
          
          const randomType = Phaser.Math.Between(0, foodTypes.length - 1)
          const foodType = foodTypes[randomType]
          
          const newOrb = this.add.circle(
            Phaser.Math.Between(50, width - 50),
            Phaser.Math.Between(50, height - 50),
            foodType.size, foodType.color
          )
          newOrb.setStrokeStyle(2, foodType.stroke)
          newOrb.setScale(foodType.scale)
          newOrb.foodType = 'good'
          this.physics.add.existing(newOrb)
          newOrb.body.setImmovable(true)
          orbs.push(newOrb)
        })
        
        // Bot collision with poison food
        this.physics.add.overlap(bot, poisonFood, (bot: any, poison: any) => {
          poison.destroy()
          poisonFood.splice(poisonFood.indexOf(poison), 1)
          
          // Remove bot body segment if it has any
          if (bot.botBody.length > 0) {
            const lastSegment = bot.botBody.pop()
            lastSegment.destroy()
          }
          
          // Add new poison food
          const newPoison = this.add.circle(
            Phaser.Math.Between(50, width - 50),
            Phaser.Math.Between(50, height - 50),
            10, 0xff0000
          )
          newPoison.setStrokeStyle(3, 0xcc0000)
          newPoison.setScale(1.3)
          newPoison.foodType = 'poison'
          this.physics.add.existing(newPoison)
          newPoison.body.setImmovable(true)
          poisonFood.push(newPoison)
        })
      })

      // Snake cannibalism - bots can eat each other
      botSnakes.forEach((bot1, index1) => {
        botSnakes.forEach((bot2, index2) => {
          if (index1 !== index2) {
            this.physics.add.overlap(bot1, bot2, (eater: any, eaten: any) => {
              // Check if eater is bigger (has more body segments)
              if (eater.botBody.length > eaten.botBody.length) {
                // Eater grows, eaten dies
                const segmentsToAdd = Math.floor(eaten.botBody.length / 2) + 1
                for (let i = 0; i < segmentsToAdd; i++) {
                  const newSegment = this.add.circle(
                    eater.x - (20 + i * 15), eater.y, 12, eater.fillColor
                  )
                  newSegment.setStrokeStyle(2, eater.strokeColor)
                  this.physics.add.existing(newSegment)
                  newSegment.body.setImmovable(true)
                  eater.botBody.push(newSegment)
                }
                
                // Remove eaten snake
                eaten.destroy()
                if (eaten.eyes) {
                  eaten.eyes.forEach((eye: any) => eye.destroy())
                }
                eaten.botBody.forEach((segment: any) => segment.destroy())
                botSnakes.splice(botSnakes.indexOf(eaten), 1)
                
                // Add eating effect
                const particles = this.add.particles(eater.x, eater.y, 'orb', {
                  speed: { min: 100, max: 200 },
                  scale: { start: 1, end: 0 },
                  lifespan: 500,
                  quantity: 10,
                  tint: eater.fillColor
                })
                particles.explode()
              }
            })
          }
        })
      })

      // Player can eat bots
      botSnakes.forEach(bot => {
        this.physics.add.overlap(player, bot, (player: any, bot: any) => {
          if (snakeBody.length > bot.botBody.length) {
            // Player eats bot
            const segmentsToAdd = Math.floor(bot.botBody.length / 2) + 1
            for (let i = 0; i < segmentsToAdd; i++) {
              const newSegment = this.add.circle(
                player.x - (20 + i * 15), player.y, 10, 0x00dd00
              )
              newSegment.setStrokeStyle(1, 0x00aa00)
              this.physics.add.existing(newSegment)
              newSegment.body.setImmovable(true)
              snakeBody.push(newSegment)
            }
            
            // Remove eaten bot
            bot.destroy()
            if (bot.eyes) {
              bot.eyes.forEach((eye: any) => eye.destroy())
            }
            bot.botBody.forEach((segment: any) => segment.destroy())
            botSnakes.splice(botSnakes.indexOf(bot), 1)
            
            // Add eating effect
            const particles = this.add.particles(player.x, player.y, 'orb', {
              speed: { min: 100, max: 200 },
              scale: { start: 1, end: 0 },
              lifespan: 500,
              quantity: 10,
              tint: 0x00ff00
            })
            particles.explode()
          } else {
            // Bot eats player - game over
            gameOver = true
            onGameEnd(survivalTime, Math.floor(survivalTime / 1000))
          }
        })
      })

      // Collision detection for poison food
      this.physics.add.overlap(player, poisonFood, (player: any, poison: any) => {
        poison.destroy()
        poisonFood.splice(poisonFood.indexOf(poison), 1)
        
        // Remove body segment if snake has more than just the head
        if (snakeBody.length > 1) {
          const lastSegment = snakeBody.pop()
          lastSegment.destroy()
        }
        
        // Add poison effect
        const poisonParticles = this.add.particles(player.x, player.y, 'orb', {
          speed: { min: 30, max: 80 },
          scale: { start: 0.3, end: 0 },
          lifespan: 500,
          quantity: 8,
          tint: 0xff0000
        })
        poisonParticles.explode()
        
        // Add shrink effect to player
        this.tweens.add({
          targets: player,
          scaleX: 0.7,
          scaleY: 0.7,
          duration: 300,
          yoyo: true,
          ease: 'Back.easeOut'
        })
        
        // Add new poison food
        const newPoison = this.add.circle(
          Phaser.Math.Between(50, width - 50),
          Phaser.Math.Between(50, height - 50),
          10, 0xff0000
        )
        newPoison.setStrokeStyle(3, 0xcc0000)
        newPoison.setScale(1.3)
        newPoison.foodType = 'poison'
        this.physics.add.existing(newPoison)
        newPoison.body.setImmovable(true)
        poisonFood.push(newPoison)
        
        // Add dangerous pulsing animation to new poison
        this.tweens.add({
          targets: newPoison,
          scaleX: 1.8,
          scaleY: 1.8,
          duration: 800,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        })
        
        this.tweens.add({
          targets: newPoison,
          rotation: Math.PI * 2,
          duration: 2000,
          repeat: -1,
          ease: 'Linear'
        })
      })

      // Smart bot snake AI
      this.time.addEvent({
        delay: 100, // More frequent updates for smarter AI
        callback: () => {
          if (gameOver) return
          
          botSnakes.forEach(bot => {
            // Find nearest food
            let nearestFood = null
            let nearestDistance = Infinity
            
            // Check all food (good and poison)
            const allFood = orbs.concat(poisonFood)
            allFood.forEach(food => {
              const distance = Phaser.Math.Distance.Between(bot.x, bot.y, food.x, food.y)
              if (distance < nearestDistance) {
                nearestDistance = distance
                nearestFood = food
              }
            })
            
            // AI decision making
            let targetX = bot.x
            let targetY = bot.y
            
            if (nearestFood && nearestDistance < 200) {
              // Move towards food
              const angle = Phaser.Math.Angle.Between(bot.x, bot.y, nearestFood.x, nearestFood.y)
              targetX = bot.x + Math.cos(angle) * bot.botSpeed * 0.016
              targetY = bot.y + Math.sin(angle) * bot.botSpeed * 0.016
            } else if (Phaser.Math.Between(0, 100) < bot.botIntelligence * 100) {
              // Sometimes chase player if intelligent enough
              const angle = Phaser.Math.Angle.Between(bot.x, bot.y, player.x, player.y)
              targetX = bot.x + Math.cos(angle) * bot.botSpeed * 0.016
              targetY = bot.y + Math.sin(angle) * bot.botSpeed * 0.016
            } else {
              // Random movement
              const angle = Phaser.Math.Between(0, Math.PI * 2)
              targetX = bot.x + Math.cos(angle) * bot.botSpeed * 0.016
              targetY = bot.y + Math.sin(angle) * bot.botSpeed * 0.016
            }
            
            // Apply movement with screen wrapping
            bot.x = targetX
            bot.y = targetY
            
            // Screen wrapping for bots
            if (bot.x < 0) bot.x = width
            if (bot.x > width) bot.x = 0
            if (bot.y < 0) bot.y = height
            if (bot.y > height) bot.y = 0
            
            // Update bot eyes (bigger snakes)
            if (bot.eyes && bot.eyes.length >= 4) {
              bot.eyes[0].x = bot.x - 7  // left eye
              bot.eyes[0].y = bot.y - 5
              bot.eyes[1].x = bot.x + 7  // right eye
              bot.eyes[1].y = bot.y - 5
              bot.eyes[2].x = bot.x - 7  // left pupil
              bot.eyes[2].y = bot.y - 5
              bot.eyes[3].x = bot.x + 7  // right pupil
              bot.eyes[3].y = bot.y - 5
            }
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
          
          // Screen wrapping (infinite world)
          if (player.x < 0) player.x = width
          if (player.x > width) player.x = 0
          if (player.y < 0) player.y = height
          if (player.y > height) player.y = 0
          
          // Update eyes position
          if (leftEye && rightEye && leftPupil && rightPupil) {
            leftEye.x = player.x - 6
            leftEye.y = player.y - 4
            rightEye.x = player.x + 6
            rightEye.y = player.y - 4
            leftPupil.x = player.x - 6
            leftPupil.y = player.y - 4
            rightPupil.x = player.x + 6
            rightPupil.y = player.y - 4
          }
        },
        loop: true
      })

      // Snake body movement
      this.time.addEvent({
        delay: 50,
        callback: () => {
          if (gameOver) return
          
          // Move player snake body segments to follow the head
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
          
          // Move bot snake body segments
          botSnakes.forEach(bot => {
            for (let i = bot.botBody.length - 1; i > 0; i--) {
              const segment = bot.botBody[i]
              const prevSegment = bot.botBody[i - 1]
              
              this.tweens.add({
                targets: segment,
                x: prevSegment.x,
                y: prevSegment.y,
                duration: 100,
                ease: 'Power2'
              })
            }
            
            // Move first bot body segment to follow bot head
            if (bot.botBody.length > 0) {
              const firstSegment = bot.botBody[0]
              this.tweens.add({
                targets: firstSegment,
                x: bot.x,
                y: bot.y,
                duration: 100,
                ease: 'Power2'
              })
            }
          })
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
          
          // No wall collisions - screen wrapping instead
        },
        loop: true
      })

      // Create UI elements like OopSss.io
      
      // Leaderboard (top right) - Fixed
      const leaderboardBg = this.add.graphics()
      leaderboardBg.fillStyle(0x000000, 0.8)
      leaderboardBg.fillRoundedRect(width - 220, 10, 210, 320, 10)
      
      const leaderboardTitle = this.add.text(width - 110, 30, 'Leaderboard', {
        fontSize: '18px',
        color: '#ffffff',
        fontFamily: 'Arial',
        fontWeight: 'bold'
      }).setOrigin(0.5)
      
      // Player stats (bottom left)
      const statsBg = this.add.graphics()
      statsBg.fillStyle(0x000000, 0.8)
      statsBg.fillRoundedRect(10, height - 100, 200, 90, 10)
      
      const lengthText = this.add.text(20, height - 80, 'Your length: 1', {
        fontSize: '16px',
        color: '#ffffff',
        fontFamily: 'Arial'
      })
      
      const rankText = this.add.text(20, height - 60, 'Your rank: 1 of 6', {
        fontSize: '16px',
        color: '#ffffff',
        fontFamily: 'Arial'
      })
      
      // Minimap (bottom right) with dynamic content
      const minimapBg = this.add.graphics()
      minimapBg.fillStyle(0x000000, 0.8)
      minimapBg.fillCircle(width - 100, height - 100, 80)
      minimapBg.lineStyle(2, 0xffffff, 0.5)
      minimapBg.strokeCircle(width - 100, height - 100, 80)
      
      const serverText = this.add.text(width - 100, height - 20, 'server 1', {
        fontSize: '12px',
        color: '#ffffff',
        fontFamily: 'Arial'
      }).setOrigin(0.5)
      
      // Minimap dots for snakes and food
      const minimapDots: any[] = []
      
      // Create minimap dots
      const createMinimapDot = (x: number, y: number, color: number, size: number) => {
        const dot = this.add.circle(
          width - 100 + (x - width/2) * 0.1, 
          height - 100 + (y - height/2) * 0.1, 
          size, color
        )
        dot.setDepth(10)
        minimapDots.push(dot)
        return dot
      }
      
      // Leaderboard text elements (create once)
      const leaderboardTexts: any[] = []
      for (let i = 0; i < 10; i++) {
        const text = this.add.text(width - 210, 50 + (i * 25), '', {
          fontSize: '14px',
          color: '#ffffff',
          fontFamily: 'Arial'
        })
        leaderboardTexts.push(text)
      }
      
      // Update UI elements
      this.time.addEvent({
        delay: 1000,
        callback: () => {
          if (gameOver) return
          
          // Update length
          lengthText.setText(`Your length: ${snakeBody.length}`)
          
          // Update rank (simple calculation)
          const totalPlayers = 1 + botSnakes.length
          const playerRank = 1 // Player is always #1 for now
          rankText.setText(`Your rank: ${playerRank} of ${totalPlayers}`)
          
          // Update leaderboard with bot scores
          const leaderboardData = [
            { name: 'Player', score: snakeBody.length * 100 },
            ...botSnakes.map((bot, index) => ({
              name: bot.botName,
              score: bot.botBody.length * 100 + Math.floor(Math.random() * 1000)
            }))
          ].sort((a, b) => b.score - a.score)
          
          // Update leaderboard texts
          leaderboardData.slice(0, 10).forEach((player, index) => {
            if (leaderboardTexts[index]) {
              leaderboardTexts[index].setText(`#${index + 1} ${player.name} ${player.score}`)
            }
          })
          
          // Update minimap
          minimapDots.forEach(dot => dot.destroy())
          minimapDots.length = 0
          
          // Add player to minimap
          createMinimapDot(player.x, player.y, 0xff0000, 3)
          
          // Add bots to minimap (bigger dots for bigger snakes)
          botSnakes.forEach(bot => {
            const dotSize = Math.max(2, Math.min(5, bot.botBody.length + 1))
            createMinimapDot(bot.x, bot.y, bot.fillColor, dotSize)
          })
          
          // Add some food to minimap
          const allFood = orbs.concat(poisonFood)
          allFood.slice(0, 20).forEach(food => {
            const dotSize = food.foodType === 'poison' ? 1 : 0.5
            const color = food.foodType === 'poison' ? 0xff0000 : food.fillColor
            createMinimapDot(food.x, food.y, color, dotSize)
          })
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
                  onGameEnd(scene.survivalTime, Math.floor(scene.survivalTime / 1000))
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
