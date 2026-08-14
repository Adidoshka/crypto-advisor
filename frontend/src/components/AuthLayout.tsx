import type { ReactNode } from 'react';
import Logo from './Logo';
import SentimentCard from './SentimentCard';

// Shared page shell for Login/Register; only the form content differs, so that's passed in as children.
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    // Background (gradient/glow/dot-grid) goes full-bleed to the viewport edge so there's no dead
    // black margin on wide monitors, but the two-column content is capped and scales up at larger
    // breakpoints — letting it stretch to the raw viewport width made everything look small and
    // adrift instead of just filling the space.
    <div className="min-h-screen bg-brand-deep relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 -left-40 w-[40rem] h-[40rem] rounded-full bg-brand-cyan/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-20 w-[40rem] h-[40rem] rounded-full bg-brand-green/10 blur-3xl" />
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: 'radial-gradient(rgba(148,163,184,0.15) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className="relative min-h-screen max-w-[1800px] mx-auto flex">
        {/* Marketing panel — decorative, hidden on small screens */}
        <div className="hidden md:flex md:w-1/2 flex-col p-12 lg:p-20 2xl:p-28">
          <Logo showWordmark size="lg" />

          {/* Hero copy + card grouped as one vertically-centered block — pinning them to the panel's
              top/bottom edges left a huge dead gap on tall screens. */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="max-w-md 2xl:max-w-xl">
              <h1 className="font-outfit font-extrabold text-4xl lg:text-5xl 2xl:text-6xl leading-tight text-white mb-4 2xl:mb-6">
                Your AI-powered crypto companion.
              </h1>
              <p className="text-slate-400 text-base lg:text-lg 2xl:text-xl mb-8 2xl:mb-10">
                Navigate the complex landscape of digital assets with tailored intelligence, machine-learning
                sentiment tracking, and high-fidelity smart alerts.
              </p>
              <SentimentCard />
            </div>
          </div>
        </div>

        {/* Form panel */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm md:max-w-md 2xl:max-w-lg">
            <div className="md:hidden mb-8 flex justify-center">
              <Logo showWordmark size="lg" />
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
