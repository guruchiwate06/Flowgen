import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layout, Kanban, Plus, Search, Image as ImageIcon, X,
  Upload, Layers, Trash2, Copy, Zap, Filter,
  Hash, Pencil, Check, ClipboardList, GripVertical, LogOut,
} from 'lucide-react';
import { STATUS_CONFIG, INITIAL_DATA, timeAgo, CLIP_ROLES, ROLE_ORDER, loadProjects, loadView, STORAGE_KEYS, devLog, sanitizeProject } from './constants';
import ExecutionMode from './components/ExecutionMode';
import Landing from './components/Landing';
import ProjectCard from './components/ProjectCard';
import QuickAddModal from './components/QuickAddModal';
import AuthPage from './components/AuthPage';
import StageStats from './components/StageStats';
import SelectDropdown from './components/SelectDropdown';
import { auth, onAuthStateChanged, signOut, db, GoogleAuthProvider, signInWithPopup } from './firebase';
import { uploadToDrive, downloadZip, getOrCreateFolder } from './driveUtils';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import {
  DndContext, DragOverlay, closestCorners,
  useDraggable, useDroppable,
  MouseSensor, TouchSensor, useSensor, useSensors,
  PointerSensor,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { toastEvent, showToast } from './utils/toast';
/* ─── Toast System ─────────────────────────────────────────────────────────── */

const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (e) => {
      const id = Date.now() + Math.random();
      setToasts(prev => [...prev, { id, ...e.detail }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    };
    toastEvent.addEventListener('toast', handler);
    return () => toastEvent.removeEventListener('toast', handler);
  }, []);

  return (
    <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[999] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`px-5 py-3 rounded-2xl flex items-center gap-3 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] text-sm font-black tracking-wide pointer-events-auto backdrop-blur-xl border ${
              t.type === 'error'
                ? 'bg-red-500/10 text-red-500 border-red-500/20'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            }`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
              t.type === 'error' ? 'bg-red-500/20' : 'bg-emerald-500/20'
            }`}>
              {t.type === 'error' ? <X size={12} strokeWidth={3} /> : <Check size={12} strokeWidth={3} />}
            </div>
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};



import DetailPanel from './components/ProjectDetailPanel';

/* ─── Droppable Kanban Column ──────────────────────────────────────────────── */
const DroppableColumn = ({ id, config, projects, onProjectClick }) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div className="flex-shrink-0 w-[280px] sm:w-[320px] md:w-[340px] flex flex-col h-full pb-10">
      <div className="flex items-center justify-between mb-6 px-3">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/40">{config.label}</h3>
        </div>
        <span className="text-[10px] font-black text-slate-600 bg-white/5 px-3 py-1 rounded-full border border-white/5">
          {projects.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 border rounded-[40px] p-4 overflow-y-auto scrollbar-hide flex flex-col shadow-inner transition-all duration-200 ${
          isOver ? 'bg-violet-500/5 border-violet-500/40' : 'bg-white/[0.015] border-white/[0.04]'
        }`}
      >
        {projects.map((p) => <DraggableItem key={p.id} project={p} onClick={onProjectClick} />)}
      </div>
    </div>
  );
};

/* ─── Draggable Card Wrapper ───────────────────────────────────────────────── */
const DraggableItem = ({ project, onClick }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: project.id, data: project });
  return (
    <ProjectCard
      ref={setNodeRef} project={project} onClick={onClick} isPipeline
      isDragging={isDragging} dragAttributes={attributes} dragListeners={listeners}
      style={{ opacity: isDragging ? 0.2 : 1, transition: 'opacity 0.15s' }}
    />
  );
};

