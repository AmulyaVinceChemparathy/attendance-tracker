#!/bin/bash

# Simple AWS EC2 Free Tier Deployment Script
# Run this script on your EC2 instance after connecting via SSH

set -e

echo "🚀 Starting AWS EC2 Free Tier Deployment..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Docker
echo "🐳 Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo "✅ Docker installed successfully"
else
    echo "✅ Docker already installed"
fi

# Install Docker Compose
echo "📦 Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose installed successfully"
else
    echo "✅ Docker Compose already installed"
fi

# Create application directory
APP_DIR="/home/ubuntu/attendance-tracker"
echo "📁 Creating application directory..."
mkdir -p $APP_DIR
cd $APP_DIR

# Clone repository (REPLACE WITH YOUR ACTUAL REPO URL)
echo "📥 Cloning repository..."
git clone https://github.com/YOUR_USERNAME/attendance-tracker.git .

# Create environment file
echo "🔧 Setting up environment variables..."
cat > .env << EOF
NODE_ENV=production
PORT=3000
JWT_SECRET=$(openssl rand -base64 32)
EOF

# Create Docker Compose file
echo "📝 Creating Docker Compose configuration..."
cat > docker-compose.yml << EOF
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - JWT_SECRET=\${JWT_SECRET}
    volumes:
      - app_data:/app/data
    restart: unless-stopped

volumes:
  app_data:
EOF

# Build and start the application
echo "🏗️ Building and starting application..."
docker-compose up -d --build

# Wait for application to start
echo "⏳ Waiting for application to start..."
sleep 30

# Check if application is running
echo "🔍 Checking application status..."
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Application is running successfully!"
    echo ""
    echo "🌐 Your application is available at:"
    echo "   http://$(curl -s ifconfig.me):3000"
    echo ""
    echo "📊 Health check:"
    echo "   http://$(curl -s ifconfig.me):3000/health"
else
    echo "❌ Application failed to start. Checking logs..."
    docker-compose logs
    echo ""
    echo "🔧 Try these commands to debug:"
    echo "   docker-compose logs -f"
    echo "   docker-compose ps"
fi

echo ""
echo "🎉 Deployment completed!"
echo ""
echo "📋 Useful commands:"
echo "   View logs:     docker-compose logs -f"
echo "   Stop app:      docker-compose down"
echo "   Restart app:   docker-compose restart"
echo "   Check status:  docker-compose ps"
echo "   Update app:    git pull && docker-compose up -d --build"
