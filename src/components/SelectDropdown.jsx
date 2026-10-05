import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

/**
 * SelectDropdown — a fully styled custom dropdown.
 *
 * Props
 * ─────
 * value       string           currently selected value
 * onChange    (value) => void  called when selection changes
 * options     Array<{ value, label, color? }>
 * placeholder string           shown when no value selected (optional)
 * variant     'pill' | 'badge' | 'status'
 *   pill   → used in the header filter/sort bars
 *   status → used in the detail panel (shows coloured dot + label, no border chrome)
 * align       'left' | 'right' (default 'left') — which side the list anchors to
 * className   string           extra classes on the trigger
 */
const SelectDropdown = ({
  value,
  onChange,
  options = [],
  placeholder = 'Select…',
  variant = 'pill',
  align = 'left',
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const listRef = useRef(null);

  const selected = options.find(o => o.value === value);

  /* Close on outside click */
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  /* Keyboard nav */
  const handleKeyDown = useCallback((e) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    const idx = options.findIndex(o => o.value === value);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = options[(idx + 1) % options.length];
      onChange(next.value);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = options[(idx - 1 + options.length) % options.length];
      onChange(prev.value);
    } else if (e.key === 'Enter' || e.key === 'Escape') {
      setOpen(false);
    }
  }, [open, options, value, onChange]);

  const pick = (val) => {
    onChange(val);
    setOpen(false);
  };

  /* ── Trigger styles per variant ── */
  const triggerClass = {
    pill: [
      'flex items-center gap-1.5 cursor-pointer select-none outline-none',
      'text-[9px] md:text-[10px] font-black uppercase tracking-widest',
      'text-slate-400 hover:text-white transition-colors duration-150',
      className,
    ].join(' '),

    status: [
      'flex items-center gap-2 cursor-pointer select-none outline-none',
      'appearance-none bg-white/[0.04] border border-white/10 rounded-full',
      'px-3 py-1.5 pr-7 text-[10px] font-black uppercase tracking-widest',
      'hover:border-violet-500/40 transition-colors duration-150',
      className,
    ].join(' '),
  }[variant] ?? '';

  /* ── List positioning ── */
  const listAlign = align === 'right' ? 'right-0' : 'left-0';

  return (
    <div ref={ref} className="relative" onKeyDown={handleKeyDown} tabIndex={0}>

      {/* ── Trigger ── */}
      {variant === 'pill' && (
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className={triggerClass}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          {selected?.color && (
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: selected.color }}
            />
          )}
          <span>{selected?.label ?? placeholder}</span>
          <ChevronDown
            size={10}
            className={`transition-transform duration-200 ${open ? 'rotate-180' : ''} text-slate-500`}
          />
        </button>
      )}

      {variant === 'status' && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            className={triggerClass}
            style={{ color: selected?.color }}
            aria-haspopup="listbox"
            aria-expanded={open}
          >
            {selected?.color && (
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: selected.color }}
              />
            )}
            {selected?.label ?? placeholder}
          </button>
          {/* Custom chevron absolutely inside */}
          <ChevronDown
            size={11}
            className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </div>
      )}

      {/* ── Dropdown list ── */}
      <AnimatePresence>
        {open && (
          <motion.ul
            ref={listRef}
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
            className={[
              'absolute z-[500] mt-2 min-w-[140px] py-1.5',
              'bg-[#18181c] border border-white/[0.09]',
              'rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.6)]',
              'backdrop-blur-xl overflow-hidden',
              listAlign,
            ].join(' ')}
          >
            {options.map((opt) => {
              const isActive = opt.value === value;
              return (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={isActive}
                  onClick={() => pick(opt.value)}
                  className={[
                    'flex items-center gap-2.5 px-3.5 py-2.5 cursor-pointer',
                    'text-[10px] font-black uppercase tracking-widest',
                    'transition-colors duration-100 select-none mx-1 rounded-xl',
                    isActive
                      ? 'bg-white/[0.06] text-white'
                      : 'text-slate-400 hover:bg-white/[0.04] hover:text-white',
                  ].join(' ')}
                >
                  {/* Colour dot */}
                  {opt.color && (
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0 transition-opacity"
                      style={{ backgroundColor: opt.color, opacity: isActive ? 1 : 0.5 }}
                    />
                  )}

                  <span className="flex-1">{opt.label}</span>

                  {/* Checkmark for active */}
                  {isActive && (
                    <Check size={10} className="text-violet-400 shrink-0" />
                  )}
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SelectDropdown;