/* ─── Main App ─────────────────────────────────────────────────────────────── */
export default function App() {
  // ── Persistent state init (lazy initialisers) ─────────────────────────────
  const [view, setView] = useState(() => {
    // Always start at landing on first visit; restore only within the app
    try { return localStorage.getItem(STORAGE_KEYS.VIEW) || 'landing'; }
    catch { return 'landing'; }
  });
  const [projects, setProjects] = useState(loadProjects);
  const [selectedId, setSelectedId] = useState(() => {
    try { const v = localStorage.getItem('flowgen_last_id'); return v ? JSON.parse(v) : null; }
    catch { return null; }
  });
  const [isLibReady, setIsLibReady] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('RECENT');
  const [activeDragItem, setActiveDragItem] = useState(null);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [driveToken, setDriveToken] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({ active: false, current: 0, total: 0, fileName: '' });
  const [downloading, setDownloading] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const saveTimeouts = useRef({});

  // ── Persistence effects ───────────────────────────────────────────────────
  useEffect(() => {
    if (view !== 'landing' && view !== 'auth') {
      try { localStorage.setItem(STORAGE_KEYS.VIEW, view); }
      catch { /* ignore */ }
    }
  }, [view]);

  useEffect(() => {
    try { localStorage.setItem('flowgen_last_id', JSON.stringify(selectedId)); }
    catch { /* ignore */ }
  }, [selectedId]);

  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); showToast("Connection restored", "success"); };
    const handleOffline = () => { setIsOnline(false); showToast("You are offline", "error"); };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (saveStatus === "saving") {
        e.preventDefault();
        e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveStatus]);

  // ── Firebase auth listener & Data Load ────────────────────────────────────
  const loadProjectsFromFirestore = async (userId) => {
    try {
      const ref = collection(db, "users", userId, "projects");
      const snapshot = await getDocs(ref);
      const data = [];
      snapshot.docs.forEach(doc => {
        const sanitized = sanitizeProject(doc.data(), doc.id);
        if (sanitized) data.push(sanitized);
        else devLog("skipped_corrupt_project", doc.id);
      });
      setProjects(data.length ? data : []);
    } catch (err) {
      console.error("Load error:", err);
      showToast("Failed to load projects");
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        loadProjectsFromFirestore(u.uid).finally(() => setAuthLoading(false));
      } else {
        setProjects([]);
        setAuthLoading(false);
        setView(v => (v !== 'landing' ? 'auth' : v));
      }
    });
    return unsub;
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setView('landing');
  };

  const saveProjectToFirestore = async (userId, project) => {
    try {
      const cleanProject = {
        title: project.title,
        status: project.status,
        caption: project.caption,
        hashtags: project.hashtags || [],
        createdAt: project.createdAt,
        lastEdited: project.lastEdited,
        thumbnail: project.thumbnail || null,
        assets: (project.assets || []).map(a => ({
          id: a.id,
          name: a.name,
          role: a.role,
          selected: a.selected,
          order: a.order,
          driveId: a.driveId,
          ...(a.preview ? { preview: a.preview } : {})
        }))
      };
      const ref = doc(db, "users", userId, "projects", String(project.id));
      await setDoc(ref, cleanProject, { merge: true });
      
      setSaveStatus("saved");
      setTimeout(() => {
        setSaveStatus(prev => prev === "saved" ? "idle" : prev);
      }, 2000);
    } catch (err) {
      devLog("save_failed", err);
      setSaveStatus("error");
    }
  };

  const triggerFirestoreSave = useCallback((project) => {
    const projectId = project.id;
    if (saveTimeouts.current[projectId]) {
      clearTimeout(saveTimeouts.current[projectId]);
    }
    setSaveStatus("saving");
    saveTimeouts.current[projectId] = setTimeout(() => {
      if (auth.currentUser) {
        saveProjectToFirestore(auth.currentUser.uid, project);
      }
    }, 500);
  }, []);

  // Derive selected project from projects array (always in sync)
  const selected = useMemo(() => projects.find(p => p.id === selectedId) || null, [projects, selectedId]);

  /* Sensors: distance=8px so clicks still work, drag needs intentional movement */
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  /* OGL loader */
  useEffect(() => {
    if (window.ogl) { setIsLibReady(true); return; }
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/ogl';
    script.onload = () => setIsLibReady(true);
    document.body.appendChild(script);
  }, []);

  /* ── Core updater ── */
  const updateProject = useCallback((id, changes) => {
    setProjects(prev => {
      const updatedProjects = prev.map(p =>
        p.id === id ? { ...p, ...changes, lastEdited: changes.lastEdited ?? Date.now() } : p
      );
      const updatedProject = updatedProjects.find(p => p.id === id);
      if (updatedProject) {
        triggerFirestoreSave(updatedProject);
      }
      return updatedProjects;
    });
  }, [triggerFirestoreSave]);

  /* Filtered + sorted list */
  const filteredProjects = useMemo(() => {
    const result = projects.filter(p => {
      const matchSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
    if (sortBy === 'UPDATED') result.sort((a, b) => b.lastEdited - a.lastEdited);
    else if (sortBy === 'STATUS') result.sort((a, b) => STATUS_CONFIG[a.status].step - STATUS_CONFIG[b.status].step);
    else result.sort((a, b) => b.id - a.id);
    return result;
  }, [projects, searchQuery, statusFilter, sortBy]);

  /* Resume working list */
  const resumeProjects = useMemo(() => {
    const editing = projects.filter(p => p.status === 'EDITING');
    if (editing.length > 0) return editing.slice(0, 3);
    return [...projects].sort((a, b) => b.lastEdited - a.lastEdited).slice(0, 1);
  }, [projects]);

  /* Handlers */
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length || !selectedId) return;

    if (!isOnline) {
      showToast("You are offline", "error");
      return;
    }

    if (!driveToken) {
      showToast("Google Drive disconnected! Reconnect to continue.");
      return;
    }

    setUploadProgress({ active: true, current: 0, total: files.length, fileName: files[0].name });

    try {
      const existingAssets = (selected?.assets || []).filter(a => typeof a === 'object');
      if (existingAssets.length + files.length > 50) {
        setUploadProgress({ active: false, current: 0, total: 0, fileName: '' });
        showToast("Max 50 assets reached. Remove some to add more.");
        return;
      }

      // Get or create "Flowgen Assets" folder
      const folderId = await getOrCreateFolder("Flowgen Assets", driveToken);

      const baseOrder = existingAssets.length;
      const uploadedAssets = [];
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(prev => ({ ...prev, current: i + 1, fileName: file.name }));
        
        if (file.size > 500 * 1024 * 1024) {
          showToast(`File ${file.name} is too large (> 500MB). Skipping.`);
          failCount++;
          continue;
        }

        try {
          const res = await uploadToDrive(file, driveToken, folderId);

          uploadedAssets.push({
            id: res.id,
            name: file.name,
            role: 'unassigned',
            selected: true,
            order: baseOrder + i,
            driveId: res.id,
            preview: res.thumbnailLink || res.iconLink || null,
          });
          successCount++;
        } catch (fileErr) {
          devLog("upload_failed", { file: file.name, err: fileErr });
          failCount++;
          if (fileErr.message === "SESSION_EXPIRED") throw fileErr;
        }
      }

      if (successCount > 0) {
        const validPreview = uploadedAssets.find(a => a.preview)?.preview;
        updateProject(selectedId, {
          assets: [...existingAssets, ...uploadedAssets],
          ...(validPreview ? { thumbnail: validPreview } : {}),
          lastEdited: Date.now(),
        });
      }
      
      if (failCount === 0 && successCount > 0) {
        showToast(`${successCount} file${successCount !== 1 ? 's' : ''} uploaded successfully`, "success");
      } else if (successCount > 0) {
        showToast(`${successCount} uploaded, ${failCount} failed`, "error");
      } else {
        showToast("Upload failed for all files");
      }
    } catch (err) {
      devLog("upload_failed", err);
      if (err.message === "SESSION_EXPIRED") {
        setDriveToken(null);
        showToast("Google Drive disconnected! Reconnect to continue.");
      } else {
        showToast("Upload flow completely failed");
      }
    } finally {
      setUploadProgress({ active: false, current: 0, total: 0, fileName: '' });
      e.target.value = ''; // Reset input to allow re-upload of same file
    }
  };

  const handleZipDownload = async (execSequence) => {
    if (!isOnline) {
      showToast("You are offline", "error");
      return;
    }
    if (!driveToken) {
      showToast("Google Drive disconnected! Reconnect to continue.");
      return;
    }
    setDownloading(true);
    showToast("Preparing ZIP...", "success");
    try {
      await downloadZip(execSequence, driveToken);
      showToast("ZIP download starting...", "success");
    } catch (err) {
      devLog("zip_failed", err);
      if (err.message === "SESSION_EXPIRED") {
        setDriveToken(null);
        showToast("Google Drive disconnected! Reconnect to continue.");
      } else {
        showToast("Failed to prepare ZIP. Please retry.");
      }
    } finally {
      setDownloading(false);
    }
  };

  const handleConnectDrive = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope("https://www.googleapis.com/auth/drive.file");
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential) setDriveToken(credential.accessToken);
    } catch (err) {
      console.error("Drive connect error:", err);
    }
  };

  const handleDragStart = ({ active }) => setActiveDragItem(projects.find(p => p.id === active.id) || null);
  const handleDragEnd = ({ active, over }) => {
    setActiveDragItem(null);
    if (!over || active.data.current?.status === over.id) return;
    updateProject(active.id, { status: over.id });
  };

  const handleRemix = (project) => {
    const now = Date.now();
    const clone = {
      ...project,
      id: now,
      title: `${project.title} (Remix)`,
      createdAt: now,
      lastEdited: now,
      assets: [],
      hashtags: [...(project.hashtags || [])],
    };
    setProjects(prev => [clone, ...prev]);
    setSelectedId(clone.id);
    triggerFirestoreSave(clone);
  };

  const handleDelete = async (id) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    setSelectedId(null);
    if (auth.currentUser) {
      try {
        await deleteDoc(doc(db, "users", auth.currentUser.uid, "projects", String(id)));
      } catch (err) {
        console.error("Delete error:", err);
        showToast("Delete failed");
      }
    }
  };

  const handleAddProject = (title) => {
    if (projects.length >= 50) {
      showToast("Max 50 projects allowed. Please delete an existing project.");
      return;
    }
    const now = Date.now();
    const newItem = {
      id: now,
      title,
      status: 'IDEA',
      type: 'New Post',
      createdAt: now,
      lastEdited: now,
      thumbnail: null,
      caption: '',
      hashtags: [],
      assets: [],
    };
    setProjects(prev => [newItem, ...prev]);
    setIsQuickAddOpen(false);
    setSelectedId(newItem.id);
    triggerFirestoreSave(newItem);
  };

  /* ─── Render ────────────────────────────────────────────────────────────── */
  if (authLoading) return null;

  return (
    <div className={`flex flex-col bg-[#0A0A0B] text-slate-200 selection:bg-violet-500 selection:text-white ${
      view === 'landing' || view === 'auth' ? 'min-h-screen' : 'h-screen overflow-hidden'
    }`}>
      <ToastContainer />

      {/* Static gradient background */}
      <div className="fixed inset-0 -z-10 bg-[#0A0A0B] overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[70%] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[60%] h-[60%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
      </div>

      {/* Header — hidden on landing + auth */}
      {view !== 'landing' && view !== 'auth' && (
        <header className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0B]/60 backdrop-blur-2xl border-b border-white/[0.06] flex flex-col md:flex-row md:items-center md:justify-between px-4 sm:px-6 md:px-10 py-3 md:py-0 md:h-24 gap-2 md:gap-0">
          <div className="flex items-center justify-between w-full md:w-auto">
            <div onClick={() => setView('landing')} className="flex items-center gap-3 cursor-pointer group">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-2xl bg-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <Layers size={20} className="text-black" />
              </div>
              <span className="text-xl md:text-2xl font-black tracking-tighter text-white">Flowgen</span>
            </div>
            {/* Mobile nav inline with logo */}
            <nav className="flex md:hidden items-center bg-black/40 border border-white/10 p-1 rounded-full shadow-xl">
              {[{ id: 'pipeline', label: 'Pipeline', icon: Kanban }, { id: 'dashboard', label: 'Hub', icon: Layout }].map(item => (
                <button key={item.id} onClick={() => setView(item.id)} className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${view === item.id ? 'bg-white text-black shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                  <item.icon size={13} /> {item.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Search + filters — visible on all screen sizes */}
          <div className="flex-1 md:max-w-3xl md:mx-16 flex gap-2 md:gap-3">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-violet-400 transition-colors" size={16} />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search..." className="w-full bg-white/[0.03] border border-white/10 rounded-full pl-10 md:pl-14 pr-4 md:pr-6 py-2.5 md:py-3.5 text-sm font-bold focus:outline-none focus:border-violet-500/50 transition-all" />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-white/[0.03] border border-white/10 rounded-full px-3 md:px-5 py-2 gap-2">
                <Filter size={12} className="text-slate-500 hidden sm:block" />
                <SelectDropdown
                  variant="pill"
                  value={statusFilter}
                  onChange={setStatusFilter}
                  align="left"
                  options={[
                    { value: 'ALL',      label: 'All'      },
                    ...Object.entries(STATUS_CONFIG).map(([k, v]) => ({ value: k, label: v.label, color: v.color }))
                  ]}
                />
              </div>
              <div className="hidden sm:flex items-center bg-white/[0.03] border border-white/10 rounded-full px-3 md:px-5 py-2 gap-2">
                <SelectDropdown
                  variant="pill"
                  value={sortBy}
                  onChange={setSortBy}
                  align="right"
                  options={[
                    { value: 'RECENT',  label: 'Recent'  },
                    { value: 'UPDATED', label: 'Updated' },
                    { value: 'STATUS',  label: 'Stage'   },
                  ]}
                />
              </div>
            </div>
          </div>

          {/* Desktop-only: nav tabs + user */}
          <div className="hidden md:flex items-center gap-4">
            {/* Save Status Indicator */}
            {saveStatus !== 'idle' && (
              <div className="flex items-center gap-2 bg-white/[0.04] border border-white/10 rounded-full px-4 py-2">
                {saveStatus === 'saving' && <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Syncing...</span>}
                {saveStatus === 'saved' && <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5"><Check size={12} /> All changes saved</span>}
                {saveStatus === 'error' && (
                  <span className="text-[10px] font-black uppercase tracking-widest text-red-400 flex items-center gap-2">
                    Save failed
                    <button onClick={() => { if(selected) triggerFirestoreSave(selected); }} className="text-white hover:text-red-300 transition-colors bg-red-500/20 px-2 py-0.5 rounded ml-1">Retry Now</button>
                  </span>
                )}
              </div>
            )}
            
            <nav className="flex items-center bg-black/40 border border-white/10 p-1.5 rounded-full shadow-2xl">
              {[{ id: 'pipeline', label: 'Pipeline', icon: Kanban }, { id: 'dashboard', label: 'Hub', icon: Layout }].map(item => (
                <button key={item.id} onClick={() => setView(item.id)} className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${view === item.id ? 'bg-white text-black shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                  <item.icon size={14} /> {item.label}
                </button>
              ))}
            </nav>
            {/* User + logout */}
            <div className="flex items-center gap-2 bg-white/[0.04] border border-white/10 rounded-2xl px-3 py-2">
              <div className="w-7 h-7 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-[10px] font-black text-violet-400 uppercase">
                {user?.email?.[0] || '?'}
              </div>
              <span className="text-[10px] font-bold text-slate-400 max-w-[120px] truncate hidden lg:block">{user?.email || 'Guest'}</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-red-400 transition-colors ml-1 pl-2 border-l border-white/10"
              >
                <LogOut size={12} /> Logout
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main */}
      <main className={`flex-1 flex flex-col relative w-full ${
        view === 'landing' || view === 'auth' ? '' : 'overflow-hidden pt-[108px] md:pt-24'
      }`}>
        <AnimatePresence mode="wait">

          {view === 'landing' && (
            <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 w-full">
              <Landing onStart={() => user ? setView('pipeline') : setView('auth')} isLibReady={isLibReady} />
            </motion.div>
          )}

          {view === 'auth' && (
            <motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 w-full">
              <AuthPage 
                onSuccess={(token) => {
                  if (token) setDriveToken(token);
                  setView('pipeline');
                }} 
                onBack={() => setView('landing')}
              />
            </motion.div>
          )}

          {view === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 py-8 md:py-16 w-full overflow-y-auto custom-scroll">
              <div className="flex justify-between items-end mb-8 md:mb-16">
                <div>
                  <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight mb-2">Workspace Hub</h2>
                  <p className="text-xs md:text-sm text-slate-500 font-bold uppercase tracking-widest">Active File Registry: {filteredProjects.length} Items</p>
                </div>
              </div>

              {resumeProjects.length > 0 && (
                <div className="mb-10">
                  <div className="flex items-center gap-3 mb-6">
                    <Zap size={16} className="text-violet-400" />
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Continue Working</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {resumeProjects.map(p => <ProjectCard key={`resume-${p.id}`} layoutPrefix="resume" project={p} onClick={p => setSelectedId(p.id)} />)}
                  </div>
                </div>
              )}

              {/* Stage Analytics */}
              <StageStats projects={projects} />

              <div className="flex items-center gap-3 mb-6">
                <Layers size={16} className="text-slate-500" />
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">All Files</h3>
              </div>

              {filteredProjects.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-24 text-center"
                >
                  <div className="text-6xl mb-5">✦</div>
                  <p className="text-lg font-black text-white mb-2">
                    {searchQuery || statusFilter !== 'ALL' ? 'No matches found' : 'Nothing here yet'}
                  </p>
                  <p className="text-sm text-slate-500 max-w-sm mb-8">
                    {searchQuery || statusFilter !== 'ALL'
                      ? 'Try clearing your filters.'
                      : 'Capture your first content idea to get started.'}
                  </p>
                  {!searchQuery && statusFilter === 'ALL' && (
                    <motion.button
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={() => setIsQuickAddOpen(true)}
                      className="flex items-center gap-2.5 px-8 py-4 bg-white text-black font-black text-sm rounded-full shadow-xl"
                    >
                      <Plus size={18} strokeWidth={3} /> Create your first content idea
                    </motion.button>
                  )}
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredProjects.map(p => <ProjectCard key={p.id} project={p} onClick={p => setSelectedId(p.id)} />)}
                </div>
              )}
            </motion.div>
          )}

          {view === 'pipeline' && (
            <motion.div key="pipeline" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 min-h-0 flex gap-4 md:gap-8 p-4 md:p-10 overflow-x-auto bg-black/10 pipeline-scroll h-full transform-gpu will-change-transform">
              {projects.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  className="flex-1 flex flex-col items-center justify-center text-center"
                >
                  <div className="text-6xl mb-5">✦</div>
                  <p className="text-lg font-black text-white mb-2">Your pipeline is empty</p>
                  <p className="text-sm text-slate-500 max-w-xs mb-8">Add your first content idea and it will appear as a card here.</p>
                  <motion.button
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={() => setIsQuickAddOpen(true)}
                    className="flex items-center gap-2.5 px-8 py-4 bg-white text-black font-black text-sm rounded-full shadow-xl"
                  >
                    <Plus size={18} strokeWidth={3} /> Create your first content idea
                  </motion.button>
                </motion.div>
              ) : (
                <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={closestCorners}>
                  {Object.entries(STATUS_CONFIG).map(([statusKey, config]) => (
                    <DroppableColumn key={statusKey} id={statusKey} config={config}
                      projects={filteredProjects.filter(p => p.status === statusKey)}
                      onProjectClick={p => setSelectedId(p.id)}
                    />
                  ))}
                  <DragOverlay dropAnimation={{ duration: 220, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
                    {activeDragItem ? (
                      <ProjectCard project={activeDragItem} isPipeline isDragging onClick={() => {}} style={{ width: 340, opacity: 1, boxShadow: '0 30px 60px rgba(109,40,217,0.3)' }} />
                    ) : null}
                  </DragOverlay>
                </DndContext>
              )}
            </motion.div>
          )}

        </AnimatePresence>

        {/* Quick Add Button */}
        {view !== 'landing' && view !== 'auth' && (
          <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}
            onClick={() => setIsQuickAddOpen(true)}
            className="fixed bottom-6 right-6 md:bottom-12 md:right-12 w-14 h-14 md:w-20 md:h-20 bg-white text-black rounded-full shadow-2xl flex items-center justify-center z-[150] hover:shadow-violet-500/20 transition-shadow"
          >
            <Plus size={28} strokeWidth={3} className="md:hidden" />
            <Plus size={40} strokeWidth={3} className="hidden md:block" />
          </motion.button>
        )}
      </main>

      {/* Quick Add Modal */}
      <QuickAddModal isOpen={isQuickAddOpen} onClose={() => setIsQuickAddOpen(false)} onAdd={handleAddProject} />

      {/* Detail Panel */}
      <AnimatePresence>
        {selected && (
          <DetailPanel
            key={selected.id}
            project={selected}
            onClose={() => setSelectedId(null)}
            onChange={(changes) => updateProject(selected.id, changes)}
            onDelete={handleDelete}
            onRemix={handleRemix}
            onFileUpload={handleFileUpload}
            driveToken={driveToken}
            setDriveToken={setDriveToken}
            uploadProgress={uploadProgress}
            downloading={downloading}
            onZipDownload={handleZipDownload}
            onConnectDrive={handleConnectDrive}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
