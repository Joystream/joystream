export type SimplifiedTypeInterface<I> = Partial<{ [k in keyof I]: any }>;
