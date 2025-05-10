#!/bin/bash

# Start the Next.js app in the background
echo "Starting Next.js application..."
npm run dev &
NEXT_PID=$!

# Wait for Next.js to start
echo "Waiting for Next.js to start (10 seconds)..."
sleep 10

# Start the background service in the background
echo "Starting background service..."
node background-service.js &
BG_PID=$!

# Setup cleanup function to handle SIGINT (Ctrl+C)
function cleanup() {
    echo "Stopping services..."
    kill $NEXT_PID
    kill $BG_PID
    exit 0
}

# Register the cleanup function to be called on SIGINT
trap cleanup SIGINT

echo "Both services are running!"
echo "Next.js: http://localhost:3000"
echo "Press Ctrl+C to stop both services"

# Wait for both processes to finish (or until interrupted)
wait $NEXT_PID $BG_PID
