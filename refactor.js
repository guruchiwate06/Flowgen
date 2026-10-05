import fs from 'fs';

const appPath = './src/App.jsx';
let appCode = fs.readFileSync(appPath, 'utf8');

// The exact markers
const sortableStart = '/* ─── Sortable clip row (IN SEQUENCE section) ──────────────────────────────── */';
const mainAppStart = '/* ─── Main App ─────────────────────────────────────────────────────────────── */';

const sortableIdx = appCode.indexOf(sortableStart);
const mainAppIdx = appCode.indexOf(mainAppStart);

const extractedCode = appCode.slice(sortableIdx, mainAppIdx);
// Remove extractedCode from App.jsx, but leave the marker
appCode = appCode.slice(0, sortableIdx) + "\nimport DetailPanel from './components/ProjectDetailPanel';\n\n" + appCode.slice(mainAppIdx);

// Now let's transform extractedCode
let panelCode = `import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X, Pencil, ClipboardList, Copy, Check, Hash, ImageIcon, Upload, Layers, GripVertical, Trash2, Wand2, RefreshCw } from 'lucide-react';
import { STATUS_CONFIG, CLIP_ROLES, timeAgo } from '../constants';
import ExecutionMode from './ExecutionMode';
import SelectDropdown from './SelectDropdown';
import { showToast } from '../App';
import { DndContext, DragOverlay, closestCorners, useDraggable, useDroppable, MouseSensor, TouchSensor, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// AI Services
import { generateCaptions } from '../services/ai/captionService.js';
import { generateHashtags } from '../services/ai/hashtagService.js';
import { rewriteCaption } from '../services/ai/rewriteService.js';
import { generateHooks } from '../services/ai/hookService.js';

${extractedCode}`;

// Replace `const DetailPanel =` with `export default function DetailPanel(`
panelCode = panelCode.replace('const DetailPanel = ({ project', 'export default function DetailPanel({ project');
// Fix `});` at the end if it was arrow function to `}`
// The original was `const DetailPanel = ({...}) => { ... };` so replacing `const DetailPanel = ({ project` with `export default function DetailPanel({ project` and we need to fix `}) => {` to `}) {`
panelCode = panelCode.replace('export default function DetailPanel({ project', 'export default function DetailPanel({ project');
panelCode = panelCode.replace('onConnectDrive }) => {', 'onConnectDrive }) {');
// At the very end of DetailPanel it was `};` we can leave it or it will just be a syntax warning. Actually it's `};` we should replace it with `}`
panelCode = panelCode.replace('    </>\n  );\n};', '    </>\n  );\n}');

// Add AI states
const stateInjection = `
  const titleRef = useRef(null);
  const captionDebounceRef = useRef(null);

  // AI Loading states
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const [isGeneratingHooks, setIsGeneratingHooks] = useState(false);
  const [hooksGenerated, setHooksGenerated] = useState([]);

  /* AI Handlers */
  const handleGenerateCaption = async () => {
    if (!titleValue) return showToast("Project title is required for context", 'error');
    setIsGeneratingCaption(true);
    try {
      const result = await generateCaptions(titleValue);
      handleCaptionChange(result);
      showToast("Caption generated successfully", 'success');
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setIsGeneratingCaption(false);
    }
  };

  const handleRewriteCaption = async () => {
    if (!captionValue) return showToast("Write a caption to rewrite", 'error');
    setIsRewriting(true);
    try {
      const result = await rewriteCaption(captionValue, 'engaging');
      handleCaptionChange(result);
      showToast("Caption rewritten successfully", 'success');
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setIsRewriting(false);
    }
  };

  const handleGenerateHooks = async () => {
    if (!titleValue) return showToast("Project title is required for context", 'error');
    setIsGeneratingHooks(true);
    try {
      const result = await generateHooks(titleValue);
      setHooksGenerated(result.split('\\n').filter(Boolean));
      showToast("Hooks generated successfully", 'success');
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setIsGeneratingHooks(false);
    }
  };

  const handleGenerateTags = async () => {
    if (!titleValue) return showToast("Project title is required for context", 'error');
    setIsGeneratingTags(true);
    try {
      const result = await generateHashtags(titleValue);
      const tags = result.split(' ').map(t => t.replace('#', '').trim()).filter(Boolean);
      const existing = project.hashtags || [];
      const newTags = Array.from(new Set([...existing, ...tags])).slice(0, 30);
      commit({ hashtags: newTags });
      showToast("Hashtags generated successfully", 'success');
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setIsGeneratingTags(false);
    }
  };
`;
panelCode = panelCode.replace('  const titleRef = useRef(null);\n  const captionDebounceRef = useRef(null);', stateInjection);

