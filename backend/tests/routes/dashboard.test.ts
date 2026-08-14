import { describe, it, expect, vi, afterEach } from 'vitest';
import { pickMeme } from '../../src/routes/dashboard';

// Pure selection logic only — no DB/network needed (the route's live external calls are out of scope here).
describe('pickMeme', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('prefers a meme tagged with one of the user\'s assets', () => {
    const meme = pickMeme(['Bitcoin'], 'DeFi Explorer');
    expect(meme.id).toBe('m1');
  });

  it('prefers a meme tagged with the user\'s investor type', () => {
    const meme = pickMeme(['Solana'], 'HODLer');
    expect(meme.id).toBe('m2');
  });

  it('falls back to the full pool when nothing matches', () => {
    const meme = pickMeme(['Solana'], 'Day Trader');
    expect(['m1', 'm2', 'm3', 'm4', 'm5']).toContain(meme.id);
  });

  it('picks deterministically for a given Math.random value', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const meme = pickMeme(['Ethereum'], 'DeFi Explorer'); // matches only m4
    expect(meme.id).toBe('m4');
  });
});
