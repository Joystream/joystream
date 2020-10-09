export type FlattenRelations<T> = { [K in keyof T]: Exclude<T[K], { new: any } | { existing: any }> }
