import { IVote, Vote } from '../models/Vote';
import { BaseRepository } from './BaseRepository';

export class VoteRepository extends BaseRepository<IVote> {
  constructor() {
    super(Vote);
  }

  /**
   * Upsert-by-key: voting twice on the same item updates the existing vote, not append a new one.
   *
   * `section`/`itemId`/`userId` are repeated in the update body (not just the
   * filter) on purpose — Mongoose's `runValidators` only checks paths present
   * in the update document itself. Fields that MongoDB merges in purely from
   * the upsert filter (e.g. `section` here) are invisible to it, so leaving
   * `section` out of the update body would silently skip its enum check.
   */
  upsertVote(userId: string, section: string, itemId: string, value: 1 | -1, contentSnapshot?: string) {
    return this.upsert({ userId, section, itemId }, { userId, section, itemId, value, contentSnapshot });
  }

  listByUser(userId: string) {
    return this.find({ userId }).select('section itemId value -_id').lean();
  }
}
