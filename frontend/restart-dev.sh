#!/bin/bash

# Stop any running React development server
echo "Stopping any running React development server..."
pkill -f "react-scripts start" || true

# Clear any cached environment variables
echo "Clearing environment variable cache..."
rm -rf node_modules/.cache

# Start the development server
echo "Starting the development server..."
npm start 