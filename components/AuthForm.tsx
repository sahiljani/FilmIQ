
import React, { useState } from 'react';
import { dbService } from '../services/dbService';

interface Props {
  onSuccess: (user: any) => void;
}

const AuthForm: React.FC<Props> = ({ onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      if (mode === 'login') {
        const data = await dbService.login({ email, password });
        localStorage.setItem('cinewise_token', data.token);
        onSuccess(data.user);
      } else if (mode === 'signup') {
        if (password !== confirmPassword) {
            throw new Error('Passwords do not match');
        }
        const data = await dbService.signup({ name, email, password });
        localStorage.setItem('cinewise_token', data.token);
        onSuccess(data.user);
      } else {
        const data = await dbService.forgotPassword(email);
        setMessage({ type: 'success', text: data.message });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white">
          {mode === 'login' ? 'Welcome Back' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
        </h2>
        <p className="text-gray-400 text-sm mt-2">
          {mode === 'login' ? 'Sign in to access your recommendations' : mode === 'signup' ? 'Start building your movie profile' : 'Enter your email to get a reset link'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'signup' && (
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Full Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-black/40 border border-gray-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-red-600 outline-none transition"
              required
            />
          </div>
        )}
        
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Email Address</label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-black/40 border border-gray-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-red-600 outline-none transition"
            required
          />
        </div>

        {mode !== 'forgot' && (
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/40 border border-gray-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-red-600 outline-none transition"
              required
            />
          </div>
        )}

        {mode === 'signup' && (
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Confirm Password</label>
            <input 
              type="password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-black/40 border border-gray-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-red-600 outline-none transition"
              required
            />
          </div>
        )}

        {message && (
          <div className={`p-3 rounded-lg text-sm font-medium ${message.type === 'error' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}>
            {message.text}
          </div>
        )}

        <button 
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-red-600 hover:bg-red-500 disabled:bg-gray-800 text-white rounded-xl font-bold text-lg shadow-lg shadow-red-900/30 transform transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          {loading && <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>}
          {mode === 'login' ? 'Login' : mode === 'signup' ? 'Sign Up' : 'Send Reset Link'}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-white/5 flex flex-col gap-4 text-center">
        {mode === 'login' ? (
          <>
            <button onClick={() => setMode('signup')} className="text-gray-400 hover:text-white text-sm transition">Don't have an account? <span className="text-red-500 font-bold">Sign Up</span></button>
            <button onClick={() => setMode('forgot')} className="text-gray-500 hover:text-gray-300 text-xs underline">Forgot password?</button>
          </>
        ) : mode === 'signup' ? (
          <button onClick={() => setMode('login')} className="text-gray-400 hover:text-white text-sm transition">Already have an account? <span className="text-red-500 font-bold">Login</span></button>
        ) : (
          <button onClick={() => setMode('login')} className="text-gray-400 hover:text-white text-sm transition">Back to <span className="text-red-500 font-bold">Login</span></button>
        )}
      </div>
    </div>
  );
};

export default AuthForm;
