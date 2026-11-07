import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'tasks.json');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Helper to get formatted date string in future/past
const now = Date.now();
const oneDayMs = 24 * 60 * 60 * 1000;
const todayStr = new Date().toISOString().split('T')[0];
const tomorrowStr = new Date(now + oneDayMs).toISOString().split('T')[0];
const overdueStr = new Date(now - 2 * oneDayMs).toISOString().split('T')[0];

// Initial seed tasks rich in advanced attributes
const defaultTasks = [
  {
    id: 1730870400000,
    title: 'Finalize Operating Systems architecture report',
    description: 'Document virtual memory management, page replacement algorithms, and benchmark scheduling results.',
    category: 'College',
    priority: 'High',
    completed: false,
    dueDate: tomorrowStr,
    tags: ['Academics', 'OS', 'Research'],
    subtasks: [
      { id: 'st-1', text: 'Draft introduction & scope', completed: true },
      { id: 'st-2', text: 'Benchmark round-robin vs priority scheduler', completed: false },
      { id: 'st-3', text: 'Generate performance graphs', completed: false }
    ],
    status: 'in-progress',
    createdAt: now - 3600000 * 5,
    updatedAt: now - 3600000 * 2
  },
  {
    id: 1730866800000,
    title: 'Review team pull requests and merge sprint tickets',
    description: 'Review code reviews for auth refactor and verify unit test passes on CI/CD pipeline.',
    category: 'Work',
    priority: 'Medium',
    completed: true,
    dueDate: todayStr,
    tags: ['DevOps', 'CodeReview'],
    subtasks: [
      { id: 'st-4', text: 'Inspect test coverage diff', completed: true },
      { id: 'st-5', text: 'Approve & trigger staging deploy', completed: true }
    ],
    status: 'completed',
    createdAt: now - 3600000 * 12,
    updatedAt: now - 3600000 * 4
  },
  {
    id: 1730863200000,
    title: 'Prepare meal plans and grocery shopping for the week',
    description: 'Buy organic greens, almond milk, oats, chicken breasts, and spices.',
    category: 'Personal',
    priority: 'Low',
    completed: false,
    dueDate: overdueStr,
    tags: ['Health', 'Errands'],
    subtasks: [
      { id: 'st-6', text: 'Check pantry inventory', completed: true },
      { id: 'st-7', text: 'Order groceries on delivery app', completed: false }
    ],
    status: 'todo',
    createdAt: now - 3600000 * 24,
    updatedAt: now - 3600000 * 24
  },
  {
    id: 1730860000000,
    title: 'Design UI mockups for customer onboarding flow',
    description: 'Create interactive Figma wireframes and run accessibility contrast checks on light & dark mode tokens.',
    category: 'Work',
    priority: 'High',
    completed: false,
    dueDate: todayStr,
    tags: ['Design', 'Figma', 'UX'],
    subtasks: [
      { id: 'st-8', text: 'Audit competitor checkout steps', completed: true },
      { id: 'st-9', text: 'Create high-fidelity mobile frames', completed: false },
      { id: 'st-10', text: 'Export assets to developer handbook', completed: false }
    ],
    status: 'in-progress',
    createdAt: now - 3600000 * 30,
    updatedAt: now - 3600000 * 10
  }
];

// Helper to load tasks from local storage / file
function loadTasks() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure each task conforms to full schema
        return parsed.map((t) => ({
          id: t.id || Date.now() + Math.random(),
          title: t.title || 'Untitled Task',
          description: t.description || '',
          category: t.category || 'Personal',
          priority: t.priority || 'Medium',
          completed: Boolean(t.completed),
          dueDate: t.dueDate || null,
          tags: Array.isArray(t.tags) ? t.tags : [],
          subtasks: Array.isArray(t.subtasks) ? t.subtasks : [],
          status: t.status || (t.completed ? 'completed' : 'todo'),
          createdAt: t.createdAt || Date.now(),
          updatedAt: t.updatedAt || Date.now()
        }));
      }
    }
  } catch (err) {
    console.warn('Could not read tasks.json, falling back to defaults:', err.message);
  }
  return [...defaultTasks];
}

// Helper to save tasks to local file
function saveTasks(tasksToSave) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(tasksToSave, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving tasks to disk:', err.message);
  }
}

