# 🚭 kurange-sap — Backend API

AI-powered behavioral analytics system that helps users track and reduce smoking/vaping habits. Users log vaping/smoking events manually, and the system generates **AI-driven usage analytics, craving predictions, and personalized habit-reduction coaching.**

![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![Express](https://img.shields.io/badge/Express-4.x-lightgrey)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## ✨ Features

- 🔐 JWT Authentication
- 📝 Intake Logging with Gamification
- 📊 Analytics Engine (Daily/Weekly/Monthly)
- 🤖 AI Insights & Coaching
- 🔮 Craving Prediction
- 🎮 Gamification (Streaks, XP, Achievements)
- 💊 Health Tracking & Money Saved Calculator

---

## 📋 Prerequisites

- **Node.js** 18.0 or higher
- **MongoDB Atlas** account (or local MongoDB)
- **Git**
- **npm** (comes with Node.js)

---

## 🚀 Installation

### Step 1: Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/cursor-hackathon-app-backend.git
cd cursor-hackathon-app-backend
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Environment Setup

Create a `.env` file in the root directory:

```bash
touch .env
```

> ⚠️ **Note:** The `.env` file contains sensitive API keys and is **not included** in this repository.
> 
> **To get the environment variables, please contact:**
> - 📧 Email: [YOUR_EMAIL]
> - 💬 Discord: [YOUR_DISCORD]

### Step 4: Run Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

### Step 5: Verify Installation

Visit `http://localhost:5000/health` in your browser. You should see:

```json
{
  "status": "ok",
  "timestamp": "2025-12-06T00:00:00.000Z"
}
```

---

## 🔑 Environment Variables

Required environment variables (contact maintainer for `.env` file):

- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `AI_API_KEY` - OpenAI or Claude API key (optional)
- `PORT` - Server port (default: 5000)
- `CORS_ORIGIN` - Allowed CORS origin

---

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### User
- `GET /api/user/me` - Get current user profile
- `PATCH /api/user/update` - Update user profile

### Intake Logging
- `POST /api/intake/log` - Log intake event
- `GET /api/intake/user/:id` - Get user intakes
- `DELETE /api/intake/:logId` - Delete intake log

### Analytics
- `GET /api/analytics/daily/:userId` - Daily statistics
- `GET /api/analytics/weekly/:userId` - Weekly statistics
- `GET /api/analytics/monthly/:userId` - Monthly statistics

### AI Features
- `POST /api/ai/insights` - Generate AI insights
- `POST /api/ai/coaching` - Get AI coaching plan
- `GET /api/ai/predict-craving/:userId` - Predict craving probability

### Gamification
- `GET /api/gamification/stats` - Get gamification stats
- `GET /api/gamification/achievements` - Get achievements
- `GET /api/gamification/leaderboard` - Get leaderboard
- `POST /api/gamification/set-baseline` - Set reduction baseline
- `GET /api/gamification/reduction` - Get reduction progress

### Health Tracking
- `GET /api/health/milestones` - Get health milestones (public)
- `GET /api/health/dashboard` - Get health dashboard
- `POST /api/health/quit-date` - Set quit date
- `POST /api/health/cost-settings` - Set cost settings
- `GET /api/health/money-saved` - Get money saved
- `GET /api/health/progress` - Get health progress

---

## 🧪 API Tester

Interactive API tester available at:
```
http://localhost:5000/api-tester.html
```

---

## 📜 Available Scripts

```bash
npm run dev      # Start development server
npm start        # Start production server
npm test         # Run tests
npm run lint     # Run ESLint
```

---

## 📧 Contact

For environment variables (`.env` file), please contact:
- **Email:** [YOUR_EMAIL]
- **Discord:** [YOUR_DISCORD]

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Made with 💚 by SmokeLess AI Team**
