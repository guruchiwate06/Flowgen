import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';

const QuickAddModal = ({ isOpen, onClose, onAdd }) => {
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
          <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-lg bg-[#1A1A1E] border border-white/10 rounded-[40px] p-10 shadow-2xl">
            <div className="flex items-center gap-3 mb-8">
               <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-black shadow-lg"><Plus size={24}/></div>
               <h3 className="text-2xl font-black text-white tracking-tight">Quick Capture</h3>
            </div>
            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3 block">Idea Name</label>
                <input 
                  ref={inputRef}
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="What's the project?" 
                  className="w-full bg-white/5 border border-white/10 rounded-[24px] px-8 py-5 text-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500 transition-all shadow-inner" 
                />
              </div>
              <div className="flex gap-4">
                <button type="button" onClick={onClose} className="flex-1 px-8 py-5 rounded-[24px] bg-white/5 text-slate-400 font-bold hover:bg-white/10 transition-all">Discard</button>
                <button type="submit" className="flex-1 px-8 py-5 rounded-[24px] bg-white text-black font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl">Capture</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default QuickAddModal;