// In-memory store initialized from disk
let tasks = loadTasks();

// --- REST ENDPOINTS ---

// Health & Status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    tasksCount: tasks.length,
    uptime: process.uptime(),
    timestamp: Date.now()
  });
});

// Analytics & Insights Endpoint
app.get('/api/analytics', (req, res) => {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const pending = total - completed;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const nowTime = new Date().setHours(0, 0, 0, 0);
  const overdueCount = tasks.filter((t) => {
    if (t.completed || !t.dueDate) return false;
    const dueTime = new Date(t.dueDate).setHours(0, 0, 0, 0);
    return dueTime < nowTime;
  }).length;

  const categoryBreakdown = {
    College: tasks.filter((t) => t.category === 'College').length,
    Work: tasks.filter((t) => t.category === 'Work').length,
    Personal: tasks.filter((t) => t.category === 'Personal').length
  };

  const priorityBreakdown = {
    High: tasks.filter((t) => t.priority === 'High').length,
    Medium: tasks.filter((t) => t.priority === 'Medium').length,
    Low: tasks.filter((t) => t.priority === 'Low').length
  };

  const statusBreakdown = {
    todo: tasks.filter((t) => !t.completed && t.status !== 'in-progress').length,
    inProgress: tasks.filter((t) => !t.completed && t.status === 'in-progress').length,
    completed
  };

  // Subtask statistics
  let totalSubtasks = 0;
  let completedSubtasks = 0;
  tasks.forEach((t) => {
    if (Array.isArray(t.subtasks)) {
      totalSubtasks += t.subtasks.length;
      completedSubtasks += t.subtasks.filter((st) => st.completed).length;
    }
  });

  res.json({
    total,
    completed,
    pending,
    completionRate,
    overdueCount,
    categoryBreakdown,
    priorityBreakdown,
    statusBreakdown,
    subtasks: {
      total: totalSubtasks,
      completed: completedSubtasks,
      rate: totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0
    }
  });
});

// GET /api/tasks: Returns all tasks, supporting optional query filters & sorting
app.get('/api/tasks', (req, res) => {
  let result = [...tasks];
  const { category, priority, status, search, sort } = req.query;

  // Filter by category
  if (category && category !== 'all') {
    result = result.filter((t) => t.category.toLowerCase() === category.toLowerCase());
  }

  // Filter by priority
  if (priority && priority !== 'all') {
    result = result.filter((t) => t.priority.toLowerCase() === priority.toLowerCase());
  }

  // Filter by status
  if (status) {
    if (status === 'completed') {
      result = result.filter((t) => t.completed);
    } else if (status === 'pending') {
      result = result.filter((t) => !t.completed);
    } else if (status === 'in-progress') {
      result = result.filter((t) => t.status === 'in-progress' && !t.completed);
    } else if (status === 'todo') {
      result = result.filter((t) => t.status === 'todo' && !t.completed);
    }
  }

  // Filter by search query across title, description, and tags
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    result = result.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (Array.isArray(t.tags) && t.tags.some((tag) => tag.toLowerCase().includes(q)))
    );
  }

  // Sort
  if (sort === 'oldest') {
    result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  } else if (sort === 'priority') {
    const weight = { High: 3, Medium: 2, Low: 1 };
    result.sort((a, b) => (weight[b.priority] || 0) - (weight[a.priority] || 0));
  } else if (sort === 'dueDate') {
    result.sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  } else if (sort === 'alphabetical') {
    result.sort((a, b) => a.title.localeCompare(b.title));
  } else {
    // Default: newest first by createdAt descending
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  res.json(result);
});

