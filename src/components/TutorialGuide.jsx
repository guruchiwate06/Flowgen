import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Plus, ArrowRight, CheckCircle2, 
  Compass, Layers, Film, Bot
} from 'lucide-react';

/* ── Confetti Particle Burst (Deterministic for pure React render) ────────── */
const PARTICLES = Array.from({ length: 32 }, (_, i) => ({
  id: i,
  x: ((i * 137.5) % 500) - 250,
  y: -(((i * 73) % 350) + 50),
  r: (i * 45) % 360,
  scale: 0.6 + ((i % 5) * 0.15),
  color: ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#ffffff'][i % 6],
  shape: i % 3 === 0 ? 'circle' : i % 3 === 1 ? 'rect' : 'pill',
}));

const ConfettiBurst = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50 flex items-center justify-center">
      {PARTICLES.map((p) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 1, x: 0, y: 0, scale: 0, rotate: 0 }}
          animate={{
            opacity: [1, 1, 0],
            x: p.x,
            y: p.y + 120,
            scale: p.scale,
            rotate: p.r,
          }}
          transition={{ duration: 1.6, ease: 'easeOut' }}
          className="absolute"
          style={{
            backgroundColor: p.color,
            width: p.shape === 'rect' ? '10px' : p.shape === 'pill' ? '14px' : '8px',
            height: p.shape === 'rect' ? '10px' : p.shape === 'pill' ? '6px' : '8px',
            borderRadius: p.shape === 'circle' ? '50%' : p.shape === 'pill' ? '999px' : '2px',
          }}
        />
      ))}
    </div>
  );
};

