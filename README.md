# Week 6 Smuggler

A full-stack React Native app with Express backend for managing smuggled items.

## Project Structure

```
week6-smuggler/
├── frontend/          # React Native/Expo app
│   ├── app/          # Expo Router pages
│   ├── components/   # React components
│   ├── assets/       # Images, fonts, etc.
│   └── package.json  # Frontend dependencies
├── backend/          # Express.js API server
│   ├── server.js     # Main server file
│   └── package.json  # Backend dependencies
└── package.json      # Root scripts
```

## Quick Start

### Install All Dependencies
```bash
npm run install:all
```

### Run Both Frontend and Backend
```bash
npm run dev
```

This will start:
- Backend server on http://localhost:3000
- Frontend Expo development server

### Run Separately

**Backend only:**
```bash
npm run dev:backend
```

**Frontend only:**
```bash
npm run dev:frontend
```

## Backend API

The Express server provides these endpoints:

- `GET /` - API status
- `GET /api/health` - Health check
- `GET /api/items` - Get smuggled items

## Frontend

The React Native app uses Expo Router for navigation and can connect to the backend API.

## Development

- **Backend**: Node.js with Express, CORS enabled
- **Frontend**: React Native with Expo Router
- **Communication**: HTTP/HTTPS requests between frontend and backend

## Environment Variables

Create `.env` files in both `frontend/` and `backend/` directories as needed.

## Scripts

- `npm run dev` - Run both frontend and backend in development mode
- `npm run install:all` - Install dependencies for all parts of the project
- `npm run dev:backend` - Run only the backend server
- `npm run dev:frontend` - Run only the frontend app
