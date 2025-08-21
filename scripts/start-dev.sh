#!/bin/bash

echo "🚀 Starting HelpDesk Development Environment..."
echo "📱 Backend: http://localhost:5001"
echo "🌐 Frontend: http://localhost:5173"
echo ""

# Function to cleanup background processes on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Start backend server
echo "🔧 Starting backend server..."
npm run dev &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend server
echo "🎨 Starting frontend server..."
npm run dev:frontend &
FRONTEND_PID=$!

echo ""
echo "✅ Both servers are starting up..."
echo "⏳ Please wait a few seconds for them to be ready..."
echo ""

# Wait for both processes
wait
