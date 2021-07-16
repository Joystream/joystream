import { components, operations } from './generated/OpenApi'
export type RouteParams<Name extends keyof operations> = operations[Name]['parameters']['path']
export type ErrorResponse = components['schemas']['ErrorResponse']
