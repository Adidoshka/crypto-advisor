import { useEffect, useState, useCallback, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResponsiveContainer, AreaChart, Area, Tooltip } from 'recharts';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import logo from '../assets/logo.png';

interface CoinPrice {
  id: string;
  name: string;
  // Optional, not string — dashboard.ts's fetchPrices fallback (used when
  // CoinGecko fails) returns objects with no symbol field at all.
  symbol?: string;
  current_price: number | null;
  price_change_percentage_24h: number | null;
  image?: string;
  sparkline_in_7d?: { price: number[] };
}

interface NewsItem {
  id: string | number;
  title: string;
  url: string;
  source?: { title: string };
  published_at?: string;
}

interface Meme {
  id: string;
  url: string;
  title: string;
}

interface DashboardData {
  prices: CoinPrice[];
  news: NewsItem[];
  insight: string;
  meme: Meme;
}

type VoteMap = Record<string, number>;

// Inline SVG fallback for a broken meme image — no external service dependency for a fallback path.
const MEME_FALLBACK_SVG =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><rect width="400" height="200" fill="#070a16"/><text x="200" y="105" fill="#64748b" font-family="sans-serif" font-size="16" text-anchor="middle">Meme unavailable</text></svg>',
  );

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 18) return 'Good Afternoon';
  return 'Good Evening';
}

function VoteButtons({
  sectionKey,
  itemId,
  votes,
  onVote,
}: {
  sectionKey: string;
  itemId: string;
  votes: VoteMap;
  onVote: (section: string, itemId: string, value: 1 | -1) => void;
}) {
  const key = `${sectionKey}:${itemId}`;
  const current = votes[key];
  return (
    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
      <span className="text-xs text-slate-500 mr-auto">Was this useful?</span>
      <button
        onClick={() => onVote(sectionKey, itemId, 1)}
        title="Thumbs up"
        className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border transition ${
          current === 1
            ? 'bg-brand-green/15 border-brand-green/40 text-brand-green'
            : 'border-transparent text-slate-500 hover:bg-slate-800'
        }`}
      >
        👍
      </button>
      <button
        onClick={() => onVote(sectionKey, itemId, -1)}
        title="Thumbs down"
        className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border transition ${
          current === -1
            ? 'bg-red-500/15 border-red-500/40 text-red-400'
            : 'border-transparent text-slate-500 hover:bg-slate-800'
        }`}
      >
        👎
      </button>
    </div>
  );
}

