# FitNex – AI-Powered Fitness & Diet Tracker

A full-stack fitness tracking app with AI-powered diet analysis, workout logging, progress analytics, and Google Sign-In.

## Tech Stack
- **Frontend**: React 18, Vite, Recharts, React Router
- **Backend**: Node.js, Express, Mongoose
- **Database**: MongoDB Atlas
- **Auth**: Firebase (Google Sign-In) + JWT
- **AI**: Google Gemini 1.5 Flash API

## Project Structure
```
fitness-tracker/
├── server/                    # Express API
│   ├── index.js               # Entry point
│   ├── .env                   # Environment variables
│   ├── package.json
│   ├── middleware/
│   │   └── auth.js            # JWT verification
│   ├── models/
│   │   ├── User.js            # User profile & targets
│   │   ├── Workout.js         # Exercises & sets
│   │   ├── FoodLog.js         # AI-analyzed meals
│   │   └── BodyWeight.js      # Weight tracking
│   ├── routes/
│   │   ├── auth.js            # Google Sign-In → JWT
│   │   ├── profile.js         # BMR, TDEE, macros
│   │   ├── workouts.js        # CRUD + PR detection
│   │   ├── diet.js            # AI food parsing + log
│   │   └── progress.js        # Aggregated analytics
│   └── services/
│       └── gemini.js          # Gemini API integration
│
├── client/                    # React (Vite)
│   ├── index.html
│   ├── .env
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── main.jsx
│       ├── App.jsx            # Router + auth guards
│       ├── index.css          # Design system
│       ├── api.js             # Axios + JWT interceptor
│       ├── firebase.js        # Firebase config
│       ├── context/
│       │   └── AuthContext.jsx # Auth state management
│       ├── components/
│       │   ├── Layout.jsx     # Sidebar + bottom nav
│       │   └── Layout.css
│       └── pages/
│           ├── Login.jsx / .css
│           ├── Onboarding.jsx / .css
│           ├── Dashboard.jsx / .css
│           ├── Workout.jsx / .css
│           ├── Diet.jsx / .css
│           ├── Progress.jsx / .css
│           └── Settings.jsx / .css
│
├── render.yaml                # Render deployment config
├── vercel.json                # Vercel deployment config
└── README.md
```

## Local Development

### 1. Start the backend
```bash
cd server
npm install
node index.js
# → Server runs on http://localhost:5000
```

### 2. Start the frontend
```bash
cd client
npm install
npm run dev
# → App runs on http://localhost:5173
```

## Deployment

### Backend → Render.com (Free)
1. Push to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your repo, set root directory to `server`
4. Build: `npm install` | Start: `node index.js`
5. Add all env vars from `server/.env` in Render dashboard
6. Update `CLIENT_URL` to your Vercel frontend URL

### Frontend → Vercel (Free)
1. Go to [vercel.com](https://vercel.com) → Import Project
2. Set root directory to `client`, framework to Vite
3. Add env vars:
   - `VITE_API_URL` = your Render backend URL
   - All `VITE_FIREBASE_*` vars from `client/.env`
