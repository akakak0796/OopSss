const { Server } = require('socket.io');
const http = require('http');
const express = require('express');

const app = express();

// Add basic endpoint for health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'OopSss Server Running', 
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3002", "http://127.0.0.1:3000", "http://127.0.0.1:3002"],
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  },
  transports: ['websocket', 'polling']
});

// Game state
const WORLD_WIDTH = 10000;
const WORLD_HEIGHT = 10000;
const MAX_FOOD = 500;
const MAX_PLAYERS = 50;
const SNAKE_SPEED = 100;
const SEGMENT_DISTANCE = 20;
const COLLISION_RADIUS = 15;

let players = new Map();
let aiSnakes = new Map();
let food = [];
let gameState = {
  players: new Map(),
  food: [],
  leaderboard: []
};

// Camera/viewport system for each player
let playerCameras = new Map();

// AI Snake configuration
const AI_SNAKE_COUNT = 20;
const AI_SNAKE_SPEED = 80;
const AI_SNAKE_INTELLIGENCE = 0.7;

// Initialize AI snakes
function initializeAISnakes() {
  const aiNames = [
    'Alpha Snake', 'Beta Snake', 'Gamma Snake', 'Delta Snake',
    'Echo Snake', 'Foxtrot Snake', 'Golf Snake', 'Hotel Snake',
    'India Snake', 'Juliet Snake', 'Kilo Snake', 'Lima Snake',
    'Mike Snake', 'November Snake', 'Oscar Snake', 'Papa Snake',
    'Quebec Snake', 'Romeo Snake', 'Sierra Snake', 'Tango Snake'
  ];
  
  const aiColors = [
    { color: 0xff6b6b, stroke: 0xff5252 }, // Red
    { color: 0x4ecdc4, stroke: 0x26a69a }, // Teal
    { color: 0x45b7d1, stroke: 0x2196f3 }, // Blue
    { color: 0x96ceb4, stroke: 0x4caf50 }, // Green
    { color: 0xfeca57, stroke: 0xff9800 }, // Orange
    { color: 0xff9ff3, stroke: 0xe91e63 }, // Pink
    { color: 0x54a0ff, stroke: 0x2196f3 }, // Light Blue
    { color: 0x5f27cd, stroke: 0x673ab7 }, // Purple
    { color: 0xff5722, stroke: 0xd84315 }, // Deep Orange
    { color: 0x795548, stroke: 0x5d4037 }, // Brown
    { color: 0x607d8b, stroke: 0x455a64 }, // Blue Grey
    { color: 0xe91e63, stroke: 0xc2185b }, // Pink
    { color: 0x3f51b5, stroke: 0x303f9f }, // Indigo
    { color: 0x009688, stroke: 0x00695c }, // Teal
    { color: 0x4caf50, stroke: 0x388e3c }, // Green
    { color: 0x8bc34a, stroke: 0x689f38 }, // Light Green
    { color: 0xcddc39, stroke: 0xafb42b }, // Lime
    { color: 0xffeb3b, stroke: 0xf9a825 }, // Yellow
    { color: 0xffc107, stroke: 0xff8f00 }, // Amber
    { color: 0xff9800, stroke: 0xf57c00 }  // Orange
  ];

  for (let i = 0; i < AI_SNAKE_COUNT; i++) {
    // Spawn AI snakes in safer positions away from edges and each other
    const margin = 500;
    const spacing = WORLD_WIDTH / Math.sqrt(AI_SNAKE_COUNT);
    const x = margin + (i % Math.floor(Math.sqrt(AI_SNAKE_COUNT))) * spacing;
    const y = margin + Math.floor(i / Math.floor(Math.sqrt(AI_SNAKE_COUNT))) * spacing;
    
    const aiSnake = {
      id: `ai_${i}`,
      name: aiNames[i],
      x: Math.min(x, WORLD_WIDTH - margin),
      y: Math.min(y, WORLD_HEIGHT - margin),
      velocity: { x: 0, y: 0 },
      segments: [{ x: Math.min(x, WORLD_WIDTH - margin), y: Math.min(y, WORLD_HEIGHT - margin) }],
      score: 3, // Start with minimal segments
      alive: true,
      color: aiColors[i],
      targetX: 0,
      targetY: 0,
      lastDirectionChange: 0,
      intelligence: AI_SNAKE_INTELLIGENCE + (Math.random() * 0.3),
      speed: AI_SNAKE_SPEED + (Math.random() * 30)
    };
    
    // Add initial segments based on score
    for (let j = 1; j < aiSnake.score; j++) {
      aiSnake.segments.push({
        x: aiSnake.x - (j * SEGMENT_DISTANCE),
        y: aiSnake.y
      });
    }
    
    aiSnakes.set(aiSnake.id, aiSnake);
  }
  
  console.log(`✅ Initialized ${AI_SNAKE_COUNT} AI snakes`);
}

