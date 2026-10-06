export const STATUS_CONFIG = {
  IDEA: { label: 'Idea', color: '#94a3b8', next: 'Start shooting', step: 1 },
  SHOOTING: { label: 'Shooting', color: '#eab308', next: 'Upload clips', step: 2 },
  EDITING: { label: 'Editing', color: '#3b82f6', next: 'Finalize edit', step: 3 },
  READY: { label: 'Ready', color: '#22c55e', next: 'Prepare to post', step: 4 },
  POSTED: { label: 'Posted', color: '#6C5CE7', next: 'Analyze performance', step: 5 }
};

export const CLIP_ROLES = {
  hook:       { label: 'Hook',       color: '#f59e0b', priority: 1 },
  body:       { label: 'Body',       color: '#6366f1', priority: 2 },
  ending:     { label: 'Ending',     color: '#10b981', priority: 3 },
  optional:   { label: 'B-roll',     color: '#94a3b8', priority: 4 },
  unassigned: { label: 'Unassigned', color: '#475569', priority: 99 },
};

export const ROLE_ORDER = ['hook', 'body', 'ending', 'optional', 'unassigned'];

const _now = Date.now();
export const INITIAL_DATA = [
  { id: 1, title: 'The Future of Minimalism', status: 'EDITING', type: 'YouTube Video', createdAt: _now - 7 * 86400000, lastEdited: _now - 2 * 3600000, thumbnail: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?q=80&w=800', caption: 'Exploring minimalism in digital products.', hashtags: ['minimalism', 'design', 'youtube'], assets: [] },
  { id: 2, title: 'Studio Setup Tour', status: 'READY', type: 'Instagram Reel', createdAt: _now - 5 * 86400000, lastEdited: _now - 5 * 3600000, thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=800', caption: 'New workspace walkthrough.', hashtags: ['studio', 'setup'], assets: [] },
  { id: 3, title: 'Productivity Hacks', status: 'IDEA', type: 'Newsletter', createdAt: _now - 3 * 86400000, lastEdited: _now - 24 * 3600000, thumbnail: null, caption: 'Systems for solo creators.', hashtags: ['productivity', 'creator'], assets: [] },
  { id: 4, title: 'Morning Routine 2024', status: 'SHOOTING', type: 'TikTok', createdAt: _now - 10 * 86400000, lastEdited: _now - 3 * 24 * 3600000, thumbnail: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1000&auto=format&fit=crop', caption: 'Maximize the first hour of your day.', hashtags: ['morning', 'routine', 'tiktok'], assets: [] }
];

/* ─── Safe localStorage helpers ────────────────────────────────────────────── */
export const STORAGE_KEYS = {
  PROJECTS: 'flowgen_projects',
  VIEW:     'flowgen_view',
};

export const loadProjects = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    if (!raw) return INITIAL_DATA;
    const parsed = JSON.parse(raw);
    // Basic shape validation
    if (!Array.isArray(parsed)) return INITIAL_DATA;
    return parsed.map(p => ({
      ...p,
      hashtags: Array.isArray(p.hashtags) ? p.hashtags : [],
      assets:   Array.isArray(p.assets)   ? p.assets   : [],
      createdAt:  p.createdAt  ?? p.lastEdited ?? Date.now(),
      lastEdited: p.lastEdited ?? Date.now(),
    }));
  } catch {
    return INITIAL_DATA;
  }
};

export const loadView = () => {
  try { return localStorage.getItem(STORAGE_KEYS.VIEW) || 'pipeline'; }
  catch { return 'pipeline'; }
};

export const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - date) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";
  return "Just now";
};

// WebGL Helpers
export const hexToRgb = hex => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255] : [1, 1, 1];
};

export const getAnchorAndDir = (origin, w, h) => {
  const outside = 0.2;
  switch (origin) {
    case 'top-left': return { anchor: [0, -outside * h], dir: [0, 1] };
    case 'top-right': return { anchor: [w, -outside * h], dir: [0, 1] };
    case 'left': return { anchor: [-outside * w, 0.5 * h], dir: [1, 0] };
    case 'right': return { anchor: [(1 + outside) * w, 0.5 * h], dir: [-1, 0] };
    case 'bottom-left': return { anchor: [0, (1 + outside) * h], dir: [0, -1] };
    case 'bottom-center': return { anchor: [0.5 * w, (1 + outside) * h], dir: [0, -1] };
    case 'bottom-right': return { anchor: [w, (1 + outside) * h], dir: [0, -1] };
    default: return { anchor: [0.5 * w, -outside * h], dir: [0, 1] };
  }
};

/* ─── Developer & Integrity Helpers ────────────────────────────────────────── */

export const devLog = (event, payload) => {
  if (import.meta.env.DEV) {
    if (event.includes("failed") || event.includes("expired") || event.includes("error")) {
      console.error(`[Flowgen DevLog] ${event}:`, payload);
    } else {
      console.log(`[Flowgen DevLog] ${event}:`, payload);
    }
  }
};

export const sanitizeProject = (rawData, docId) => {
  if (!rawData || typeof rawData !== "object") return null;
  
  const idStr = String(rawData.id || docId || Date.now());
  const idNum = idStr.match(/^\d+$/) ? Number(idStr) : idStr;
  
  const sanitizeAssets = (assets) => {
    if (!Array.isArray(assets)) return [];
    return assets.filter(a => a && typeof a === 'object' && a.id).map(a => ({
      id: a.id,
      name: a.name || 'Unnamed',
      role: a.role || 'unassigned',
      selected: Boolean(a.selected),
      order: typeof a.order === 'number' ? a.order : 0,
      driveId: a.driveId || null,
      preview: a.preview || null
    }));
  };

  const repaired = {
    id: idNum,
    title: rawData.title || `Project ${idStr.slice(-4)}`,
    status: rawData.status && STATUS_CONFIG[rawData.status] ? rawData.status : 'IDEA',
    type: rawData.type || 'Content',
    caption: rawData.caption || '',
    hashtags: Array.isArray(rawData.hashtags) ? rawData.hashtags : [],
    thumbnail: rawData.thumbnail || null,
    assets: sanitizeAssets(rawData.assets),
    createdAt: typeof rawData.createdAt === 'number' ? rawData.createdAt : Date.now(),
    lastEdited: typeof rawData.lastEdited === 'number' ? rawData.lastEdited : Date.now(),
  };
  
  // Checking for severe corruption if you want to skip completely:
  // Since we supply safe defaults (Date.now(), 'IDEA'), it will barely ever be invalid
  // If we really wanted to skip, we could check if both title and assets were completely mangled.

  return repaired;
};
