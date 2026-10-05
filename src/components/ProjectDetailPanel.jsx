import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X, Pencil, ClipboardList, Copy, Check, Hash, ImageIcon, Upload, Layers, GripVertical, Trash2, Wand2, RefreshCw } from 'lucide-react';
import { STATUS_CONFIG, CLIP_ROLES, timeAgo } from '../constants';
import ExecutionMode from './ExecutionMode';
import SelectDropdown from './SelectDropdown';
import AICaptionModal from './AICaptionModal';
import { showToast } from '../utils/toast';
import { DndContext, DragOverlay, closestCorners, useDraggable, useDroppable, MouseSensor, TouchSensor, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// AI Services
import { generateCaptions } from '../services/ai/captionService.js';
import { generateHashtags } from '../services/ai/hashtagService.js';
import { rewriteCaption } from '../services/ai/rewriteService.js';
import { generateHooks } from '../services/ai/hookService.js';

/* ─── Sortable clip row (IN SEQUENCE section) ──────────────────────────────── */
const SortableClipRow = ({ asset, idx, onRoleChange, onRemove }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: asset.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };
  const role = CLIP_ROLES[asset.role] ?? CLIP_ROLES.unassigned;
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.04] border border-white/10 mb-2 relative">
      {/* Sequence number */}
      <div className="w-7 h-7 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-[10px] font-black text-violet-400 shrink-0">
        {idx + 1}
      </div>
      {/* Open Button / Preview */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          if (asset.driveId) window.open(`https://drive.google.com/file/d/${asset.driveId}/view`);
        }}
        className="relative w-11 h-11 rounded-xl bg-white/[0.03] hover:border-violet-500/50 transition-colors flex flex-col items-center justify-center shrink-0 border border-white/10 group cursor-pointer overflow-hidden"
        title={asset.driveId ? "Open in Drive" : "No Drive Link"}
      >
        {asset.preview ? (
          <>
            <img src={asset.preview} alt={asset.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
               <span className="text-[8px] font-black uppercase text-white shadow-sm">Open</span>
            </div>
          </>
        ) : (
          <>
            <ImageIcon size={14} className="text-slate-500 group-hover:text-violet-400 transition-colors" />
            <span className="text-[8px] font-black uppercase mt-0.5 opacity-60 group-hover:opacity-100 group-hover:text-violet-400 transition-colors">Open</span>
          </>
        )}
      </div>
      {/* Info */}
      <div className="flex-1 min-w-0">
        {/* Role pills */}
        <div className="flex gap-1 mb-1">
          {['hook', 'body', 'ending', 'optional'].map(rk => (
            <button
              key={rk}
              onClick={() => onRoleChange(rk)}
              className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full border transition-all ${
                asset.role === rk ? 'text-white border-transparent' : 'bg-transparent border-white/10 text-slate-700 hover:text-slate-400'
              }`}
              style={asset.role === rk ? { backgroundColor: `${CLIP_ROLES[rk].color}25`, borderColor: `${CLIP_ROLES[rk].color}50`, color: CLIP_ROLES[rk].color } : {}}
            >
              {CLIP_ROLES[rk].label}
            </button>
          ))}
        </div>
        <p className="text-[11px] font-bold text-white truncate">{asset.name || `clip-${idx + 1}`}</p>
      </div>
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="p-1.5 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-white/5 transition-colors cursor-grab active:cursor-grabbing shrink-0"
        title="Drag to reorder"
      >
        <GripVertical size={14} />
      </button>
      {/* Remove from sequence */}
      <button
        onClick={onRemove}
        className="p-1.5 rounded-lg text-slate-700 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
        title="Remove from sequence"
      >
        <X size={12} />
      </button>
    </div>
  );
};



/* ─── Detail Panel ─────────────────────────────────────────────────────────── */
/**
 * Self-contained panel that handles all inline editing.
 * Uses local state for fast/instant feel, synced to parent via `onChange`.
 */
export default function DetailPanel({ project, onClose, onChange, onDelete, onRemix, onFileUpload, driveToken, setDriveToken, uploadProgress, downloading, onZipDownload, onConnectDrive }) {
  const [titleEditing, setTitleEditing] = useState(false);
  const [titleValue, setTitleValue] = useState(project.title);
  const [captionValue, setCaptionValue] = useState(project.caption || '');
  const [tagInput, setTagInput] = useState('');
  const [captionCopied, setCaptionCopied] = useState(false);
  const [hashtagsCopied, setHashtagsCopied] = useState(false);
  const [showExecution, setShowExecution] = useState(false);

  const titleRef = useRef(null);
  const captionDebounceRef = useRef(null);

  // AI Loading states
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const [isGeneratingHooks, setIsGeneratingHooks] = useState(false);
  const [hooksGenerated, setHooksGenerated] = useState([]);
  const [isCaptionModalOpen, setIsCaptionModalOpen] = useState(false);

  /* AI Handlers */
  const handleCaptionApply = (captionText, newTags, aiContext, hooks) => {
    setCaptionValue(captionText);
    const existing = project.hashtags || [];
    const mergedTags = Array.from(new Set([...existing, ...newTags])).slice(0, 30);
    if (hooks && hooks.length > 0) setHooksGenerated(hooks);
    commit({ 
      caption: captionText, 
      hashtags: mergedTags,
      aiContext,
      ...(hooks && hooks.length > 0 ? { hooks } : {})
    });
    showToast("Smart Caption & Hooks Applied!", 'success');
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
      setHooksGenerated(result.split('\n').filter(Boolean));
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


  // Sync local state when a different project is opened
  useEffect(() => {
    setTitleValue(project.title);
    setCaptionValue(project.caption || '');
    setTitleEditing(false);
    setTagInput('');
    setShowExecution(false);
    setHooksGenerated(project.hooks || []);
  }, [project.id]);

  useEffect(() => {
    if (titleEditing && titleRef.current) titleRef.current.focus();
  }, [titleEditing]);

  const commit = useCallback((changes) => {
    onChange({ ...changes, lastEdited: Date.now() });
  }, [onChange]);

  /* Title */
  const saveTitle = () => {
    const trimmed = titleValue.trim();
    if (trimmed.length > 100) {
      showToast("Title too long (max 100 chars)");
      return;
    }
    if (trimmed && trimmed !== project.title) commit({ title: trimmed });
    else setTitleValue(project.title);
    setTitleEditing(false);
  };

  /* Caption */
  const handleCaptionChange = (val) => {
    if (val.length > 2000) {
      showToast("Caption too long (max 2000 chars)");
      return;
    }
    setCaptionValue(val);
    clearTimeout(captionDebounceRef.current);
    captionDebounceRef.current = setTimeout(() => commit({ caption: val }), 600);
  };

  /* Status */
  const handleStatusChange = (newStatus) => { commit({ status: newStatus }); };

  /* Hashtags */
  const addTag = () => {
    const tag = tagInput.trim().replace(/^#/, '').toLowerCase();
    if (!tag) return;
    const existing = project.hashtags || [];
    if (existing.length >= 30) {
      showToast("Max 30 hashtags allowed");
      return;
    }
    if (existing.includes(tag)) { setTagInput(''); return; }
    commit({ hashtags: [...existing, tag] });
    setTagInput('');
  };
  const removeTag = (tag) => {
    commit({ hashtags: (project.hashtags || []).filter(t => t !== tag) });
  };

  /* Asset helpers */
  const updateAsset = useCallback((assetId, changes) => {
    const updated = (project.assets || []).map(a =>
      (typeof a === 'object' && a.id === assetId) ? { ...a, ...changes } : a
    );
    commit({ assets: updated });
  }, [project.assets, commit]);

  const removeAsset = useCallback((assetId) => {
    commit({ assets: (project.assets || []).filter(a => typeof a === 'object' ? a.id !== assetId : true) });
  }, [project.assets, commit]);

  /* Sensors for the sequence DnD-sort */
  const sequenceSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  /* Execution sequence: selected assets sorted by role priority */
  const execSequence = useMemo(() => {
    return (project.assets || [])
      .filter(a => typeof a === 'object' && a.selected)
      .sort((a, b) => (CLIP_ROLES[a.role]?.priority ?? 99) - (CLIP_ROLES[b.role]?.priority ?? 99));
  }, [project.assets]);

  /* Sequence number map */
  const seqMap = useMemo(() => {
    const m = {};
    execSequence.forEach((a, i) => { m[a.id] = i + 1; });
    return m;
  }, [execSequence]);

  const statusCfg = STATUS_CONFIG[project.status];

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200]"
      />

      {/* Panel */}
      <div className="fixed inset-0 z-[210] flex items-center justify-center pointer-events-none p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-full max-w-[820px] max-h-[100dvh] sm:max-h-[88vh] bg-[#121214] border-0 sm:border border-white/10 rounded-none sm:rounded-[40px] overflow-y-auto scrollbar-hide flex flex-col shadow-2xl pointer-events-auto"
        >
          {/* ── Header ── */}
          <div className="flex justify-between items-center px-5 sm:px-12 pt-6 sm:pt-10 pb-4 sm:pb-6 shrink-0">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-[10px] font-black text-violet-400 uppercase tracking-[0.2em]">
                FILE_ID: {project.id.toString().slice(-4)}
              </div>
              <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                {timeAgo(project.lastEdited)}
              </div>

              {/* Status dropdown */}
              <SelectDropdown
                variant="status"
                value={project.status}
                onChange={handleStatusChange}
                options={Object.entries(STATUS_CONFIG).map(([k, v]) => ({ value: k, label: v.label, color: v.color }))}
              />
            </div>

            <button onClick={onClose} className="p-2.5 rounded-2xl hover:bg-white/5 transition-colors text-slate-500 hover:text-white flex-shrink-0">
              <X size={24} />
            </button>
          </div>

          {/* ── Title + Progress ── */}
          <div className="px-5 sm:px-12 pb-5 sm:pb-8 shrink-0">
            <div className="flex items-center gap-2 mb-3 text-violet-400">
              <Zap size={14} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">
                Next Step: {statusCfg.next}
              </span>
            </div>

            {/* Inline editable title */}
            {titleEditing ? (
              <input
                ref={titleRef}
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={(e) => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') { setTitleValue(project.title); setTitleEditing(false); } }}
                className="w-full text-2xl sm:text-4xl font-black text-white tracking-tighter leading-tight bg-transparent border-b border-violet-500/50 outline-none pb-1 mb-5 caret-violet-400"
                style={{ fontFamily: 'inherit' }}
              />
            ) : (
              <div
                className="group flex items-start gap-3 mb-5 cursor-text"
                onClick={() => setTitleEditing(true)}
              >
                <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tighter leading-tight flex-1">
                  {project.title}
                </h2>
                <Pencil size={16} className="text-white/0 group-hover:text-slate-500 transition-colors mt-2 flex-shrink-0" />
              </div>
            )}

            {/* Progress bar */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-[3px] bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${(statusCfg.step / 5) * 100}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">
                Stage {statusCfg.step} / 5
              </span>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="px-5 sm:px-12 pb-8 sm:pb-12 flex flex-col gap-6 sm:gap-8">

            {/* Caption — editable textarea */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-2">
                  <ClipboardList size={12} /> Caption
                </h5>
                <div className="flex items-center gap-2">
                  <button onClick={() => setIsCaptionModalOpen(true)} className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border bg-violet-500/10 border-violet-500/20 text-violet-400 hover:bg-violet-500/20 transition-all">
                    <Wand2 size={9} /> Smart AI Caption
                  </button>
                  <button onClick={handleRewriteCaption} disabled={isRewriting || !captionValue} className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border bg-white/[0.03] border-white/10 text-slate-500 hover:text-white hover:border-white/20 transition-all disabled:opacity-50">
                    <RefreshCw size={9} /> {isRewriting ? '...' : 'Rewrite'}
                  </button>
                  <button
                  onClick={() => {
                    navigator.clipboard.writeText(captionValue);
                    setCaptionCopied(true);
                    setTimeout(() => setCaptionCopied(false), 1500);
                  }}
                  className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border transition-all ${
                    captionCopied
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      : 'bg-white/[0.03] border-white/10 text-slate-500 hover:text-white hover:border-white/20'
                  }`}
                >
                  {captionCopied ? <><Check size={9} /> Copied!</> : <><Copy size={9} /> Copy</>}
                </button>
              </div>
            </div>
            <textarea
                value={captionValue}
                onChange={(e) => handleCaptionChange(e.target.value)}
                placeholder="Write your caption, ideas, script notes…"
                rows={4}
                className="w-full bg-black/40 border border-white/5 rounded-[24px] p-6 text-sm text-slate-300 leading-relaxed resize-none outline-none focus:border-violet-500/40 transition-colors placeholder-slate-600 scrollbar-hide"
              />
            </section>

            {/* Hashtags */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-2">
                  <Hash size={12} /> Hashtags
                </h5>
                <div className="flex items-center gap-2">
                  <button onClick={handleGenerateTags} disabled={isGeneratingTags} className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border bg-violet-500/10 border-violet-500/20 text-violet-400 hover:bg-violet-500/20 transition-all disabled:opacity-50">
                    <Wand2 size={9} /> {isGeneratingTags ? 'Gen...' : 'AI Tags'}
                  </button>
                  <button
                  onClick={() => {
                    const text = (project.hashtags || []).map(t => `#${t}`).join(' ');
                    navigator.clipboard.writeText(text);
                    setHashtagsCopied(true);
                    setTimeout(() => setHashtagsCopied(false), 1500);
                  }}
                  className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border transition-all ${
                    hashtagsCopied
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      : 'bg-white/[0.03] border-white/10 text-slate-500 hover:text-white hover:border-white/20'
                  }`}
                >
                  {hashtagsCopied ? <><Check size={9} /> Copied!</> : <><Copy size={9} /> Copy All</>}
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
                {(project.hashtags || []).map((tag) => (
                  <motion.span
                    key={tag}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    className="inline-flex items-center gap-1.5 bg-violet-500/10 border border-violet-500/20 text-violet-300 text-[11px] font-bold px-3 py-1 rounded-full"
                  >
                    #{tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="text-violet-400/50 hover:text-violet-300 transition-colors leading-none"
                    >
                      <X size={10} />
                    </button>
                  </motion.span>
                ))}
                {/* Tag input */}
                <div className="inline-flex items-center gap-1 bg-white/[0.03] border border-white/10 rounded-full px-3 py-1 focus-within:border-violet-500/40 transition-colors">
                  <span className="text-slate-600 text-[11px] font-bold">#</span>
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value.replace(/\s/g, ''))}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); } }}
                    placeholder="add tag"
                    className="bg-transparent outline-none text-[11px] text-slate-400 placeholder-slate-600 w-20 font-bold"
                  />
                </div>
              </div>
              <p className="text-[9px] text-slate-600 uppercase tracking-widest">Press Enter to add · Click × to remove</p>
            </section>

            {/* Video Hooks */}
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

            {/* ── Asset Buffer ── */}
            <section>
              {/* Section header */}
              <div className="flex items-center justify-between mb-4">
                <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-2">
                  <ImageIcon size={12} /> Clip Sequence
                </h5>
                {execSequence.length > 0 && (
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[9px] font-black text-violet-400 bg-violet-500/5 border border-violet-500/15 px-2.5 py-1 rounded-full whitespace-nowrap shrink-0">
                      {execSequence.length} in sequence
                    </span>
                    <button
                      onClick={() => onZipDownload(execSequence)}
                      disabled={downloading}
                      className="text-[9px] font-black text-white bg-violet-500 hover:bg-violet-400 px-3 py-1 rounded-full transition-colors flex items-center gap-1.5 shadow-lg shadow-violet-500/20 disabled:opacity-50 whitespace-nowrap shrink-0"
                    >
                      {downloading ? "Preparing ZIP..." : "Download All"}
                    </button>
                  </div>
                )}
              </div>

              {driveToken ? (
                <label className={`flex items-center gap-3 p-3 rounded-[18px] bg-white/[0.025] border border-dashed border-white/10 hover:border-violet-500/40 hover:bg-violet-500/5 cursor-pointer group transition-all mb-5 ${uploadProgress.active ? 'opacity-50 pointer-events-none' : ''}`}>
                  <input type="file" className="hidden" accept="image/*,video/*" onChange={onFileUpload} multiple disabled={uploadProgress.active} />
                  <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-violet-500/10 transition-colors shrink-0">
                    <Upload size={15} className="text-slate-500 group-hover:text-violet-400 transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-slate-400 group-hover:text-white transition-colors truncate">
                      {uploadProgress.active ? `Uploading ${uploadProgress.current} of ${uploadProgress.total}` : "Upload Clips"}
                    </p>
                    <p className="text-[9px] text-slate-600 uppercase tracking-widest mt-0.5 truncate">
                      {uploadProgress.active ? uploadProgress.fileName : "Images · Videos · Multiple"}
                    </p>
                  </div>
                </label>
              ) : (
                <button onClick={onConnectDrive} className="w-full mb-5 flex items-center gap-3 p-3 rounded-[18px] bg-violet-500/10 border border-violet-500/20 hover:bg-violet-500/20 transition-all text-left">
                  <div className="w-9 h-9 rounded-xl bg-violet-500/20 flex items-center justify-center shrink-0">
                    <Layers size={15} className="text-violet-400" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-violet-300">Connect Google Drive</p>
                    <p className="text-[9px] text-violet-400/60 uppercase tracking-widest mt-0.5">Required for Upload</p>
                  </div>
                </button>
              )}

              {/* ── IN SEQUENCE ── */}
              {execSequence.length > 0 && (
                <div className="mb-5">
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] mb-2.5">In Sequence</p>
                  <DndContext
                    sensors={sequenceSensors}
                    onDragEnd={({ active, over }) => {
                      if (!over || active.id === over.id) return;
                      const oldIndex = execSequence.findIndex(a => a.id === active.id);
                      const newIndex = execSequence.findIndex(a => a.id === over.id);
                      const reordered = arrayMove(execSequence, oldIndex, newIndex);
                      // Rebuild full assets array: reordered selected + unselected untouched
                      const unselected = (project.assets || []).filter(a => typeof a === 'object' && !a.selected);
                      commit({ assets: [...reordered, ...unselected] });
                    }}
                  >
                    <SortableContext items={execSequence.map(a => a.id)} strategy={verticalListSortingStrategy}>
                      {execSequence.map((asset, idx) => (
                        <SortableClipRow
                          key={asset.id}
                          asset={asset}
                          idx={idx}
                          onRoleChange={rk => updateAsset(asset.id, { role: rk })}
                          onRemove={() => updateAsset(asset.id, { selected: false })}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                </div>
              )}

              {/* ── OTHER CLIPS ── */}
              {(project.assets || []).filter(a => typeof a === 'object' && !a.selected).length > 0 && (
                <div className="mb-4">
                  <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.3em] mb-2.5">Other Clips</p>
                  <div className="flex flex-col gap-1.5">
                    {(project.assets || []).filter(a => typeof a === 'object' && !a.selected).map(asset => (
                      <motion.div
                        key={asset.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-[14px] bg-transparent border border-white/[0.04] opacity-50 hover:opacity-80 transition-opacity"
                      >
                        {/* Tiny Open Button / Preview */}
                        <div 
                          onClick={() => {
                              if (asset.driveId) window.open(`https://drive.google.com/file/d/${asset.driveId}/view`);
                          }}
                          className="relative w-8 h-8 rounded-lg bg-white/5 hover:border-violet-500/50 flex items-center justify-center shrink-0 border border-white/10 group cursor-pointer overflow-hidden"
                          title={asset.driveId ? "Open in Drive" : "No Drive Link"}
                        >
                          {asset.preview ? (
                            <>
                              <img src={asset.preview} alt={asset.name} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                 <ImageIcon size={10} className="text-white drop-shadow-md" />
                              </div>
                            </>
                          ) : (
                            <ImageIcon size={12} className="text-slate-500 group-hover:text-violet-400 transition-colors" />
                          )}
                        </div>
                        {/* Name */}
                        <p className="text-[11px] font-bold text-slate-500 truncate flex-1">{asset.name || 'Unnamed'}</p>
                        {/* Role selector — compact */}
                        <div className="flex gap-1">
                          {['hook','body','ending'].map(rk => (
                            <button
                              key={rk}
                              onClick={() => updateAsset(asset.id, { role: rk })}
                              className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full border transition-all ${
                                asset.role === rk
                                  ? 'text-white border-transparent'
                                  : 'bg-transparent border-white/10 text-slate-700 hover:text-slate-400'
                              }`}
                              style={asset.role === rk ? { backgroundColor: `${CLIP_ROLES[rk].color}25`, borderColor: `${CLIP_ROLES[rk].color}50`, color: CLIP_ROLES[rk].color } : {}}
                            >
                              {CLIP_ROLES[rk].label}
                            </button>
                          ))}
                        </div>
                        {/* Add to sequence */}
                        <button
                          onClick={() => updateAsset(asset.id, { selected: true })}
                          className="shrink-0 text-[8px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 hover:bg-violet-500/20 transition-all"
                        >
                          + Add
                        </button>
                        {/* Remove */}
                        <button
                          onClick={() => removeAsset(asset.id)}
                          className="p-1 rounded-lg hover:bg-red-500/10 text-slate-700 hover:text-red-400 transition-colors shrink-0"
                        >
                          <X size={10} />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {(project.assets || []).filter(a => typeof a === 'object').length === 0 && (
                <div className="text-center py-8 text-slate-700">
                  <ImageIcon size={24} className="mx-auto mb-2 opacity-40" />
                  <p className="text-[10px] uppercase tracking-widest font-black">No clips yet</p>
                  <p className="text-[9px] mt-1 text-slate-700">Upload clips above to build your sequence</p>
                </div>
              )}

              {/* Open Execution Plan CTA */}
              {execSequence.length > 0 && (
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => setShowExecution(true)}
                  className="w-full mt-2 py-4 bg-violet-500 text-white font-black text-xs rounded-[18px] flex items-center justify-center gap-2 hover:bg-violet-400 transition-all uppercase tracking-wider shadow-lg shadow-violet-500/20"
                >
                  <Zap size={13} /> Open Execution Plan
                </motion.button>
              )}
            </section>
          </div>

          {/* ── Footer Actions ── */}
          <div className="px-5 sm:px-12 pb-8 sm:pb-10 pt-5 sm:pt-6 border-t border-white/5 flex gap-3 shrink-0">
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => { onRemix(project); onClose(); }}
              className="flex-1 h-14 bg-white text-black font-black text-sm rounded-[20px] flex items-center justify-center gap-2.5 shadow-xl"
            >
              <Copy size={18} /> Remix Project
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => onDelete(project.id)}
              className="w-14 h-14 bg-red-500/10 text-red-500 rounded-[20px] border border-red-500/20 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
            >
              <Trash2 size={18} />
            </motion.button>
          </div>
        </motion.div>
      </div>
      {/* Execution Mode overlay */}
      {showExecution && <ExecutionMode project={project} onClose={() => setShowExecution(false)} />}
      <AICaptionModal 
        isOpen={isCaptionModalOpen} 
        onClose={() => setIsCaptionModalOpen(false)} 
        project={project} 
        onApply={handleCaptionApply} 
      />
    </>
  );
}