// Update AI snake behavior
function updateAISnake(aiSnake) {
  if (!aiSnake.alive) return;
  
  const now = Date.now();
  const timeSinceLastChange = now - aiSnake.lastDirectionChange;
  
  // Find nearest food
  let nearestFood = null;
  let nearestDistance = Infinity;
  
  food.forEach(foodItem => {
    const distance = Math.sqrt(
      Math.pow(aiSnake.x - foodItem.x, 2) + 
      Math.pow(aiSnake.y - foodItem.y, 2)
    );
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestFood = foodItem;
    }
  });
  
  // Find nearest player
  let nearestPlayer = null;
  let nearestPlayerDistance = Infinity;
  
  for (const [playerId, player] of players) {
    if (!player.alive) continue;
    const distance = Math.sqrt(
      Math.pow(aiSnake.x - player.x, 2) + 
      Math.pow(aiSnake.y - player.y, 2)
    );
    if (distance < nearestPlayerDistance) {
      nearestPlayerDistance = distance;
      nearestPlayer = player;
    }
  }
  
  // AI decision making
  let targetX = aiSnake.x;
  let targetY = aiSnake.y;
  
  if (nearestFood && nearestDistance < 300) {
    // Move towards food
    const angle = Math.atan2(nearestFood.y - aiSnake.y, nearestFood.x - aiSnake.x);
    targetX = aiSnake.x + Math.cos(angle) * aiSnake.speed * 0.016;
    targetY = aiSnake.y + Math.sin(angle) * aiSnake.speed * 0.016;
  } else if (nearestPlayer && nearestPlayerDistance < 200 && aiSnake.score > nearestPlayer.score) {
    // Chase smaller player if AI is bigger
    const angle = Math.atan2(nearestPlayer.y - aiSnake.y, nearestPlayer.x - aiSnake.x);
    targetX = aiSnake.x + Math.cos(angle) * aiSnake.speed * 0.016;
    targetY = aiSnake.y + Math.sin(angle) * aiSnake.speed * 0.016;
  } else if (Math.random() < aiSnake.intelligence * 0.1) {
    // Random movement based on intelligence
    const angle = Math.random() * Math.PI * 2;
    targetX = aiSnake.x + Math.cos(angle) * aiSnake.speed * 0.016;
    targetY = aiSnake.y + Math.sin(angle) * aiSnake.speed * 0.016;
  }
  
  // Update position
  aiSnake.x = targetX;
  aiSnake.y = targetY;
  
  // Keep within world bounds
  aiSnake.x = Math.max(0, Math.min(WORLD_WIDTH, aiSnake.x));
  aiSnake.y = Math.max(0, Math.min(WORLD_HEIGHT, aiSnake.y));
  
  // Update segments
  for (let i = aiSnake.segments.length - 1; i > 0; i--) {
    const segment = aiSnake.segments[i];
    const prevSegment = aiSnake.segments[i - 1];
    
    const dx = prevSegment.x - segment.x;
    const dy = prevSegment.y - segment.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > SEGMENT_DISTANCE) {
      const moveDistance = distance - SEGMENT_DISTANCE;
      segment.x += (dx / distance) * moveDistance;
      segment.y += (dy / distance) * moveDistance;
    }
  }
  
  // Update head segment
  aiSnake.segments[0].x = aiSnake.x;
  aiSnake.segments[0].y = aiSnake.y;
}

