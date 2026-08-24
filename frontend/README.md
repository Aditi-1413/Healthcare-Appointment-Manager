# MedTime Plus — Frontend

React + Vite client for **MedTime Plus**, an AI-powered healthcare appointment platform. See the [project README](../README.md) for the full feature list, architecture, and API documentation.

## Tech Stack

- React 18
- Vite
- React Router
- JavaScript / CSS

## Getting Started

### Prerequisites

- Node.js 18+
- The backend API running (see the [server README](../server/README.md) or root [README](../README.md))

### Install

```bash
npm install
```

### Configure environment variables

Create a `.env` file in this directory:

```env
VITE_API_URL=http://localhost:5000/api
```

### Run the dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for production

```bash
npm run build       # outputs to dist/
npm run preview     # preview the production build locally
```

## Project Structure

```
src/
├── components/     Shared UI components
├── pages/          Route pages, organized by role: patient/, doctor/, admin/
├── context/        AuthContext (JWT session)
├── services/       API request wrappers
├── App.jsx         Root component and route definitions
└── main.jsx        Entry point
```

## Linting

This project uses ESLint. Run:

```bash
npm run lint
```

For type-aware lint rules in a production setting, consider migrating to the [TypeScript template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) and adding [`typescript-eslint`](https://typescript-eslint.io).
