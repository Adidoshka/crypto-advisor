import { IPreference, Preference } from '../models/Preference';
import { BaseRepository } from './BaseRepository';

export class PreferenceRepository extends BaseRepository<IPreference> {
  constructor() {
    super(Preference);
  }

  /** Read-only lookup — .lean() skips document hydration since callers only serialize fields. */
  findByUserId(userId: string) {
    return this.findOne({ userId }).lean();
  }

  // userId repeated in the update body for consistency with VoteRepository.upsertVote's pattern, though harmless either way here.
  upsertForUser(userId: string, data: Pick<IPreference, 'assets' | 'investorType' | 'contentTypes'>) {
    return this.upsert({ userId }, { userId, ...data });
  }

  cacheInsight(userId: string, insight: string, date: string) {
    return this.upsert({ userId }, { cachedInsight: insight, cachedInsightDate: date });
  }
}
