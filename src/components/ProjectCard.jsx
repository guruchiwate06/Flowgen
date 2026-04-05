import React from 'react';
import { motion } from 'framer-motion';
import { Clock, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { STATUS_CONFIG } from '../constants';

const ProjectCard = ({ project, onClick, isPipeline = false }) => {
  const status = STATUS_CONFIG[project.status];
  return (
    <motion.div 
      layoutId={`card-${project.id}`}
      onClick={() => onClick(project)}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8, scale: 1.02, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.6)" }}
      whileTap={{ scale: 0.98 }}
      className={`group flex flex-col h-full bg-[#121214] border border-white/[0.08] rounded-[32px] overflow-hidden cursor-pointer hover:border-white/20 transition-all ${isPipeline ? 'w-full mb-4' : ''}`}
    >
      <div className="aspect-[16/10] relative overflow-hidden bg-slate-900/50">
        {project.thumbnail ? (
          <img src={project.thumbnail} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt={project.title} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/5 bg-gradient-to-br from-white/5 to-transparent">
            <ImageIcon size={48} />
          </div>
        )}
        <div className="absolute top-4 right-4">
          <div className="bg-black/90 border border-white/10 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-white flex items-center gap-2 shadow-xl">
            <div className={`w-1.5 h-1.5 rounded-full`} style={{ backgroundColor: status.color }} />
            {status.label}
          </div>
        </div>
      </div>
      <div className="p-6 flex flex-col flex-1">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">{project.type}</div>
        <h3 className="text-sm font-bold text-white mb-2 leading-tight group-hover:text-violet-400 transition-colors line-clamp-1">{project.title}</h3>
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase">
            <Clock size={12} />
            {project.updated}
          </div>
          <ChevronRight size={16} className="text-white/20 group-hover:text-white transition-colors" />
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectCard;
