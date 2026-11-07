import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Check,
  Plus,
  Trash2,
  Search,
  X,
  Sun,
  Moon,
  Zap,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Folder,
  ArrowUpDown,
  Sparkles,
  RefreshCw,
  Layers,
  LayoutList,
  Columns3,
  Calendar,
  Tag as TagIcon,
  Edit3,
  BarChart3,
  Download,
  Upload,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronRight,
  Flame,
  CheckSquare,
  Square,
  MoreHorizontal,
  RotateCcw,
  CloudRain
} from 'lucide-react';
import confetti from 'canvas-confetti';
import AnimatedBackground from './components/AnimatedBackground.jsx';

const API_BASE = '/api/tasks';

// Synthesize pleasant completion chime with Web Audio API
function playChime(enabled) {
  if (!enabled) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.15); // D6

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.4);
    osc2.stop(ctx.currentTime + 0.4);
  } catch (e) {
    // audio context might be restricted before interaction
  }
}

export default function App() {
  // Main state
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // View mode: 'list' | 'kanban'
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('tasksprint_view') || 'list';
  });

  // Sound toggle
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('tasksprint_sound') !== 'false';
  });

  // Theme: 'dark' | 'light'
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('tasksprint_theme') || 'dark';
  });

  // Background Motion State
  const [motionActive, setMotionActive] = useState(() => {
    return localStorage.getItem('tasksprint_motion') !== 'false';
  });

  // Background Mode: 'wave' | 'hyperspace'
  const [bgMode, setBgMode] = useState(() => {
    return localStorage.getItem('tasksprint_bgmode') || 'wave';
  });

  // New task form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('College');
  const [priority, setPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState('');
  const [showAdvancedForm, setShowAdvancedForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'completed' | 'in-progress'
  const [categoryFilter, setCategoryFilter] = useState('all'); // 'all' | 'College' | 'Work' | 'Personal'
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'priority' | 'dueDate' | 'alphabetical'

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Subtasks expanded state (map of taskId -> boolean)
  const [expandedSubtasks, setExpandedSubtasks] = useState({});

  // Modals state
  const [editingTask, setEditingTask] = useState(null);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);

  // Toast state
  const [toast, setToast] = useState(null);

  // Input ref for keyboard shortcuts
  const taskInputRef = useRef(null);
  const searchInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => {
      setToast(null);
    }, 2800);
  };

  // Sync theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('tasksprint_theme', theme);
  }, [theme]);

  // Sync view mode
  useEffect(() => {
    localStorage.setItem('tasksprint_view', viewMode);
  }, [viewMode]);

  // Sync sound
  useEffect(() => {
    localStorage.setItem('tasksprint_sound', String(soundEnabled));
  }, [soundEnabled]);

  // Sync background motion
  useEffect(() => {
    localStorage.setItem('tasksprint_motion', String(motionActive));
  }, [motionActive]);

  // Sync background mode
  useEffect(() => {
    localStorage.setItem('tasksprint_bgmode', bgMode);
  }, [bgMode]);

  // Global Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts if user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
        if (e.key === 'Escape') {
          e.target.blur();
          if (editingTask) setEditingTask(null);
          if (showAnalyticsModal) setShowAnalyticsModal(false);
        }
        return;
      }

      if (e.key === '/' || (e.ctrlKey && e.key === 'k')) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        taskInputRef.current?.focus();
      } else if (e.key === '1') {
        setViewMode('list');
      } else if (e.key === '2') {
        setViewMode('kanban');
      } else if (e.key === 'Escape') {
        setEditingTask(null);
        setShowAnalyticsModal(false);
        setSelectedIds(new Set());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingTask, showAnalyticsModal]);

  // Fetch tasks
  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      let res;
      try {
        res = await fetch(API_BASE);
      } catch (err) {
        res = await fetch('http://localhost:5000/api/tasks');
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error(err);
      setError('Unable to connect to TaskSprint backend on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Compute live sprint metrics
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const pending = total - completed;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    const todayStr = new Date().toISOString().split('T')[0];
    const overdueCount = tasks.filter((t) => {
      if (t.completed || !t.dueDate) return false;
      return t.dueDate < todayStr;
    }).length;

    const highPriorityCount = tasks.filter((t) => !t.completed && t.priority === 'High').length;
    const collegeCount = tasks.filter((t) => t.category === 'College').length;
    const workCount = tasks.filter((t) => t.category === 'Work').length;
    const personalCount = tasks.filter((t) => t.category === 'Personal').length;

    // Subtasks total
    let totalSubtasks = 0;
    let completedSubtasks = 0;
    tasks.forEach((t) => {
      if (Array.isArray(t.subtasks)) {
        totalSubtasks += t.subtasks.length;
        completedSubtasks += t.subtasks.filter((st) => st.completed).length;
      }
    });

    // Unique tags
    const allTags = new Set();
    tasks.forEach((t) => {
      if (Array.isArray(t.tags)) {
        t.tags.forEach((tag) => allTags.add(tag));
      }
    });

    return {
      total,
      completed,
      pending,
      percent,
      overdueCount,
      highPriorityCount,
      collegeCount,
      workCount,
      personalCount,
      totalSubtasks,
      completedSubtasks,
      tags: Array.from(allTags)
    };
  }, [tasks]);

  // Derived filtered and sorted tasks
  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        // Status filter
        if (statusFilter === 'pending' && task.completed) return false;
        if (statusFilter === 'completed' && !task.completed) return false;
        if (statusFilter === 'in-progress' && (task.completed || task.status !== 'in-progress')) return false;

        // Category filter
        if (categoryFilter !== 'all' && task.category !== categoryFilter) return false;

        // Priority filter
        if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;

        // Tag filter
        if (tagFilter !== 'all') {
          if (!Array.isArray(task.tags) || !task.tags.includes(tagFilter)) return false;
        }

        // Search query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchTitle = task.title.toLowerCase().includes(q);
          const matchDesc = task.description && task.description.toLowerCase().includes(q);
          const matchCat = task.category.toLowerCase().includes(q);
          const matchTag = Array.isArray(task.tags) && task.tags.some((t) => t.toLowerCase().includes(q));
          if (!matchTitle && !matchDesc && !matchCat && !matchTag) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sortBy === 'priority') {
          const weight = { High: 3, Medium: 2, Low: 1 };
          return weight[b.priority] - weight[a.priority];
        }
        if (sortBy === 'dueDate') {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        if (sortBy === 'alphabetical') {
          return a.title.localeCompare(b.title);
        }
        return 0;
      });
  }, [tasks, searchQuery, statusFilter, categoryFilter, priorityFilter, tagFilter, sortBy]);

  // Kanban Columns
  const kanbanColumns = useMemo(() => {
    return {
      todo: filteredTasks.filter((t) => !t.completed && t.status !== 'in-progress'),
      inProgress: filteredTasks.filter((t) => !t.completed && t.status === 'in-progress'),
      completed: filteredTasks.filter((t) => t.completed)
    };
  }, [filteredTasks]);

  // Create Task
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        dueDate: dueDate || null,
        status: 'todo'
      };

      let res;
      try {
        res = await fetch(API_BASE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (err) {
        res = await fetch('http://localhost:5000/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) throw new Error('Failed to create task');
      const newTask = await res.json();
      setTasks((prev) => [newTask, ...prev]);
      setTitle('');
      setDescription('');
      setDueDate('');
      setShowAdvancedForm(false);
      showToast(`Created task: "${newTask.title.slice(0, 24)}"`);
    } catch (err) {
      alert(err.message || 'Error creating task');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Completed
  const handleToggleTask = async (task) => {
    const nextCompleted = !task.completed;

    if (nextCompleted) {
      playChime(soundEnabled);
      const remainingPending = tasks.filter((t) => t.id !== task.id && !t.completed).length;
      if (remainingPending === 0) {
        try {
          confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
        } catch (e) {}
      }
    }

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? {
              ...t,
              completed: nextCompleted,
              status: nextCompleted ? 'completed' : 'todo'
            }
          : t
      )
    );

    try {
      let res;
      try {
        res = await fetch(`${API_BASE}/${task.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ completed: nextCompleted })
        });
      } catch (err) {
        res = await fetch(`http://localhost:5000/api/tasks/${task.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ completed: nextCompleted })
        });
      }

      if (!res.ok) throw new Error('Update failed');
      const updated = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err) {
      // revert
      setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
      showToast('Error syncing with backend.');
    }
  };

  // Update Status directly (Kanban drag / click)
  const handleUpdateStatus = async (taskId, newStatus) => {
    const isCompleted = newStatus === 'completed';
    if (isCompleted) playChime(soundEnabled);

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, status: newStatus, completed: isCompleted }
          : t
      )
    );

    try {
      await fetch(`${API_BASE}/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, completed: isCompleted })
      });
    } catch (err) {
      fetchTasks();
    }
  };

  // Delete Task
  const handleDeleteTask = async (id) => {
    const backup = [...tasks];
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setSelectedIds((prev) => {
      const copy = new Set(prev);
      copy.delete(id);
      return copy;
    });

    try {
      const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      showToast('Task deleted');
    } catch (err) {
      setTasks(backup);
      showToast('Failed to delete on server.');
    }
  };

  // Toggle Subtask
  const handleToggleSubtask = async (taskId, subtaskId) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !Array.isArray(task.subtasks)) return;

    const updatedSubtasks = task.subtasks.map((st) =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, subtasks: updatedSubtasks } : t))
    );

    try {
      await fetch(`${API_BASE}/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subtasks: updatedSubtasks })
      });
    } catch (err) {
      fetchTasks();
    }
  };

  // Save Task from Edit Modal
  const handleSaveEditedTask = async (updatedTask) => {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
    setEditingTask(null);

    try {
      const res = await fetch(`${API_BASE}/${updatedTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTask)
      });
      if (!res.ok) throw new Error('Failed to update task');
      showToast('Task updated successfully');
    } catch (err) {
      showToast('Failed to save edits to server.');
      fetchTasks();
    }
  };

  // Bulk Actions
  const toggleSelectTask = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredTasks.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTasks.map((t) => t.id)));
    }
  };

  const handleBulkAction = async (action) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    try {
      const res = await fetch('/api/tasks/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ids })
      });

      if (!res.ok) throw new Error('Bulk action failed');
      const data = await res.json();
      if (data.tasks) setTasks(data.tasks);
      else fetchTasks();

      setSelectedIds(new Set());
      showToast(`Bulk action "${action}" completed`);
    } catch (err) {
      showToast('Bulk action error.');
      fetchTasks();
    }
  };

  // Clear Completed
  const handleClearCompleted = async () => {
    if (!window.confirm('Clear all completed tasks from your sprint?')) return;
    try {
      const res = await fetch('/api/tasks-bulk/completed', { method: 'DELETE' });
      if (!res.ok) throw new Error('Clear failed');
      setTasks((prev) => prev.filter((t) => !t.completed));
      showToast('Cleared completed tasks');
    } catch (err) {
      fetchTasks();
    }
  };

  // Export Tasks JSON
  const handleExportTasks = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(tasks, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `tasksprint-backup-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Exported tasks to JSON');
  };

  // Import Tasks JSON
  const handleImportTasks = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (!Array.isArray(parsed)) throw new Error('JSON is not an array of tasks');

        const res = await fetch('/api/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ importedTasks: parsed })
        });
        if (!res.ok) throw new Error('Import failed');
        fetchTasks();
        showToast(`Imported ${parsed.length} tasks`);
      } catch (err) {
        alert('Invalid task file: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Reset demo tasks
  const handleResetDemo = async () => {
    if (!window.confirm('Reset board back to sample sprint tasks?')) return;
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      const data = await res.json();
      setTasks(data.tasks || []);
      showToast('Reset to demo sprint data');
    } catch (err) {
      fetchTasks();
    }
  };

  // Due Date status helper
  const getDueDateStatus = (dueDateStr) => {
    if (!dueDateStr) return null;
    const today = new Date().toISOString().split('T')[0];
    if (dueDateStr < today) return { type: 'overdue', label: 'Overdue' };
    if (dueDateStr === today) return { type: 'today', label: 'Due Today' };
    return { type: 'future', label: `Due ${dueDateStr}` };
  };

  // Format date helper
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <>
      {motionActive && <AnimatedBackground theme={theme} speed={1} mode={bgMode} />}
      <div className="app-container">
        {/* Hidden file input for import */}
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept=".json"
          onChange={handleImportTasks}
        />

        {/* ================= HEADER ================= */}
        <header className="header">
          <div className="brand">
            <div className="brand-icon-wrapper">
              <Zap size={25} />
            </div>
            <div className="brand-title-wrap">
              <div className="brand-title">
                <span>TaskSprint</span>
                <span className="brand-badge-pro">PRO</span>
              </div>
              <span className="brand-subtitle">High-velocity full-stack sprint workspace</span>
            </div>
          </div>

          <div className="header-actions">
            {/* Live Task Summary Badge */}
            <div className="live-summary-badge" title="Live task progress">
              <span className={`pulse-indicator ${stats.pending === 0 && stats.total > 0 ? 'all-done' : ''}`} />
              <span>
                {stats.pending} pending / {stats.total} total
              </span>
            </div>

            {/* Rain Atmospheric Effect Toggle */}
            <button
              onClick={() => {
                const nextState = !motionActive;
                setMotionActive(nextState);
                showToast(nextState ? 'Atmospheric Rain Active 🌧️' : 'Rain Paused');
              }}
              className="action-icon-btn"
              title={motionActive ? 'Atmospheric rain: Active (Click to pause)' : 'Atmospheric rain: Paused'}
              aria-label="Toggle Rain Effect"
            >
              <CloudRain size={16} color={motionActive ? '#38bdf8' : undefined} />
              <span>{motionActive ? 'Rain 🌧️' : 'Dry'}</span>
            </button>

            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="action-icon-btn"
              title={soundEnabled ? 'Completion chime enabled' : 'Sound muted'}
              aria-label="Toggle Sound"
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

          {/* Analytics Modal Button */}
          <button
            onClick={() => setShowAnalyticsModal(true)}
            className="action-icon-btn"
            title="Open Sprint Velocity & Analytics"
          >
            <BarChart3 size={16} />
            <span>Metrics</span>
          </button>

          {/* Theme switcher */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="action-icon-btn"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </header>

      {/* ================= ERROR ALERT ================= */}
      {error && (
        <div className="error-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
          <button onClick={fetchTasks}>Retry</button>
        </div>
      )}

      {/* ================= PROGRESS & STATS BANNER ================= */}
      <div className="stats-card">
        <div className="stats-top">
          <div className="stats-info">
            <span className="stats-label">Sprint Velocity & Progress</span>
            <span className="stats-headline">
              {stats.total === 0
                ? 'Your sprint board is empty. Create your first task below!'
                : stats.pending === 0
                ? '🎉 Incredible! All sprint tickets are completed.'
                : `${stats.pending} ticket${stats.pending > 1 ? 's' : ''} left in this sprint`}
            </span>
          </div>
          <div className="stats-percent">{stats.percent}%</div>
        </div>

        <div className="progress-track" role="progressbar" aria-valuenow={stats.percent} aria-valuemin="0" aria-valuemax="100">
          <div className="progress-fill" style={{ width: `${stats.percent}%` }} />
        </div>

        <div className="stats-pills">
          <div className="stat-pill pill-completed">
            <CheckCircle2 size={13} color="#4ade80" />
            <span>Completed:</span>
            <span className="stat-pill-num">{stats.completed}</span>
          </div>
          <div className="stat-pill pill-pending">
            <Clock size={13} color="#facc15" />
            <span>Pending:</span>
            <span className="stat-pill-num">{stats.pending}</span>
          </div>
          {stats.overdueCount > 0 && (
            <div className="stat-pill pill-overdue">
              <Flame size={13} color="#f87171" />
              <span>Overdue:</span>
              <span className="stat-pill-num">{stats.overdueCount}</span>
            </div>
          )}
          {stats.highPriorityCount > 0 && (
            <div className="stat-pill pill-high">
              <AlertTriangle size={13} color="#fb923c" />
              <span>High Priority:</span>
              <span className="stat-pill-num">{stats.highPriorityCount}</span>
            </div>
          )}
          {stats.totalSubtasks > 0 && (
            <div className="stat-pill pill-subtasks">
              <CheckSquare size={13} color="#38bdf8" />
              <span>Subtasks: {stats.completedSubtasks}/{stats.totalSubtasks}</span>
            </div>
          )}

          {/* Quick Data Actions */}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.4rem' }}>
            {stats.completed > 0 && (
              <button onClick={handleClearCompleted} className="action-icon-btn" style={{ height: '28px', fontSize: '0.725rem' }}>
                Clear Completed
              </button>
            )}
            <button onClick={handleExportTasks} className="action-icon-btn" style={{ height: '28px', fontSize: '0.725rem' }} title="Export JSON">
              <Download size={13} />
              <span>Export</span>
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="action-icon-btn" style={{ height: '28px', fontSize: '0.725rem' }} title="Import JSON">
              <Upload size={13} />
              <span>Import</span>
            </button>
            <button onClick={handleResetDemo} className="action-icon-btn" style={{ height: '28px', fontSize: '0.725rem' }} title="Reset to Sample Data">
              <RotateCcw size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* ================= TASK CREATION FORM ================= */}
      <div className="creation-card">
        <form onSubmit={handleCreateTask} className="creation-form">
          <div className="form-input-row">
            <input
              ref={taskInputRef}
              type="text"
              className="task-input"
              placeholder="What needs to get done? Type task name and press Enter... (Shortcut: N)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
            />
            <button
              type="button"
              className="btn-toggle-more"
              onClick={() => setShowAdvancedForm(!showAdvancedForm)}
              title="Add description & due date"
            >
              {showAdvancedForm ? 'Simple' : 'More Options'}
              {showAdvancedForm ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          </div>

          {showAdvancedForm && (
            <div className="form-expand-details">
              <textarea
                className="task-desc-input"
                placeholder="Optional notes or description (e.g. key specs, links, context)..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          )}

          <div className="form-controls-row">
            <div className="form-dropdowns">
              {/* Category Dropdown */}
              <div className="dropdown-group" title="Select Category">
                <Folder size={14} />
                <select
                  className="form-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="College">College</option>
                  <option value="Work">Work</option>
                  <option value="Personal">Personal</option>
                </select>
              </div>

              {/* Priority Dropdown */}
              <div className="dropdown-group" title="Select Priority">
                <AlertTriangle size={14} />
                <select
                  className="form-select"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority</option>
                </select>
              </div>

              {/* Due Date Input */}
              <div className="dropdown-group" title="Set Due Date">
                <Calendar size={14} />
                <input
                  type="date"
                  className="form-date-input"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn-add-task"
              disabled={!title.trim() || isSubmitting}
            >
              <Plus size={18} />
              <span>{isSubmitting ? 'Adding...' : 'Add Task'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* ================= TOOLBAR: SEARCH, FILTERS & VIEW MODE ================= */}
      <div className="toolbar">
        <div className="toolbar-primary">
          <div className="search-and-view">
            {/* Search Input */}
            <div className="search-input-wrapper">
              <Search size={15} className="search-icon" />
              <input
                ref={searchInputRef}
                type="text"
                className="search-input"
                placeholder="Search tasks, descriptions, tags... (Press / to search)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  className="search-clear-btn"
                  onClick={() => setSearchQuery('')}
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* View Mode Toggle: List vs Kanban */}
            <div className="view-mode-tabs" role="tablist">
              <button
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="List View (Shortcut: 1)"
              >
                <LayoutList size={15} />
                <span>List</span>
              </button>
              <button
                className={`view-btn ${viewMode === 'kanban' ? 'active' : ''}`}
                onClick={() => setViewMode('kanban')}
                title="Kanban Board (Shortcut: 2)"
              >
                <Columns3 size={15} />
                <span>Kanban</span>
              </button>
            </div>
          </div>

          {/* Sort Selector */}
          <div className="sort-select-wrapper">
            <ArrowUpDown size={14} />
            <select
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="priority">Priority (High to Low)</option>
              <option value="dueDate">Due Date (Earliest)</option>
              <option value="alphabetical">Title (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Filter Tabs & Category Chips */}
        <div className="filter-tabs-row">
          <div className="tabs-group">
            <button
              className={`tab-btn ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              All
              <span className="tab-count">{stats.total}</span>
            </button>
            <button
              className={`tab-btn ${statusFilter === 'pending' ? 'active' : ''}`}
              onClick={() => setStatusFilter('pending')}
            >
              Pending
              <span className="tab-count">{stats.pending}</span>
            </button>
            <button
              className={`tab-btn ${statusFilter === 'in-progress' ? 'active' : ''}`}
              onClick={() => setStatusFilter('in-progress')}
            >
              In Progress
            </button>
            <button
              className={`tab-btn ${statusFilter === 'completed' ? 'active' : ''}`}
              onClick={() => setStatusFilter('completed')}
            >
              Completed
              <span className="tab-count">{stats.completed}</span>
            </button>
          </div>

          <div className="category-filter-chips">
            <button
              className={`cat-chip ${categoryFilter === 'all' ? 'active' : ''}`}
              onClick={() => setCategoryFilter('all')}
            >
              All Categories
            </button>
            <button
              className={`cat-chip ${categoryFilter === 'College' ? 'active' : ''}`}
              onClick={() => setCategoryFilter(categoryFilter === 'College' ? 'all' : 'College')}
            >
              🎓 College ({stats.collegeCount})
            </button>
            <button
              className={`cat-chip ${categoryFilter === 'Work' ? 'active' : ''}`}
              onClick={() => setCategoryFilter(categoryFilter === 'Work' ? 'all' : 'Work')}
            >
              💼 Work ({stats.workCount})
            </button>
            <button
              className={`cat-chip ${categoryFilter === 'Personal' ? 'active' : ''}`}
              onClick={() => setCategoryFilter(categoryFilter === 'Personal' ? 'all' : 'Personal')}
            >
              🌿 Personal ({stats.personalCount})
            </button>
            {tagFilter !== 'all' && (
              <button className="cat-chip active" onClick={() => setTagFilter('all')}>
                #{tagFilter} ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ================= MAIN CONTENT: LIST OR KANBAN ================= */}
      {loading ? (
        <div className="empty-state">
          <RefreshCw size={28} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
          <p className="empty-title">Loading sprint board...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon-wrap">
            {searchQuery || categoryFilter !== 'all' || statusFilter !== 'all' || tagFilter !== 'all' ? (
              <Filter size={24} />
            ) : (
              <Sparkles size={24} />
            )}
          </div>
          <h3 className="empty-title">
            {searchQuery || categoryFilter !== 'all' || statusFilter !== 'all' || tagFilter !== 'all'
              ? 'No matching sprint tasks'
              : 'Sprint board is clean and clear'}
          </h3>
          <p className="empty-subtitle">
            {searchQuery || categoryFilter !== 'all' || statusFilter !== 'all' || tagFilter !== 'all'
              ? 'Try relaxing your search terms or clearing active filters.'
              : 'Add a new task using the form above to begin your next sprint.'}
          </p>
          {(searchQuery || categoryFilter !== 'all' || statusFilter !== 'all' || tagFilter !== 'all') && (
            <button
              className="btn-reset-filters"
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('all');
                setStatusFilter('all');
                setPriorityFilter('all');
                setTagFilter('all');
              }}
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : viewMode === 'list' ? (
        /* ================= LIST VIEW ================= */
        <main className="tasks-list">
          {/* Quick select all toggle bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0.25rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                className="select-checkbox"
                checked={selectedIds.size > 0 && selectedIds.size === filteredTasks.length}
                onChange={handleSelectAll}
              />
              <span>Select all ({filteredTasks.length})</span>
            </label>
            <span style={{ fontSize: '0.775rem', color: 'var(--text-subtle)' }}>
              Tip: Click any task title or edit icon to edit details
            </span>
          </div>

          {filteredTasks.map((task) => {
            const isDone = Boolean(task.completed);
            const catLower = (task.category || 'personal').toLowerCase();
            const prioLower = (task.priority || 'medium').toLowerCase();
            const dueStatus = getDueDateStatus(task.dueDate);
            const isSelected = selectedIds.has(task.id);
            const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
            const completedSubtasks = subtasks.filter((st) => st.completed).length;
            const isExpanded = Boolean(expandedSubtasks[task.id]);

            return (
              <div
                key={task.id}
                className={`task-card ${isDone ? 'completed' : ''}`}
                style={{ borderColor: isSelected ? 'var(--primary)' : undefined }}
              >
                <div className="task-main-row">
                  {/* Select Checkbox */}
                  <input
                    type="checkbox"
                    className="select-checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelectTask(task.id)}
                    title="Select task for bulk actions"
                  />

                  {/* Complete Checkbox */}
                  <button
                    type="button"
                    onClick={() => handleToggleTask(task)}
                    className={`checkbox-btn ${isDone ? 'checked' : ''}`}
                    title={isDone ? 'Mark as pending' : 'Mark as completed'}
                  >
                    {isDone && <Check size={15} strokeWidth={3} />}
                  </button>

                  {/* Task Content */}
                  <div className="task-content">
                    <span
                      className="task-title"
                      onClick={() => setEditingTask(task)}
                      title="Click to view & edit details"
                    >
                      {task.title}
                    </span>

                    {task.description && (
                      <p className="task-description-preview">{task.description}</p>
                    )}

                    <div className="task-meta">
                      {/* Category Badge */}
                      <span className={`badge badge-category-${catLower}`}>
                        {task.category === 'College' && '🎓 '}
                        {task.category === 'Work' && '💼 '}
                        {task.category === 'Personal' && '🌿 '}
                        {task.category}
                      </span>

                      {/* Priority Badge */}
                      <span className={`badge badge-priority-${prioLower}`}>
                        <span className="priority-dot" />
                        {task.priority} Priority
                      </span>

                      {/* Due Date Badge */}
                      {dueStatus && (
                        <span className={`badge badge-due-${dueStatus.type}`}>
                          <Calendar size={11} />
                          {dueStatus.label}
                        </span>
                      )}

                      {/* Subtasks pill */}
                      {subtasks.length > 0 && (
                        <button
                          type="button"
                          className="subtasks-progress-pill"
                          onClick={() =>
                            setExpandedSubtasks((prev) => ({
                              ...prev,
                              [task.id]: !prev[task.id]
                            }))
                          }
                          title="Toggle checklist items"
                        >
                          <CheckSquare size={12} />
                          <span>
                            {completedSubtasks}/{subtasks.length} subtasks
                          </span>
                          {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        </button>
                      )}

                      {/* Tags */}
                      {Array.isArray(task.tags) &&
                        task.tags.map((tag) => (
                          <span
                            key={tag}
                            className="tag-badge"
                            onClick={(e) => {
                              e.stopPropagation();
                              setTagFilter(tag);
                            }}
                            title={`Filter by #${tag}`}
                          >
                            <TagIcon size={10} />
                            {tag}
                          </span>
                        ))}

                      {/* Created Date */}
                      <span className="task-date">
                        <Clock size={11} />
                        {formatDate(task.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Actions: Edit & Delete */}
                  <div className="card-actions">
                    <button
                      type="button"
                      onClick={() => setEditingTask(task)}
                      className="btn-card-action"
                      title="Edit task details"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTask(task.id)}
                      className="btn-card-action btn-delete"
                      title="Delete task"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Subtasks Accordion */}
                {isExpanded && subtasks.length > 0 && (
                  <div className="subtasks-expanded-list">
                    {subtasks.map((st) => (
                      <div
                        key={st.id}
                        className={`subtask-inline-item ${st.completed ? 'completed' : ''}`}
                        onClick={() => handleToggleSubtask(task.id, st.id)}
                      >
                        {st.completed ? (
                          <CheckSquare size={14} color="#22c55e" />
                        ) : (
                          <Square size={14} color="var(--text-subtle)" />
                        )}
                        <span>{st.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </main>
      ) : (
        /* ================= KANBAN BOARD VIEW ================= */
        <div className="kanban-board">
          {/* Column 1: To Do */}
          <div className="kanban-column">
            <div className="kanban-column-header">
              <span className="kanban-column-title">
                <Square size={16} color="var(--text-muted)" />
                To Do
              </span>
              <span className="kanban-count">{kanbanColumns.todo.length}</span>
            </div>
            <div className="kanban-tasks-list">
              {kanbanColumns.todo.map((task) => (
                <div key={task.id} className="kanban-card" onClick={() => setEditingTask(task)}>
                  <span className="kanban-card-title">{task.title}</span>
                  <div className="task-meta" style={{ marginTop: 0 }}>
                    <span className={`badge badge-priority-${task.priority.toLowerCase()}`}>
                      <span className="priority-dot" />
                      {task.priority}
                    </span>
                    <span className={`badge badge-category-${task.category.toLowerCase()}`}>
                      {task.category}
                    </span>
                  </div>
                  <div className="kanban-card-actions">
                    <span style={{ fontSize: '0.725rem', color: 'var(--text-subtle)' }}>
                      {task.dueDate ? `Due ${task.dueDate}` : 'No date'}
                    </span>
                    <button
                      type="button"
                      className="btn-move-status"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateStatus(task.id, 'in-progress');
                      }}
                    >
                      Start →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: In Progress */}
          <div className="kanban-column">
            <div className="kanban-column-header">
              <span className="kanban-column-title">
                <Clock size={16} color="#f59e0b" />
                In Progress
              </span>
              <span className="kanban-count">{kanbanColumns.inProgress.length}</span>
            </div>
            <div className="kanban-tasks-list">
              {kanbanColumns.inProgress.map((task) => (
                <div key={task.id} className="kanban-card" onClick={() => setEditingTask(task)}>
                  <span className="kanban-card-title">{task.title}</span>
                  <div className="task-meta" style={{ marginTop: 0 }}>
                    <span className={`badge badge-priority-${task.priority.toLowerCase()}`}>
                      <span className="priority-dot" />
                      {task.priority}
                    </span>
                    <span className={`badge badge-category-${task.category.toLowerCase()}`}>
                      {task.category}
                    </span>
                  </div>
                  <div className="kanban-card-actions">
                    <button
                      type="button"
                      className="btn-move-status"
                      style={{ background: 'var(--bg-surface-subtle)', color: 'var(--text-muted)' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateStatus(task.id, 'todo');
                      }}
                    >
                      ← To Do
                    </button>
                    <button
                      type="button"
                      className="btn-move-status"
                      style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateStatus(task.id, 'completed');
                      }}
                    >
                      Complete ✓
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 3: Completed */}
          <div className="kanban-column">
            <div className="kanban-column-header">
              <span className="kanban-column-title">
                <CheckCircle2 size={16} color="#22c55e" />
                Done
              </span>
              <span className="kanban-count">{kanbanColumns.completed.length}</span>
            </div>
            <div className="kanban-tasks-list">
              {kanbanColumns.completed.map((task) => (
                <div key={task.id} className="kanban-card" style={{ opacity: 0.8 }} onClick={() => setEditingTask(task)}>
                  <span className="kanban-card-title" style={{ textDecoration: 'line-through', color: 'var(--text-muted)' }}>
                    {task.title}
                  </span>
                  <div className="task-meta" style={{ marginTop: 0 }}>
                    <span className={`badge badge-category-${task.category.toLowerCase()}`}>
                      {task.category}
                    </span>
                  </div>
                  <div className="kanban-card-actions">
                    <button
                      type="button"
                      className="btn-move-status"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateStatus(task.id, 'in-progress');
                      }}
                    >
                      ↺ Reopen
                    </button>
                    <button
                      type="button"
                      className="btn-card-action btn-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTask(task.id);
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= FLOATING BULK ACTIONS TOOLBAR ================= */}
      {selectedIds.size > 0 && (
        <div className="bulk-actions-bar">
          <span className="bulk-count">{selectedIds.size} selected</span>
          <div className="bulk-btns">
            <button
              onClick={() => handleBulkAction('complete')}
              className="btn-bulk"
              title="Mark selected tasks complete"
            >
              <CheckCircle2 size={14} />
              <span>Mark Done</span>
            </button>
            <button
              onClick={() => handleBulkAction('incomplete')}
              className="btn-bulk"
              title="Mark selected tasks incomplete"
            >
              <RotateCcw size={14} />
              <span>Mark Pending</span>
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              className="btn-bulk btn-bulk-delete"
              title="Delete selected tasks"
            >
              <Trash2 size={14} />
              <span>Delete</span>
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="btn-bulk"
              style={{ background: 'transparent', borderColor: 'transparent' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ================= EDIT / DETAIL MODAL ================= */}
      {editingTask && (
        <TaskDetailModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSave={handleSaveEditedTask}
          onDelete={(id) => {
            handleDeleteTask(id);
            setEditingTask(null);
          }}
        />
      )}

      {/* ================= SPRINT ANALYTICS MODAL ================= */}
      {showAnalyticsModal && (
        <AnalyticsModal
          stats={stats}
          onClose={() => setShowAnalyticsModal(false)}
        />
      )}

      {/* ================= TOAST NOTIFICATION ================= */}
      {toast && (
        <div className="toast-container">
          <div className="toast">
            <CheckCircle2 size={16} color="#22c55e" />
            <span>{toast}</span>
          </div>
        </div>
      )}
      </div>
    </>
  );
}

// Subcomponent: Task Detail & Edit Modal
function TaskDetailModal({ task, onClose, onSave, onDelete }) {
  const [form, setForm] = useState({
    ...task,
    tags: Array.isArray(task.tags) ? [...task.tags] : [],
    subtasks: Array.isArray(task.subtasks) ? [...task.subtasks] : []
  });
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [newTagText, setNewTagText] = useState('');

  const handleAddSubtask = (e) => {
    e.preventDefault();
    if (!newSubtaskText.trim()) return;
    const newSt = {
      id: `st-${Date.now()}`,
      text: newSubtaskText.trim(),
      completed: false
    };
    setForm((prev) => ({ ...prev, subtasks: [...prev.subtasks, newSt] }));
    setNewSubtaskText('');
  };

  const handleRemoveSubtask = (id) => {
    setForm((prev) => ({
      ...prev,
      subtasks: prev.subtasks.filter((st) => st.id !== id)
    }));
  };

  const handleToggleSubtask = (id) => {
    setForm((prev) => ({
      ...prev,
      subtasks: prev.subtasks.map((st) =>
        st.id === id ? { ...st, completed: !st.completed } : st
      )
    }));
  };

  const handleAddTag = (e) => {
    e.preventDefault();
    if (!newTagText.trim()) return;
    const clean = newTagText.trim().replace(/^#/, '');
    if (!form.tags.includes(clean)) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, clean] }));
    }
    setNewTagText('');
  };

  const handleRemoveTag = (tag) => {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">
            <Edit3 size={18} color="var(--primary)" />
            Task Details & Specifications
          </span>
          <button onClick={onClose} className="modal-close-btn">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>Task Title</label>
            <input
              type="text"
              className="modal-input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Description & Notes</label>
            <textarea
              className="modal-textarea"
              rows={3}
              placeholder="Add key specifications, context, or links..."
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="modal-grid-2">
            <div className="form-group">
              <label>Category</label>
              <select
                className="modal-input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="College">College</option>
                <option value="Work">Work</option>
                <option value="Personal">Personal</option>
              </select>
            </div>

            <div className="form-group">
              <label>Priority</label>
              <select
                className="modal-input"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
              </select>
            </div>
          </div>

          <div className="modal-grid-2">
            <div className="form-group">
              <label>Status</label>
              <select
                className="modal-input"
                value={form.status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status: e.target.value,
                    completed: e.target.value === 'completed'
                  })
                }
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="form-group">
              <label>Due Date</label>
              <input
                type="date"
                className="modal-input"
                value={form.dueDate || ''}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value || null })}
              />
            </div>
          </div>

          {/* Subtasks Checklist Editor */}
          <div className="form-group">
            <label>Checklist & Subtasks ({form.subtasks.filter((s) => s.completed).length}/{form.subtasks.length})</label>
            <div className="subtask-editor-list">
              {form.subtasks.map((st) => (
                <div key={st.id} className="subtask-editor-row">
                  <input
                    type="checkbox"
                    className="select-checkbox"
                    checked={st.completed}
                    onChange={() => handleToggleSubtask(st.id)}
                  />
                  <span style={{ flex: 1, textDecoration: st.completed ? 'line-through' : 'none', color: st.completed ? 'var(--text-muted)' : 'inherit' }}>
                    {st.text}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubtask(st.id)}
                    className="btn-remove-subtask"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
              <input
                type="text"
                className="modal-input"
                style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                placeholder="Add subtask item..."
                value={newSubtaskText}
                onChange={(e) => setNewSubtaskText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask(e);
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="action-icon-btn"
                style={{ background: 'var(--primary)', color: '#fff' }}
              >
                Add
              </button>
            </div>
          </div>

          {/* Tags Editor */}
          <div className="form-group">
            <label>Tags & Labels</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.4rem' }}>
              {form.tags.map((tag) => (
                <span key={tag} className="tag-badge">
                  #{tag}
                  <button type="button" onClick={() => handleRemoveTag(tag)} style={{ color: 'inherit', marginLeft: '3px' }}>
                    ✕
                  </button>
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className="modal-input"
                style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                placeholder="Add tag (e.g. backend, urgent)..."
                value={newTagText}
                onChange={(e) => setNewTagText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag(e);
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="action-icon-btn"
              >
                + Tag
              </button>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            onClick={() => onDelete(form.id)}
            className="action-icon-btn"
            style={{ color: 'var(--prio-high-dot)', marginRight: 'auto' }}
          >
            <Trash2 size={15} />
            <span>Delete</span>
          </button>
          <button type="button" onClick={onClose} className="action-icon-btn">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(form)}
            className="btn-add-task"
            style={{ margin: 0, padding: '0.55rem 1.25rem' }}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// Subcomponent: Sprint Velocity & Analytics Modal
function AnalyticsModal({ stats, onClose }) {
  const getVelocityRating = (rate) => {
    if (rate >= 90) return { label: 'Peak Velocity 🚀', desc: 'Outstanding execution and ticket closure pace.' };
    if (rate >= 60) return { label: 'Strong Momentum ⚡', desc: 'Solid sprint progress with steady completions.' };
    if (rate >= 30) return { label: 'In Flight ⏳', desc: 'Active development phase underway.' };
    return { label: 'Sprint Kickoff 🏁', desc: 'Early sprint phase; ramp up ticket closures.' };
  };

  const rating = getVelocityRating(stats.percent);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">
            <BarChart3 size={20} color="var(--primary)" />
            Sprint Velocity & Insights
          </span>
          <button onClick={onClose} className="modal-close-btn">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{ background: 'var(--primary-light)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary)' }}>
              {rating.label}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {rating.desc}
            </div>
          </div>

          <div className="analytics-grid">
            <div className="analytics-widget">
              <span className="widget-num">{stats.percent}%</span>
              <span className="widget-title">Overall Sprint Completion</span>
            </div>
            <div className="analytics-widget">
              <span className="widget-num">{stats.pending}</span>
              <span className="widget-title">Active Pending Tickets</span>
            </div>
            <div className="analytics-widget">
              <span className="widget-num" style={{ color: stats.overdueCount > 0 ? '#ef4444' : undefined }}>
                {stats.overdueCount}
              </span>
              <span className="widget-title">Overdue Deadlines</span>
            </div>
            <div className="analytics-widget">
              <span className="widget-num">
                {stats.completedSubtasks}/{stats.totalSubtasks}
              </span>
              <span className="widget-title">Checklist Subtasks Finished</span>
            </div>
          </div>

          <div className="form-group">
            <label>Workload by Category</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '3px' }}>
                  <span>🎓 College</span>
                  <span>{stats.collegeCount} tickets</span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${stats.total > 0 ? (stats.collegeCount / stats.total) * 100 : 0}%`,
                      background: '#a855f7'
                    }}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '3px' }}>
                  <span>💼 Work</span>
                  <span>{stats.workCount} tickets</span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${stats.total > 0 ? (stats.workCount / stats.total) * 100 : 0}%`,
                      background: '#0ea5e9'
                    }}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '3px' }}>
                  <span>🌿 Personal</span>
                  <span>{stats.personalCount} tickets</span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${stats.total > 0 ? (stats.personalCount / stats.total) * 100 : 0}%`,
                      background: '#10b981'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn-add-task" style={{ margin: 0 }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
