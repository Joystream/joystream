export const BUCKET_PENDING_PREFIX = 'pending'
export const BUCKET_ACCEPTED_PREFIX = 'accepted'

export function cloudPendingPathForFile(filename: string): string {
  return `${BUCKET_PENDING_PREFIX}/${filename}`
}

export function cloudAcceptedPathForFile(filename: string): string {
  return `${BUCKET_ACCEPTED_PREFIX}/${filename}`
}
