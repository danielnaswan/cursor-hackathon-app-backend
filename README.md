# cursor-hackathon-app-backend
---

# 🚀 SmokeLess AI — Backend (Non-IoT Version)

AI-powered behavioral analytics system that helps users track and reduce smoking/vaping habits.
Users log vaping/smoking events manually, and the system generates **AI-driven usage analytics, craving predictions, and personalized habit-reduction coaching.**

---

# 📌 Project Overview

This is **Phase 1 (Backend-first)** of a 4-developer hackathon project.
The backend provides:

* Authentication + User Profiles
* Vape/Smoke Intake Logging API
* Analytics Engine (aggregation + trend modeling)
* AI Insights Generator
* AI Habit Coach Endpoint
* Event Prediction Engine (craving probability)
* Admin dashboard APIs (future-proof)

No IoT hardware is required in this phase.

---

# ⚙️ Tech Stack

**Runtime:** Node.js (LTS)
**Framework:** Express.js
**Database:** MongoDB + Mongoose
**AI Layer:**

* Lindy (coaching logic)
* Cursor (backend codegen)
* Apify (scraping motivational content / habit reduction knowledge)
* Coderabbit (PR automation)

---

# 📦 Backend Dependencies (Strict List — No Deviations)

These should be installed exactly as listed for agentic AI repeatability:

## Core

```
express
cors
dotenv
helmet
morgan
compression
```

## Database

```
mongoose
mongodb-memory-server   // for testing only
```

## Authentication

```
jsonwebtoken
bcryptjs
cookie-parser
express-rate-limit
```

## AI Layer

```
axios
zod         // schema validation for AI payloads
uuid
```

## Utilities

```
dayjs
lodash
winston     // logging
```

## Dev Tools

```
nodemon
eslint
prettier
jest
supertest
```

---

# 🏗️ Backend Architecture

```
/src
  /config
  /controllers
  /routes
  /models
  /services
     ai.service.js
     analytics.service.js
     prediction.service.js
  /middleware
  /utils
  /tests
```

---

# 📡 Core API Endpoints (Strict Contract)

## AUTH

POST `/auth/register`
POST `/auth/login`
POST `/auth/logout`

## USER

GET `/user/me`
PATCH `/user/update`

## INTAKE LOGGING

POST `/intake/log`
GET `/intake/user/:id`
DELETE `/intake/:logId`

**Payload (Manual Vaping Log):**

```json
{
  "puffs": 1,
  "intensity": "low|medium|high",
  "context": "stress|bored|habit|social|other",
  "notes": "optional"
}
```

## ANALYTICS

GET `/analytics/daily/:userId`
GET `/analytics/weekly/:userId`
GET `/analytics/monthly/:userId`

## AI COACH

POST `/ai/insights`
POST `/ai/coaching`

## AI PREDICTION

GET `/ai/predict-craving/:userId`

---

# 🎯 Tasks Split for 4 Developers (No Overlap)

---

# 👤 **Developer 1 — Backend Infrastructure + Auth Lead**

### Responsibilities

* Project initialization (`express`, folder structure, env setup)
* Implement JWT auth
* Rate limiting + CORS + Helmet + Logging
* User model + controllers
* `/auth/*` endpoints
* `/user/*` endpoints
* Global error handler
* Logging system (Winston)

### Deliverables

* `src/server.js`
* `src/config/` (db, env, logger)
* `src/routes/auth.routes.js`
* `src/controllers/auth.controller.js`

---

# 👤 **Developer 2 — Intake & Storage Lead (Core Data Flow)**

### Responsibilities

* Intake model + schema
* Intake CRUD endpoints
* Validate logs using Zod
* Ensure strict timestamp handling (DayJS)
* Query optimization + indexes
* Data cleanup utilities

### Deliverables

* `src/models/intake.model.js`
* `src/routes/intake.routes.js`
* `src/controllers/intake.controller.js`
* Zod schemas for validation

---

# 👤 **Developer 3 — Analytics & Prediction Engine Lead**

### Responsibilities

* Daily/weekly/monthly aggregation
* Usage heatmaps (hour-of-day calculation)
* Craving prediction engine

  * Based on intake frequency
  * Rolling average
  * Weighted context
* Trend modeling (last 7 days slope)
* Output JSON for frontend charts

### Deliverables

* `src/services/analytics.service.js`
* `src/services/prediction.service.js`
* `/analytics/*` routes

---

# 👤 **Developer 4 — AI Insights & Habit Coach Lead**

### Responsibilities

* AI prompt engineering
* Integrate Lindy / OpenAI API wrapper
* Generate insights:

  * “Most active hour”
  * “Stress correlation”
  * “Reduction opportunity”
* Generate coaching plan:

  * Daily habit target
  * Craving advice
  * Personalized action steps
* Integrate Apify scraper for motivation data

### Deliverables

* `src/services/ai.service.js`
* `/ai/insights`
* `/ai/coaching`

---

# 🚀 Run Instructions

```
npm install
npm run dev
```

Environment variables (strict):

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/smokeless
JWT_SECRET=supersecuresecret
AI_API_KEY=your_key_here
```

---

# 🧪 Tests (Required for All Teams)

Use Jest + Supertest:

* Auth test
* Intake logging test
* Analytics aggregation test
* AI service mock test

---

# 🗂️ Milestones (For Hackathon Execution)

### **Day 1:**

* Backend skeleton + Auth logic
* Intake endpoints complete

### **Day 2:**

* Analytics engine + Prediction
* AI prompt design

### **Day 3:**

* AI coaching + insights
* Final API testing + cleanup
* Deploy (Railway / Render)

---

# 📘 License

MIT

---
