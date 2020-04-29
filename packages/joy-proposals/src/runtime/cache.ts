// Set does not do a deep equal when adding elements, so try to only use strings or another primitive for K

export default class Cache<K, T extends { id: K }> extends Map<K, T> {
  protected neverClear: Set<K>;

  constructor(
    objects: Iterable<readonly [K, T]>,
    protected loaderFn: (ids: K[]) => Promise<T[]>,
    neverClear: K[] | Set<K> = [],
    public name?: string
  ) {
    super(objects);
    this.name = name;
    this.neverClear = new Set(neverClear);
    this.loaderFn = loaderFn;
  }

  forceClear(): void {
    const prevCacheSize = this.size;
    this.clear();
    console.info(`Removed all ${prevCacheSize} entries from ${this.name}, including ${this.neverClear}`);
  }

  clearExcept(keepIds: K[] | Set<K>, force: boolean = false): void {
    const prevCacheSize = this.size;
    const keepIdsSet = force ? new Set(keepIds) : new Set([...keepIds, ...this.neverClear]);

    for (let key of this.keys()) {
      if (!keepIdsSet.has(key)) {
        this.delete(key);
      }
    }

    console.info(`Removed ${prevCacheSize - this.size} entries out of ${prevCacheSize} from ${this.name}`);
  }

  clear(): void {
    this.clearExcept([]);
  }

  async load(ids: K[], force: boolean = false): Promise<T[]> {
    const idsNotInCache: K[] = [];
    const cachedObjects: T[] = [];

    ids.forEach(id => {
      let objFromCache = this.get(id);
      if (objFromCache && !force) {
        cachedObjects.push(objFromCache);
      } else {
        idsNotInCache.push(id);
      }
    });

    let loadedObjects: T[] = [];

    if (idsNotInCache.length > 0) {
      loadedObjects = await this.loaderFn(idsNotInCache);
      loadedObjects.forEach(obj => {
        const id = obj.id;
        this.set(id, obj);
      });
    }

    return [...cachedObjects, ...loadedObjects];
  }
}
