import { Document, Model, QueryFilter, UpdateQuery } from 'mongoose';

/** Thin wrapper around a single Mongoose Model with the query primitives every repository needs; subclasses add domain-specific queries on top. */
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
    // Required: findOneAndUpdate skips schema validators by default, unlike .save().
    return this.model.findOneAndUpdate(filter, update, {
      upsert: true,
      returnDocument: 'after',
      runValidators: true,
    });
  }
}
