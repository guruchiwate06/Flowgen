import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Wand2, RefreshCw, Check } from 'lucide-react';
import SelectDropdown from './SelectDropdown';
import { generateCaptions } from '../services/ai/captionService';
import { showToast } from '../utils/toast';

const NICHES = ['Fitness', 'Travel', 'Fashion', 'Food', 'Business', 'Personal Brand', 'Podcast', 'Education', 'Tech', 'Other'];
const TONES = ['Motivational', 'Bold', 'Funny', 'Premium', 'Casual', 'Emotional', 'Viral Style'];
const PLATFORMS = ['Instagram', 'TikTok', 'YouTube Shorts'];

const AICaptionModal = ({ isOpen, onClose, project, onApply }) => {
  const [niche, setNiche] = useState('Personal Brand');
  const [contentDescription, setContentDescription] = useState('');
  const [tone, setTone] = useState('Viral Style');
  const [platform, setPlatform] = useState('Instagram');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState(null); // { captions: [], hashtags: [] }

  // Smart Prefill
  useEffect(() => {
    if (!isOpen) return;
    
    // 1. Try project context
    if (project.aiContext) {
      setNiche(project.aiContext.niche || 'Personal Brand');
      setContentDescription(project.aiContext.lastDescription || '');
      setTone(project.aiContext.tone || 'Viral Style');
      setPlatform(project.aiContext.platform || 'Instagram');
    } else {
      // 2. Try user defaults
      try {
        const prefs = JSON.parse(localStorage.getItem('flowgen_ai_prefs') || '{}');
        if (prefs.niche) setNiche(prefs.niche);
        if (prefs.tone) setTone(prefs.tone);
        if (prefs.platform) setPlatform(prefs.platform);
      } catch (e) { /* ignore */ }
    }
    
    setResults(null);
  }, [isOpen, project]);

  const handleGenerate = async () => {
    if (!contentDescription.trim()) return showToast("Please describe the content", 'error');
    
    // Save preferences for next time
    try {
      localStorage.setItem('flowgen_ai_prefs', JSON.stringify({ niche, tone, platform }));
    } catch(e) {}

    setIsGenerating(true);
    try {
      const payload = {
        title: project.title,
        niche,
        contentDescription,
        tone,
        platform
      };
      const res = await generateCaptions(payload);
      setResults(res);
    } catch (e) {
      showToast(e.message || "Failed to generate captions", 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const applyCaption = (captionText) => {
    const tagsText = (results.hashtags || []).map(t => t.startsWith('#') ? t.substring(1) : t);
    const hooks = results.hooks || [];
    const newContext = { niche, tone, platform, lastDescription: contentDescription };
    onApply(captionText, tagsText, newContext, hooks);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-[600px] bg-[#121214] border border-white/10 rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
              <Wand2 size={20} className="text-violet-400" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">AI Caption Generator</h2>
              <p className="text-[10px] uppercase tracking-widest text-slate-500">Context-Aware AI</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scroll flex-1">
          {!results ? (
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Niche / Category</label>
                  <select 
                    value={niche} onChange={e => setNiche(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-violet-500/50 appearance-none"
                  >
                    {NICHES.map(n => <option key={n} value={n} className="bg-black">{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Platform</label>
                  <select 
                    value={platform} onChange={e => setPlatform(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-violet-500/50 appearance-none"
                  >
                    {PLATFORMS.map(p => <option key={p} value={p} className="bg-black">{p}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Tone of Voice</label>
                <select 
                  value={tone} onChange={e => setTone(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-violet-500/50 appearance-none"
                >
                  {TONES.map(t => <option key={t} value={t} className="bg-black">{t}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Describe This Content</label>
                <textarea
                  value={contentDescription} onChange={e => setContentDescription(e.target.value)}
                  placeholder="e.g. Gym workout montage with deadlifts"
                  rows={3}
                  className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-slate-300 resize-none outline-none focus:border-violet-500/40"
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {(results.hooks && results.hooks.length > 0) && (
                <div className="mb-2">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Generated Hooks</h3>
                  <div className="flex flex-col gap-1.5">
                    {results.hooks.map((h, i) => (
                      <div key={i} className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-xs text-slate-300 font-bold">
                        {h}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <h3 className="text-xs font-black uppercase tracking-widest text-violet-400 mb-2">Select a Caption to Apply</h3>
              {(results.captions || []).map((cap, i) => (
                <motion.div 
                  key={i}
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  onClick={() => applyCaption(cap)}
                  className="p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-violet-500/50 hover:bg-violet-500/10 cursor-pointer transition-all group"
                >
                  <p className="text-sm text-slate-300 mb-3 leading-relaxed">{cap}</p>
                  <div className="flex items-center gap-2 text-[10px] font-black text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Check size={12} /> Click to apply
                  </div>
                </motion.div>
              ))}
              
              <div className="mt-2">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Suggested Hashtags</h3>
                <div className="flex flex-wrap gap-1.5">
                  {(results.hashtags || []).map((tag, i) => (
                    <span key={i} className="text-[10px] font-bold px-2 py-1 bg-white/5 rounded text-slate-400">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 bg-black/20 shrink-0">
          {!results ? (
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-4 bg-violet-600 hover:bg-violet-500 text-white font-black text-sm rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isGenerating ? <RefreshCw size={18} className="animate-spin" /> : <Wand2 size={18} />}
              {isGenerating ? 'Generating...' : 'Generate Smart Captions'}
            </button>
          ) : (
            <button
              onClick={() => setResults(null)}
              className="w-full py-3 bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-sm rounded-xl transition-all"
            >
              Retry with different inputs
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AICaptionModal;