// POST /api/tasks: Validate title presence, create, and append the new task
app.post('/api/tasks', (req, res) => {
  const { title, description, category, priority, dueDate, tags, subtasks, status } = req.body;

  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'Title is required and must not be empty.' });
  }

  const validCategories = ['College', 'Work', 'Personal'];
  const validPriorities = ['Low', 'Medium', 'High'];

  const sanitizedCategory = validCategories.includes(category) ? category : 'Personal';
  const sanitizedPriority = validPriorities.includes(priority) ? priority : 'Medium';
  const sanitizedStatus = ['todo', 'in-progress', 'completed'].includes(status) ? status : 'todo';

  const currentTime = Date.now();
  const newTask = {
    id: currentTime,
    title: title.trim(),
    description: typeof description === 'string' ? description.trim() : '',
    category: sanitizedCategory,
    priority: sanitizedPriority,
    completed: sanitizedStatus === 'completed',
    dueDate: dueDate || null,
    tags: Array.isArray(tags) ? tags.map((tg) => String(tg).trim()).filter(Boolean) : [],
    subtasks: Array.isArray(subtasks)
      ? subtasks.map((st, idx) => ({
          id: st.id || `st-${currentTime}-${idx}`,
          text: String(st.text || '').trim(),
          completed: Boolean(st.completed)
        }))
      : [],
    status: sanitizedStatus,
    createdAt: currentTime,
    updatedAt: currentTime
  };

  tasks.unshift(newTask);
  saveTasks(tasks);

  res.status(201).json(newTask);
});

// PATCH /api/tasks/:id: Toggle completed status or update specific task properties
app.patch('/api/tasks/:id', (req, res) => {
  const targetId = req.params.id;
  const index = tasks.findIndex((t) => String(t.id) === String(targetId));

  if (index === -1) {
    return res.status(404).json({ error: `Task with id "${targetId}" not found.` });
  }

  const task = tasks[index];
  const currentTime = Date.now();

  // If completed is explicitly provided, apply it; otherwise toggle completed if empty body or not provided
  if (req.body && typeof req.body.completed === 'boolean') {
    task.completed = req.body.completed;
    task.status = req.body.completed ? 'completed' : task.status === 'completed' ? 'todo' : task.status;
  } else if (!req.body || (req.body.completed === undefined && !req.body.title && !req.body.status && !req.body.subtasks)) {
    task.completed = !task.completed;
    task.status = task.completed ? 'completed' : 'todo';
  }

  // Update status if provided
  if (req.body && req.body.status) {
    const s = req.body.status;
    if (['todo', 'in-progress', 'completed'].includes(s)) {
      task.status = s;
      task.completed = s === 'completed';
    }
  }

  // Update optional fields if sent
  if (req.body && req.body.title && typeof req.body.title === 'string' && req.body.title.trim()) {
    task.title = req.body.title.trim();
  }
  if (req.body && typeof req.body.description === 'string') {
    task.description = req.body.description.trim();
  }
  if (req.body && req.body.category && ['College', 'Work', 'Personal'].includes(req.body.category)) {
    task.category = req.body.category;
  }
  if (req.body && req.body.priority && ['Low', 'Medium', 'High'].includes(req.body.priority)) {
    task.priority = req.body.priority;
  }
  if (req.body && req.body.dueDate !== undefined) {
    task.dueDate = req.body.dueDate;
  }
  if (req.body && Array.isArray(req.body.tags)) {
    task.tags = req.body.tags.map((tg) => String(tg).trim()).filter(Boolean);
  }
  if (req.body && Array.isArray(req.body.subtasks)) {
    task.subtasks = req.body.subtasks;
  }

  task.updatedAt = currentTime;
  saveTasks(tasks);

  res.json(task);
});

// PUT /api/tasks/:id: Full update
app.put('/api/tasks/:id', (req, res) => {
  const targetId = req.params.id;
  const index = tasks.findIndex((t) => String(t.id) === String(targetId));

  if (index === -1) {
    return res.status(404).json({ error: `Task with id "${targetId}" not found.` });
  }

  const { title, description, category, priority, completed, dueDate, tags, subtasks, status } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Title cannot be empty.' });
  }

  const isCompleted = completed !== undefined ? Boolean(completed) : status === 'completed';
  const assignedStatus = status || (isCompleted ? 'completed' : 'todo');

  tasks[index] = {
    ...tasks[index],
    title: title.trim(),
    description: typeof description === 'string' ? description.trim() : tasks[index].description,
    category: ['College', 'Work', 'Personal'].includes(category) ? category : tasks[index].category,
    priority: ['Low', 'Medium', 'High'].includes(priority) ? priority : tasks[index].priority,
    completed: isCompleted,
    status: assignedStatus,
    dueDate: dueDate !== undefined ? dueDate : tasks[index].dueDate,
    tags: Array.isArray(tags) ? tags : tasks[index].tags,
    subtasks: Array.isArray(subtasks) ? subtasks : tasks[index].subtasks,
    updatedAt: Date.now()
  };

  saveTasks(tasks);
  res.json(tasks[index]);
});

