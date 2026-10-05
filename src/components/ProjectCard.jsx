import React from 'react';
import { Clock, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { STATUS_CONFIG, timeAgo } from '../constants';

const TOTAL_STAGES = 5;

/**
 * ProjectCard
 *
 * In pipeline mode, drag listeners are spread on the root div so the whole
 * card is draggable. The MouseSensor in App.jsx only activates drag after
 * 8px of movement, so a normal click still fires onClick to open the panel.
 */
const ProjectCard = React.forwardRef(
  (
    {
      project,
      onClick,
      isPipeline = false,
      layoutPrefix = 'card',
      style,
      dragListeners,
      dragAttributes,
      isDragging,
    },
    ref
  ) => {
    const status = STATUS_CONFIG[project.status];
    const progress = (status.step / TOTAL_STAGES) * 100;

    const handleClick = (e) => {
      // Don't open panel if the pointer moved (drag completed)
      if (!isDragging) onClick(project);
    };

    return (
      <div
        ref={ref}
        style={{ ...style, ...(isDragging ? { zIndex: 999 } : {}) }}
        // Spread drag listeners on the whole card — the 8px distance sensor
        // means quick taps/clicks are treated as clicks, not drags.
        {...(isPipeline ? dragAttributes : {})}
        {...(isPipeline ? dragListeners : {})}
        onClick={handleClick}
        className={[
          'group flex flex-col shrink-0 bg-[#121214] border border-white/[0.08] rounded-[32px] overflow-hidden',
          'hover:border-white/20 transition-colors select-none',
          isPipeline ? 'w-full mb-4 cursor-grab active:cursor-grabbing' : 'cursor-pointer',
          isDragging ? 'shadow-[0_30px_60px_rgba(109,40,217,0.3)] scale-[1.04] opacity-40' : '',
        ].join(' ')}
      >
        {/* Thumbnail */}
        <div className="aspect-[16/10] relative overflow-hidden bg-slate-900/50 flex-shrink-0">
          {project.thumbnail ? (
            <img
              src={project.thumbnail}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              alt={project.title}
              draggable={false}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/5 bg-gradient-to-br from-white/5 to-transparent">
              <ImageIcon size={48} />
            </div>
          )}
          {/* Status badge */}
          <div className="absolute top-4 right-4">
            <div className="bg-black/90 border border-white/10 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-white flex items-center gap-2 shadow-xl">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: status.color }} />
              {status.label}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col flex-1">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{project.type}</div>
          <h3 className="text-sm font-bold text-white mb-4 leading-tight group-hover:text-violet-400 transition-colors line-clamp-2">
            {project.title}
          </h3>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Progress</span>
              <span className="text-[9px] font-black text-slate-500">{status.step}/{TOTAL_STAGES}</span>
            </div>
            <div className="h-[2px] bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-400"
                style={{ width: `${progress}%`, transition: 'width 0.4s ease' }}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase">
              <Clock size={12} />
              {timeAgo(project.lastEdited)}
            </div>
            <ChevronRight size={16} className="text-white/20 group-hover:text-white transition-colors" />
          </div>
        </div>
      </div>
    );
  }
);

ProjectCard.displayName = 'ProjectCard';

export default ProjectCard;
