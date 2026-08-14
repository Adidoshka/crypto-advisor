import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import AuthLayout from '../components/AuthLayout';
import FormField from '../components/FormField';
import { UserIcon, MailIcon, LockIcon, EyeIcon } from '../components/icons';

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
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
      await api.post('/auth/register', { name, email, password });
      // No auto-login — send them to sign in with the account they just created.
      navigate('/login', { state: { justRegistered: true } });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg ?? 'Registration failed');
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <h2 className="font-outfit font-bold text-3xl 2xl:text-4xl text-white mb-1">Create Your Account</h2>
      <p className="text-slate-400 text-sm 2xl:text-base mb-8">Join CoinSage and get a dashboard tailored to you.</p>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <FormField label="Name" icon={<UserIcon />} placeholder="Alex Rivera" value={name} onChange={setName} />

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
          minLength={8}
          value={password}
          onChange={setPassword}
          helperText="At least 8 characters."
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
          className="w-full bg-brand-cyan hover:brightness-110 disabled:opacity-60 text-slate-950 font-semibold rounded-lg py-2.5 2xl:py-3.5 2xl:text-lg transition"
        >
          {isSubmitting ? 'Creating Account…' : 'Create Account'}
        </button>
      </form>

      <p className="text-slate-400 text-sm text-center mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-brand-cyan hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
