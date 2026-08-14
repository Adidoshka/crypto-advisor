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
});
