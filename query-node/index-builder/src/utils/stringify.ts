export function stringifyWithTs(s: Record<string, unknown>): string {
  return JSON.stringify({ ...s, ts: Date.now() })
}

export function withTs(s: Record<string, unknown>): Record<string, unknown> {
  return { ...s, ts: Date.now() };
}