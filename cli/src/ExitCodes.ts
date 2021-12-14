enum ExitCodes {
  OK = 0,

  InvalidInput = 400,
  FileNotFound = 401,
  InvalidFile = 402,
  NoAccountFound = 403,
  NoAccountSelected = 404,
  AccessDenied = 405,

  UnexpectedException = 500,
  FsOperationFailed = 501,
  ApiError = 502,
  StorageNodeError = 503,
  ActionCurrentlyUnavailable = 504,
  QueryNodeError = 505,
}
export = ExitCodes
