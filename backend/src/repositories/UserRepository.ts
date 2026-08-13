import { Query } from 'mongoose';
import { IUser, User } from '../models/User';
import { BaseRepository } from './BaseRepository';

export class UserRepository extends BaseRepository<IUser> {
  constructor() {
    super(User);
  }

  /**
   * `password` is `select: false` on the schema, so callers must opt in
   * with `withPassword` (e.g. login) to get the hash back at all.
   */
  findByEmail(email: string, opts?: { withPassword?: boolean }): Query<IUser | null, IUser> {
    const query = this.findOne({ email: email.toLowerCase().trim() });
    return opts?.withPassword ? query.select('+password') : query;
  }
}
