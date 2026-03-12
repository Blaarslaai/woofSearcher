# React + TypeScript + Vite

## Environment Setup (Testing)

### 1. Prerequisites

- Node.js `>= 18` (Node 20+ recommended)
- npm `>= 9`

Check versions:

```bash
node -v
npm -v
```

### 2. Install dependencies

From the project root:

```bash
npm install
```

### 3. Start the app for testing

- Frontend only: `npm run dev`
- Backend only: `npm run dev:server`
- Frontend + backend together: `npm run dev:full`

#### JEST Tests

- Tests only: `npm run test`

Default dev URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`

Vite proxies `/api/*` to `http://localhost:3001` during development.

### 4. Build validation

Run this before/after changes:

```bash
npm run build
```

### 5. Manual test flow

1. Open `http://localhost:5173`.
2. Log in with test credentials:
  - username: emilys
  - password: emilyspass
3. On Dashboard, select a breed and click the heart icon to save a favourite.
4. Go to Favorites and confirm the saved breed/image appears.
5. Reload the page and confirm favourites still exist (backend file persistence).
