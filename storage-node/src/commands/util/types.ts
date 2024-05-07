export type Maybe<T> = T | undefined

// definition for the supported stream types in the codebase
export type ColossusFileStream = ReadableStream | Buffer | Uint8Array | string
