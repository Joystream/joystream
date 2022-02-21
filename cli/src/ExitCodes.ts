enum ExitCodes {
  OK = 0,

  InvalidInput = 40,
  FileNotFound = 41,
  InvalidFile = 42,
  NoAccountFound = 43,
  NoAccountSelected = 44,
  AccessDenied = 45,

  UnexpectedException = 50,
  FsOperationFailed = 51,
  ApiError = 52,
  StorageNodeError = 53,
  ActionCurrentlyUnavailable = 54,
  QueryNodeError = 55,

  // NOTE: never exceed exit code 255 or it will be modulated by `256` and create problems
}
export = ExitCodes
