import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const CRYPTO_ASSETS = ['Bitcoin', 'Ethereum', 'Solana', 'Cardano', 'Polkadot', 'Chainlink', 'Dogecoin', 'Avalanche'];
const INVESTOR_TYPES = ['HODLer', 'Day Trader', 'NFT Collector', 'DeFi Explorer', 'Swing Trader'];
const CONTENT_TYPES = ['Market News', 'Coin Prices', 'AI Insights', 'Memes & Fun'];

function Toggle({ label, selected, onToggle }: { label: string; selected: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
        selected
          ? 'bg-amber-400 text-slate-900 border-amber-400'
          : 'bg-slate-800 text-slate-300 border-slate-600 hover:border-amber-400'
      }`}
    >
      {label}
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
      title: 'Which crypto assets interest you?',
      subtitle: 'Select all that apply',
      content: (
        <div className="flex flex-wrap gap-2 justify-center">
          {CRYPTO_ASSETS.map((a) => (
            <Toggle key={a} label={a} selected={assets.includes(a)} onToggle={() => toggleItem(assets, a, setAssets)} />
          ))}
        </div>
      ),
      canProceed: assets.length > 0,
    },
    {
      title: 'What type of investor are you?',
      subtitle: 'Pick one that best describes you',
      content: (
        <div className="flex flex-wrap gap-2 justify-center">
          {INVESTOR_TYPES.map((t) => (
            <Toggle key={t} label={t} selected={investorType === t} onToggle={() => setInvestorType(t)} />
          ))}
        </div>
      ),
      canProceed: investorType !== '',
    },
    {
      title: 'What content would you like to see?',
      subtitle: 'Select all that apply',
      content: (
        <div className="flex flex-wrap gap-2 justify-center">
          {CONTENT_TYPES.map((c) => (
            <Toggle
              key={c}
              label={c}
              selected={contentTypes.includes(c)}
              onToggle={() => toggleItem(contentTypes, c, setContentTypes)}
            />
          ))}
        </div>
      ),
      canProceed: contentTypes.length > 0,
    },
  ];

  const current = steps[step];

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-lg bg-slate-800 rounded-2xl p-8 shadow-xl border border-slate-700">
        <div className="flex gap-1 mb-6">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition ${i <= step ? 'bg-amber-400' : 'bg-slate-600'}`}
            />
          ))}
        </div>

        <h2 className="text-xl font-bold text-slate-100 mb-1">{current.title}</h2>
        <p className="text-slate-400 text-sm mb-6">{current.subtitle}</p>

        {current.content}

        {error && <p className="text-red-400 text-sm mt-4 text-center">{error}</p>}

        <div className="flex justify-between mt-8">
          <button
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className="px-4 py-2 text-slate-400 hover:text-slate-200 disabled:opacity-30 transition"
          >
            Back
          </button>
          <button
            onClick={step < steps.length - 1 ? () => setStep((s) => s + 1) : finish}
            disabled={!current.canProceed}
            className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-900 font-semibold rounded-lg disabled:opacity-40 transition"
          >
            {step < steps.length - 1 ? 'Next' : 'Go to Dashboard'}
          </button>
        </div>
      </div>
    </div>
  );
}
