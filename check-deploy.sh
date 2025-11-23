#!/bin/bash

# Pre-deployment script to check everything is ready

echo "🔍 Checking deployment prerequisites..."

# Check if required files exist
if [ ! -f "app.yaml" ]; then
    echo "❌ app.yaml not found!"
    exit 1
fi

if [ ! -f "package.json" ]; then
    echo "❌ package.json not found!"
    exit 1
fi

if [ ! -d "backend" ]; then
    echo "❌ backend directory not found!"
    exit 1
fi

if [ ! -d "frontend" ]; then
    echo "❌ frontend directory not found!"
    exit 1
fi

echo "✅ All required files and directories found"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud CLI not installed!"
    echo "📥 Please install from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

echo "✅ Google Cloud CLI is installed"

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "."; then
    echo "❌ Not authenticated with Google Cloud!"
    echo "🔑 Please run: gcloud auth login"
    exit 1
fi

echo "✅ Authenticated with Google Cloud"

# Check if project is set
PROJECT=$(gcloud config get-value project)
if [ -z "$PROJECT" ]; then
    echo "❌ No Google Cloud project set!"
    echo "🔧 Please run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo "✅ Project set to: $PROJECT"

# Check MongoDB URI in app.yaml
if grep -q "mongodb+srv://username:password" app.yaml; then
    echo "⚠️  WARNING: Please update MongoDB URI in app.yaml with your actual credentials"
fi

if grep -q "your-super-secret-jwt-key-here" app.yaml; then
    echo "⚠️  WARNING: Please update JWT_SECRET in app.yaml with a secure secret"
fi

echo ""
echo "🚀 Ready to deploy!"
echo "📝 Run: gcloud app deploy"
echo ""