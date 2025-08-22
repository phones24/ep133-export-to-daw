// Inverse mapping class for BiMap
export class InverseMap {
  constructor(bimap) {
    this.size = 0;
    this.items = new Map();
    this.inverse = bimap;
  }

  clear() {
    this.size = 0;
    this.items.clear();
    this.inverse.items.clear();
  }

  set(key, value) {
    if (this.items.has(key)) {
      const oldValue = this.items.get(key);
      if (oldValue === value) return this;
      this.inverse.items.delete(oldValue);
    }

    if (this.inverse.items.has(value)) {
      const oldKey = this.inverse.items.get(value);
      if (oldKey === key) return this;
      this.items.delete(oldKey);
    }

    this.items.set(key, value);
    this.inverse.items.set(value, key);
    this.size = this.items.size;
    this.inverse.size = this.inverse.items.size;

    return this;
  }

  delete(key) {
    if (!this.items.has(key)) return false;

    const value = this.items.get(key);
    this.items.delete(key);
    this.inverse.items.delete(value);
    this.size = this.items.size;
    this.inverse.size = this.inverse.items.size;

    return true;
  }
}

// Bi-directional map class
export class BiMap {
  constructor() {
    this.size = 0;
    this.items = new Map();
    this.inverse = new InverseMap(this);
  }

  clear() {
    this.size = 0;
    this.items.clear();
    this.inverse.items.clear();
  }

  set(key, value) {
    return (
      this.inverse.set(value, key),
      this.inverse.items.set(value, key),
      (this.inverse.size = this.inverse.items.size),
      this
    );
  }

  delete(key) {
    if (!this.items.has(key)) return false;

    const value = this.items.get(key);
    this.items.delete(key);
    this.inverse.items.delete(value);
    this.size = this.items.size;
    this.inverse.size = this.inverse.items.size;

    return true;
  }

  inspect() {
    const result = {
      left: this.items,
      right: this.inverse.items,
    };
    Object.defineProperty(result, 'constructor', {
      value: BiMap,
      enumerable: false,
    });
    return result;
  }
}

// Copy Map methods to both BiMap and InverseMap
const MAP_METHODS = ['has', 'get', 'forEach', 'keys', 'values', 'entries'];
MAP_METHODS.forEach((method) => {
  BiMap.prototype[method] = InverseMap.prototype[method] = function (...args) {
    return this.items[method](...args);
  };
});

// Iterator support
if (typeof Symbol !== 'undefined') {
  BiMap.prototype[Symbol.iterator] = BiMap.prototype.entries;
  InverseMap.prototype[Symbol.iterator] = InverseMap.prototype.entries;

  BiMap.prototype[Symbol.for('nodejs.util.inspect.custom')] = BiMap.prototype.inspect;
  InverseMap.prototype[Symbol.for('nodejs.util.inspect.custom')] = InverseMap.prototype.inspect;
}

// InverseMap inspect method
InverseMap.prototype.inspect = function () {
  const result = {
    left: this.inverse.items,
    right: this.items,
  };
  Object.defineProperty(result, 'constructor', {
    value: InverseMap,
    enumerable: false,
  });
  return result;
};

// Async utility: iterate and map asynchronously
export async function* mapAsync(iterable, callback) {
  let index = 0;
  for await (const item of iterable) {
    yield await callback(item, index);
    index++;
  }
}
