import { Router, Response } from 'express';
import Parser from 'rss-parser';
import { authenticate, AuthRequest } from '../middleware/auth';
import { getRepos } from '../repositories/provider';
import { asyncHandler } from '../middleware/asyncHandler';
import type { CRYPTO_ASSETS, INVESTOR_TYPES } from '../models/Preference';

const router = Router();
const rssParser = new Parser({ timeout: 8000 });

// CryptoPanic dropped its free tier, so news comes from these RSS feeds instead (filtered by asset keyword, with staticNewsFallback as final fallback).
const RSS_FEEDS = [
  { name: 'CoinDesk', url: 'https://www.coindesk.com/arc/outboundfeeds/rss' },
  { name: 'Cointelegraph', url: 'https://cointelegraph.com/rss' },
  { name: 'Decrypt', url: 'https://decrypt.co/feed' },
];

// assets/investorTypes tag which preference a meme matches (see pickMeme); values come from Preference.ts's enums so a tag can't drift out of the allowed vocab.
interface StaticMeme {
  id: string;
  url: string;
  title: string;
  assets?: (typeof CRYPTO_ASSETS)[number][];
  investorTypes?: (typeof INVESTOR_TYPES)[number][];
}

// URLs verified reachable AND visually checked for actual content (not a blank caption template) as of 2026-08-14 — stable high-traffic images, not one-off uploads, so less prone to link-rot than the original set.
const STATIC_MEMES: StaticMeme[] = [
  { id: 'm1', url: 'https://i.imgflip.com/23ls.jpg', title: 'When Bitcoin dips 10%', assets: ['Bitcoin'] },
  { id: 'm2', url: 'https://i.imgflip.com/65939r.jpg', title: 'HODLing through a bear market', investorTypes: ['HODLer'] },
  { id: 'm3', url: 'https://i.imgflip.com/gk5el.jpg', title: 'Buying the dip again' },
  { id: 'm4', url: 'https://i.imgflip.com/3oevdk.jpg', title: 'When ETH gas fees spike', assets: ['Ethereum'] },
  { id: 'm5', url: 'https://i.imgflip.com/1c1uej.jpg', title: 'My portfolio at 3 AM' },
];

// Same filter-then-fall-back-to-the-full-pool shape as fetchNews below, applied to memes.
export function pickMeme(assets: string[], investorType: string): StaticMeme {
  const matches = STATIC_MEMES.filter(
    (m) => m.assets?.some((a) => assets.includes(a)) || m.investorTypes?.some((t) => t === investorType),
  );
  const pool = matches.length > 0 ? matches : STATIC_MEMES;
  return pool[Math.floor(Math.random() * pool.length)];
}

// Overrides for assets where CoinGecko's real id doesn't match a naive slugify of the display name.
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
    // Every feed failed (network issue, feed structure change, etc.).
    return staticNewsFallback(assets);
  }

  const lowerAssets = assets.map((a) => a.toLowerCase());
  const filtered = items.filter((item) => lowerAssets.some((a) => item.title.toLowerCase().includes(a)));
  // Fall back to the unfiltered pool rather than an empty section.
  const pool = filtered.length > 0 ? filtered : items;

  return pool
    .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
    .slice(0, 6);
}

// Configurable since free-tier model availability shifts. `||` not `??`: a blank `NVIDIA_MODEL=` in .env is '' (not nullish), which `??` wouldn't catch.
const NVIDIA_MODEL = process.env.NVIDIA_MODEL || 'meta/llama-3.1-8b-instruct';

async function fetchAiInsight(assets: string[], investorType: string): Promise<string> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    return `As a ${investorType}, focus on your long-term strategy. The market is showing mixed signals today — ${assets.slice(0, 2).join(' and ')} are key assets to watch. Stay disciplined and avoid emotional trading decisions.`;
  }
  try {
    const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: NVIDIA_MODEL,
        messages: [
          {
            role: 'user',
            content: `Give a short daily crypto insight for a ${investorType} investor who is interested in: ${assets.join(', ')}. Be concise and actionable. Respond in exactly 2-3 sentences of plain prose — no markdown, no headers, no bullet points, no per-asset breakdown, no bold text.`,
          },
        ],
        max_tokens: 200,
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) throw new Error(`NVIDIA NIM error: ${res.status} ${await res.text()}`);
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return data.choices?.[0]?.message?.content?.trim() ?? 'Stay informed and trade responsibly.';
  } catch (err) {
    // Logged so a delisted/rate-limited model doesn't fail silently.
    console.error('AI insight fetch failed, using fallback:', err);
    return `As a ${investorType}, keep an eye on ${assets.slice(0, 2).join(' and ')} today. Market volatility requires patience and a clear strategy.`;
  }
}

router.get(
  '/',
  authenticate,
  asyncHandler<AuthRequest>(async (req, res: Response): Promise<void> => {
    const prefs = await getRepos().preference.findByUserId(req.userId!);

    if (!prefs) {
      res.status(404).json({ error: 'No preferences found' });
      return;
    }

    const assets: string[] = prefs.assets;
    const investorType: string = prefs.investorType;

    // Reuse today's cached insight instead of calling NVIDIA on every load.
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

    const { id, url, title } = pickMeme(assets, investorType);
    const meme = { id, url, title }; // explicit shaping — don't leak the internal tag fields to the client

    res.json({ prices, news, insight, meme });
  }),
);

export default router;
