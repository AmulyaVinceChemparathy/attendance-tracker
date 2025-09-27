# 🚀 Deploy Client-Server Application

This deploys the main attendance tracker application (client + server).

## 📁 **Project Structure**
```
attendance-tracker/
├── client/          ← React frontend
├── server/          ← Node.js backend
├── Dockerfile       ← Multi-stage build
├── docker-compose.yml
├── railway.json     ← Railway config
└── render.yaml      ← Render config
```

## 🚀 **Deploy to Railway**

### **Step 1: Push to GitHub**
```bash
git add .
git commit -m "Ready for deployment"
git push
```

### **Step 2: Deploy on Railway**
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Set environment variables:
   - `JWT_SECRET` = `your-secret-key-here`
   - `NODE_ENV` = `production`

## 🚀 **Deploy to Render**

### **Step 1: Same GitHub push**

### **Step 2: Deploy on Render**
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Connect your repository
5. Set environment variables:
   - `JWT_SECRET` = `your-secret-key-here`
   - `NODE_ENV` = `production`

## 🐳 **Local Testing**

```bash
# Build and run locally
docker build -t attendance-tracker .
docker run -p 3000:3000 -e JWT_SECRET=test-secret attendance-tracker

# Or use docker-compose
docker-compose up --build
```

Visit: http://localhost:3000

## ✅ **What This Deploys**

- ✅ **React Frontend** (client folder)
- ✅ **Node.js Backend** (server folder)
- ✅ **SQLite Database** (persistent data)
- ✅ **Authentication** (JWT tokens)
- ✅ **All Features** (Timetable, Attendance, etc.)

## 🎯 **Expected Result**

Your full attendance tracker application will be live with:
- Frontend and backend working together
- Database persistence
- All features functional
- Free hosting! 🎉
