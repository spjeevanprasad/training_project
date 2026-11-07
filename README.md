# TaskSprint PRO 🌧️ — Dim Rainy Window & Transparent Glass UI

TaskSprint PRO is a full-stack sprint task management application featuring a **Node.js + Express** REST API backend and a **React 18 + Vite** frontend. The UI delivers an atmospheric rainy day aesthetic with an interactive rain-on-glass physics canvas and glassmorphic controls.

---

## 📁 Project Architecture

The project is structured into modular `frontend` and `backend` directories:

```
training_project/
├── backend/                  # Node.js + Express REST API
│   ├── package.json          # Backend dependencies (express, cors)
│   ├── server.js             # Express API server with task management & analytics
│   └── tasks.json            # Persistent JSON file storage for tasks
│
├── frontend/                 # React + Vite Client Application
│   ├── public/
│   │   └── rain-window.jpg   # High-resolution rainy window background
│   ├── src/
│   │   ├── components/
│   │   │   └── AnimatedBackground.jsx  # HTML5 Canvas rain & glass ripple physics engine
│   │   ├── App.jsx           # Main TaskSprint dashboard & interaction logic
│   │   ├── index.css         # VisionOS / iOS 18 glassmorphic styling
│   │   └── main.jsx          # React DOM entrypoint
│   ├── index.html            # Vite HTML template
│   ├── vite.config.js        # Vite config with backend proxy (/api -> http://localhost:5000)
│   └── package.json          # Frontend dependencies (react, lucide-react, canvas-confetti, vite)
│
├── .gitignore                # Excludes node_modules, dist, and environment files from Git
├── package.json              # Root workspace convenience scripts
└── README.md                 # Complete documentation and setup guide
```

---

## ⚡ Quick Start

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

---

### Option 1: Run from Root Directory

From the project root folder (`training_project/`):

1. **Install all dependencies** (installs both backend & frontend):
   ```bash
   npm run install:all
   ```

2. **Start Backend Server** (Port `5000`):
   ```bash
   npm run start:backend
   ```
   *(Or for watch mode: `npm run dev:backend`)*

3. **Start Frontend Dev Server** (in a separate terminal, Port `3000`):
   ```bash
   npm run dev:frontend
   ```

4. Open your browser and navigate to:
   - **Frontend App**: [http://localhost:3000](http://localhost:3000)
   - **Backend API**: [http://localhost:5000/api/tasks](http://localhost:5000/api/tasks)

---

### Option 2: Run Frontend & Backend Independently

#### 1. Backend (`/backend`)
```bash
cd backend
npm install
npm start
```
> The Express server starts on `http://localhost:5000` and automatically persists task changes to `tasks.json`.

#### 2. Frontend (`/frontend`)
```bash
cd frontend
npm install
npm run dev
```
> The Vite dev server starts on `http://localhost:3000` and proxies all `/api/*` calls directly to `http://localhost:5000`.

To build the frontend for production:
```bash
cd frontend
npm run build
npm run preview
```

---

## 🌧️ Core Features & Capabilities

1. **Atmospheric Canvas Physics Engine**:
   - High-speed diagonal rain streaks cutting through the foggy skyline.
   - Glass impact ripples expanding when raindrops hit the pane.
   - Condensation beads with lens gleam and drop shadows.
   - Toggle rainfall animation on/off with the **"Rain / Dry"** header pill.

2. **Full-Featured Sprint Task Management**:
   - **Categories**: `College`, `Work`, `Personal`.
   - **Priorities**: `High`, `Medium`, `Low` with color-coded badges.
   - **Statuses**: `todo`, `in-progress`, `completed`.
   - **Subtasks**: Checkable subtask checklists with live completion progress.
   - **Tags & Due Dates**: Overdue detection, sorting, and tag filtering.
   - **Bulk Actions**: Batch delete, mark complete/incomplete, or assign priorities.
   - **Data Portability**: Full JSON export and import capabilities.
   - **Sound & Haptics**: Synthesized Web Audio chime and canvas confetti on completion.

---

## 🔌 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health status, uptime, and task count |
| `GET` | `/api/analytics` | Completion rates, overdue counts, and category breakdown |
| `GET` | `/api/tasks` | Get all tasks (supports `?category=`, `?priority=`, `?search=`, `?sort=`) |
| `POST` | `/api/tasks` | Create a new task (body: `title`, `description`, `category`, `priority`, etc.) |
| `PATCH` | `/api/tasks/:id` | Update status, toggle completion, or edit specific properties |
| `PUT` | `/api/tasks/:id` | Full update of an existing task |
| `DELETE` | `/api/tasks/:id` | Delete a single task |
| `DELETE` | `/api/tasks-bulk/completed` | Clear all completed tasks |
| `POST` | `/api/tasks/bulk` | Batch actions on multiple tasks (`action: 'delete' \| 'complete' \| 'incomplete' \| 'setPriority' \| 'setCategory'`) |
| `GET` | `/api/export` | Download all tasks as JSON file attachment |
| `POST` | `/api/import` | Import tasks from JSON payload |
| `POST` | `/api/reset` | Reset tasks to default demo dataset |

---

## 🚀 How to Push this Project to GitHub

### Why GitHub Web Upload Failed Previously
- **100-File Limit**: The GitHub website upload tool only accepts up to 100 files at a time and cannot handle nested folder hierarchies properly.
- **`node_modules` Bloat**: The `node_modules` folder contains thousands of small files and tens of megabytes that should never be pushed to GitHub.
- **Solution**: A `.gitignore` file has now been configured to automatically ignore `node_modules`, `dist`, and temporary cache files. You can now push the clean source code directly with standard Git commands.

### Push Commands

Run the following commands in your terminal at the root of `training_project`:

```bash
# 1. Stage the restructured folders and .gitignore
git add .

# 2. Commit the changes
git commit -m "Organize full-stack architecture into frontend, backend, and documentation"

# 3. Push to your GitHub repository
git push origin main
```

*(If you ever need to force update your branch or overwrite previous web uploads: `git push -u origin main --force`)*