/* ── Main Tutorial Guide Component ───────────────────────────────────────── */
export default function TutorialGuide({
  step,
  user,
  onStartGuide,
  onOpenCreate,
  onSkip,
  onComplete,
  createdProjectTitle,
}) {
  const userName = user?.displayName || user?.email?.split('@')[0] || 'Creator';

  // If tutorial is not active (step === 0), don't render
  if (step === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[250] select-none">
      <AnimatePresence mode="wait">
        
        {/* ── STEP 1: WELCOME MODAL ── */}
        {step === 1 && (
          <motion.div
            key="step-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-auto fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
          >
            <motion.div
              initial={{ scale: 0.92, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.92, y: 20, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg bg-[#121216] border border-violet-500/30 rounded-[32px] p-6 sm:p-8 shadow-[0_25px_70px_rgba(139,92,246,0.25)] text-left overflow-hidden"
            >
              {/* Top ambient glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-24 bg-violet-600/20 blur-3xl pointer-events-none" />

              {/* Header badge */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-black tracking-wider uppercase">
                  <Compass size={14} className="animate-spin-slow" /> First-Time Guide
                </div>
                <button
                  onClick={onSkip}
                  className="text-[11px] font-bold text-slate-500 hover:text-slate-300 transition-colors uppercase tracking-widest px-2 py-1"
                >
                  Skip Guide
                </button>
              </div>

              {/* Title & Greeting */}
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
                Welcome to Flowgen, <span className="text-violet-400 capitalize">{userName}</span>! 👋
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed mb-6 font-medium">
                Flowgen is your creator studio workspace to manage video ideas through every phase of production:
              </p>

              {/* 5-Stage Mini Pipeline Preview */}
              <div className="grid grid-cols-5 gap-1.5 p-2 rounded-2xl bg-white/[0.03] border border-white/5 mb-6 text-center">
                {[
                  { label: 'Idea', color: '#94a3b8' },
                  { label: 'Shooting', color: '#eab308' },
                  { label: 'Editing', color: '#3b82f6' },
                  { label: 'Ready', color: '#22c55e' },
                  { label: 'Posted', color: '#8b5cf6' },
                ].map((st) => (
                  <div key={st.label} className="flex flex-col items-center py-2 px-1">
                    <div 
                      className="w-2.5 h-2.5 rounded-full mb-1.5 ring-2 ring-white/10" 
                      style={{ backgroundColor: st.color }}
                    />
                    <span className="text-[10px] font-extrabold text-slate-400">{st.label}</span>
                  </div>
                ))}
              </div>

              {/* Goal prompt */}
              <div className="p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20 mb-6 flex items-start gap-3">
                <Sparkles className="text-violet-400 flex-shrink-0 mt-0.5" size={18} />
                <p className="text-xs text-violet-200 leading-normal font-medium">
                  <strong>First Step:</strong> Let's create your very first project card. It takes less than 10 seconds!
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={onSkip}
                  className="flex-1 py-3.5 px-4 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 font-bold text-xs uppercase tracking-wider transition-all"
                >
                  I'll Explore Myself
                </button>
                <button
                  onClick={onStartGuide}
                  className="flex-1 py-3.5 px-4 rounded-2xl bg-white text-black hover:bg-slate-200 font-black text-xs uppercase tracking-wider shadow-lg hover:shadow-violet-500/20 transition-all flex items-center justify-center gap-2 group"
                >
                  Let's Begin <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ── STEP 2: BEACON & POINTER TO CREATE BUTTON ── */}
        {step === 2 && (
          <div className="fixed inset-0 pointer-events-none">
            {/* Subtle dimming backdrop that allows interaction */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 pointer-events-auto"
              onClick={onOpenCreate}
            />

            {/* Floating Navigation Card pointing to Action */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="pointer-events-auto fixed bottom-24 md:bottom-36 right-6 md:right-16 z-[300] max-w-sm bg-[#16161B] border-2 border-violet-500/50 rounded-3xl p-5 shadow-[0_20px_50px_rgba(139,92,246,0.35)] backdrop-blur-2xl"
            >
              {/* Pulsing indicator pin */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-violet-500"></span>
                  </span>
                  <span className="text-[11px] font-black uppercase tracking-widest text-violet-400">Step 1 of 2</span>
                </div>
                <button
                  onClick={onSkip}
                  className="text-[10px] font-bold text-slate-500 hover:text-slate-300 uppercase tracking-wider"
                >
                  Skip
                </button>
              </div>

              <h3 className="text-base font-black text-white mb-1.5 flex items-center gap-2">
                Click the <span className="bg-white text-black px-1.5 py-0.5 rounded-md text-xs font-black inline-flex items-center justify-center"><Plus size={12} strokeWidth={4} /></span> button
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Tap the floating button below or click <strong>"Create Project Now"</strong> to capture your first idea.
              </p>

              <button
                onClick={onOpenCreate}
                className="w-full py-3 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-violet-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus size={16} strokeWidth={3} /> Create Project Now
              </button>

              {/* Pulsing directional arrow pointing to the + button at bottom right */}
              <div className="absolute -bottom-3 right-10 w-6 h-6 bg-[#16161B] border-r-2 border-b-2 border-violet-500/50 transform rotate-45" />
            </motion.div>

            {/* Glowing Beacon Rings centered on the floating Plus button */}
            <div className="pointer-events-none fixed bottom-6 right-6 md:bottom-12 md:right-12 w-14 h-14 md:w-20 md:h-20 flex items-center justify-center z-[200]">
              <div className="absolute w-20 h-20 md:w-28 md:h-28 rounded-full border-2 border-violet-400 animate-ping opacity-60" />
              <div className="absolute w-24 h-24 md:w-36 md:h-36 rounded-full border border-violet-500/40 animate-pulse" />
            </div>
          </div>
        )}

        {/* ── STEP 4: CONGRATULATIONS & FIRST PROJECT READY ── */}
        {step === 4 && (
          <motion.div
            key="step-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-auto fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 z-[500]"
          >
            <ConfettiBurst />

            <motion.div
              initial={{ scale: 0.9, y: 25, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 25, opacity: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 280 }}
              className="relative w-full max-w-lg bg-[#141419] border border-emerald-500/30 rounded-[36px] p-6 sm:p-8 shadow-[0_25px_80px_rgba(16,185,129,0.25)] text-left overflow-hidden"
            >
              {/* Background ambient glow */}
              <div className="absolute top-0 right-1/2 translate-x-1/2 w-72 h-32 bg-emerald-500/15 blur-3xl pointer-events-none" />

              {/* Header Icon */}
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-5 shadow-lg">
                <CheckCircle2 size={32} />
              </div>

              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black tracking-widest uppercase">
                  🎉 Milestone Reached!
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
                First Project Created!
              </h2>
              <p className="text-sm text-slate-300 font-medium mb-6">
                <span className="text-white font-bold underline decoration-emerald-400 decoration-2">"{createdProjectTitle || 'Your Project'}"</span> has been added to your pipeline.
              </p>

              {/* What to do next walkthrough cards */}
              <div className="space-y-3 mb-6">
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 flex-shrink-0 mt-0.5">
                    <Film size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider mb-0.5">1. Upload Clips & Assets</h4>
                    <p className="text-[11px] text-slate-400 font-medium">Connect Google Drive to upload video hook, body, and B-roll clips directly.</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 flex-shrink-0 mt-0.5">
                    <Bot size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider mb-0.5">2. Generate AI Captions</h4>
                    <p className="text-[11px] text-slate-400 font-medium">Click "Generate AI Caption" for viral hooks, descriptions, and hashtags.</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0 mt-0.5">
                    <Layers size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider mb-0.5">3. Drag Along The Pipeline</h4>
                    <p className="text-[11px] text-slate-400 font-medium">Drag cards from Idea → Shooting → Editing as your content takes shape.</p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={onComplete}
                className="w-full py-4 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm uppercase tracking-wider shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 group hover:scale-[1.01] active:scale-[0.99]"
              >
                You're Ready — Open Workspace <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
