import { IVote, Vote } from '../models/Vote';
import { BaseRepository } from './BaseRepository';

export class VoteRepository extends BaseRepository<IVote> {
  constructor() {
    super(Vote);
  }

  /**
   * Upsert-by-key: voting twice on the same item updates it rather than appending.
   * Filter fields are repeated in the update body on purpose — `runValidators` only checks
   * paths present in the update itself, so omitting `section` there would skip its enum check.
   */
  upsertVote(userId: string, section: string, itemId: string, value: 1 | -1, contentSnapshot?: string) {
    return this.upsert({ userId, section, itemId }, { userId, section, itemId, value, contentSnapshot });
  }

  listByUser(userId: string) {
    return this.find({ userId }).select('section itemId value -_id').lean();
  }
}