// Initialize food
function initializeFood() {
  food = [];
  for (let i = 0; i < MAX_FOOD; i++) {
    food.push({
      id: i,
      x: Math.random() * WORLD_WIDTH,
      y: Math.random() * WORLD_HEIGHT,
      type: Math.random() < 0.1 ? 'poison' : 'good',
      color: getRandomFoodColor()
    });
  }
}

function getRandomFoodColor() {
  const colors = [
    { color: 0xffff00, type: 'good', value: 1 }, // Yellow - basic food
    { color: 0x00ff00, type: 'good', value: 2 }, // Green - better food
    { color: 0x0088ff, type: 'good', value: 1 }, // Blue - basic food
    { color: 0xaa00ff, type: 'good', value: 3 }, // Purple - premium food
    { color: 0xff0000, type: 'poison', value: -1 } // Red poison
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

function spawnFood() {
  if (food.length < MAX_FOOD) {
    const newFood = {
      id: Date.now() + Math.random(),
      x: Math.random() * WORLD_WIDTH,
      y: Math.random() * WORLD_HEIGHT,
      type: Math.random() < 0.1 ? 'poison' : 'good',
      color: getRandomFoodColor()
    };
    food.push(newFood);
  }
}

function updateLeaderboard() {
  const allSnakes = [
    ...Array.from(players.values()),
    ...Array.from(aiSnakes.values())
  ];
  
  const sortedSnakes = allSnakes
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
  
  gameState.leaderboard = sortedSnakes.map(snake => ({
    id: snake.id,
    name: snake.name,
    score: snake.score
  }));
}

function checkCollisions(playerId) {
  const player = players.get(playerId);
  if (!player || !player.alive) return;

  // Check world boundaries
  if (player.x < 0 || player.x > WORLD_WIDTH || 
      player.y < 0 || player.y > WORLD_HEIGHT) {
    eliminatePlayer(playerId);
    return;
  }

  // Check self collision (skip first few segments to avoid immediate collision)
  for (let i = 4; i < player.segments.length; i++) {
    const segment = player.segments[i];
    const distance = Math.sqrt(
      Math.pow(player.x - segment.x, 2) + 
      Math.pow(player.y - segment.y, 2)
    );
    if (distance < COLLISION_RADIUS) {
      eliminatePlayer(playerId);
      return;
    }
  }

  // Check collision with other players
  for (const [otherId, otherPlayer] of players) {
    if (otherId === playerId || !otherPlayer.alive) continue;
    
    // Check head collision with other player's body
    for (let i = 0; i < otherPlayer.segments.length; i++) {
      const segment = otherPlayer.segments[i];
      const distance = Math.sqrt(
        Math.pow(player.x - segment.x, 2) + 
        Math.pow(player.y - segment.y, 2)
      );
      if (distance < COLLISION_RADIUS) {
        eliminatePlayer(playerId);
        return;
      }
    }
  }

  // Check collision with AI snakes
  for (const [aiId, aiSnake] of aiSnakes) {
    if (!aiSnake.alive) continue;
    
    // Check if AI snake head eats player (AI snake grows, player dies)
    const headDistance = Math.sqrt(
      Math.pow(player.x - aiSnake.x, 2) + 
      Math.pow(player.y - aiSnake.y, 2)
    );
    if (headDistance < COLLISION_RADIUS) {
      // AI snake eats player - AI grows, player dies
      const lastSegment = aiSnake.segments[aiSnake.segments.length - 1];
      aiSnake.segments.push({
        x: lastSegment.x - SEGMENT_DISTANCE,
        y: lastSegment.y
      });
      aiSnake.score += 1;
      eliminatePlayer(playerId);
      return;
    }
    
    // Check head collision with AI snake's body
    for (let i = 1; i < aiSnake.segments.length; i++) {
      const segment = aiSnake.segments[i];
      const distance = Math.sqrt(
        Math.pow(player.x - segment.x, 2) + 
        Math.pow(player.y - segment.y, 2)
      );
      if (distance < COLLISION_RADIUS) {
        eliminatePlayer(playerId);
        return;
      }
    }
  }
}

// Check AI snake collisions
function checkAICollisions(aiId) {
  const aiSnake = aiSnakes.get(aiId);
  if (!aiSnake || !aiSnake.alive) return;

  // Check world boundaries - wrap around instead of eliminate
  if (aiSnake.x < 0) {
    aiSnake.x = WORLD_WIDTH;
  } else if (aiSnake.x > WORLD_WIDTH) {
    aiSnake.x = 0;
  }
  if (aiSnake.y < 0) {
    aiSnake.y = WORLD_HEIGHT;
  } else if (aiSnake.y > WORLD_HEIGHT) {
    aiSnake.y = 0;
  }

  // Check self collision - reduced sensitivity
  for (let i = 8; i < aiSnake.segments.length; i++) {
    const segment = aiSnake.segments[i];
    const distance = Math.sqrt(
      Math.pow(aiSnake.x - segment.x, 2) + 
      Math.pow(aiSnake.y - segment.y, 2)
    );
    if (distance < COLLISION_RADIUS) {
      eliminateAISnake(aiId);
      return;
    }
  }

  // Check collision with players
  for (const [playerId, player] of players) {
    if (!player.alive) continue;
    
    // Check head collision with player's body
    for (let i = 0; i < player.segments.length; i++) {
      const segment = player.segments[i];
      const distance = Math.sqrt(
        Math.pow(aiSnake.x - segment.x, 2) + 
        Math.pow(aiSnake.y - segment.y, 2)
      );
      if (distance < COLLISION_RADIUS) {
        eliminateAISnake(aiId);
        return;
      }
    }
  }

  // Check collision with other AI snakes
  for (const [otherAiId, otherAiSnake] of aiSnakes) {
    if (otherAiId === aiId || !otherAiSnake.alive) continue;
    
    // Check head collision with other AI snake's body
    for (let i = 0; i < otherAiSnake.segments.length; i++) {
      const segment = otherAiSnake.segments[i];
      const distance = Math.sqrt(
        Math.pow(aiSnake.x - segment.x, 2) + 
        Math.pow(aiSnake.y - segment.y, 2)
      );
      if (distance < COLLISION_RADIUS) {
        eliminateAISnake(aiId);
        return;
      }
    }
  }
}

function eliminateAISnake(aiId) {
  const aiSnake = aiSnakes.get(aiId);
  if (aiSnake) {
    aiSnake.alive = false;
    aiSnake.segments = [];
    
    // Respawn after 5 seconds
    setTimeout(() => {
      respawnAISnake(aiId);
    }, 5000);
  }
}

function respawnAISnake(aiId) {
  const aiSnake = aiSnakes.get(aiId);
  if (aiSnake) {
    aiSnake.x = Math.random() * WORLD_WIDTH;
    aiSnake.y = Math.random() * WORLD_HEIGHT;
    aiSnake.alive = true;
    aiSnake.score = Math.floor(Math.random() * 10) + 3;
    aiSnake.segments = [{ x: aiSnake.x, y: aiSnake.y }];
    
    // Add initial segments
    for (let j = 1; j < aiSnake.score; j++) {
      aiSnake.segments.push({
        x: aiSnake.x - (j * SEGMENT_DISTANCE),
        y: aiSnake.y
      });
    }
  }
}

function eliminatePlayer(playerId) {
  const player = players.get(playerId);
  if (player) {
    player.alive = false;
    player.segments = [];
    io.to(playerId).emit('gameOver', { score: player.score });
    
    // Respawn after 3 seconds
    setTimeout(() => {
      respawnPlayer(playerId);
    }, 3000);
  }
}

function respawnPlayer(playerId) {
  const player = players.get(playerId);
  if (player) {
    player.x = Math.random() * WORLD_WIDTH;
    player.y = Math.random() * WORLD_HEIGHT;
    player.alive = true;
    player.score = 0;
    player.segments = [{ x: player.x, y: player.y }];
    player.velocity = { x: 0, y: 0 };
    
    io.to(playerId).emit('respawn', {
      x: player.x,
      y: player.y
    });
  }
}

function checkFoodCollisions(playerId) {
  const player = players.get(playerId);
  if (!player || !player.alive) return;

  for (let i = food.length - 1; i >= 0; i--) {
    const foodItem = food[i];
    const distance = Math.sqrt(
      Math.pow(player.x - foodItem.x, 2) + 
      Math.pow(player.y - foodItem.y, 2)
    );

    if (distance < 20) {
      // Player ate food
      if (foodItem.type === 'poison') {
        // Remove segment if possible
        if (player.segments.length > 1) {
          player.segments.pop();
          player.score = Math.max(0, player.score - 1);
        }
      } else {
        // Add only 1 segment per food item (slower growth)
        const lastSegment = player.segments[player.segments.length - 1];
        player.segments.push({
          x: lastSegment.x - SEGMENT_DISTANCE,
          y: lastSegment.y
        });
        player.score += 1;
      }

      // Remove eaten food
      food.splice(i, 1);
      
      // Spawn new food
      spawnFood();
      
      // Broadcast food update
      io.emit('foodUpdate', {
        removed: foodItem.id,
        added: food[food.length - 1]
      });
    }
  }
}

// Check AI snake food collisions
function checkAIFoodCollisions(aiId) {
  const aiSnake = aiSnakes.get(aiId);
  if (!aiSnake || !aiSnake.alive) return;

  for (let i = food.length - 1; i >= 0; i--) {
    const foodItem = food[i];
    const distance = Math.sqrt(
      Math.pow(aiSnake.x - foodItem.x, 2) + 
      Math.pow(aiSnake.y - foodItem.y, 2)
    );

    if (distance < 20) {
      // AI snake ate food
      if (foodItem.type === 'poison') {
        // Remove segment if possible
        if (aiSnake.segments.length > 1) {
          aiSnake.segments.pop();
          aiSnake.score = Math.max(0, aiSnake.score - 1);
        }
      } else {
        // Add only 1 segment per food item (slower growth)
        const lastSegment = aiSnake.segments[aiSnake.segments.length - 1];
        aiSnake.segments.push({
          x: lastSegment.x - SEGMENT_DISTANCE,
          y: lastSegment.y
        });
        aiSnake.score += 1;
      }

      // Remove eaten food
      food.splice(i, 1);
      
      // Spawn new food
      spawnFood();
      
      // Broadcast food update
      io.emit('foodUpdate', {
        removed: foodItem.id,
        added: food[food.length - 1]
      });
    }
  }
}

// Game loop
setInterval(() => {
  const deltaTime = 16; // ~60 FPS
  
  // Update all players
  for (const [playerId, player] of players) {
    if (!player.alive) continue;

    // Update position with delta time
    const speed = SNAKE_SPEED * (deltaTime / 1000);
    player.x += player.velocity.x * speed;
    player.y += player.velocity.y * speed;

    // Update segments with smooth following
    for (let i = player.segments.length - 1; i > 0; i--) {
      const segment = player.segments[i];
      const prevSegment = player.segments[i - 1];
      
      const dx = prevSegment.x - segment.x;
      const dy = prevSegment.y - segment.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > SEGMENT_DISTANCE) {
        const moveDistance = distance - SEGMENT_DISTANCE;
        segment.x += (dx / distance) * moveDistance;
        segment.y += (dy / distance) * moveDistance;
      }
    }

    // Update head segment
    player.segments[0].x = player.x;
    player.segments[0].y = player.y;

    // Check collisions
    checkCollisions(playerId);
    checkFoodCollisions(playerId);
  }

  // Update AI snakes
  for (const [aiId, aiSnake] of aiSnakes) {
    if (!aiSnake.alive) continue;
    
    // Update AI behavior
    updateAISnake(aiSnake);
    
    // Check collisions
    checkAICollisions(aiId);
    checkAIFoodCollisions(aiId);
  }

  // Update leaderboard
  updateLeaderboard();

  // Broadcast game state with viewport optimization
  const gameStateToSend = {
    players: Array.from(players.values()).map(p => ({
      id: p.id,
      name: p.name,
      x: p.x,
      y: p.y,
      segments: p.segments,
      score: p.score,
      alive: p.alive
    })),
    aiSnakes: Array.from(aiSnakes.values()).map(ai => ({
      id: ai.id,
      name: ai.name,
      x: ai.x,
      y: ai.y,
      segments: ai.segments,
      score: ai.score,
      alive: ai.alive,
      color: ai.color
    })),
    food: food,
    leaderboard: gameState.leaderboard,
    worldSize: { width: WORLD_WIDTH, height: WORLD_HEIGHT }
  };

  // Debug logging
  if (Math.random() < 0.01) { // Log occasionally to avoid spam
    console.log(`🎮 Game state: ${gameStateToSend.players.length} players, ${gameStateToSend.aiSnakes.length} AI snakes`);
  }

  io.emit('gameState', gameStateToSend);
}, 1000 / 60); // 60 FPS

// Socket.IO events
io.on('connection', (socket) => {
  console.log(`✅ Player connected: ${socket.id}`);

  // Add new player with better initialization
  const player = {
    id: socket.id,
    name: `Player${Math.floor(Math.random() * 1000)}`,
    x: Math.random() * WORLD_WIDTH,
    y: Math.random() * WORLD_HEIGHT,
    velocity: { x: 0, y: 0 },
    segments: [{ x: Math.random() * WORLD_WIDTH, y: Math.random() * WORLD_HEIGHT }],
    score: 0,
    alive: true,
    lastUpdate: Date.now()
  };

  players.set(socket.id, player);
  
  // Initialize camera for player
  playerCameras.set(socket.id, {
    x: player.x,
    y: player.y,
    targetX: player.x,
    targetY: player.y
  });

  // Send initial game state
  socket.emit('gameState', {
    players: Array.from(players.values()).map(p => ({
      id: p.id,
      name: p.name,
      x: p.x,
      y: p.y,
      segments: p.segments,
      score: p.score,
      alive: p.alive
    })),
    food: food,
    leaderboard: gameState.leaderboard,
    worldSize: { width: WORLD_WIDTH, height: WORLD_HEIGHT }
  });

  // Handle player movement
  socket.on('move', (data) => {
    const player = players.get(socket.id);
    if (player && player.alive) {
      // Normalize velocity to prevent speed hacking
      const magnitude = Math.sqrt(data.velocityX * data.velocityX + data.velocityY * data.velocityY);
      if (magnitude > 0) {
        const normalizedX = (data.velocityX / magnitude) * SNAKE_SPEED;
        const normalizedY = (data.velocityY / magnitude) * SNAKE_SPEED;
        player.velocity.x = normalizedX;
        player.velocity.y = normalizedY;
      } else {
        player.velocity.x = 0;
        player.velocity.y = 0;
      }
      player.lastUpdate = Date.now();
    }
  });

  // Handle boost
  socket.on('boost', (data) => {
    const player = players.get(socket.id);
    if (player && player.alive) {
      // Apply temporary speed boost
      const boostMultiplier = 1.5;
      player.velocity.x *= boostMultiplier;
      player.velocity.y *= boostMultiplier;
      
      // Reset after 2 seconds
      setTimeout(() => {
        if (player && player.alive) {
          player.velocity.x /= boostMultiplier;
          player.velocity.y /= boostMultiplier;
        }
      }, 2000);
    }
  });

  // Handle player name change
  socket.on('setName', (name) => {
    const player = players.get(socket.id);
    if (player) {
      player.name = name;
    }
  });

  // Handle disconnect
  socket.on('disconnect', (reason) => {
    console.log(`❌ Player disconnected: ${socket.id}, reason: ${reason}`);
    players.delete(socket.id);
    playerCameras.delete(socket.id);
  });

  // Handle connection errors
  socket.on('error', (error) => {
    console.error(`❌ Socket error for ${socket.id}:`, error);
  });
});

// Initialize food and AI snakes
initializeFood();
initializeAISnakes();

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`OopSss server running on port ${PORT}`);
  console.log(`World size: ${WORLD_WIDTH}x${WORLD_HEIGHT}`);
  console.log(`AI snakes: ${AI_SNAKE_COUNT}`);
  console.log(`Max food: ${MAX_FOOD}`);
});
