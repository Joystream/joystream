import { components, operations } from './generated'

// Upload tokens (currently unused)
export type UploadTokenRequest = components['schemas']['TokenRequest']
export type UploadTokenBody = UploadTokenRequest['data'] & {
  nonce: string
  validUntil: number
}
export type UploadToken = {
  data: UploadTokenBody
  signature: string
}

// filesApi.uploadFile
export type UploadFileQueryParams = operations['filesApi.uploadFile']['parameters']['query']

// filesApi.getFile
export type GetFileRequestParams = operations['filesApi.getFile']['parameters']['path']

// filesApi.getFileHeaders
export type GetFileHeadersRequestParams = operations['filesApi.getFileHeaders']['parameters']['path']

// filesApi.getLocalDataObjectsByBagId
export type GetLocalDataObjectsByBagIdParams = operations['stateApi.getLocalDataObjectsByBagId']['parameters']['path']

// stateApi.getLocalDataObjectsByBagId
// stateApi.getAllLocalDataObjects
export type DataObjectResponse = components['schemas']['DataObjectResponse']

// stateApi.getVersion
export type VersionResponse = components['schemas']['VersionResponse']

// stateApi.getLocalDataStats
export type DataStatsResponse = components['schemas']['DataStatsResponse']

export type ErrorResponse = components['schemas']['ErrorResponse']

// stateApi.getStatus
export type StatusResponse = components['schemas']['StatusResponse']