// Update reset effect
const effectToReplace = `  useEffect(() => {
    setTitleValue(project.title);
    setCaptionValue(project.caption || '');
    setTitleEditing(false);
    setTagInput('');
    setShowExecution(false);
  }, [project.id]);`;

const effectReplacement = `  useEffect(() => {
    setTitleValue(project.title);
    setCaptionValue(project.caption || '');
    setTitleEditing(false);
    setTagInput('');
    setShowExecution(false);
    setHooksGenerated([]);
  }, [project.id]);`;
panelCode = panelCode.replace(effectToReplace, effectReplacement);

// UI Replacements
// Caption Header
const captionHeaderReplace = `<h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-2">
                  <ClipboardList size={12} /> Caption
                </h5>
                <button`;
const captionHeaderNew = `<h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-2">
                  <ClipboardList size={12} /> Caption
                </h5>
                <div className="flex items-center gap-2">
                  <button onClick={handleGenerateCaption} disabled={isGeneratingCaption} className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border bg-violet-500/10 border-violet-500/20 text-violet-400 hover:bg-violet-500/20 transition-all disabled:opacity-50">
                    <Wand2 size={9} /> {isGeneratingCaption ? 'Gen...' : 'AI Caption'}
                  </button>
                  <button onClick={handleRewriteCaption} disabled={isRewriting || !captionValue} className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border bg-white/[0.03] border-white/10 text-slate-500 hover:text-white hover:border-white/20 transition-all disabled:opacity-50">
                    <RefreshCw size={9} /> {isRewriting ? '...' : 'Rewrite'}
                  </button>
                  <button`;
panelCode = panelCode.replace(captionHeaderReplace, captionHeaderNew);
// Fix the closing div for the caption header
panelCode = panelCode.replace('Copy</>}</button>\n              </div>\n              <textarea', 'Copy</>}</button>\n                </div>\n              </div>\n              <textarea');


// Hashtag Header
const hashtagHeaderReplace = `<h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-2">
                  <Hash size={12} /> Hashtags
                </h5>
                <button`;
const hashtagHeaderNew = `<h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-2">
                  <Hash size={12} /> Hashtags
                </h5>
                <div className="flex items-center gap-2">
                  <button onClick={handleGenerateTags} disabled={isGeneratingTags} className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border bg-violet-500/10 border-violet-500/20 text-violet-400 hover:bg-violet-500/20 transition-all disabled:opacity-50">
                    <Wand2 size={9} /> {isGeneratingTags ? 'Gen...' : 'AI Tags'}
                  </button>
                  <button`;
panelCode = panelCode.replace(hashtagHeaderReplace, hashtagHeaderNew);
// Fix closing div for hashtag header
panelCode = panelCode.replace('Copy All</>}</button>\n              </div>\n              <div className="flex flex-wrap gap-2 mb-3">', 'Copy All</>}</button>\n                </div>\n              </div>\n              <div className="flex flex-wrap gap-2 mb-3">');


// Hooks Injection (before Asset Buffer)
const assetBufferReplace = '            {/* ── Asset Buffer ── */}';
const hooksNew = `            {/* Video Hooks */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-2">
                  <Zap size={12} /> Video Hooks
                </h5>
                <button onClick={handleGenerateHooks} disabled={isGeneratingHooks} className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border bg-violet-500/10 border-violet-500/20 text-violet-400 hover:bg-violet-500/20 transition-all disabled:opacity-50">
                  <Wand2 size={9} /> {isGeneratingHooks ? 'Generating...' : 'Generate Hooks'}
                </button>
              </div>
              {hooksGenerated.length > 0 && (
                <div className="flex flex-col gap-2 mb-6">
                  {hooksGenerated.map((hook, idx) => (
                    <div key={idx} className="bg-black/40 border border-white/5 rounded-xl p-3 text-[11px] text-slate-300 font-bold leading-relaxed">
                      {hook}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ── Asset Buffer ── */}`;
panelCode = panelCode.replace(assetBufferReplace, hooksNew);

fs.writeFileSync('./src/components/ProjectDetailPanel.jsx', panelCode);
fs.writeFileSync('./src/App.jsx', appCode);

console.log("Refactoring complete");
