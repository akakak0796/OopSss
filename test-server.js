// Simple test script to verify the server is working
const { io } = require('socket.io-client');

console.log('Testing SlitherFi server connection...');

const socket = io('http://localhost:3001');

socket.on('connect', () => {
  console.log('✅ Successfully connected to server!');
  console.log('Socket ID:', socket.id);
  
  // Test sending movement data
  socket.emit('move', { velocityX: 100, velocityY: 0 });
  
  // Test setting name
  socket.emit('setName', 'TestPlayer');
  
  // Listen for game state updates
  socket.on('gameState', (state) => {
    console.log('📊 Received game state:');
    console.log(`- Players: ${state.players.length}`);
    console.log(`- Food: ${state.food.length}`);
    console.log(`- Leaderboard: ${state.leaderboard.length} entries`);
    console.log(`- World size: ${state.worldSize.width}x${state.worldSize.height}`);
  });
  
  // Test boost
  setTimeout(() => {
    console.log('🚀 Testing boost...');
    socket.emit('boost', {});
  }, 2000);
  
  // Disconnect after 5 seconds
  setTimeout(() => {
    console.log('🔌 Disconnecting...');
    socket.disconnect();
    process.exit(0);
  }, 5000);
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from server');
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
  process.exit(1);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down test client...');
  socket.disconnect();
  process.exit(0);
});
