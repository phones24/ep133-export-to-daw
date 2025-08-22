// Manages multiple named mutexes
export class MutexManager {
  constructor() {
    this.mutexes = new Map();
  }

  // Get or create a mutex by name
  get(name) {
    let mutex = this.mutexes.get(name);
    if (!mutex) {
      mutex = new Mutex();
      this.mutexes.set(name, mutex);
    }
    return mutex;
  }

  // Acquire a mutex by name
  async acquire(name) {
    const mutex = this.get(name);
    await mutex.acquire();
  }

  // Release a mutex by name
  release(name) {
    const mutex = this.mutexes.get(name);
    if (mutex) mutex.release();
  }
}

// Represents a single mutex
export class Mutex {
  constructor({ timeout } = {}) {
    this.acquired = false; // Is the lock currently held
    this.waitingResolvers = new Set(); // Set of queued functions waiting for lock
    this.timeout = timeout; // Optional timeout in ms
  }

  // Acquire the lock
  acquire() {
    if (!this.acquired) {
      this.acquired = true;
      return Promise.resolve();
    }

    // If no timeout, just wait indefinitely
    if (this.timeout == null) {
      return new Promise((resolve) => {
        this.waitingResolvers.add(resolve);
      });
    }

    // If timeout is set, wait with race against timeout
    let resolver, timer;
    return Promise.race([
      new Promise((resolve) => {
        resolver = () => {
          clearTimeout(timer);
          resolve();
        };
        this.waitingResolvers.add(resolver);
      }),
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          this.waitingResolvers.delete(resolver);
          reject(new Error('Timed out waiting for lock'));
        }, this.timeout);
      }),
    ]);
  }

  // Release the lock
  release() {
    if (!this.acquired) return;

    if (this.waitingResolvers.size > 0) {
      // Give the lock to the first waiter
      const [first] = this.waitingResolvers;
      this.waitingResolvers.delete(first);
      first();
    } else {
      this.acquired = false;
    }
  }
}
