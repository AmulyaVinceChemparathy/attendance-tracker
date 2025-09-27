# 🚀 Free Docker Deployment Guide

## Option 1: Railway (Recommended - Easiest)

### Step 1: Prepare Your Code
```bash
cd netlify
git init
git add .
git commit -m "Initial commit"
```

### Step 2: Push to GitHub
1. Create a new repository on GitHub
2. Push your code:
```bash
git remote add origin https://github.com/yourusername/attendance-tracker.git
git push -u origin main
```

### Step 3: Deploy on Railway
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your repository
6. Railway will automatically detect the Dockerfile and deploy!

### Step 4: Set Environment Variables
1. In Railway dashboard, go to your project
2. Click on "Variables" tab
3. Add: `JWT_SECRET` = `your-secret-key-here`
4. Your app will redeploy automatically

### Step 5: Get Your URL
- Railway will give you a URL like: `https://attendance-tracker-production.up.railway.app`
- Your app is live! 🎉

---

## Option 2: Render (Alternative)

### Step 1: Prepare Your Code
```bash
cd netlify
git init
git add .
git commit -m "Initial commit"
```

### Step 2: Push to GitHub
1. Create a new repository on GitHub
2. Push your code:
```bash
git remote add origin https://github.com/yourusername/attendance-tracker.git
git push -u origin main
```

### Step 3: Deploy on Render
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Render will auto-detect the Dockerfile
6. Set environment variables:
   - `NODE_ENV` = `production`
   - `JWT_SECRET` = `your-secret-key-here`
7. Click "Create Web Service"

### Step 4: Get Your URL
- Render will give you a URL like: `https://attendance-tracker.onrender.com`
- Your app is live! 🎉

---

## 🐳 Local Testing

### Test with Docker
```bash
cd netlify
docker build -t attendance-tracker .
docker run -p 3000:3000 -e JWT_SECRET=test-secret attendance-tracker
```

### Test with Docker Compose
```bash
cd netlify
docker-compose up --build
```

Visit: http://localhost:3000

---

## 🔧 Environment Variables

Set these in your deployment platform:

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Environment mode |
| `JWT_SECRET` | `your-secret-key` | JWT signing secret |

---

## 📊 Free Tier Limits

### Railway
- ✅ $5 credit monthly (enough for small apps)
- ✅ 512MB RAM
- ✅ 1GB storage
- ✅ Custom domains
- ✅ Automatic deployments

### Render
- ✅ 750 hours/month
- ✅ 512MB RAM
- ✅ Free PostgreSQL database
- ✅ Custom domains
- ✅ Automatic deployments

---

## 🚨 Troubleshooting

### Build Fails
1. Check Dockerfile syntax
2. Ensure all files are committed
3. Check platform logs

### App Won't Start
1. Verify environment variables
2. Check port configuration (should be 3000)
3. Review startup logs

### Database Issues
- Railway: Built-in PostgreSQL
- Render: Add PostgreSQL service
- Both: Connection strings auto-provided

---

## 🎯 Quick Start (Railway)

1. **Fork this repo** or create your own
2. **Push to GitHub**
3. **Connect to Railway**
4. **Set JWT_SECRET**
5. **Deploy!**

Your app will be live in under 5 minutes! 🚀
