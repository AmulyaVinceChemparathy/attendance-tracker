# 🚀 AWS EC2 Free Tier Deployment Guide

## 📋 Prerequisites
- AWS Account (Free tier eligible)
- Your code pushed to GitHub
- Basic knowledge of SSH

## 🎯 Step 1: Launch EC2 Instance

### 1.1 Go to AWS Console
1. Login to [AWS Console](https://console.aws.amazon.com)
2. Navigate to **EC2** → **Instances** → **Launch Instance**

### 1.2 Configure Instance
- **Name**: `attendance-tracker`
- **AMI**: Ubuntu Server 22.04 LTS (Free tier eligible)
- **Instance Type**: `t2.micro` (Free tier)
- **Key Pair**: Create new or use existing
- **Storage**: 20GB (Free tier: 30GB)

### 1.3 Configure Security Group
**IMPORTANT**: Add these rules to your security group:

| Type | Protocol | Port | Source | Description |
|------|----------|------|--------|-------------|
| SSH | TCP | 22 | My IP | SSH access |
| HTTP | TCP | 80 | 0.0.0.0/0 | Web traffic |
| HTTPS | TCP | 443 | 0.0.0.0/0 | SSL traffic |
| Custom TCP | TCP | 3000 | 0.0.0.0/0 | **Your app port** |

### 1.4 Launch Instance
- Click **Launch Instance**
- Wait for instance to be **Running**
- Note down the **Public IP address**

## 🔑 Step 2: Connect to Your Instance

```bash
# Replace with your key file and instance IP
ssh -i your-key.pem ubuntu@YOUR_EC2_IP
```

## 🚀 Step 3: Deploy Your Application

### Option A: Automated Deployment (Recommended)
```bash
# Download and run the deployment script
curl -o deploy-ec2.sh https://raw.githubusercontent.com/YOUR_USERNAME/attendance-tracker/main/deploy-ec2.sh
chmod +x deploy-ec2.sh
./deploy-ec2.sh
```

### Option B: Manual Deployment
```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
rm get-docker.sh

# 3. Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 4. Clone your repository
git clone https://github.com/YOUR_USERNAME/attendance-tracker.git
cd attendance-tracker

# 5. Create environment file
cat > .env << EOF
NODE_ENV=production
PORT=3000
JWT_SECRET=$(openssl rand -base64 32)
EOF

# 6. Start the application
docker-compose up -d --build
```

## ✅ Step 4: Verify Deployment

### Check Application Status
```bash
# Check if containers are running
docker-compose ps

# View application logs
docker-compose logs -f

# Test health endpoint
curl http://localhost:3000/health
```

### Access Your Application
- **Application URL**: `http://YOUR_EC2_IP:3000`
- **Health Check**: `http://YOUR_EC2_IP:3000/health`

## 🔧 Management Commands

```bash
# View logs
docker-compose logs -f

# Restart application
docker-compose restart

# Stop application
docker-compose down

# Update application
git pull
docker-compose up -d --build

# Check system resources
df -h
free -h
```

## 💰 Cost Information

### Free Tier (First 12 months)
- **EC2**: 750 hours/month of t2.micro
- **Storage**: 30GB EBS
- **Data Transfer**: 1GB/month
- **Total Cost**: $0/month

### After Free Tier
- **t2.micro**: ~$8.50/month
- **Storage**: ~$2/month
- **Total**: ~$10-15/month

## 🛡️ Security Features

- ✅ SSH access restricted to your IP
- ✅ Strong JWT secret generation
- ✅ Container isolation
- ✅ Automatic restarts on failure
- ✅ Data persistence with volumes

## 🚨 Troubleshooting

### Application Won't Start
```bash
# Check logs
docker-compose logs

# Check if port 3000 is open
sudo netstat -tlnp | grep 3000

# Restart Docker
sudo systemctl restart docker
```

### Can't Access from Browser
1. Check security group has port 3000 open
2. Verify EC2 instance is running
3. Check application logs for errors

### Out of Memory
```bash
# Check memory usage
free -h

# If needed, upgrade to t3.small (not free tier)
```

## 📞 Support

If you encounter issues:
1. Check the logs: `docker-compose logs -f`
2. Verify security group settings
3. Ensure your GitHub repository is public
4. Check AWS EC2 instance status

## 🎉 You're Done!

Your attendance tracker is now running on AWS EC2 free tier!

**Access your app**: `http://YOUR_EC2_IP:3000`