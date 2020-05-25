export type IdLike = { toString: () => string } | number

export type HasId = { id: IdLike }

export type MayHaveId = { id?: IdLike }
