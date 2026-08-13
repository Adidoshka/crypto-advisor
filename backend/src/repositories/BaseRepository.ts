import { Document, Model, QueryFilter, UpdateQuery } from 'mongoose';

/**
 * Thin wrapper around a single Mongoose Model, holding only the query
 * primitives every repository ends up needing. Subclasses add
 * domain-specific, named queries on top (see UserRepository etc.) rather
 * than routes ever importing a Model directly.
 *
 * Return types are left to inference rather than hand-typed against
 * mongoose's Query<...> generics, which change shape across versions.
 */
export abstract class BaseRepository<T extends Document> {
  constructor(protected readonly model: Model<T>) {}

  create(data: Partial<T>) {
    return this.model.create(data);
  }

  findOne(filter: QueryFilter<T>) {
    return this.model.findOne(filter);
  }

  find(filter: QueryFilter<T>) {
    return this.model.find(filter);
  }

  upsert(filter: QueryFilter<T>, update: UpdateQuery<T>) {
    // runValidators is required here — findOneAndUpdate skips schema
    // validators (enum, minlength, etc.) by default, unlike .save().
    return this.model.findOneAndUpdate(filter, update, {
      upsert: true,
      returnDocument: 'after',
      runValidators: true,
    });
  }
}
