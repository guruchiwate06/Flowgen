export const STATUS_CONFIG = {
  IDEA: { label: 'Idea', color: '#94a3b8', next: 'Start shooting' },
  SHOOTING: { label: 'Shooting', color: '#eab308', next: 'Upload clips' },
  EDITING: { label: 'Editing', color: '#3b82f6', next: 'Finalize edit' },
  READY: { label: 'Ready', color: '#22c55e', next: 'Prepare to post' },
  POSTED: { label: 'Posted', color: '#6C5CE7', next: 'Analyze performance' }
};

export const INITIAL_DATA = [
  { id: 1, title: 'The Future of Minimalism', status: 'EDITING', type: 'YouTube Video', updated: '2h ago', thumbnail: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?q=80&w=800', caption: 'Exploring minimalism in digital products.', assets: [1, 2] },
  { id: 2, title: 'Studio Setup Tour', status: 'READY', type: 'Instagram Reel', updated: '5h ago', thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=800', caption: 'New workspace walkthrough.', assets: [3] },
  { id: 3, title: 'Productivity Hacks', status: 'IDEA', type: 'Newsletter', updated: '1d ago', thumbnail: null, caption: 'Systems for solo creators.', assets: [] },
  { id: 4, title: 'Morning Routine 2024', status: 'SHOOTING', type: 'TikTok', updated: '3d ago', thumbnail: 'https://images.unsplash.com/photo-1507133750040-4a8f5700ed3e?q=80&w=800', caption: 'Maximize the first hour of your day.', assets: [4, 5] }
];

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
