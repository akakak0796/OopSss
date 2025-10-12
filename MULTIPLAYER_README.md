# OopSss Multiplayer Implementation

This document describes the comprehensive multiplayer OopSss.io-style game implementation with Socket.IO integration.

## Features Implemented

### 1. Multiplayer Integration (Socket.IO)
- ✅ Real-time multiplayer support using Socket.IO
- ✅ Multiple users can join the same match instance
- ✅ Node.js server manages player connections/disconnections
- ✅ Snake positions, growth, collisions, and food state synchronization
- ✅ Periodic broadcast of world updates to all clients

### 2. Scrollable Arena (Camera/Viewport System)
- ✅ Large map (5000×5000 world units)
- ✅ Camera follows snake head smoothly
- ✅ World scrolls beneath the player
- ✅ Camera offset calculations: `renderX = worldX - camera.x + canvasWidth / 2`
- ✅ Prevents camera from scrolling past world boundaries
- ✅ Smooth interpolation for fluid visuals

### 3. Food and Growth System
- ✅ Food dots spawn across the entire arena
- ✅ Different food types with varying values:
  - Yellow: Basic food (1 segment)
  - Green: Better food (2 segments)
  - Blue: Basic food (1 segment)
  - Purple: Premium food (3 segments)
  - Red: Poison food (-1 segment)
- ✅ Smooth growth animations when eating food
- ✅ Food respawns in random locations
- ✅ Limited total food count (200 max)
- ✅ Viewport optimization - only renders visible food

### 4. Collision System
- ✅ Self-collision: Snake dies if head touches its own body
- ✅ Other snakes: Head collision with another snake's body eliminates player
- ✅ Map edges: Snake dies if it leaves world boundaries
- ✅ Server-side collision detection for fairness
- ✅ Death notification and respawn system (3-second delay)

### 5. Scoring and Leaderboard
- ✅ Score = number of segments (snake length)
- ✅ Real-time leaderboard synchronization
- ✅ In-game UI shows:
  - Player's score (top-left corner)
  - Global leaderboard (top-right corner)
- ✅ Leaderboard updates in real-time

### 6. Rendering & Visuals
- ✅ Snake segments: Smoothly connected circles with gradients
- ✅ Food dots: Glowing colored circles with pulsing animation
- ✅ Background: Subtle grid pattern
- ✅ Viewport clipping - only renders visible objects
- ✅ Smooth camera following with interpolation
- ✅ Different colors for current player vs other players

### 7. Controls
- ✅ Mouse movement for direction control
- ✅ Keyboard controls (WASD/Arrow keys)
- ✅ Space bar for speed boost
- ✅ Smooth velocity normalization

## File Structure

```
oopsss/
├── server.js                 # Socket.IO server with game logic
├── src/
│   └── components/
│       └── MultiplayerGame.tsx  # Main game component with canvas rendering
├── package.json             # Dependencies including socket.io-client
└── test-server.js          # Test script for server verification
```

## Technical Implementation

### Server-Side (server.js)
- **Game State Management**: Centralized state with players, food, and leaderboard
- **Collision Detection**: Server-side validation for fairness
- **Food System**: Dynamic spawning with different types and values
- **Player Management**: Connection handling, respawn system, camera tracking
- **Real-time Updates**: 60 FPS game loop with state broadcasting

### Client-Side (MultiplayerGame.tsx)
- **Canvas Rendering**: HTML5 Canvas for smooth 2D graphics
- **Camera System**: Smooth following with interpolation
- **Viewport Optimization**: Only renders objects within camera bounds
- **Input Handling**: Mouse and keyboard controls
- **UI Elements**: Score display and real-time leaderboard
- **Socket Integration**: Real-time communication with server

### Key Features

#### Camera System
```typescript
// World to screen coordinate conversion
const worldToScreen = (worldX: number, worldY: number) => {
  return {
    x: worldX - cameraRef.current.x + canvas.width / 2,
    y: worldY - cameraRef.current.y + canvas.height / 2
  }
}

// Viewport culling for performance
const isInViewport = (worldX: number, worldY: number, radius: number = 0) => {
  const screen = worldToScreen(worldX, worldY)
  return screen.x + radius >= 0 && screen.x - radius <= canvas.width &&
         screen.y + radius >= 0 && screen.y - radius <= canvas.height
}
```

#### Smooth Movement
```javascript
// Server-side movement with delta time
const speed = SNAKE_SPEED * (deltaTime / 1000);
player.x += player.velocity.x * speed;
player.y += player.velocity.y * speed;

// Client-side camera interpolation
cameraRef.current.x += (cameraRef.current.targetX - cameraRef.current.x) * cameraSpeed;
cameraRef.current.y += (cameraRef.current.targetY - cameraRef.current.y) * cameraSpeed;
```

#### Food System
```javascript
// Different food types with values
const colors = [
  { color: 0xffff00, type: 'good', value: 1 }, // Yellow - basic
  { color: 0x00ff00, type: 'good', value: 2 }, // Green - better
  { color: 0x0088ff, type: 'good', value: 1 }, // Blue - basic
  { color: 0xaa00ff, type: 'good', value: 3 }, // Purple - premium
  { color: 0xff0000, type: 'poison', value: -1 } // Red poison
];
```

## Running the Game

1. **Install Dependencies**:
   ```bash
   cd oopsss
   npm install
   ```

2. **Start the Server**:
   ```bash
   node server.js
   ```
   Server runs on port 3001

3. **Start the Client**:
   ```bash
   npm run dev
   ```
   Client runs on port 3000

4. **Test the Server** (optional):
   ```bash
   node test-server.js
   ```

## Game Controls

- **Mouse**: Move mouse to control snake direction
- **WASD/Arrow Keys**: Alternative directional controls
- **Space**: Speed boost (temporary)
- **Enter**: Submit player name

## Performance Optimizations

1. **Viewport Culling**: Only renders objects within camera bounds
2. **Efficient Collision Detection**: Server-side validation with optimized algorithms
3. **Smooth Interpolation**: Reduces visual stuttering
4. **Delta Time**: Frame-rate independent movement
5. **Object Pooling**: Reuses graphics objects when possible

## Future Enhancements

- Mini-map showing global snake positions
- Power-ups and special abilities
- Team-based gameplay
- Spectator mode
- Replay system
- Mobile touch controls
- Sound effects and music

## Troubleshooting

### Common Issues

1. **Connection Failed**: Ensure server is running on port 3001
2. **Canvas Not Rendering**: Check browser console for errors
3. **Movement Not Working**: Verify socket connection and input handlers
4. **Performance Issues**: Reduce viewport size or food count

### Debug Mode

Enable debug logging by setting `console.log` statements in the code or using browser dev tools to monitor socket events.

## Architecture Decisions

1. **Server Authority**: All game logic runs on server for fairness
2. **Canvas Rendering**: Chosen over WebGL for simplicity and compatibility
3. **Socket.IO**: Real-time communication with fallback support
4. **Component Architecture**: React components for maintainability
5. **TypeScript**: Type safety for better development experience
