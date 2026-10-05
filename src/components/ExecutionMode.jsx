import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ChevronLeft, ChevronRight,
  Copy, Check, Hash, ClipboardList,
  Image as ImageIcon, Zap, CheckCircle2,
} from 'lucide-react';
import { CLIP_ROLES } from '../constants';

/* ─── small helpers ─────────────────────────────────────────────────────────── */
const useCopy = (timeout = 1500) => {
  const [copied, setCopied] = useState(false);
  const copy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), timeout);
  };
  return [copied, copy];
};

const RoleBadge = ({ roleKey }) => {
  const role = CLIP_ROLES[roleKey] ?? CLIP_ROLES.unassigned;
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-[0.25em]"
      style={{ backgroundColor: `${role.color}18`, border: `1px solid ${role.color}35`, color: role.color }}
    >
      {role.label}
    </span>
  );
};

const ClipPreview = ({ asset, size = 'md' }) => {
  const dim = size === 'lg' ? 'w-full aspect-video' : 'w-14 h-14';
  return asset?.preview ? (
    <div className={`${dim} rounded-2xl overflow-hidden border border-white/10 shrink-0`}>
      <img src={asset.preview} alt={asset.name} className="w-full h-full object-cover" />
    </div>
  ) : (
    <div className={`${dim} rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0`}>
      <ImageIcon size={size === 'lg' ? 32 : 18} className="text-slate-700" />
    </div>
  );
};

