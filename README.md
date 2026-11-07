# TaskSprint // QUANTUM HUD ⚡ — Futuristic Cyber-Velocity Task Command

TaskSprint is a high-velocity full-stack sprint task management application featuring a **Node.js + Express** REST API backend and a **React 18 + Vite** frontend. Built with an ultra-sleek, professional sci-fi HUD aesthetic, an interactive **Quantum Neural Grid physics canvas**, tactile sound synthesis, and real-time sprint velocity analytics.

---

## 🌌 Futuristic Features & Cyber Aesthetics

1. **Interactive Quantum Physics Engine (`AnimatedBackground.jsx`)**:
   - **Quantum Particle Nodes**: Floating luminous energy particles that dynamically drift, pulse, and interact.
   - **Neural Laser Filaments**: Proximity-based dynamic laser filaments with gradient neon coloring connecting nodes in real time.
   - **Mouse Gravitational Warp**: The cursor generates a local holographic gravity field that pulls and connects nearby nodes with energetic electric arcs.
   - **Kinetic Quantum Shockwaves**: Clicking anywhere generates resonant holographic shockwaves that physically disperse surrounding particles.
   - **Perspective Cyber Grid & Radar Scanner**: Smooth downward radar laser beam and a 3D perspective cyber grid along the horizon.
   - **Multi-Mode Selector**: Cycle between **Quantum Grid ⚡**, **Hyperspace Warp 🚀**, and **FX Off ⏸️** right from the header.

2. **Professional Aerospace Cyber-HUD UI**:
   - **Typography**: Google Fonts pairing of **Orbitron**, **Space Grotesk**, and **JetBrains Mono** for crisp telemetry and high-tech typography.
   - **Holographic Glassmorphism**: Translucent obsidian surfaces with tactical corner brackets, glowing neon laser borders, and animated border sweeps.
   - **Pulsing Telemetry Badges**: Live sprint velocity radar beacons, tactical priority hazard badges (`High`, `Medium`, `Low`), and category chips (`College`, `Work`, `Personal`).
   - **Tactile Audio Feedback**: Synthesized Web Audio API harmonics with dual-oscillator resonant cyber-chime on task completions.
   - **Neon Confetti**: Particle explosions on sprint completion with cyber cyan, magenta, aqua, and electric violet colorways.

---

## 📁 Project Architecture

The workspace is organized into modular `frontend` and `backend` packages:

```
training_project/
├── backend/                       # Node.js + Express REST API
│   ├── package.json               # Backend dependencies (express, cors)
│   ├── server.js                  # Express API server & telemetry endpoints
│   └── tasks.json                 # Persistent JSON data store
│
├── frontend/                      # React 18 + Vite Client Application
│   ├── src/
│   │   ├── components/
│   │   │   └── AnimatedBackground.jsx  # Quantum particle & laser physics canvas
│   │   ├── App.jsx                # Main HUD dashboard & task management
│   │   ├── index.css              # Cyber-HUD & Quantum Glass design system
│   │   └── main.jsx               # React DOM entry point
│   ├── index.html                 # Vite HTML template with Orbitron/Space Grotesk
│   ├── vite.config.js             # Vite proxy (/api -> http://localhost:5000)
│   └── package.json               # Frontend dependencies (react, lucide-react, etc.)
│
├── .gitignore                     # Excludes node_modules, dist, and environment files
├── package.json                   # Root workspace scripts to run both apps
└── README.md                      # Documentation & instructions
```

---

## ⚡ Execution Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

---

### Option 1: Run from Root Directory

From `training_project/`:

1. **Install dependencies** (if not already installed):
   ```bash
   npm run install:all
   ```

2. **Launch Backend Server** (Port `5000`):
   ```bash
   npm run start:backend
   ```
   *(Or with auto-restart: `npm run dev:backend`)*

3. **Launch Frontend Dev Server** (in a second terminal, Port `3000`):
   ```bash
   npm run dev:frontend
   ```

4. Open in browser:
   - **HUD App**: [http://localhost:3000](http://localhost:3000)
   - **Backend API**: [http://localhost:5000/api/tasks](http://localhost:5000/api/tasks)

---

### Option 2: Run Separately

#### Backend (`/backend`)
```bash
cd backend
npm install
npm start
```

#### Frontend (`/frontend`)
```bash
cd frontend
npm install
npm run dev
```

---

## 🔌 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | System health check, uptime, and task count |
| `GET` | `/api/analytics` | Completion rates, overdue counts, and category statistics |
| `GET` | `/api/tasks` | Retrieve all tasks (supports `?category=`, `?priority=`, `?search=`, `?sort=`) |
| `POST` | `/api/tasks` | Create a new task (body: `title`, `description`, `category`, `priority`, etc.) |
| `PATCH` | `/api/tasks/:id` | Update status, toggle completion, or edit fields |
| `PUT` | `/api/tasks/:id` | Full update of existing task |
| `DELETE` | `/api/tasks/:id` | Remove a single task |
| `DELETE` | `/api/tasks-bulk/completed` | Clear all completed tasks |
| `POST` | `/api/tasks/bulk` | Batch action on tasks (`action: 'delete' \| 'complete' \| 'incomplete' \| ...`) |
| `GET` | `/api/export` | Download tasks as JSON file attachment |
| `POST` | `/api/import` | Import tasks from JSON payload |
| `POST` | `/api/reset` | Reset tasks to default sample dataset |

---

## 🚀 Pushing to GitHub

To push all changes to your repository:

```bash
git add .
git commit -m "Elevate theme to professional futuristic cyber-HUD with interactive quantum canvas"
git push origin main
```
