import { Router, Response } from 'express';
import Parser from 'rss-parser';
import { authenticate, AuthRequest } from '../middleware/auth';
import { getRepos } from '../repositories/provider';

const router = Router();
const rssParser = new Parser({ timeout: 8000 });

// CryptoPanic's API no longer offers a free tier (paid plans start at
// $50/week as of Aug 2026) — sourcing live news from free public RSS feeds
// instead, with keyword filtering against the user's assets for a
// personalization touch, and the static list below as the final fallback
// if every feed fails.
const RSS_FEEDS = [
  { name: 'CoinDesk', url: 'https://www.coindesk.com/arc/outboundfeeds/rss' },
  { name: 'Cointelegraph', url: 'https://cointelegraph.com/rss' },
  { name: 'Decrypt', url: 'https://decrypt.co/feed' },
];

const STATIC_MEMES = [
  { id: 'm1', url: 'https://i.imgflip.com/7nt7jx.jpg', title: 'When Bitcoin dips 10%' },
  { id: 'm2', url: 'https://i.imgflip.com/65939r.jpg', title: 'HODLing through a bear market' },
  { id: 'm3', url: 'https://i.imgflip.com/5c7lwq.jpg', title: 'Buying the dip again' },
  { id: 'm4', url: 'https://i.imgflip.com/3oevdk.jpg', title: 'When ETH gas fees spike' },
  { id: 'm5', url: 'https://i.imgflip.com/44r619.jpg', title: 'My portfolio at 3 AM' },
];

// CoinGecko's actual coin ids don't always match a naive slugify of the
// display name — these three are wrong if left to the default conversion
// below (CoinGecko silently drops unmatched ids from results rather than
// erroring, so a wrong id just means that coin's price never appears).
const COINGECKO_ID_OVERRIDES: Record<string, string> = {
  'near protocol': 'near',
  avalanche: 'avalanche-2',
  polygon: 'matic-network',
};

async function fetchPrices(assets: string[]): Promise<object[]> {
  const ids = assets
    .map((a) => COINGECKO_ID_OVERRIDES[a.toLowerCase()] ?? a.toLowerCase().replace(/\s+/g, '-'))
    .join(',');
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=10&page=1&sparkline=true&price_change_percentage=24h`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error('CoinGecko error');
    return (await res.json()) as object[];
  } catch {
    return assets.map((a) => ({ id: a, name: a, current_price: null, price_change_percentage_24h: null, sparkline_in_7d: null }));
  }
}

function staticNewsFallback(assets: string[]): object[] {
  return assets.slice(0, 3).map((asset, i) => ({
    id: `static-${i}`,
    title: `${asset} market analysis: key levels to watch`,
    url: 'https://coindesk.com',
    source: { title: 'CoinDesk' },
    published_at: new Date().toISOString(),
  }));
}

async function fetchNews(assets: string[]): Promise<object[]> {
  const feedResults = await Promise.allSettled(
    RSS_FEEDS.map((feed) => rssParser.parseURL(feed.url).then((parsed) => ({ feed, parsed }))),
  );

  const items = feedResults
    .filter((r) => r.status === 'fulfilled')
    .flatMap((r) => {
      const { feed, parsed } = (r as PromiseFulfilledResult<{ feed: (typeof RSS_FEEDS)[number]; parsed: Parser.Output<object> }>).value;
      return (parsed.items ?? []).map((item) => ({
        id: item.link ?? `${feed.name}-${item.title}`,
        title: item.title ?? '',
        url: item.link ?? '',
        source: { title: feed.name },
        published_at: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
      }));
    });

  if (items.length === 0) {
    // Every feed failed (network issue, feed structure change, etc.)
    return staticNewsFallback(assets);
  }

  const lowerAssets = assets.map((a) => a.toLowerCase());
  const filtered = items.filter((item) => lowerAssets.some((a) => item.title.toLowerCase().includes(a)));
  // Fall back to the unfiltered pool rather than an empty section if none
  // of the user's assets happen to be in today's headlines.
  const pool = filtered.length > 0 ? filtered : items;

  return pool
    .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
    .slice(0, 6);
}

// Configurable so a delisted free model can be swapped via env var alone —
// OpenRouter's free-tier model lineup rotates and endpoints can vanish (the
// original default, mistralai/mistral-7b-instruct:free, was delisted
// entirely — "No endpoints found" — while building this feature).
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL ?? 'nvidia/nemotron-nano-9b-v2:free';

async function fetchAiInsight(assets: string[], investorType: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return `As a ${investorType}, focus on your long-term strategy. The market is showing mixed signals today — ${assets.slice(0, 2).join(' and ')} are key assets to watch. Stay disciplined and avoid emotional trading decisions.`;
  }
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://crypto-advisor.app',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          {
            role: 'user',
            content: `Give a short (2-3 sentence) daily crypto insight for a ${investorType} investor who is interested in: ${assets.join(', ')}. Be concise and actionable.`,
          },
        ],
        // Generous budget on purpose: several free-tier models "think"
        // internally before answering, and spend part of this budget on
        // that reasoning — too low a cap leaves the final content empty.
        max_tokens: 500,
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) throw new Error(`OpenRouter error: ${res.status} ${await res.text()}`);
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return data.choices?.[0]?.message?.content?.trim() ?? 'Stay informed and trade responsibly.';
  } catch (err) {
    // Logged (not silent) so a delisted/rate-limited model shows up in
    // server logs instead of just quietly serving the fallback forever.
    console.error('AI insight fetch failed, using fallback:', err);
    return `As a ${investorType}, keep an eye on ${assets.slice(0, 2).join(' and ')} today. Market volatility requires patience and a clear strategy.`;
  }
}

router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const prefs = await getRepos().preference.findByUserId(req.userId!);

  if (!prefs) {
    res.status(404).json({ error: 'No preferences found' });
    return;
  }

  const assets: string[] = prefs.assets;
  const investorType: string = prefs.investorType;

  // "AI Insight of the Day" — reuse today's cached insight instead of
  // spending an OpenRouter call on every dashboard load.
  const today = new Date().toISOString().slice(0, 10);
  const cachedInsight = prefs.cachedInsightDate === today ? prefs.cachedInsight : undefined;

  const [prices, news, insight] = await Promise.all([
    fetchPrices(assets),
    fetchNews(assets),
    cachedInsight ? Promise.resolve(cachedInsight) : fetchAiInsight(assets, investorType),
  ]);

  if (!cachedInsight) {
    await getRepos().preference.cacheInsight(req.userId!, insight, today);
  }

  const meme = STATIC_MEMES[Math.floor(Math.random() * STATIC_MEMES.length)];

  res.json({ prices, news, insight, meme });
});

export default router;
