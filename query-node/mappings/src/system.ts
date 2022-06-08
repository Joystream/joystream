// ExtrinsicSuccess event handler - we're using an empty handler just for the purpose of triggering
// preBlock/postBlock hooks for each block (instead of "catching-up" after some event/tx recognized by processor is fired)
// ExtrinsicSuccess is emitted at least once per block due to timestamp.set extrinsic
export function system_ExtrinsicSuccess(): void {
  // Do nothing
}
