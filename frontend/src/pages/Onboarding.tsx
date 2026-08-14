import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Logo from '../components/Logo';

const CRYPTO_ASSETS = [
  'Bitcoin',
  'Ethereum',
  'Solana',
  'Cardano',
  'Polkadot',
  'Avalanche',
  'Chainlink',
  'Polygon',
  'Near Protocol',
  'Cosmos',
  'Uniswap',
  'Aptos',
];
const INVESTOR_TYPES = [
  { name: 'HODLer', description: 'Buy and hold for the long term', icon: 'pulse' as const },
  { name: 'Day Trader', description: 'Active trading and market timing', icon: 'trend' as const },
  { name: 'NFT Collector', description: 'Digital art and collectibles', icon: 'image' as const },
  { name: 'DeFi Explorer', description: 'Yield farming and protocols', icon: 'share' as const },
];
const CONTENT_TYPES = [
  { name: 'Market News', description: 'Real-time updates, macro trends, and regulatory alerts.' },
  { name: 'Price Charts', description: 'Interactive technical analysis and real-time order books.' },
  { name: 'AI Insights', description: 'Machine learning prediction models and on-chain intelligence.' },
  { name: 'Social Buzz', description: 'Sentiment tracking from Twitter, Reddit, and Discord communities.' },
  { name: 'Fun Memes', description: 'Lightweight algorithmic crypto community humor and culture.' },
];

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const INVESTOR_ICONS: Record<(typeof INVESTOR_TYPES)[number]['icon'], ReactNode> = {
  pulse: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 12h4l2 7 4-14 2 7h8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  trend: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 17l6-6 4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 7h6v6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  image: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  share: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="18" cy="5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="19" r="2.5" />
      <path d="M8.3 10.7l7.4-4.4M8.3 13.3l7.4 4.4" strokeLinecap="round" />
    </svg>
  ),
};

function Toggle({ label, selected, onToggle }: { label: string; selected: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition ${
        selected
          ? 'bg-brand-cyan/10 text-brand-cyan border-brand-cyan'
          : 'bg-slate-800/50 text-slate-300 border-slate-700 hover:border-slate-500'
      }`}
    >
      {label}
      {selected && <CheckIcon />}
    </button>
  );
}

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [assets, setAssets] = useState<string[]>([]);
  const [investorType, setInvestorType] = useState('');
  const [contentTypes, setContentTypes] = useState<string[]>([]);
  const [error, setError] = useState('');

  function toggleItem(arr: string[], item: string, setter: (v: string[]) => void) {
    setter(arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item]);
  }

  async function finish() {
    setError('');
    try {
      await api.post('/preferences', { assets, investorType, contentTypes });
      navigate('/dashboard');
    } catch {
      setError('Failed to save preferences. Please try again.');
    }
  }

  const steps = [
    {
      title: 'What crypto assets are you interested in?',
      subtitle: 'Select your preferred digital assets to customize your news feed and AI models. (Select all that apply)',
      canProceed: assets.length > 0,
      content: (
        <div className="flex flex-wrap gap-2.5 justify-center">
          {CRYPTO_ASSETS.map((a) => (
            <Toggle key={a} label={a} selected={assets.includes(a)} onToggle={() => toggleItem(assets, a, setAssets)} />
          ))}
        </div>
      ),
    },
    {
      title: 'What type of investor are you?',
      subtitle: 'Help our AI model choose your advisor persona and strategic parameters.',
      canProceed: investorType !== '',
      content: (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4" role="radiogroup" aria-label="Investor type">
          {INVESTOR_TYPES.map((t) => {
            const selected = investorType === t.name;
            return (
              <button
                key={t.name}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setInvestorType(t.name)}
                className={`text-left p-4 rounded-xl border transition ${
                  selected ? 'border-brand-cyan bg-brand-cyan/10' : 'border-slate-700 bg-slate-800/40 hover:border-slate-500'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                    selected ? 'bg-brand-cyan text-slate-950' : 'bg-slate-700/60 text-slate-300'
                  }`}
                >
                  {INVESTOR_ICONS[t.icon]}
                </div>
                <p className="font-bold text-white text-sm mb-1">{t.name}</p>
                <p className="text-xs text-slate-400">{t.description}</p>
              </button>
            );
          })}
        </div>
      ),
    },
    {
      title: 'What content do you want to see?',
      subtitle: 'Customize your dashboard interface layout and intelligence feeds.',
      canProceed: contentTypes.length > 0,
      content: (
        <div className="flex flex-col gap-3">
          {CONTENT_TYPES.map((c) => {
            const selected = contentTypes.includes(c.name);
            return (
              <button
                key={c.name}
                type="button"
                role="checkbox"
                aria-checked={selected}
                onClick={() => toggleItem(contentTypes, c.name, setContentTypes)}
                className={`flex items-start gap-3 text-left p-4 rounded-xl border transition ${
                  selected ? 'border-brand-cyan bg-brand-cyan/5' : 'border-slate-700 bg-slate-800/30 hover:border-slate-500'
                }`}
              >
                <span
                  className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 ${
                    selected ? 'bg-brand-cyan text-slate-950' : 'border border-slate-600'
                  }`}
                >
                  {selected && <CheckIcon />}
                </span>
                <span>
                  <p className="font-bold text-white text-sm">{c.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{c.description}</p>
                </span>
              </button>
            );
          })}
        </div>
      ),
    },
  ];

  const current = steps[step];
  const isLastStep = step === steps.length - 1;

  return (
    <div className="min-h-screen bg-brand-deep">
      <div className="flex items-center justify-between px-8 py-5 border-b border-white/10">
        <Logo showWordmark />
        <div className="flex items-center gap-2 text-sm text-slate-400">
          Onboarding Mode
          <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
        </div>
      </div>

      <div className="flex justify-center px-4 py-14">
        <div className="w-full max-w-2xl bg-slate-900/60 rounded-2xl p-10 border border-white/10">
          <div className="text-center mb-6">
            <p className="text-xs font-semibold tracking-wide text-brand-cyan mb-2">
              STEP {step + 1} OF {steps.length}
            </p>
            <div className="flex gap-1.5 justify-center w-40 mx-auto">
              {steps.map((_, i) => (
                <div key={i} className={`h-1 flex-1 rounded-full transition ${i <= step ? 'bg-brand-cyan' : 'bg-slate-700'}`} />
              ))}
            </div>
          </div>

          <h2 className="font-outfit font-bold text-2xl md:text-3xl text-white text-center mb-2">{current.title}</h2>
          <p className="text-slate-400 text-sm text-center max-w-lg mx-auto mb-8">{current.subtitle}</p>

          {current.content}

          {error && <p className="text-red-400 text-sm mt-4 text-center">{error}</p>}

          <div className="flex justify-between items-center mt-10">
            {step === 0 ? (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-sm text-slate-500 hover:text-slate-300 transition"
              >
                Skip for now
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="px-4 py-2 text-slate-400 hover:text-slate-200 transition"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={isLastStep ? finish : () => setStep((s) => s + 1)}
              disabled={!current.canProceed}
              className={`px-6 py-2.5 font-semibold rounded-lg disabled:opacity-40 transition text-slate-950 ${
                isLastStep ? 'bg-gradient-to-r from-brand-cyan to-brand-green' : 'bg-brand-cyan hover:brightness-110'
              }`}
            >
              {isLastStep ? 'Get Started' : 'Next Step'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
