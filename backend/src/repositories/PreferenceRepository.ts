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

  upsertForUser(userId: string, data: Pick<IPreference, 'assets' | 'investorType' | 'contentTypes'>) {
    return this.upsert({ userId }, data);
  }
}
