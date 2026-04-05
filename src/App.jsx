import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layout, 
  Kanban, 
  Plus, 
  Search, 
  Image as ImageIcon, 
  X,
  Upload,
  Layers,
  FileText,
  Trash2,
  Copy,
  Zap,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { STATUS_CONFIG, INITIAL_DATA } from './constants';
import Landing from './components/Landing';
import ProjectCard from './components/ProjectCard';
import QuickAddModal from './components/QuickAddModal';

export default function App() {
  const [view, setView] = useState('landing');
  const [projects, setProjects] = useState(INITIAL_DATA);
  const [selected, setSelected] = useState(null);
  const [isLibReady, setIsLibReady] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    const loadOGL = async () => {
      if (window.ogl) {
        setIsLibReady(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://unpkg.com/ogl";
      script.onload = () => setIsLibReady(true);
      document.body.appendChild(script);
    };
    loadOGL();
  }, []);

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [projects, searchQuery, statusFilter]);

  const handleDuplicate = (project) => {
    const clone = { ...project, id: Date.now(), title: `${project.title} (Copy)`, updated: 'Just now' };
    setProjects([clone, ...projects]);
    setSelected(clone);
  };

  const handleDelete = (id) => {
    setProjects(projects.filter(p => p.id !== id));
    setSelected(null);
  };

  return (
    <div className={`flex flex-col bg-[#0A0A0B] text-slate-200 selection:bg-violet-500 selection:text-white ${view === 'landing' ? 'min-h-screen' : 'h-screen overflow-hidden'}`}>
      {/* Dynamic Background */}
      <div className="fixed inset-0 -z-10 bg-[#0A0A0B] overflow-hidden">
        <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.15, 0.1] }} transition={{ duration: 15, repeat: Infinity }} className="absolute top-[-20%] right-[-10%] w-[70%] h-[70%] rounded-full bg-violet-600/10 blur-[120px]" />
        <motion.div animate={{ scale: [1.1, 1, 1.1], opacity: [0.05, 0.1, 0.05] }} transition={{ duration: 20, repeat: Infinity }} className="absolute bottom-[-10%] left-[-5%] w-[60%] h-[60%] rounded-full bg-blue-500/10 blur-[120px]" />
      </div>

      {view !== 'landing' && (
        <header className="fixed top-0 left-0 right-0 z-50 h-24 bg-[#0A0A0B]/60 backdrop-blur-2xl border-b border-white/[0.06] flex items-center justify-between px-10">
          <div onClick={() => setView('landing')} className="flex items-center gap-4 cursor-pointer group">
            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform"><Layers size={22} className="text-black" /></div>
            <span className="text-2xl font-black tracking-tighter text-white">Flowgen</span>
          </div>

          <div className="flex-1 max-w-3xl mx-16 flex gap-4">
             <div className="relative flex-1 group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-violet-400 transition-colors" size={18} />
                <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search your registry..." className="w-full bg-white/[0.03] border border-white/10 rounded-full pl-14 pr-6 py-3.5 text-sm font-bold focus:outline-none focus:border-violet-500/50 transition-all shadow-inner" />
             </div>
             <div className="flex items-center bg-white/[0.03] border border-white/10 rounded-full px-5 py-2 gap-3 shadow-inner">
                <Filter size={14} className="text-slate-500" />
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-transparent text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer text-slate-400 hover:text-white transition-colors">
                  <option value="ALL">ALL STATUS</option>
                  {Object.entries(STATUS_CONFIG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
             </div>
          </div>

          <div className="flex items-center gap-6">
            <nav className="flex items-center bg-black/40 border border-white/10 p-1.5 rounded-full shadow-2xl">
               {[
                { id: 'pipeline', label: 'Pipeline', icon: Kanban },
                { id: 'dashboard', label: 'Hub', icon: Layout },
               ].map(item => (
                <button key={item.id} onClick={() => setView(item.id)} className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${view === item.id ? 'bg-white text-black shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                  <item.icon size={14} /> {item.label}
                </button>
               ))}
            </nav>
            <div className="w-11 h-11 rounded-2xl border border-white/10 overflow-hidden bg-slate-800 shadow-2xl"><img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100" alt="User" /></div>
          </div>
        </header>
      )}
      
      <main className={`flex-1 flex flex-col relative w-full ${view === 'landing' ? '' : 'overflow-hidden pt-24'}`}>
        <AnimatePresence mode="wait">
          {view === 'landing' && (
            <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 w-full">
              <Landing onStart={() => setView('pipeline')} isLibReady={isLibReady} />
            </motion.div>
          )}
          
          {view === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-7xl mx-auto px-10 py-16 w-full overflow-y-auto custom-scroll">
              <div className="flex justify-between items-end mb-16">
                <div>
                  <h2 className="text-4xl font-black text-white tracking-tight mb-2">Workspace Hub</h2>
                  <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">Active File Registry: {filteredProjects.length} Items</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProjects.map(p => <ProjectCard key={p.id} project={p} onClick={setSelected} />)}
              </div>
            </motion.div>
          )}

          {view === 'pipeline' && (
            <motion.div key="pipeline" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 min-h-0 flex gap-8 p-10 overflow-x-auto bg-black/10 custom-scroll h-full transform-gpu will-change-transform">
              {Object.entries(STATUS_CONFIG).map(([statusKey, config]) => {
                const columnProjects = filteredProjects.filter(p => p.status === statusKey);
                return (
                  <div key={statusKey} className="flex-shrink-0 w-[340px] flex flex-col h-full pb-10">
                    <div className="flex items-center justify-between mb-6 px-3">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/40">{config.label}</h3>
                      </div>
                      <span className="text-[10px] font-black text-slate-600 bg-white/5 px-3 py-1 rounded-full border border-white/5">{columnProjects.length}</span>
                    </div>
                    <div className="flex-1 bg-white/[0.015] border border-white/[0.04] rounded-[40px] p-4 overflow-y-auto scrollbar-hide flex flex-col shadow-inner">
                      {columnProjects.map(p => <ProjectCard key={p.id} project={p} onClick={setSelected} isPipeline />)}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Quick Add Button */}
        {view !== 'landing' && (
          <motion.button 
            whileHover={{ scale: 1.1, rotate: 90 }} 
            whileTap={{ scale: 0.9 }} 
            onClick={() => setIsQuickAddOpen(true)}
            className="fixed bottom-12 right-12 w-20 h-20 bg-white text-black rounded-full shadow-2xl flex items-center justify-center z-[150] shadow-white/10 hover:shadow-violet-500/20 transition-shadow"
          >
            <Plus size={40} strokeWidth={3} />
          </motion.button>
        )}
      </main>

      <QuickAddModal isOpen={isQuickAddOpen} onClose={() => setIsQuickAddOpen(false)} onAdd={(title) => {
        const newItem = { id: Date.now(), title, status: 'IDEA', type: 'New Post', updated: 'Just now', thumbnail: null, caption: '', assets: [] };
        setProjects([newItem, ...projects]);
        setSelected(newItem);
      }} />

      {/* Slide-over Detail Panel */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelected(null)} className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200]" />
            <div className="fixed inset-0 z-[210] flex items-center justify-center pointer-events-none p-6">
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="w-full max-w-[800px] max-h-[85vh] bg-[#121214] border border-white/10 rounded-[40px] p-12 overflow-y-auto scrollbar-hide flex flex-col shadow-2xl pointer-events-auto">
                <div className="flex justify-between items-center mb-16 shrink-0">
                <div className="flex items-center gap-4">
                   <div className="px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-[10px] font-black text-violet-400 uppercase tracking-[0.2em]">FILE_ID: {selected.id.toString().slice(-4)}</div>
                </div>
                <button onClick={() => setSelected(null)} className="p-3 rounded-2xl hover:bg-white/5 transition-colors text-slate-500 hover:text-white"><X size={28} /></button>
              </div>

              <div className="mb-12">
                 <div className="flex items-center gap-3 mb-4 text-violet-400">
                    <Zap size={16} />
                    <span className="text-xs font-black uppercase tracking-[0.3em]">Next Step: {STATUS_CONFIG[selected.status].next}</span>
                 </div>
                 <h2 className="text-5xl font-black text-white tracking-tighter leading-[1.1] mb-8">{selected.title}</h2>
              </div>

              <div className="flex-1 space-y-12">
                <section>
                   <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-6 flex items-center gap-3"><FileText size={14}/> Creative Log</h5>
                   <div className="p-10 rounded-[40px] bg-black/40 border border-white/5 text-base text-slate-400 italic leading-loose min-h-[180px] shadow-inner">{selected.caption || "Waiting for creative input stream..."}</div>
                </section>
                <section>
                   <div className="flex items-center justify-between mb-6">
                      <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-3"><ImageIcon size={14}/> Asset Buffer</h5>
                      <div className="flex items-center gap-2 text-[9px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/5 px-4 py-1.5 rounded-full border border-emerald-500/10">
                         <CheckCircle2 size={10} /> Used in this project
                      </div>
                   </div>
                   <div className="grid grid-cols-3 gap-5">
                      <div className="aspect-square bg-white/5 rounded-[32px] flex flex-col items-center justify-center border-2 border-dashed border-white/10 hover:border-white/30 cursor-pointer group transition-all">
                         <Upload size={24} className="text-slate-600 group-hover:text-white transition-colors" />
                         <span className="text-[9px] font-black text-slate-600 mt-3 uppercase tracking-widest">Ingest</span>
                      </div>
                      <div className="aspect-square bg-white/[0.02] border border-white/5 rounded-[32px] flex items-center justify-center group relative overflow-hidden transition-all hover:border-violet-500/30">
                         <div className="absolute inset-0 bg-violet-600/20 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer gap-2">
                            <Copy size={20} className="text-white" />
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white">Reuse</span>
                         </div>
                         <ImageIcon size={32} className="text-white/5" />
                      </div>
                   </div>
                </section>
              </div>

              <div className="mt-20 pt-10 border-t border-white/5 flex gap-5">
                <button onClick={() => { handleDuplicate(selected); setSelected(null); }} className="flex-1 h-20 bg-white text-black font-black text-lg rounded-[28px] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-2xl">
                  <Copy size={22} /> Duplicate Sequence
                </button>
                <button onClick={() => handleDelete(selected.id)} className="w-20 h-20 bg-red-500/10 text-red-500 rounded-[28px] border border-red-500/20 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all group shadow-inner">
                  <Trash2 size={24} />
                </button>
              </div>
            </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
