import { describe, it, expect } from 'vitest';
import { Preference } from '../../src/models/Preference';

// Pure schema validation — validate() checks required/enum/etc. without
// needing a live DB connection, only .save()/queries do.
describe('Preference schema validation', () => {
  it('rejects an asset outside the allowed enum', async () => {
    const doc = new Preference({
      userId: '000000000000000000000000',
      assets: ['Dogecoin'], // dropped from CRYPTO_ASSETS during the CoinSage rebrand
      investorType: 'HODLer',
      contentTypes: ['Market News'],
    });
    await expect(doc.validate()).rejects.toThrow();
  });

  it('rejects an investorType outside the allowed enum', async () => {
    const doc = new Preference({
      userId: '000000000000000000000000',
      assets: ['Bitcoin'],
      investorType: 'Swing Trader', // also dropped during the rebrand
      contentTypes: ['Market News'],
    });
    await expect(doc.validate()).rejects.toThrow();
  });

  it('rejects a contentType outside the allowed enum', async () => {
    const doc = new Preference({
      userId: '000000000000000000000000',
      assets: ['Bitcoin'],
      investorType: 'HODLer',
      contentTypes: ['Coin Prices'], // renamed to "Price Charts"
    });
    await expect(doc.validate()).rejects.toThrow();
  });

  it('accepts a fully valid preference doc', async () => {
    const doc = new Preference({
      userId: '000000000000000000000000',
      assets: ['Bitcoin', 'Near Protocol'],
      investorType: 'DeFi Explorer',
      contentTypes: ['Market News', 'Social Buzz'],
    });
    await expect(doc.validate()).resolves.toBeUndefined();
  });
});
