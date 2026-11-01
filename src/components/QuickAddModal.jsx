import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sparkles } from 'lucide-react';

const SUGGESTIONS = [
  '🔥 My First Reel',
  '🎬 Product Launch',
  '✨ Weekly Vlog',
  '💡 60s Tech Tip'
];

const QuickAddModal = ({ isOpen, onClose, onAdd, isTutorialMode }) => {
  const [title, setTitle] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd(title);
    setTitle('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
          <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className={`relative w-full max-w-lg bg-[#1A1A1E] border rounded-[32px] sm:rounded-[40px] p-6 sm:p-10 shadow-2xl ${isTutorialMode ? 'border-violet-500/60 ring-2 ring-violet-500/30' : 'border-white/10'}`}>
            
            {/* Tutorial guidance callout */}
            {isTutorialMode && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="mb-6 p-4 rounded-2xl bg-violet-500/10 border border-violet-500/30 flex items-start gap-3"
              >
                <Sparkles className="text-violet-400 flex-shrink-0 mt-0.5" size={18} />
                <div>
                  <h4 className="text-xs font-black text-violet-300 uppercase tracking-wider mb-0.5">Tutorial Step 2 of 2</h4>
                  <p className="text-xs text-slate-300 leading-normal">
                    Give your content idea a title or tap one of the instant ideas below!
                  </p>
                </div>
              </motion.div>
            )}

            <div className="flex items-center gap-3 mb-6 sm:mb-8">
               <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white flex items-center justify-center text-black shadow-lg"><Plus size={22}/></div>
               <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">Quick Capture</h3>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-8">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3 block">Idea Name</label>
                <input 
                  ref={inputRef}
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="What's the project?" 
                  className="w-full bg-white/5 border border-white/10 rounded-[20px] sm:rounded-[24px] px-5 sm:px-8 py-4 sm:py-5 text-base sm:text-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500 transition-all shadow-inner" 
                />

                {/* Instant suggestions */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {SUGGESTIONS.map((sug) => (
                    <button
                      type="button"
                      key={sug}
                      onClick={() => setTitle(sug)}
                      className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5 hover:border-violet-500/40 transition-all"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 sm:gap-4">
                <button type="button" onClick={onClose} className="flex-1 px-4 sm:px-8 py-4 sm:py-5 rounded-[20px] sm:rounded-[24px] bg-white/5 text-slate-400 font-bold hover:bg-white/10 transition-all text-sm sm:text-base">Discard</button>
                <button type="submit" className={`flex-1 px-4 sm:px-8 py-4 sm:py-5 rounded-[20px] sm:rounded-[24px] font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl text-sm sm:text-base flex items-center justify-center gap-2 ${isTutorialMode ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-600/30' : 'bg-white text-black'}`}>
                  {isTutorialMode ? <><Sparkles size={16} /> Create Idea</> : 'Capture'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default QuickAddModal;
