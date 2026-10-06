import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import LightRays from './LightRays';
import ShinyText from './ShinyText';

const Landing = ({ onStart, isLibReady }) => {
  const words = "Organize your content, not your files".split(" ");

  return (
    // The entire Landing page flow, free of strict absolute overlaps, 100% bug-proof.
    <div className="w-full relative bg-[#0A0A0B]">
      
      {/* SECTION 1: TOP IDENTITY (STICKY BEHIND) */}
      {/* 
        This section is sticky. It stays pinned to the screen while you scroll down.
        Because its z-index is 0, Section 2 will slide seamlessly *over* it like a curtain.
      */}
      <section className="sticky top-0 w-full h-screen flex flex-col items-center justify-center overflow-hidden z-0">
        <LightRays
          isLibReady={isLibReady}
          raysOrigin="top-center"
          raysColor="#ffffff"
          raysSpeed={1.0}
          lightSpread={1.5}
          rayLength={3}
          followMouse={true}
          mouseInfluence={0.12}
          fadeDistance={1.4}
        />
        <div className="relative z-10 flex flex-col items-center px-4 text-center">
          <ShinyText text="Flowgen" className="text-[clamp(3.5rem,14vw,14rem)] font-black tracking-tighter drop-shadow-[0_0_35px_rgba(255,255,255,0.4)]" />
          <p className="mt-4 text-xs md:text-sm font-bold uppercase tracking-[0.4em] text-slate-400 max-w-md">
            Organize content, not files
          </p>
          <div className="mt-8 flex items-center gap-4">
            <button
              onClick={onStart}
              className="h-14 px-10 bg-white text-black font-black text-sm rounded-full hover:scale-105 active:scale-95 transition-all shadow-2xl cursor-pointer"
            >
              Enter Workspace
            </button>
          </div>
          <div className="mt-12 flex flex-col items-center gap-2 text-white/30 animate-bounce" style={{ animationDuration: '2.5s' }}>
            <span className="text-[9px] font-bold uppercase tracking-[0.4em]">Scroll to Discover</span>
            <ArrowRight className="rotate-90" size={14} />
          </div>
        </div>
      </section>

      {/* SECTION 2: HERO CONTENT (CURTAIN REVEAL) */}
      {/* 
        This section sits naturally in the document flow. 
        It has a solid background, so as it scrolls up, it beautifully covers Section 1.
        This provides a flawless transition without buggy JavaScript scroll logic!
      */}
      <section className="relative w-full min-h-screen flex flex-col items-center pt-32 pb-16 z-10 bg-[#0A0A0B] shadow-[0_-20px_40px_rgba(10,10,11,1)]">
        
        {/* We re-add a subtle background effect strictly for Section 2's aura */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <LightRays
            isLibReady={isLibReady}
            raysOrigin="bottom-center"
            raysColor="#ffffff"
            raysSpeed={1}
            lightSpread={1.5}
            rayLength={3}
            followMouse={true}
            mouseInfluence={0.1}
            pulsating={false}
          />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          whileInView={{ opacity: 1, y: 0 }} 
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="relative z-10 flex flex-col items-center px-6 text-center max-w-5xl mx-auto flex-1 justify-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.08] text-slate-400 text-xs font-medium mb-12 uppercase tracking-widest">
            <Sparkles size={14} className="text-violet-400" />
            <span>Built for Performance</span>
          </div>
          <div className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-12 leading-[1.1] flex flex-wrap justify-center gap-x-4">
            {words.map((word, i) => (
              <span key={i} className={`inline-block py-2 ${i > 2 ? "text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400" : ""}`}>
                {word}
              </span>
            ))}
          </div>
          <button onClick={onStart} className="h-20 px-14 bg-white text-black font-black text-lg rounded-[28px] hover:scale-105 active:scale-95 transition-all shadow-2xl">
            Enter Workspace
          </button>
        </motion.div>

        {/* SECTION 3 / FOOTER: NO DEAD SCROLL */}
        <div className="mt-32 w-full flex flex-col items-center text-center px-6 z-10 opacity-70">
          <h4 className="text-white/30 text-[10px] font-black uppercase tracking-[0.6em] mb-4">Flowgen Terminal</h4>
        </div>
      </section>

    </div>
  );
};

export default Landing;
