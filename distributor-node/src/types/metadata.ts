// Distributor Node's operational states (are part of Operator metadata)
export const NODE_OPERATIONAL_STATUS_OPTIONS = ['Normal', 'NoService', 'NoServiceFrom', 'NoServiceDuring'] as const

// convert NODE_OPERATIONAL_STATUS_OPTIONS into string literal union type
export type NodeOperationalStatus = typeof NODE_OPERATIONAL_STATUS_OPTIONS[number]
