#!/bin/bash

# AWS EC2 Deployment Script for Attendance Tracker
# Run this script on your EC2 instance

set -e

echo "🚀 Starting Attendance Tracker deployment on AWS EC2..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
if ! command -v docker &> /dev/null; then
    echo "📦 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
fi

# Install Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "📦 Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Create application directory
APP_DIR="/opt/attendance-tracker"
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR

# Clone repository (replace with your repo URL)
echo "📥 Cloning repository..."
cd $APP_DIR
git clone https://github.com/yourusername/attendance-tracker.git .

# Set up environment variables
echo "🔧 Setting up environment variables..."
cat > .env << EOF
NODE_ENV=production
PORT=3000
JWT_SECRET=$(openssl rand -base64 32)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=attendance_tracker
DB_USER=postgres
DB_PASSWORD=$(openssl rand -base64 32)
EOF

# Build and start the application
echo "🏗️ Building and starting application..."
docker-compose up -d --build

# Set up auto-start on boot
echo "⚙️ Setting up auto-start..."
sudo tee /etc/systemd/system/attendance-tracker.service > /dev/null << EOF
[Unit]
Description=Attendance Tracker
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$APP_DIR
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable attendance-tracker.service

echo "✅ Deployment complete!"
echo "🌐 Your application should be running on http://$(curl -s ifconfig.me):3000"
echo "📊 Check status with: sudo systemctl status attendance-tracker"
echo "📝 View logs with: docker-compose logs -f"
