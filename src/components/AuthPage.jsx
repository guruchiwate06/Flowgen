import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Mail, Lock, ArrowRight, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from '../firebase';

const AuthPage = ({ onSuccess, onBack }) => {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle redirect result for local development
  useEffect(() => {
    getRedirectResult(auth).then((result) => {
      if (result) {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const accessToken = credential.accessToken;
        onSuccess(accessToken);
      }
    }).catch(err => {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(friendlyError(err.code));
      }
      console.error("Redirect login error:", err);
    });
  }, [onSuccess]);

  const friendlyError = (code) => {
    switch (code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential': return 'Incorrect email or password.';
      case 'auth/email-already-in-use':  return 'This email is already registered.';
      case 'auth/weak-password':         return 'Password must be at least 6 characters.';
      case 'auth/invalid-email':         return 'Please enter a valid email.';
      default:                           return 'Something went wrong. Try again.';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setError('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onSuccess();
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope("https://www.googleapis.com/auth/drive.file");
      
      // Use signInWithPopup uniformly for Google login
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential.accessToken;
      onSuccess(accessToken);
      setLoading(false);
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(friendlyError(err.code));
      }
      console.error("Google login error:", err);
      setLoading(false);
    }
  };

  const toggle = () => {
    setMode(m => m === 'login' ? 'signup' : 'login');
    setError('');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 bg-[#0A0A0B] relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[50%] h-[50%] rounded-full bg-blue-500/8 blur-[120px] pointer-events-none" />

      {onBack && (
        <button 
          onClick={onBack}
          className="absolute top-6 left-6 md:top-10 md:left-10 flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white transition-colors z-10"
        >
          <ArrowLeft size={16} /> Back to Home
        </button>
      )}

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', damping: 24, stiffness: 180 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 rounded-[22px] bg-white flex items-center justify-center shadow-2xl mb-5">
            <Layers size={28} className="text-black" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-white mb-1">Flowgen</h1>
          <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/[0.04] border border-white/10 rounded-[32px] p-8 backdrop-blur-2xl shadow-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: mode === 'signup' ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: mode === 'signup' ? -20 : 20 }}
              transition={{ duration: 0.18 }}
            >
              <h2 className="text-xl font-black text-white tracking-tight mb-6">
                {mode === 'login' ? 'Log in' : 'Sign up'}
              </h2>
            </motion.div>
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="relative group">
              <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-violet-400 transition-colors" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email address"
                required
                className="w-full bg-black/40 border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 transition-all"
              />
            </div>

            {/* Password */}
            <div className="relative group">
              <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-violet-400 transition-colors" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="w-full bg-black/40 border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 transition-all"
              />
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2 text-red-400 text-xs font-bold bg-red-500/5 border border-red-500/15 rounded-xl px-4 py-2.5"
                >
                  <AlertCircle size={13} /> {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-white text-black font-black text-sm rounded-2xl flex items-center justify-center gap-2.5 shadow-xl hover:shadow-violet-500/10 transition-shadow disabled:opacity-60 mt-2"
            >
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Please wait…</>
                : <>{mode === 'login' ? 'Log In' : 'Sign Up'} <ArrowRight size={16} /></>
              }
            </motion.button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[10px] uppercase font-black tracking-widest text-slate-500">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Google Login */}
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3.5 bg-white/[0.03] border border-white/10 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-3 hover:bg-white/5 transition-all disabled:opacity-60"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </motion.button>

          {/* Toggle */}
          <p className="text-center text-xs text-slate-500 mt-6 font-bold">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={toggle} className="text-violet-400 hover:text-violet-300 transition-colors underline underline-offset-2">
              {mode === 'login' ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
