import React, { useState, useEffect, useRef, Component } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, Kanban, Cloud, CheckCircle2, 
  Layers, Check, Sparkles, Video, ChevronRight
} from 'lucide-react';
import Lightfall from './Lightfall';
import ShinyText from './ShinyText';
import Folder from './Folder';
import BorderGlow from './BorderGlow';

class SafeBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err) { console.warn('[SafeBoundary caught]:', err); }
  render() {
    if (this.state.hasError) return this.props.fallback || null;
    return this.props.children;
  }
}

const FOLDER_ITEMS = [
  { title: 'Brand guidelines' },
  { title: 'Launch plan' },
  { image: '/photos/pier.jpg', title: 'The pier' }
];

export default function Landing({ onStart, onLogin, user }) {
  const [activeStep, setActiveStep] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isNavExpanded, setIsNavExpanded] = useState(false);
  const navRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      // Check if user has scrolled past slide 1
      const pastSlide1 = window.scrollY > window.innerHeight * 0.45;
      setIsScrolled(pastSlide1);
      if (!pastSlide1) {
        setIsNavExpanded(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close unrolled menu when clicking outside (while scrolled down)
  useEffect(() => {
    if (!isNavExpanded) return;
    const handleClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setIsNavExpanded(false);
      }
    };
    window.addEventListener('pointerdown', handleClickOutside);
    return () => window.removeEventListener('pointerdown', handleClickOutside);
  }, [isNavExpanded]);

  const isCollapsed = isScrolled && !isNavExpanded;

  const words = "Good ideas deserve better workflows.".split(" ");

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Studio Theme Stages (matching STATUS_CONFIG in src/constants.js)
  const WORKFLOW_STEPS = [
    {
      step: '01',
      stage: 'Idea',
      color: '#94a3b8', // Studio Slate
      glowColor: '215 16 65',
      tagline: 'Capture concepts before they fade',
      description: 'Log raw ideas, quick voice notes, and target formats into a frictionless inbox. Optional AI hooks give you immediate opening angles.',
      highlights: ['Instant quick-add modal', 'Opening hook generator', 'Format and target audience tags'],
      mockMeta: { clips: 0, status: 'Drafting', drive: 'Pending' }
    },
    {
      step: '02',
      stage: 'Shooting',
      color: '#eab308', // Studio Amber
      glowColor: '45 93 47',
      tagline: 'Structured checklists on set',
      description: 'Switch to shoot mode with role-based checklists. Verify camera settings, lighting setups, audio levels, and b-roll requirements before calling wrap.',
      highlights: ['Pre-shoot equipment checklist', 'A-roll and B-roll shot logs', 'Crew role assignments'],
      mockMeta: { clips: 4, status: 'On Set', drive: 'Folder Created' }
    },
    {
      step: '03',
      stage: 'Editing',
      color: '#3b82f6', // Studio Blue
      glowColor: '217 91 60',
      tagline: 'Centralized footage and Drive links',
      description: 'Keep all footage links, Google Drive folders, and music references unified in the card so editors can begin cutting without back-and-forth.',
      highlights: ['Direct Google Drive link', 'Asset ZIP downloader', 'Rough cut revision tracking'],
      mockMeta: { clips: 12, status: 'In Timeline', drive: 'Synced' }
    },
    {
      step: '04',
      stage: 'Ready',
      color: '#22c55e', // Studio Emerald
      glowColor: '142 71 45',
      tagline: 'Final packaging and thumbnail test',
      description: 'Evaluate thumbnail options, finalize title variations, and inspect final renders before scheduling the video for release.',
      highlights: ['Thumbnail preview gallery', 'Title and description notes', 'Final QA checklist'],
      mockMeta: { clips: 14, status: 'Approved', drive: 'Final Export' }
    },
    {
      step: '05',
      stage: 'Posted',
      color: '#6C5CE7', // Flowgen Signature Violet
      glowColor: '248 74 63',
      tagline: 'Permanent archive and velocity tracking',
      description: 'Mark the project complete. Keep all source scripts, b-roll archives, and assets easily searchable for future repurposing.',
      highlights: ['Long-term asset archive', 'Channel output velocity', 'Fast repurpose logging'],
      mockMeta: { clips: 14, status: 'Published', drive: 'Archived' }
    }
  ];

  const currentWorkflow = WORKFLOW_STEPS[activeStep];

  return (
    <div className="w-full relative bg-[#0A0A0B] text-slate-200 selection:bg-violet-500 selection:text-white font-sans overflow-x-hidden">
      
      {/* ── SECTION 1: TOP IDENTITY (SLIDE 1 - STICKY BASE WITH LIGHTFALL BACKGROUND) ── */}
      <section className="sticky top-0 w-full h-[100dvh] min-h-[520px] flex flex-col items-center justify-center overflow-hidden z-10 bg-[#0A0A0B]">
        
        {/* React Bits Lightfall Component: strictly in z-0 background layer behind FLOWGEN */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <SafeBoundary fallback={null}>
            <Lightfall
              colors={["#9781c7", "#6C5CE7", "#a78bfa"]}
              backgroundColor="#0A0A0B"
              speed={0.3}
              streakCount={2}
              streakWidth={0.6}
              twinkle={1}
              backgroundGlow={0.15}
              headGlow={0.35}
              bloom={0.6}
              mouseInteraction={true}
              holdToWarp={true}
              intro={true}
              streakLength={1.8}
              glow={1.8}
              depth={0.6}
              zoom={2.2}
              opacity={0.7}
              mouseStrength={0.2}
              mouseRadius={0.15}
              lens={0.15}
            />
          </SafeBoundary>
        </div>

        {/* Foreground Content: Sitting cleanly on layer z-20 with ShinyText */}
        <div className="relative z-20 isolate flex flex-col items-center px-4 text-center select-none pointer-events-auto">
          {/* Subtle violet ambient glow behind title for mobile depth */}
          <div className="absolute w-[240px] h-[240px] sm:w-[460px] sm:h-[460px] rounded-full bg-violet-600/20 blur-[80px] sm:blur-[130px] pointer-events-none -z-10" />

          <ShinyText 
            text="Flowgen" 
            className="text-6xl sm:text-8xl md:text-9xl lg:text-[14rem] font-black tracking-tight sm:tracking-tighter drop-shadow-[0_0_40px_rgba(255,255,255,0.4)]" 
          />
          
          <p className="mt-3 sm:mt-5 text-xs sm:text-sm md:text-base font-bold uppercase tracking-[0.25em] sm:tracking-[0.4em] text-slate-300">
            Organize content, not files
          </p>
          
          <div 
            onClick={() => scrollToSection('hero-slogan')} 
            className="mt-8 sm:mt-12 flex flex-col items-center gap-2 text-white/50 hover:text-white/90 transition-colors cursor-pointer animate-bounce" 
            style={{ animationDuration: '2.5s' }}
          >
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.25em] sm:tracking-[0.4em]">Scroll to Discover</span>
            <ArrowRight className="rotate-90" size={15} />
          </div>
        </div>
      </section>

      {/* ── SECTION 2: SLOGAN + CTAS (SLIDE 2) ── */}
      <section 
        id="hero-slogan"
        className="relative lg:sticky w-full min-h-[100dvh] flex flex-col items-center justify-center py-16 sm:py-20 px-4 z-20 bg-[#0A0A0B] shadow-[0_-30px_80px_rgba(0,0,0,0.95)] border-t border-white/[0.08]"
        style={{ top: 'min(0px, calc(100vh - 100%))' }}
      >
        <motion.div 
          initial={{ opacity: 0, y: 25 }} 
          whileInView={{ opacity: 1, y: 0 }} 
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="relative z-10 flex flex-col items-center px-4 sm:px-6 text-center max-w-5xl mx-auto flex-1 justify-center w-full"
        >
          {/* Studio Brand Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-400 text-[11px] sm:text-xs font-semibold mb-6 sm:mb-8 uppercase tracking-widest">
            <Sparkles size={13} />
            <span>Video Production Pipeline</span>
          </div>

          {/* Slogan: Responsive clamp sizing so words fit cleanly on mobile */}
          <h2 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tight mb-6 sm:mb-8 leading-[1.2] flex flex-wrap justify-center gap-x-2 sm:gap-x-4 overflow-visible max-w-4xl">
            {words.map((word, i) => (
              <span 
                key={i} 
                className={`inline-block px-1 pt-0.5 pb-2 sm:pb-3 overflow-visible ${
                  i > 2 ? "text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-[#6C5CE7]" : ""
                }`}
              >
                {word}
              </span>
            ))}
          </h2>

          <p className="text-sm sm:text-base md:text-lg text-slate-400 font-normal max-w-xl mx-auto mb-8 sm:mb-10 leading-relaxed px-2">
            From initial idea to final export. Manage scripts, shot lists, and Google Drive assets in one continuous visual workspace.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto max-w-xs sm:max-w-none">
            <button 
              onClick={onStart} 
              className="w-full sm:w-auto h-12 sm:h-16 px-6 sm:px-10 bg-white text-black font-extrabold text-sm sm:text-base rounded-full hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{user ? 'Enter Workspace' : 'Get Started Free'}</span>
              <ArrowRight size={17} />
            </button>

            {!user && (
              <button
                onClick={onLogin}
                className="w-full sm:w-auto h-12 sm:h-16 px-6 sm:px-8 bg-white/[0.04] hover:bg-white/[0.08] text-white font-medium text-sm sm:text-base rounded-full border border-white/10 hover:border-violet-500/30 transition-all flex items-center justify-center cursor-pointer"
              >
                <span>Login</span>
              </button>
            )}
          </div>

          {/* Down Indicator */}
          <div 
            onClick={() => scrollToSection('whats-inside')}
            className="mt-10 sm:mt-14 flex flex-col items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer text-xs"
          >
            <span className="text-[10px] font-mono uppercase tracking-[0.25em]">Features</span>
            <ArrowRight className="rotate-90" size={13} />
          </div>
        </motion.div>
      </section>

      {/* ── SECTION 3: FEATURES (WITH BORDERGLOW CONTAINERS) ── */}
      <section 
        id="whats-inside" 
        className="relative w-full min-h-screen py-16 sm:py-28 px-4 sm:px-6 lg:px-8 border-t border-white/[0.08] bg-[#0C0C0E] z-30 shadow-[0_-30px_80px_rgba(0,0,0,0.95)]"
      >
        <div className="max-w-6xl mx-auto relative z-10">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-2xl mx-auto mb-10 sm:mb-16"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/25 text-violet-400 text-xs font-mono uppercase tracking-widest mb-3">
              <Sparkles size={13} /> Flowgen Capabilities
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Designed for the video production workflow.
            </h2>
            <p className="mt-2.5 text-xs sm:text-base text-slate-400">
              Interactive stage controls built for creators, editors, and production teams.
            </p>
          </motion.div>

          {/* Feature Grid with Interactive BorderGlow Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">

            {/* Feature 1: Kanban Pipeline (Wide) - Themed in Studio Violet */}
            <BorderGlow
              borderRadius={24}
              edgeSensitivity={32}
              glowRadius={36}
              glowIntensity={1.0}
              glowColor="268 80 75"
              backgroundColor="#121216"
              colors={['#6C5CE7', '#a78bfa', '#c084fc']}
              className="lg:col-span-2 shadow-lg"
            >
              <div className="p-5 sm:p-7 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400 flex-shrink-0">
                        <Kanban size={20} />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">Visual Kanban Pipeline</h3>
                        <span className="text-xs text-violet-400/80 font-mono">Stage tracking</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300">
                      5 Stages
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-xl">
                    Drag and drop project cards across Idea, Shooting, Editing, Ready, and Posted stages. Real-time stage analytics keep you focused on what to shoot next.
                  </p>
                </div>

                {/* Studio Stage Status Counter: wrap cleanly on mobile */}
                <div className="mt-6 sm:mt-8 pt-4 sm:pt-5 border-t border-white/[0.06] flex flex-wrap sm:grid sm:grid-cols-5 gap-1.5 sm:gap-2 text-center text-xs">
                  {[
                    { label: 'Idea', color: '#94a3b8' },
                    { label: 'Shooting', color: '#eab308' },
                    { label: 'Editing', color: '#3b82f6' },
                    { label: 'Ready', color: '#22c55e' },
                    { label: 'Posted', color: '#6C5CE7' },
                  ].map((s, idx) => (
                    <div key={idx} className="flex-1 min-w-[55px] bg-white/[0.02] border border-white/[0.05] hover:border-white/10 rounded-xl py-1.5 sm:py-2 px-1 transition-all">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                        <span className="text-[10px] sm:text-[11px] font-medium text-slate-300 truncate">{s.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </BorderGlow>

            {/* Feature 2: Google Drive Vault - Themed in Studio Blue */}
            <BorderGlow
              borderRadius={24}
              edgeSensitivity={30}
              glowRadius={36}
              glowIntensity={1.0}
              glowColor="217 91 60"
              backgroundColor="#121216"
              colors={['#3b82f6', '#60a5fa', '#38bdf8']}
              className="shadow-lg"
            >
              <div className="p-5 sm:p-7 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0">
                      <Cloud size={20} />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">Google Drive Vault</h3>
                      <span className="text-xs text-blue-400/80 font-mono">Cloud asset sync</span>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    Automatic project folder creation in Google Drive. Direct links and instant ZIP archives keep all files tethered to the project.
                  </p>
                </div>

                <div className="mt-6 sm:mt-8 pt-4 sm:pt-5 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono">
                  <span className="text-blue-300 flex items-center gap-1.5 text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-blue-400" /> Drive Synced
                  </span>
                  <span className="text-slate-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 text-[10px]">
                    ZIP Export
                  </span>
                </div>
              </div>
            </BorderGlow>

            {/* Feature 3: Shoot Checklists - Themed in Studio Amber */}
            <BorderGlow
              borderRadius={24}
              edgeSensitivity={30}
              glowRadius={36}
              glowIntensity={1.0}
              glowColor="45 93 50"
              backgroundColor="#121216"
              colors={['#eab308', '#facc15', '#f59e0b']}
              className="shadow-lg"
            >
              <div className="p-5 sm:p-7 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">Shoot Checklists</h3>
                      <span className="text-xs text-amber-400/80 font-mono">On-set checklist</span>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    Role-specific checklists for camera, lighting, audio, and b-roll so nothing is missed during production.
                  </p>
                </div>

                <div className="mt-6 sm:mt-8 pt-4 sm:pt-5 border-t border-white/[0.06] space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                      <Check size={11} strokeWidth={2.5} />
                    </div>
                    <span className="text-[11px] sm:text-xs">Audio 32-bit float recorded</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                      <Check size={11} strokeWidth={2.5} />
                    </div>
                    <span className="text-[11px] sm:text-xs">4K B-Roll coverage verified</span>
                  </div>
                </div>
              </div>
            </BorderGlow>

            {/* Feature 4: Script & Hook Assistant - Themed in Studio Violet/Indigo */}
            <BorderGlow
              borderRadius={24}
              edgeSensitivity={30}
              glowRadius={36}
              glowIntensity={1.0}
              glowColor="270 85 70"
              backgroundColor="#121216"
              colors={['#8b5cf6', '#c084fc', '#f472b6']}
              className="shadow-lg"
            >
              <div className="p-5 sm:p-7 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400 flex-shrink-0">
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">Script & Hook Copilot</h3>
                      <span className="text-xs text-violet-400/80 font-mono">Creative assistant</span>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    Generate retention-focused hooks, video pacing outlines, and scene bullet points when drafting concepts.
                  </p>
                </div>

                <div className="mt-6 sm:mt-8 pt-4 sm:pt-5 border-t border-white/[0.06] flex items-center gap-1.5 sm:gap-2 text-[11px] text-slate-300">
                  <span className="px-2 sm:px-2.5 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-300 text-[10px] sm:text-[11px]">Hooks 🔥</span>
                  <span className="px-2 sm:px-2.5 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-300 text-[10px] sm:text-[11px]">Outline</span>
                  <span className="px-2 sm:px-2.5 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-300 text-[10px] sm:text-[11px]">Captions</span>
                </div>
              </div>
            </BorderGlow>

            {/* Feature 5: Media & Asset Preview - Themed in Studio Emerald */}
            <BorderGlow
              borderRadius={24}
              edgeSensitivity={30}
              glowRadius={36}
              glowIntensity={1.0}
              glowColor="142 71 45"
              backgroundColor="#121216"
              colors={['#22c55e', '#4ade80', '#10b981']}
              className="shadow-lg"
            >
              <div className="p-5 sm:p-7 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
                      <Video size={20} />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">Media & Thumbnails</h3>
                      <span className="text-xs text-emerald-400/80 font-mono">Asset preview</span>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    Inspect thumbnail drafts, review raw clip previews, and tag creative references without downloading large files.
                  </p>
                </div>

                <div className="mt-6 sm:mt-8 pt-4 sm:pt-5 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-300 font-mono">
                  <span className="text-emerald-400 flex items-center gap-1.5 text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" /> In-App Player
                  </span>
                  <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded text-[10px]">
                    Thumbnail Test
                  </span>
                </div>
              </div>
            </BorderGlow>

          </div>
        </div>
      </section>

      {/* ── SECTION 4: WORKFLOW TIMELINE ── */}
      <section 
        id="workflow-section" 
        className="relative lg:sticky w-full min-h-screen flex flex-col justify-center py-16 sm:py-20 px-4 sm:px-6 lg:px-8 border-t border-white/[0.08] bg-[#0E0E12] z-40 shadow-[0_-30px_80px_rgba(0,0,0,0.95)]"
        style={{ top: 'min(0px, calc(100vh - 100%))' }}
      >
        <div className="max-w-5xl mx-auto w-full">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-xl mx-auto mb-8 sm:mb-12"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono text-slate-400 uppercase tracking-widest mb-2">
              The 5 Production Stages
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              From concept to finished upload.
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-400">
              Select a stage to explore the real-time pipeline controls.
            </p>
          </motion.div>

          {/* Studio Stage Tabs: clean horizontal scroll on mobile, 5 cols on sm+ */}
          <div className="flex sm:grid sm:grid-cols-5 gap-2 overflow-x-auto pb-2 sm:pb-0 mb-6 sm:mb-8 -mx-1 px-1 sm:mx-0 sm:px-0 scrollbar-hide">
            {WORKFLOW_STEPS.map((step, idx) => {
              const isActive = activeStep === idx;
              return (
                <button
                  key={step.step}
                  onClick={() => setActiveStep(idx)}
                  className={`p-2.5 sm:p-3.5 rounded-2xl text-left border transition-all cursor-pointer relative flex-1 min-w-[95px] sm:min-w-0 ${
                    isActive
                      ? 'bg-white/[0.08] shadow-md'
                      : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.05] text-slate-400'
                  }`}
                  style={{
                    borderColor: isActive ? step.color : undefined
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono text-slate-500">
                      {step.step}
                    </span>
                    <div 
                      className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full" 
                      style={{ backgroundColor: step.color }} 
                    />
                  </div>
                  <div className={`text-xs sm:text-sm font-bold truncate ${isActive ? 'text-white' : 'text-slate-400'}`}>
                    {step.stage}
                  </div>
                  {isActive && (
                    <motion.div 
                      layoutId="stageTabIndicator"
                      className="absolute -bottom-1 left-3 right-3 h-0.5 rounded-full"
                      style={{ backgroundColor: step.color }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Active Stage Card Wrapped in BorderGlow */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <BorderGlow
                borderRadius={24}
                edgeSensitivity={28}
                glowRadius={36}
                glowIntensity={1.0}
                coneSpread={28}
                animated={true}
                glowColor={currentWorkflow.glowColor}
                backgroundColor="#121216"
                colors={[currentWorkflow.color, '#a78bfa', '#38bdf8']}
                className="shadow-2xl"
              >
                <div className="p-5 sm:p-8 relative overflow-hidden">
                  
                  {/* Subtle ambient stage glow */}
                  <div 
                    className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-20"
                    style={{ backgroundColor: currentWorkflow.color }}
                  />

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center relative z-10">
                    
                    <div className="lg:col-span-7 space-y-3 sm:space-y-4">
                      <div 
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold border"
                        style={{ 
                          backgroundColor: `${currentWorkflow.color}15`, 
                          borderColor: `${currentWorkflow.color}35`,
                          color: currentWorkflow.color 
                        }}
                      >
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: currentWorkflow.color }} />
                        <span>Stage {currentWorkflow.step} • {currentWorkflow.stage}</span>
                      </div>

                      <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                        {currentWorkflow.tagline}
                      </h3>

                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                        {currentWorkflow.description}
                      </p>

                      <div className="pt-1 sm:pt-2 space-y-2">
                        {currentWorkflow.highlights.map((item, i) => (
                          <div key={i} className="flex items-center gap-2.5 text-xs text-slate-200">
                            <div 
                              className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                              style={{ 
                                backgroundColor: `${currentWorkflow.color}20`,
                                color: currentWorkflow.color
                              }}
                            >
                              <Check size={11} strokeWidth={2.5} />
                            </div>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Minimalist Stage Card Representation */}
                    <div className="lg:col-span-5 bg-[#0A0A0C] border border-white/[0.08] rounded-2xl p-4 sm:p-5 space-y-3.5 text-xs font-mono">
                      <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.06]">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: currentWorkflow.color }} />
                          <span className="text-slate-200 font-bold">{currentWorkflow.stage} Card</span>
                        </div>
                        <span className="text-slate-500">#{currentWorkflow.step}</span>
                      </div>

                      <div className="space-y-2 text-slate-400">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Pipeline Status</span>
                          <span className="font-bold" style={{ color: currentWorkflow.color }}>
                            {currentWorkflow.mockMeta.status}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Attached Clips</span>
                          <span className="text-slate-200">{currentWorkflow.mockMeta.clips} items</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Cloud Storage</span>
                          <span className="text-slate-200">{currentWorkflow.mockMeta.drive}</span>
                        </div>
                      </div>

                      <div className="pt-2.5 border-t border-white/[0.06] flex justify-end">
                        <button
                          onClick={() => setActiveStep((activeStep + 1) % WORKFLOW_STEPS.length)}
                          className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors cursor-pointer text-[11px]"
                        >
                          <span>Next: {WORKFLOW_STEPS[(activeStep + 1) % WORKFLOW_STEPS.length].stage}</span>
                          <ChevronRight size={13} />
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              </BorderGlow>
            </motion.div>
          </AnimatePresence>

        </div>
      </section>

      {/* ── SECTION 5: INTERACTIVE FOLDER & CTA ── */}
      <section 
        id="scale-section"
        className="relative lg:sticky w-full min-h-screen flex flex-col justify-center py-16 sm:py-20 px-4 sm:px-6 lg:px-8 border-t border-white/[0.08] bg-[#0A0A0B] z-50 shadow-[0_-30px_80px_rgba(0,0,0,0.95)] pb-32 sm:pb-36"
        style={{ top: 'min(0px, calc(100vh - 100%))' }}
      >
        <div className="max-w-3xl mx-auto w-full text-center">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/25 text-violet-400 text-xs font-mono uppercase tracking-widest mb-3 sm:mb-4">
            <Sparkles size={13} /> Ready to Organize?
          </div>
          
          <h2 className="text-2xl sm:text-5xl font-extrabold text-white tracking-tight px-2">
            Stop fighting messy files. <br className="hidden sm:inline" />
            Start orchestrating content.
          </h2>

          <p className="mt-2.5 sm:mt-3 text-xs sm:text-base text-slate-400 max-w-md mx-auto px-4">
            Interact with the demo folder below to preview how project assets and documents stay accessible.
          </p>

          {/* Interactive Folder Widget with Mobile Scale Container */}
          <div className="my-8 sm:my-10 flex flex-col items-center justify-center overflow-visible">
            <div className="scale-[0.8] sm:scale-100 origin-center">
              <Folder
                label="Projects"
                items={FOLDER_ITEMS}
                onItemClick={(item, index) => console.log(item, index)}
              />
            </div>
            <span className="mt-3 sm:mt-4 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
              Click folder flap to open
            </span>
          </div>

          <div className="flex justify-center px-4">
            <button
              onClick={onStart}
              className="w-full sm:w-auto h-12 sm:h-14 px-8 sm:px-10 bg-white text-black font-extrabold text-sm sm:text-base rounded-full hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.25)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{user ? 'Enter Workspace' : 'Launch Flowgen Free'}</span>
              <ArrowRight size={17} />
            </button>
          </div>

          {/* Minimal Terminal Footer */}
          <div className="mt-16 sm:mt-24 pt-6 sm:pt-8 border-t border-white/[0.06] w-full flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-white flex items-center justify-center">
                <Layers size={12} className="text-black" />
              </div>
              <span className="font-bold text-white text-xs">Flowgen</span>
            </div>
            <span className="font-mono text-[10px] sm:text-[11px] text-slate-600">
              Flowgen Studio • {new Date().getFullYear()}
            </span>
          </div>

        </div>
      </section>

      {/* ── FLOATING NAVIGATION DOCK / UNROLLING BAR ── */}
      <div 
        className={`fixed bottom-6 sm:bottom-8 inset-x-0 z-[100] pointer-events-none px-4 sm:px-6 flex ${
          isCollapsed ? 'justify-start' : 'justify-center'
        }`}
      >
        <motion.div
          ref={navRef}
          layout
          transition={{
            type: 'spring',
            stiffness: 420,
            damping: 35,
            mass: 0.4
          }}
          style={{ willChange: 'transform' }}
          className="pointer-events-auto max-w-[calc(100vw-32px)]"
        >
          <BorderGlow
            borderRadius={999}
            edgeSensitivity={35}
            glowRadius={24}
            glowIntensity={1.0}
            coneSpread={30}
            glowColor="268 80 75"
            backgroundColor="#121215"
            colors={['#6C5CE7', '#a78bfa', '#38bdf8']}
            className="shadow-2xl backdrop-blur-md"
          >
            <div className="flex items-center p-1.5 sm:p-2">
              
              {/* The Flowgen Logo Button (clean icon always at anchor position) */}
              <button
                onClick={() => {
                  if (isCollapsed) {
                    setIsNavExpanded(true);
                  } else if (isScrolled) {
                    setIsNavExpanded(false);
                  } else {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                title={isCollapsed ? "Open navigation menu" : isScrolled ? "Collapse to icon" : "Scroll to top"}
                className="flex items-center justify-center p-1 rounded-full hover:scale-105 active:scale-95 transition-transform cursor-pointer flex-shrink-0"
              >
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow">
                  <Layers size={15} className="text-black" />
                </div>
              </button>

              {/* Synchronized Smooth Collapsing/Expanding Menu */}
              <motion.div
                initial={false}
                animate={{
                  maxWidth: isCollapsed ? 0 : 440,
                  opacity: isCollapsed ? 0 : 1,
                }}
                transition={{
                  duration: isCollapsed ? 0.2 : 0.28,
                  ease: isCollapsed ? [0.4, 0, 0.2, 1] : [0.16, 1, 0.3, 1]
                }}
                className="overflow-hidden flex items-center"
              >
                <div className="flex items-center gap-2 sm:gap-4 pl-2 pr-1 whitespace-nowrap">
                  <span className="text-xs sm:text-sm font-bold text-white tracking-tight hidden sm:inline">
                    Flowgen
                  </span>

                  <div className="h-4 w-[1px] bg-white/10 hidden sm:block flex-shrink-0" />

                  {/* Navigation anchors */}
                  <div className="flex items-center gap-1 text-[11px] sm:text-xs font-medium text-slate-400">
                    <button
                      onClick={() => {
                        scrollToSection('whats-inside');
                        if (isScrolled) setIsNavExpanded(false);
                      }}
                      className="px-2.5 py-1 rounded-full hover:text-white transition-colors cursor-pointer text-slate-300"
                    >
                      Features
                    </button>
                    <button
                      onClick={() => {
                        scrollToSection('workflow-section');
                        if (isScrolled) setIsNavExpanded(false);
                      }}
                      className="px-2.5 py-1 rounded-full hover:text-white transition-colors cursor-pointer text-slate-300"
                    >
                      Workflow
                    </button>
                  </div>

                  <div className="h-3.5 sm:h-4 w-[1px] bg-white/10 flex-shrink-0" />

                  {/* Action button */}
                  <button
                    onClick={onStart}
                    className="h-8 px-3.5 sm:px-4 bg-white text-black font-bold text-xs rounded-full hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-sm flex-shrink-0"
                  >
                    <span>{user ? 'Studio' : 'Open'}</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              </motion.div>

            </div>
          </BorderGlow>
        </motion.div>
      </div>

    </div>
  );
}
