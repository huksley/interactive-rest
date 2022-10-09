export const LRU_MAP_DEFAULT = 200;

export class LRUMap {
  constructor(max = LRU_MAP_DEFAULT) {
    this.max = max || LRU_MAP_DEFAULT;
    this.cache = new Map();
  }

  get(key) {
    const item = this.cache.get(key);
    if (item) {
      // refresh key
      this.cache.delete(key);
      this.cache.set(key, item);
    }
    return item;
  }

  size() {
    return this.cache.size;
  }

  has(key) {
    return this.cache.has(key);
  }

  set(key, val) {
    // refresh key
    if (this.cache.has(key)) this.cache.delete(key);
    // evict oldest
    else while (this.cache.size > this.max) this.cache.delete(this.first());
    this.cache.set(key, val);
  }

  first() {
    return this.cache.keys().next().value;
  }
}