function SectionCard({ title, badge, children }: { title: string; badge?: string; children: ReactNode }) {
  return (
    <div className="bg-slate-900/60 rounded-2xl border border-white/10 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-bold text-lg">{title}</h2>
        {badge && (
          <span className="text-[11px] font-semibold tracking-wide px-2.5 py-1 rounded-full border border-brand-cyan/40 text-brand-cyan">
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

export default function Dashboard() {
  const { name, logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [votes, setVotes] = useState<VoteMap>({});

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [dashRes, voteRes] = await Promise.all([api.get('/dashboard'), api.get('/votes')]);
      setData(dashRes.data as DashboardData);
      const voteMap: VoteMap = {};
      for (const v of voteRes.data as { section: string; itemId: string; value: number }[]) {
        voteMap[`${v.section}:${v.itemId}`] = v.value;
      }
      setVotes(voteMap);
    } catch {
      setError('Failed to load dashboard. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  async function handleVote(section: string, itemId: string, value: 1 | -1) {
    const key = `${section}:${itemId}`;
    const previous = votes[key]; // restore this exact value on failure, not just clear it
    setVotes((prev) => ({ ...prev, [key]: value }));
    try {
      await api.post('/votes', { section, itemId, value });
    } catch {
      setVotes((prev) => {
        const next = { ...prev };
        if (previous === undefined) delete next[key];
        else next[key] = previous;
        return next;
      });
    }
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const firstName = name?.split(' ')[0] ?? 'there';
  const initial = name?.charAt(0).toUpperCase() ?? '?';

  return (
    <div className="min-h-screen bg-brand-deep">
      <header className="flex items-center justify-between px-6 md:px-10 py-4 border-b border-white/10">
        <div className="flex items-center gap-10">
          <Logo showWordmark />
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
            <span className="text-brand-cyan">Dashboard</span>
            <span className="text-slate-500">Alerts</span>
            <span className="text-slate-500">Sentiment</span>
            <span className="text-slate-500">Portfolio</span>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-white text-sm font-semibold">
              {getGreeting()}, {firstName}
            </p>
            <p className="text-slate-500 text-xs">Investor Cockpit Active</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-cyan to-brand-green flex items-center justify-center text-slate-950 font-bold text-sm shrink-0">
            {initial}
          </div>
          <div className="flex gap-1 border-l border-white/10 pl-3 ml-1">
            <button
              onClick={loadDashboard}
              className="text-slate-400 hover:text-brand-cyan text-xs transition px-2.5 py-1.5 rounded-lg hover:bg-slate-800"
            >
              Refresh
            </button>
            <button
              onClick={() => navigate('/onboarding')}
              className="text-slate-400 hover:text-brand-cyan text-xs transition px-2.5 py-1.5 rounded-lg hover:bg-slate-800"
            >
              Preferences
            </button>
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-red-400 text-xs transition px-2.5 py-1.5 rounded-lg hover:bg-slate-800"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
          <div>
            <h1 className="font-outfit font-bold text-3xl text-white mb-1">Your Daily Intelligence Hub</h1>
            <p className="text-slate-400 text-sm">AI-synthesized markets, technical anomalies, and live sentiment analysis.</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-300 bg-slate-800/50 border border-white/10 rounded-full px-4 py-2">
            <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
            AI Models Synced
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-brand-cyan border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="text-center py-20">
            <p className="text-red-400 mb-4">{error}</p>
            <button onClick={loadDashboard} className="px-4 py-2 bg-brand-cyan text-slate-950 rounded-lg font-semibold">
              Retry
            </button>
          </div>
        )}

        {data && !loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Coin Prices */}
            <SectionCard title="Market Tracker" badge="REAL-TIME">
              {data.prices.length === 0 ? (
                <p className="text-slate-400 text-sm">No price data available.</p>
              ) : (
                <ul className="space-y-4">
                  {data.prices.map((coin) => {
                    const sparkData = coin.sparkline_in_7d?.price
                      ? coin.sparkline_in_7d.price
                          .filter((_, i) => i % 12 === 0)
                          .map((v) => ({ v }))
                      : null;
                    const up = (coin.price_change_percentage_24h ?? 0) >= 0;
                    return (
                      <li key={coin.id} className="bg-slate-950/50 rounded-xl p-4 border border-white/5">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            {coin.image ? (
                              <img src={coin.image} alt={coin.name} className="w-8 h-8 rounded-full" />
                            ) : (
                              <span className="w-8 h-8 rounded-full bg-brand-cyan/10 border border-brand-cyan/30 flex items-center justify-center text-[10px] font-bold text-brand-cyan">
                                {(coin.symbol ?? coin.name).slice(0, 3).toUpperCase()}
                              </span>
                            )}
                            <div>
                              <p className="text-slate-100 font-semibold text-sm leading-tight">{coin.name}</p>
                              <p className="text-slate-500 text-xs uppercase">{coin.symbol}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-slate-100 font-semibold">
                              {coin.current_price != null ? `$${coin.current_price.toLocaleString()}` : 'N/A'}
                            </p>
                            {coin.price_change_percentage_24h != null && (
                              <p className={`text-xs font-medium ${up ? 'text-brand-green' : 'text-red-400'}`}>
                                {up ? '+' : ''}
                                {coin.price_change_percentage_24h.toFixed(2)}%
                              </p>
                            )}
                          </div>
                        </div>
                        {sparkData && (
                          <ResponsiveContainer width="100%" height={48}>
                            <AreaChart data={sparkData}>
                              <defs>
                                <linearGradient id={`g-${coin.id}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor={up ? '#10b981' : '#f87171'} stopOpacity={0.3} />
                                  <stop offset="95%" stopColor={up ? '#10b981' : '#f87171'} stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <Tooltip
                                content={({ active, payload }) =>
                                  active && payload?.[0] ? (
                                    <span className="text-xs text-slate-300 bg-slate-800 px-2 py-1 rounded">
                                      ${Number(payload[0].value).toLocaleString()}
                                    </span>
                                  ) : null
                                }
                              />
                              <Area
                                type="monotone"
                                dataKey="v"
                                stroke={up ? '#10b981' : '#f87171'}
                                strokeWidth={1.5}
                                fill={`url(#g-${coin.id})`}
                                dot={false}
                                isAnimationActive={false}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        )}
                        <VoteButtons sectionKey="prices" itemId={coin.id} votes={votes} onVote={handleVote} />
                      </li>
                    );
                  })}
                </ul>
              )}
            </SectionCard>

            {/* AI Insight */}
            <SectionCard title="AI Insight of the Day" badge="POWERED BY AI">
              <div className="flex items-start gap-3">
                <span className="w-10 h-10 rounded-lg bg-brand-cyan/10 border border-brand-cyan/30 flex items-center justify-center shrink-0">
                  <img src={logo} alt="" className="w-6 h-6" />
                </span>
                <p className="text-slate-300 text-sm leading-relaxed">{data.insight}</p>
              </div>
              <VoteButtons sectionKey="insight" itemId="daily" votes={votes} onVote={handleVote} />
            </SectionCard>

            {/* Market News */}
            <SectionCard title="Market News Feed" badge="LIVE">
              {data.news.length === 0 ? (
                <p className="text-slate-400 text-sm">No news available.</p>
              ) : (
                <ul>
                  {data.news.map((item) => (
                    <li key={String(item.id)} className="pb-4 mb-4 border-b border-white/5 last:border-0 last:mb-0 last:pb-0">
                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan shrink-0" />
                        <span>{item.source?.title ?? 'Unknown'}</span>
                        <span>·</span>
                        <span>{item.published_at ? new Date(item.published_at).toLocaleDateString() : ''}</span>
                      </div>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-100 hover:text-brand-cyan text-sm font-semibold leading-snug transition"
                      >
                        {item.title}
                      </a>
                      <VoteButtons sectionKey="news" itemId={String(item.id)} votes={votes} onVote={handleVote} />
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>

            {/* Fun Meme */}
            <SectionCard title="Algorithmic Humor Plate" badge="MEMES">
              <img
                src={data.meme.url}
                alt={data.meme.title}
                className="w-full max-h-64 object-contain rounded-xl bg-slate-950"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = MEME_FALLBACK_SVG;
                }}
              />
              <p className="text-slate-400 text-sm mt-3">{data.meme.title}</p>
              <VoteButtons sectionKey="meme" itemId={data.meme.id} votes={votes} onVote={handleVote} />
            </SectionCard>
          </div>
        )}
      </main>
    </div>
  );
}