// DELETE /api/tasks/:id: Remove single task
app.delete('/api/tasks/:id', (req, res) => {
  const targetId = req.params.id;
  const taskToDelete = tasks.find((t) => String(t.id) === String(targetId));

  if (!taskToDelete) {
    return res.status(404).json({ error: `Task with id "${targetId}" not found.` });
  }

  tasks = tasks.filter((t) => String(t.id) !== String(targetId));
  saveTasks(tasks);

  res.json({ message: 'Task deleted successfully', task: taskToDelete });
});

// DELETE /api/tasks/completed: Clear all completed tasks
app.delete('/api/tasks-bulk/completed', (req, res) => {
  const initialCount = tasks.length;
  tasks = tasks.filter((t) => !t.completed);
  const deletedCount = initialCount - tasks.length;
  saveTasks(tasks);

  res.json({ message: `Cleared ${deletedCount} completed tasks`, deletedCount });
});

// POST /api/tasks/bulk: Execute batch actions (toggle, delete, update category/priority)
app.post('/api/tasks/bulk', (req, res) => {
  const { action, ids, payload } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'ids array is required' });
  }

  const idSet = new Set(ids.map(String));

  if (action === 'delete') {
    tasks = tasks.filter((t) => !idSet.has(String(t.id)));
  } else if (action === 'complete') {
    tasks.forEach((t) => {
      if (idSet.has(String(t.id))) {
        t.completed = true;
        t.status = 'completed';
        t.updatedAt = Date.now();
      }
    });
  } else if (action === 'incomplete') {
    tasks.forEach((t) => {
      if (idSet.has(String(t.id))) {
        t.completed = false;
        t.status = 'todo';
        t.updatedAt = Date.now();
      }
    });
  } else if (action === 'setPriority' && payload && payload.priority) {
    tasks.forEach((t) => {
      if (idSet.has(String(t.id))) {
        t.priority = payload.priority;
        t.updatedAt = Date.now();
      }
    });
  } else if (action === 'setCategory' && payload && payload.category) {
    tasks.forEach((t) => {
      if (idSet.has(String(t.id))) {
        t.category = payload.category;
        t.updatedAt = Date.now();
      }
    });
  }

  saveTasks(tasks);
  res.json({ message: `Bulk action "${action}" completed`, tasks });
});

// GET /api/export: Export tasks as JSON
app.get('/api/export', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="tasksprint-export.json"');
  res.send(JSON.stringify(tasks, null, 2));
});

// POST /api/import: Import tasks from JSON
app.post('/api/import', (req, res) => {
  const { importedTasks } = req.body;
  if (!Array.isArray(importedTasks)) {
    return res.status(400).json({ error: 'importedTasks must be an array' });
  }

  const validTasks = importedTasks.map((t) => ({
    id: t.id || Date.now() + Math.random(),
    title: String(t.title || 'Untitled task').trim(),
    description: String(t.description || '').trim(),
    category: ['College', 'Work', 'Personal'].includes(t.category) ? t.category : 'Personal',
    priority: ['Low', 'Medium', 'High'].includes(t.priority) ? t.priority : 'Medium',
    completed: Boolean(t.completed),
    dueDate: t.dueDate || null,
    tags: Array.isArray(t.tags) ? t.tags : [],
    subtasks: Array.isArray(t.subtasks) ? t.subtasks : [],
    status: t.status || (t.completed ? 'completed' : 'todo'),
    createdAt: t.createdAt || Date.now(),
    updatedAt: Date.now()
  }));

  tasks = [...validTasks];
  saveTasks(tasks);

  res.json({ message: `Successfully imported ${tasks.length} tasks`, count: tasks.length });
});

// POST /api/reset: Reset back to rich demo dataset
app.post('/api/reset', (req, res) => {
  tasks = [...defaultTasks];
  saveTasks(tasks);
  res.json({ message: 'Reset to sample sprint tasks', tasks });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start Express server
app.listen(PORT, () => {
  console.log(`TaskSprint Advanced Backend running on http://localhost:${PORT}`);
});
