#!/bin/bash

echo "Starting OopSss Development Environment..."
echo ""
echo "This will start both the game server and the Next.js client."
echo "Make sure you have installed dependencies with: npm install"
echo ""

# Start server in background
echo "Starting server on port 3001..."
node server.js &
SERVER_PID=$!

# Wait a moment for server to start
sleep 3

# Start client
echo "Starting Next.js client on port 3000..."
npm run dev &
CLIENT_PID=$!

echo ""
echo "Both servers are starting up..."
echo "Game server: http://localhost:3001"
echo "Web client: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Stopping servers..."
    kill $SERVER_PID 2>/dev/null
    kill $CLIENT_PID 2>/dev/null
    exit
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for user to press Ctrl+C
wait
