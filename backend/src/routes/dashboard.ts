import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { Preference } from '../models/Preference';

const router = Router();

const STATIC_MEMES = [
  { id: 'm1', url: 'https://i.imgflip.com/7nt7jx.jpg', title: 'When Bitcoin dips 10%' },
  { id: 'm2', url: 'https://i.imgflip.com/65939r.jpg', title: 'HODLing through a bear market' },
  { id: 'm3', url: 'https://i.imgflip.com/5c7lwq.jpg', title: 'Buying the dip again' },
  { id: 'm4', url: 'https://i.imgflip.com/3oevdk.jpg', title: 'When ETH gas fees spike' },
  { id: 'm5', url: 'https://i.imgflip.com/44r619.jpg', title: 'My portfolio at 3 AM' },
];

async function fetchPrices(assets: string[]): Promise<object[]> {
  const ids = assets.map((a) => a.toLowerCase().replace(/\s+/g, '-')).join(',');
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=10&page=1&sparkline=true&price_change_percentage=24h`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error('CoinGecko error');
    return (await res.json()) as object[];
  } catch {
    return assets.map((a) => ({ id: a, name: a, current_price: null, price_change_percentage_24h: null, sparkline_in_7d: null }));
  }
}

async function fetchNews(assets: string[]): Promise<object[]> {
  const apiKey = process.env.CRYPTOPANIC_API_KEY;
  const currencies = assets.slice(0, 5).join(',').toUpperCase();
  const url = apiKey
    ? `https://cryptopanic.com/api/v1/posts/?auth_token=${apiKey}&currencies=${currencies}&public=true`
    : null;

  if (url) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (res.ok) {
        const data = (await res.json()) as { results?: object[] };
        return data.results?.slice(0, 6) ?? [];
      }
    } catch {
      // fall through to static
    }
  }

  // Static fallback news
  return assets.slice(0, 3).map((asset, i) => ({
    id: `static-${i}`,
    title: `${asset} market analysis: key levels to watch`,
    url: 'https://coindesk.com',
    source: { title: 'CoinDesk' },
    published_at: new Date().toISOString(),
  }));
}

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
        model: 'mistralai/mistral-7b-instruct:free',
        messages: [
          {
            role: 'user',
            content: `Give a short (2-3 sentence) daily crypto insight for a ${investorType} investor who is interested in: ${assets.join(', ')}. Be concise and actionable.`,
          },
        ],
        max_tokens: 150,
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error('OpenRouter error');
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return data.choices?.[0]?.message?.content?.trim() ?? 'Stay informed and trade responsibly.';
  } catch {
    return `As a ${investorType}, keep an eye on ${assets.slice(0, 2).join(' and ')} today. Market volatility requires patience and a clear strategy.`;
  }
}

router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const prefs = await Preference.findOne({ userId: req.userId });

  if (!prefs) {
    res.status(404).json({ error: 'No preferences found' });
    return;
  }

  const assets: string[] = prefs.assets;
  const investorType: string = prefs.investorType;

  const [prices, news, insight] = await Promise.all([
    fetchPrices(assets),
    fetchNews(assets),
    fetchAiInsight(assets, investorType),
  ]);

  const meme = STATIC_MEMES[Math.floor(Math.random() * STATIC_MEMES.length)];

  res.json({ prices, news, insight, meme });
});

export default router;
