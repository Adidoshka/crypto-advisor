import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { VoteRepository } from '../../src/repositories/VoteRepository';
import { Vote } from '../../src/models/Vote';

let mongod: MongoMemoryServer;
let voteRepo: VoteRepository;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  voteRepo = new VoteRepository();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await Vote.deleteMany({});
});

const userId = '000000000000000000000000';

describe('VoteRepository.upsertVote', () => {
  // Regression guard: `section` was once only in the upsert filter, so runValidators never saw it and the enum silently never fired.
  it('rejects an invalid section', async () => {
    await expect(voteRepo.upsertVote(userId, 'bogus-section', 'bitcoin', 1)).rejects.toThrow();
  });

  it('accepts a valid section', async () => {
    const doc = await voteRepo.upsertVote(userId, 'prices', 'bitcoin', 1);
    expect(doc?.value).toBe(1);
  });

  it('upserts by key instead of appending a new row', async () => {
    await voteRepo.upsertVote(userId, 'prices', 'bitcoin', 1);
    await voteRepo.upsertVote(userId, 'prices', 'bitcoin', -1);
    const rows = await Vote.find({ userId, section: 'prices', itemId: 'bitcoin' });
    expect(rows).toHaveLength(1);
    expect(rows[0].value).toBe(-1);
  });

  it('persists a contentSnapshot when given one', async () => {
    const doc = await voteRepo.upsertVote(userId, 'meme', 'm1', 1, 'When Bitcoin dips 10% (https://i.imgflip.com/2kbn1e.jpg)');
    expect(doc?.contentSnapshot).toBe('When Bitcoin dips 10% (https://i.imgflip.com/2kbn1e.jpg)');
  });

  // Schema enforces maxlength: 1000 — the frontend must truncate before sending, this is why.
  it('rejects a contentSnapshot over 1000 chars', async () => {
    await expect(voteRepo.upsertVote(userId, 'insight', 'daily', 1, 'x'.repeat(1001))).rejects.toThrow();
  });

  // itemId is part of the unique index and fully client-controlled — schema must bound it, not just Express's body-size limit.
  it('rejects an itemId over 500 chars', async () => {
    await expect(voteRepo.upsertVote(userId, 'prices', 'x'.repeat(501), 1)).rejects.toThrow();
  });
});
