import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';
import FormField from '../components/FormField';
import { MailIcon, LockIcon, EyeIcon } from '../components/icons';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data.token, data.name);
      navigate(data.hasPreferences ? '/dashboard' : '/onboarding');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg ?? 'Login failed');
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <h2 className="font-outfit font-bold text-3xl text-white mb-1">Welcome Back</h2>
      <p className="text-slate-400 text-sm mb-8">Please enter your details to access your investor cockpit.</p>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <FormField
          label="Email Address"
          icon={<MailIcon />}
          type="email"
          placeholder="alex@fintech.com"
          value={email}
          onChange={setEmail}
        />

        <FormField
          label="Password"
          icon={<LockIcon />}
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={setPassword}
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <EyeIcon open={showPassword} />
            </button>
          }
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-brand-cyan hover:brightness-110 disabled:opacity-60 text-slate-950 font-semibold rounded-lg py-2.5 transition"
        >
          {isSubmitting ? 'Signing In…' : 'Log In'}
        </button>
      </form>

      <p className="text-slate-400 text-sm text-center mt-6">
        Don't have an account?{' '}
        <Link to="/register" className="text-brand-cyan hover:underline font-medium">
          Sign Up
        </Link>
      </p>
    </AuthLayout>
  );
}
