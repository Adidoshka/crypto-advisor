import type { ReactNode } from 'react';
import Logo from './Logo';
import SentimentCard from './SentimentCard';

// Shared page shell for Login/Register; only the form content differs, so that's passed in as children.
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex bg-brand-deep">
      {/* Caps the two-column layout width on wide screens; the outer div still goes full-bleed. */}
      <div className="w-full max-w-7xl mx-auto flex">
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
            <span>Data Encrypted in Transit</span>
          </div>
        </div>

        {/* Form panel */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm">
            <div className="md:hidden mb-8 flex justify-center">
              <Logo showWordmark />
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
