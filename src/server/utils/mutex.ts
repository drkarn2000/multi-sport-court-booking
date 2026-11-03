/**
 * Keyed in-memory async mutex to serialize concurrent critical sections
 * (e.g. court slot booking locks and group daily credit redemptions)
 * in addition to database-level UNIQUE constraints and transactions.
 */
class KeyedMutex {
  private queues = new Map<string, Promise<void>>();

  private async runSingleKey<T>(
    key: string,
    fn: () => Promise<T> | T
  ): Promise<T> {
    const previous = this.queues.get(key) ?? Promise.resolve();
    let release!: () => void;
    const current = new Promise<void>((resolve) => {
      release = resolve;
    });
    const chained = previous.then(() => current);
    this.queues.set(key, chained);

    await previous;
    try {
      return await fn();
    } finally {
      release();
      if (this.queues.get(key) === chained) {
        this.queues.delete(key);
      }
    }
  }

  async runExclusive<T>(
    keyOrKeys: string | string[],
    fn: () => Promise<T> | T
  ): Promise<T> {
    const keys = Array.isArray(keyOrKeys)
      ? [...new Set(keyOrKeys)].sort()
      : [keyOrKeys];

    const acquireNext = (idx: number): Promise<T> => {
      if (idx >= keys.length) {
        return Promise.resolve(fn());
      }
      return this.runSingleKey(keys[idx], () => acquireNext(idx + 1));
    };

    return acquireNext(0);
  }
}

export const domainMutex = new KeyedMutex();
