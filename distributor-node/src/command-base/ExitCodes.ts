enum ExitCodes {
  OK = 0,
  Error = 1,
  ApiError = 20,
  InvalidInput = 40,
  FileNotFound = 41,
  InvalidFile = 42,

  // NOTE: never exceed exit code 255 or it will be modulated by `256` and create problems
}
export = ExitCodes
