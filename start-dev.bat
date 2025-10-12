@echo off
echo Starting SlitherFi Development Environment...
echo.
echo This will start both the game server and the Next.js client.
echo Make sure you have installed dependencies with: npm install
echo.
echo Starting server on port 3001...
start "SlitherFi Server" cmd /k "node server.js"
timeout /t 3 /nobreak > nul
echo.
echo Starting Next.js client on port 3000...
start "SlitherFi Client" cmd /k "npm run dev"
echo.
echo Both servers are starting up...
echo Game server: http://localhost:3001
echo Web client: http://localhost:3000
echo.
echo Press any key to exit this window (servers will continue running)
pause > nul
