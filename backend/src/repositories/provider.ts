import { PreferenceRepository } from './PreferenceRepository';
import { UserRepository } from './UserRepository';
import { VoteRepository } from './VoteRepository';

/** Plain data class — no singleton logic itself, just holds the repos. */
class RepositoryProvider {
  readonly user = new UserRepository();
  readonly preference = new PreferenceRepository();
  readonly vote = new VoteRepository();
}

let _provider: RepositoryProvider | null = null;

/**
 * Lazy singleton. Node has no thread-safety concern here (single event
 * loop), so unlike a multi-threaded host this needs no locking — a plain
 * null-check is enough.
 */
export function getRepos(): RepositoryProvider {
  if (!_provider) _provider = new RepositoryProvider();
  return _provider;
}

/** Tear down for test isolation, once a test suite exists. */
export function resetRepos(): void {
  _provider = null;
}
