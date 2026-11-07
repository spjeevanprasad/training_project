# TaskSprint — Modern Sprint Task Management

TaskSprint is a modern, full-stack sprint task management application inspired by the clean, focused design language of **Linear**, **Vercel**, and **Raycast**. Built with a **Node.js + Express** REST API backend and a **React 18 + Vite** frontend.

---

## ✨ Features & Design Highlights

1. **Refined SaaS Design System**:
   - **Clean Typography**: Powered by **Inter**, **Plus Jakarta Sans**, and **JetBrains Mono** for clear hierarchy, natural casing, and readable metrics.
   - **Modern Dark/Light Themes**: Deep obsidian dark mode (`#090a0f`) and crisp daylight theme with subtle frosted glass surfaces and 1px precision borders.
   - **Intuitive Status & Priority Indicators**: Color-coded badges for categories (`Work`, `College`, `Personal`) and dot priority pills (`High`, `Medium`, `Low`).
   - **Interactive Ambient Flow Canvas**: A subtle, organic particle mesh that gently interacts with cursor proximity and click ripples without distracting from your tasks.

2. **Sprint Management Capabilities**:
   - **Dual Views**: Toggle between **List View** with subtask checklists and **Kanban Board** with drag/move stage transitions (`To Do`, `In Progress`, `Done`).
   - **Real-Time Sprint Progress**: Live velocity progress bar, completion percentage, overdue counters, and active tickets.
   - **Keyboard Shortcuts**: Focus search (`/` or `Ctrl+K`), quick add (`N`), view switching (`1` / `2`), and modal dismiss (`Esc`).
   - **Bulk Actions**: Batch complete, delete, or re-prioritize multiple tasks with a floating action bar.
   - **Data Portability**: Full JSON export and import for task backup and migration.
   - **Acoustic Feedback**: Subtle notification chime and celebratory confetti upon completing sprint tickets.

---

## 📁 Project Architecture

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
│   │   │   └── AnimatedBackground.jsx  # Interactive ambient mesh canvas
│   │   ├── App.jsx                # Main workspace dashboard & interaction logic
│   │   ├── index.css              # Professional SaaS design system (Linear / Vercel style)
│   │   └── main.jsx               # React DOM entry point
│   ├── index.html                 # Vite HTML template
│   ├── vite.config.js             # Vite proxy (/api -> http://localhost:5000)
│   └── package.json               # Frontend dependencies (react, lucide-react, etc.)
│
├── .gitignore                     # Excludes node_modules, dist, and environment files
├── package.json                   # Root workspace scripts to run both apps
└── README.md                      # Documentation & instructions
```

---

## ⚡ Quick Start

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

---

### Option 1: Run from Root Directory

From `training_project/`:

1. **Install dependencies**:
   ```bash
   npm run install:all
   ```

2. **Start Backend Server** (Port `5000`):
   ```bash
   npm run start:backend
   ```

3. **Start Frontend Dev Server** (in a second terminal, Port `3000`):
   ```bash
   npm run dev:frontend
   ```

4. Open in your browser:
   - **Frontend App**: [http://localhost:3000](http://localhost:3000)
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
| `GET` | `/api/health` | Service health status, uptime, and task count |
| `GET` | `/api/analytics` | Completion rates, overdue counts, and category breakdown |
| `GET` | `/api/tasks` | Get all tasks (supports `?category=`, `?priority=`, `?search=`, `?sort=`) |
| `POST` | `/api/tasks` | Create a new task (body: `title`, `description`, `category`, `priority`, etc.) |
| `PATCH` | `/api/tasks/:id` | Update status, toggle completion, or edit specific properties |
| `PUT` | `/api/tasks/:id` | Full update of an existing task |
| `DELETE` | `/api/tasks/:id` | Delete a single task |
| `DELETE` | `/api/tasks-bulk/completed` | Clear all completed tasks |
| `POST` | `/api/tasks/bulk` | Batch action on tasks (`delete`, `complete`, `incomplete`, etc.) |
| `GET` | `/api/export` | Download tasks as JSON file attachment |
| `POST` | `/api/import` | Import tasks from JSON payload |
| `POST` | `/api/reset` | Reset tasks to default demo dataset |

---

## 🚀 Pushing to GitHub

To push your project to GitHub:

```bash
git add .
git commit -m "Refine design into clean, professional SaaS interface (Linear/Vercel style)"
git push origin main
```
