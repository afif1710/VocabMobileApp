# Vocabulary Arcade

A vocabulary flashcard learning app built with React Native / Expo (web mode) and a FastAPI + MongoDB backend.

## Project Structure

```
frontend/     - Expo React Native app (serves on port 5000)
backend/      - FastAPI + MongoDB backend (optional)
tests/        - Python test files
```

## Frontend

- **Framework**: React Native with Expo (web-enabled via Metro bundler)
- **Navigation**: expo-router with file-based routing
- **State**: Zustand store
- **Database**: expo-sqlite (WebAssembly-based, runs in browser)
- **Port**: 5000

### Key Files
- `frontend/app/` - Screen files using expo-router
- `frontend/src/stores/appStore.ts` - Global state management
- `frontend/src/utils/database.ts` - SQLite database operations
- `frontend/src/data/seedData.ts` - Vocabulary seed data

### Running Frontend
```bash
cd frontend && npm run web
```

## Backend (Optional)

- **Framework**: FastAPI
- **Database**: MongoDB (requires `MONGO_URL` and `DB_NAME` env vars)
- **Port**: 8000 (or configured separately)

### Running Backend
```bash
cd backend && uvicorn server:app --host localhost --port 8000
```

Requires a `.env` file in `backend/` with:
```
MONGO_URL=mongodb://...
DB_NAME=your_db_name
```

## Development Notes

- The app is primarily a frontend-only app - all vocabulary data is stored locally in SQLite
- The backend provides status check endpoints but is not required for core functionality
- The CorsMiddleware in Expo CLI has been patched to allow all hosts (required for Replit's proxy)
- SQL queries use parameterized queries (not double-quoted string literals) for SQLite compatibility

## Workflows

- **Start application**: `cd frontend && npm run web` (port 5000, webview)
