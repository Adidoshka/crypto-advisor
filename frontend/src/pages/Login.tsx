import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import SentimentCard from '../components/SentimentCard';
import { MailIcon, LockIcon, EyeIcon } from '../components/icons';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data.token, data.name);
      navigate(data.hasPreferences ? '/dashboard' : '/onboarding');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg ?? 'Login failed');
    }
  }

  return (
    <div className="min-h-screen flex bg-brand-deep">
      {/* Marketing panel — decorative, hidden on small screens */}
      <div className="hidden md:flex md:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-brand-deep via-slate-900 to-brand-deep">
        <Logo showWordmark />

        <div className="max-w-md">
          <h1 className="font-outfit font-extrabold text-4xl leading-tight text-white mb-4">
            Your AI-powered crypto companion.
          </h1>
          <p className="text-slate-400 mb-8">
            Navigate the complex landscape of digital assets with tailored intelligence, machine-learning
            sentiment tracking, and high-fidelity smart alerts.
          </p>
          <SentimentCard />
        </div>

        <div className="flex gap-6 text-xs text-slate-500">
          <span>Institutional Grade</span>
          <span>End-to-End Encryption</span>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="md:hidden mb-8 flex justify-center">
            <Logo showWordmark />
          </div>

          <h2 className="font-outfit font-bold text-3xl text-white mb-1">Welcome Back</h2>
          <p className="text-slate-400 text-sm mb-8">Please enter your details to access your investor cockpit.</p>

          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                  <MailIcon />
                </span>
                <input
                  type="email"
                  required
                  placeholder="alex@fintech.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-700 rounded-lg pl-10 pr-3 py-2.5 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-brand-cyan transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                  <LockIcon />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-700 rounded-lg pl-10 pr-10 py-2.5 text-slate-100 focus:outline-none focus:border-brand-cyan transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-400 select-none">
              <input
                type="checkbox"
                checked={keepSignedIn}
                onChange={(e) => setKeepSignedIn(e.target.checked)}
                className="rounded border-slate-600 bg-slate-900 accent-brand-cyan"
              />
              Keep me signed in
            </label>

            <button
              type="submit"
              className="w-full bg-brand-cyan hover:brightness-110 text-slate-950 font-semibold rounded-lg py-2.5 transition"
            >
              Log In
            </button>
          </form>

          <p className="text-slate-400 text-sm text-center mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-cyan hover:underline font-medium">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
