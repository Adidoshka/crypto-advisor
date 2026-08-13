import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResponsiveContainer, AreaChart, Area, Tooltip } from 'recharts';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

interface CoinPrice {
  id: string;
  name: string;
  symbol: string;
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
    <div className="flex gap-1 mt-2">
      <button
        onClick={() => onVote(sectionKey, itemId, 1)}
        title="Thumbs up"
        className={`text-lg px-2 py-0.5 rounded transition ${current === 1 ? 'bg-green-500/30 text-green-400' : 'hover:bg-slate-700 text-slate-400'}`}
      >
        👍
      </button>
      <button
        onClick={() => onVote(sectionKey, itemId, -1)}
        title="Thumbs down"
        className={`text-lg px-2 py-0.5 rounded transition ${current === -1 ? 'bg-red-500/30 text-red-400' : 'hover:bg-slate-700 text-slate-400'}`}
      >
        👎
      </button>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5">
      <h2 className="text-amber-400 font-semibold text-lg mb-4">{title}</h2>
      {children}
    </div>
  );
}

export default function Dashboard() {
  const { logout } = useAuth();
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
    setVotes((prev) => ({ ...prev, [key]: value }));
    try {
      await api.post('/votes', { section, itemId, value });
    } catch {
      // revert on failure
      setVotes((prev) => { const next = { ...prev }; delete next[key]; return next; });
    }
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
        <span className="text-amber-400 font-bold text-xl">CryptoAdvisor</span>
        <div className="flex gap-3">
          <button
            onClick={loadDashboard}
            className="text-slate-400 hover:text-amber-400 text-sm transition px-3 py-1.5 rounded-lg hover:bg-slate-700"
          >
            Refresh
          </button>
          <button
            onClick={() => navigate('/onboarding')}
            className="text-slate-400 hover:text-amber-400 text-sm transition px-3 py-1.5 rounded-lg hover:bg-slate-700"
          >
            Preferences
          </button>
          <button
            onClick={handleLogout}
            className="text-slate-400 hover:text-red-400 text-sm transition px-3 py-1.5 rounded-lg hover:bg-slate-700"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="text-center py-20">
            <p className="text-red-400 mb-4">{error}</p>
            <button onClick={loadDashboard} className="px-4 py-2 bg-amber-400 text-slate-900 rounded-lg font-semibold">
              Retry
            </button>
          </div>
        )}

        {data && !loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Coin Prices */}
            <SectionCard title="📈 Coin Prices">
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
                      <li key={coin.id} className="bg-slate-900 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {coin.image && <img src={coin.image} alt={coin.name} className="w-6 h-6" />}
                            <span className="text-slate-200 font-medium">{coin.name}</span>
                            <span className="text-slate-500 text-xs uppercase">{coin.symbol}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-slate-100 font-semibold">
                              {coin.current_price != null ? `$${coin.current_price.toLocaleString()}` : 'N/A'}
                            </p>
                            {coin.price_change_percentage_24h != null && (
                              <p className={`text-xs ${up ? 'text-green-400' : 'text-red-400'}`}>
                                {up ? '+' : ''}{coin.price_change_percentage_24h.toFixed(2)}%
                              </p>
                            )}
                          </div>
                        </div>
                        {sparkData && (
                          <ResponsiveContainer width="100%" height={48}>
                            <AreaChart data={sparkData}>
                              <defs>
                                <linearGradient id={`g-${coin.id}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor={up ? '#4ade80' : '#f87171'} stopOpacity={0.3} />
                                  <stop offset="95%" stopColor={up ? '#4ade80' : '#f87171'} stopOpacity={0} />
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
                                stroke={up ? '#4ade80' : '#f87171'}
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

            {/* Market News */}
            <SectionCard title="📰 Market News">
              {data.news.length === 0 ? (
                <p className="text-slate-400 text-sm">No news available.</p>
              ) : (
                <ul className="space-y-4">
                  {data.news.map((item) => (
                    <li key={String(item.id)}>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-200 hover:text-amber-400 text-sm font-medium leading-snug transition"
                      >
                        {item.title}
                      </a>
                      <p className="text-slate-500 text-xs mt-0.5">
                        {item.source?.title ?? 'Unknown'} ·{' '}
                        {item.published_at ? new Date(item.published_at).toLocaleDateString() : ''}
                      </p>
                      <VoteButtons sectionKey="news" itemId={String(item.id)} votes={votes} onVote={handleVote} />
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>

            {/* AI Insight */}
            <SectionCard title="🤖 AI Insight of the Day">
              <p className="text-slate-300 leading-relaxed">{data.insight}</p>
              <VoteButtons sectionKey="insight" itemId="daily" votes={votes} onVote={handleVote} />
            </SectionCard>

            {/* Fun Meme */}
            <SectionCard title="😂 Crypto Meme">
              <p className="text-slate-400 text-sm mb-3">{data.meme.title}</p>
              <img
                src={data.meme.url}
                alt={data.meme.title}
                className="w-full max-h-64 object-contain rounded-lg bg-slate-900"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://via.placeholder.com/400x200/1e293b/94a3b8?text=Meme+unavailable';
                }}
              />
              <VoteButtons sectionKey="meme" itemId={data.meme.id} votes={votes} onVote={handleVote} />
            </SectionCard>
          </div>
        )}
      </main>
    </div>
  );
}
