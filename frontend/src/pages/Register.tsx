import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/auth/register', { name, email, password });
      login(data.token);
      navigate('/onboarding');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg ?? 'Registration failed');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-sm bg-slate-800 rounded-2xl p-8 shadow-xl border border-slate-700">
        <h1 className="text-2xl font-bold text-amber-400 mb-1 text-center">CryptoAdvisor</h1>
        <p className="text-slate-400 text-sm text-center mb-6">Create your account</p>

        {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-400"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-400"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-400"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-amber-400 hover:bg-amber-300 text-slate-900 font-semibold rounded-lg py-2 transition"
          >
            Create Account
          </button>
        </form>

        <p className="text-slate-400 text-sm text-center mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-amber-400 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
