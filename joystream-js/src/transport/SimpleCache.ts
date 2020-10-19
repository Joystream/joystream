import BN from 'bn.js';

export type IdLike = { toString: () => string } | number
export type HasId = { id: IdLike }
export type MayHaveId = { id?: IdLike }

type LoadObjectsByIdsFn<Id extends IdLike, Obj extends HasId> =
  (ids: Id[]) => Promise<Obj[]>

function anyIdToString (id: IdLike): string {
  return typeof id === 'number'
    ? new BN(id).toString()
    : id.toString();
}

export class SimpleCache<Id extends IdLike, Obj extends HasId> {
  private cacheName: string
  private loadByIds: LoadObjectsByIdsFn<Id, Obj>
  private cache = new Map<string, Obj>()

  constructor (cacheName: string, loadByIds: LoadObjectsByIdsFn<Id, Obj>) {
    this.cacheName = cacheName;
    this.loadByIds = loadByIds;
  }

  get name (): string {
    return this.cacheName;
  }

  clear (): void {
    const prevCacheSize = this.cache.size;

    this.cache = new Map<string, Obj>();
    console.info(`Removed all ${prevCacheSize} entries from ${this.cacheName}`);
  }

  clearExcept (keepIds: Id[] | Set<string>): void {
    const prevCacheSize = this.cache.size;
    const keepIdsSet = keepIds instanceof Set
      ? keepIds
      : new Set(keepIds.map((id) => id.toString()));

    const newCache = new Map<string, Obj>();

    for (const [id, o] of this.cache.entries()) {
      if (keepIdsSet.has(id)) {
        newCache.set(id, o);
      }
    }

    this.cache = newCache;
    console.info(`Removed ${prevCacheSize - newCache.size} entries out of ${prevCacheSize} from ${this.cacheName}`);
  }

  async getOrLoadById (id: Id): Promise<Obj | undefined> {
    return (await this.getOrLoadByIds([id]))[0];
  }

  async getOrLoadByIds (ids: Id[]): Promise<Obj[]> {
    const idsNoFoundInCache: Id[] = [];
    const cachedObjects: Obj[] = [];

    ids.map((id) => {
      const fromCache = this.cache.get(id.toString());

      if (fromCache) {
        cachedObjects.push(fromCache);
      } else {
        idsNoFoundInCache.push(id);
      }
    });

    let loadedObjects: Obj[] = [];

    if (idsNoFoundInCache.length > 0) {
      loadedObjects = await this.loadByIds(idsNoFoundInCache);
      loadedObjects.map((o) => {
        const id = anyIdToString(o.id);

        this.cache.set(id, o);
      });
    }

    return cachedObjects.concat(loadedObjects);
  }
}
