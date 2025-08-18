#!/bin/bash

# Test script for Clockify MCP Server

echo "Testing Clockify MCP Server..."

# Create a test environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file with test API key..."
    echo "CLOCKIFY_API_KEY=test_api_key_12345678" > .env
fi

# Check if the build was successful
if [ ! -d "dist" ]; then
    echo "Building the project..."
    npm run build
fi

# Test if the server can start (it will fail without a valid API key, but that's expected)
echo "Testing server startup..."
timeout 2s node dist/index.js 2>&1 | head -n 5

echo ""
echo "Server structure check:"
ls -la dist/

echo ""
echo "Available npm scripts:"
npm run | grep -E "build|dev|start|lint|typecheck"

echo ""
echo "Test complete! To use the server:"
echo "1. Get your Clockify API key from https://app.clockify.me/user/settings"
echo "2. Set CLOCKIFY_API_KEY in your .env file"
echo "3. Add to your MCP settings in Claude Desktop"