/* ─── Plan View (before starting) ───────────────────────────────────────────── */
const PlanView = ({ project, sequence, onStart, onClose }) => {
  const [copiedCaption, copyCaption] = useCopy();
  const [copiedTags, copyTags] = useCopy();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between px-6 sm:px-8 pt-7 pb-5 border-b border-white/[0.06] shrink-0">
        <div>
          <div className="text-[9px] font-black text-violet-400 uppercase tracking-[0.35em] mb-1.5 flex items-center gap-1.5">
            <Zap size={9} /> Execution Plan
          </div>
          <h3 className="text-xl font-black text-white tracking-tight leading-tight">{project.title}</h3>
          {sequence.length > 0 && (
            <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-widest">
              {sequence.length} clip{sequence.length > 1 ? 's' : ''} queued
            </p>
          )}
        </div>
        <button onClick={onClose} className="p-2 rounded-2xl hover:bg-white/5 transition-colors text-slate-500 hover:text-white shrink-0 ml-4">
          <X size={20} />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-6 sm:px-8 py-5 flex flex-col gap-5">

        {/* Sequence */}
        {sequence.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-slate-400 font-bold text-sm mb-1">No clips in sequence</p>
            <p className="text-slate-600 text-xs max-w-xs">
              Go back and select clips in the asset buffer — assign roles (Hook / Body / Ending) and toggle them into the sequence.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {sequence.map((asset, idx) => (
              <motion.div
                key={asset.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.025] border border-white/[0.06]"
              >
                {/* Step number */}
                <div className="w-8 h-8 rounded-xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center text-[11px] font-black text-violet-400 shrink-0">
                  {idx + 1}
                </div>
                {/* Thumbnail */}
                {asset.preview ? (
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 shrink-0">
                    <img src={asset.preview} alt={asset.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-white/[0.03] flex items-center justify-center shrink-0">
                    <ImageIcon size={16} className="text-slate-700" />
                  </div>
                )}
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <RoleBadge roleKey={asset.role} />
                  <p className="text-xs font-bold text-white truncate mt-1">{asset.name || `clip-${idx + 1}`}</p>
                </div>
                {/* Arrow indicator */}
                {idx < sequence.length - 1 && (
                  <ChevronRight size={14} className="text-slate-700 shrink-0" />
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Caption */}
        {project.caption ? (
          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.05] overflow-hidden">
            <div className="flex items-center justify-between px-4 pt-3 pb-2">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-1.5">
                <ClipboardList size={9} /> Caption
              </span>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => copyCaption(project.caption)}
                className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border transition-all ${
                  copiedCaption
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-violet-500/10 border-violet-500/20 text-violet-400 hover:bg-violet-500/20'
                }`}
              >
                {copiedCaption ? <><Check size={9} /> Copied!</> : <><Copy size={9} /> Copy Caption</>}
              </motion.button>
            </div>
            <p className="px-4 pb-4 text-xs text-slate-300 leading-relaxed">{project.caption}</p>
          </div>
        ) : null}

        {/* Hashtags */}
        {(project.hashtags || []).length > 0 && (
          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.05] overflow-hidden">
            <div className="flex items-center justify-between px-4 pt-3 pb-2">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-1.5">
                <Hash size={9} /> Hashtags
              </span>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => copyTags(project.hashtags.map(t => `#${t}`).join(' '))}
                className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border transition-all ${
                  copiedTags
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-violet-500/10 border-violet-500/20 text-violet-400 hover:bg-violet-500/20'
                }`}
              >
                {copiedTags ? <><Check size={9} /> Copied!</> : <><Copy size={9} /> Copy Tags</>}
              </motion.button>
            </div>
            <div className="px-4 pb-4 flex flex-wrap gap-1.5">
              {project.hashtags.map(t => (
                <span key={t} className="bg-violet-500/10 border border-violet-500/15 text-violet-300 text-[10px] font-bold px-2.5 py-1 rounded-full">
                  #{t}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="px-6 sm:px-8 pb-7 pt-4 border-t border-white/[0.06] shrink-0">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onStart}
          disabled={sequence.length === 0}
          className="w-full py-4 bg-white text-black font-black text-sm rounded-[18px] flex items-center justify-center gap-2.5 shadow-xl disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Zap size={16} /> Start Execution
        </motion.button>
        {sequence.length === 0 && (
          <p className="text-center text-[9px] text-slate-600 uppercase tracking-widest mt-2">
            Add clips to the sequence first
          </p>
        )}
      </div>
    </div>
  );
};

/* ─── Execution View (step by step) ─────────────────────────────────────────── */
const ExecutionView = ({ project, sequence, onClose }) => {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [copiedCaption, copyCaption] = useCopy();
  const [copiedTags, copyTags] = useCopy();

  const clip = sequence[step];
  const total = sequence.length;
  const isFirst = step === 0;
  const isLast = step === total - 1;
  const progress = (step + 1) / total;

  if (done) {
    return (
      <div className="flex flex-col h-full items-center justify-center px-8 text-center gap-6">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15 }}
        >
          <CheckCircle2 size={64} className="text-emerald-400 mx-auto" />
        </motion.div>
        <div>
          <p className="text-2xl font-black text-white mb-2">Execution Complete</p>
          <p className="text-slate-500 text-sm">You followed {total} clip{total > 1 ? 's' : ''}. Go make great content.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={onClose}
          className="px-10 py-4 bg-white text-black font-black text-sm rounded-full shadow-xl"
        >
          Close
        </motion.button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 sm:px-8 pt-6 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="text-[9px] font-black text-violet-400 uppercase tracking-[0.35em] flex items-center gap-1.5">
            <Zap size={9} /> Executing
          </div>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            Step {step + 1} / {total}
          </span>
        </div>
        <button onClick={onClose} className="p-2 rounded-2xl hover:bg-white/5 transition-colors text-slate-500 hover:text-white">
          <X size={18} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="px-6 sm:px-8 mb-5 shrink-0">
        <div className="h-1 bg-white/[0.05] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full"
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          />
        </div>
        {/* Step dots */}
        <div className="flex gap-1.5 mt-2 justify-center">
          {sequence.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`rounded-full transition-all duration-200 ${
                i === step
                  ? 'w-5 h-1.5 bg-violet-400'
                  : i < step
                  ? 'w-1.5 h-1.5 bg-white/30'
                  : 'w-1.5 h-1.5 bg-white/10'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main clip focus */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-6 sm:px-8 flex flex-col gap-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-3"
          >
            {/* Number + role */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-base font-black text-violet-400">
                {step + 1}
              </div>
              <RoleBadge roleKey={clip?.role} />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                {isFirst ? 'Start here' : isLast ? 'Final clip' : 'Then this'}
              </span>
            </div>

            {/* Large preview */}
            <ClipPreview asset={clip} size="lg" />

            {/* Clip name */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl px-4 py-3">
              <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-0.5">Clip file</p>
              <p className="text-sm font-black text-white">{clip?.name || `clip-${step + 1}`}</p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Caption + Hashtags (compact, always visible as reference) */}
        {(project.caption || (project.hashtags || []).length > 0) && (
          <div className="flex gap-2 pb-2">
            {project.caption && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => copyCaption(project.caption)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                  copiedCaption
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-white/[0.03] border-white/[0.06] text-slate-400 hover:text-white hover:border-white/20'
                }`}
              >
                {copiedCaption ? <Check size={10} /> : <ClipboardList size={10} />}
                {copiedCaption ? 'Copied!' : 'Copy Caption'}
              </motion.button>
            )}
            {(project.hashtags || []).length > 0 && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => copyTags(project.hashtags.map(t => `#${t}`).join(' '))}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                  copiedTags
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-white/[0.03] border-white/[0.06] text-slate-400 hover:text-white hover:border-white/20'
                }`}
              >
                {copiedTags ? <Check size={10} /> : <Hash size={10} />}
                {copiedTags ? 'Copied!' : 'Copy Tags'}
              </motion.button>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="px-6 sm:px-8 pb-7 pt-4 border-t border-white/[0.06] shrink-0 flex gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => setStep(s => s - 1)}
          disabled={isFirst}
          className="h-14 w-14 rounded-[18px] bg-white/[0.04] border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all disabled:opacity-20 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={20} />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => isLast ? setDone(true) : setStep(s => s + 1)}
          className={`flex-1 h-14 font-black text-sm rounded-[18px] flex items-center justify-center gap-2.5 shadow-xl transition-all ${
            isLast
              ? 'bg-emerald-500 text-white hover:bg-emerald-400'
              : 'bg-white text-black hover:bg-white/90'
          }`}
        >
          {isLast ? (
            <><CheckCircle2 size={16} /> Mark Done</>
          ) : (
            <>Next Clip <ChevronRight size={16} /></>
          )}
        </motion.button>
      </div>
    </div>
  );
};

/* ─── Root component ─────────────────────────────────────────────────────────── */
const ExecutionMode = ({ project, onClose }) => {
  const [started, setStarted] = useState(false);

  const sequence = useMemo(() => {
    return (project.assets || [])
      .filter(a => typeof a === 'object' && a.selected)
      .sort((a, b) => (CLIP_ROLES[a.role]?.priority ?? 99) - (CLIP_ROLES[b.role]?.priority ?? 99));
  }, [project.assets]);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[220]"
      />

      {/* Panel */}
      <div className="fixed inset-0 z-[230] flex items-center justify-center pointer-events-none p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-full max-w-lg h-[90dvh] bg-[#0D0D10] border border-white/[0.08] rounded-[28px] sm:rounded-[36px] overflow-hidden flex flex-col shadow-2xl pointer-events-auto"
        >
          <AnimatePresence mode="wait">
            {!started ? (
              <motion.div key="plan" className="flex flex-col h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <PlanView
                  project={project}
                  sequence={sequence}
                  onStart={() => setStarted(true)}
                  onClose={onClose}
                />
              </motion.div>
            ) : (
              <motion.div key="exec" className="flex flex-col h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ExecutionView
                  project={project}
                  sequence={sequence}
                  onClose={onClose}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </>
  );
};

export default ExecutionMode;
