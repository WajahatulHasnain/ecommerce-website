#!/bin/bash

# Build frontend
cd frontend
npm install
npm run build
cd ..

# Prepare backend
cd backend
npm install
cd ..

echo "Build completed successfully!"