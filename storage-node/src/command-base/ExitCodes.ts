/**
 * CLI process exit codes.
 *
 */
enum ExitCodes {
  OK = 0,

  InvalidParameters = 100,
  DevelopmentModeOnly,
  FileError,
  InvalidWorkerId,
  InvalidIntegerArray,
  ServerError,
  ApiError = 200,
  UnsuccessfulRuntimeCall,

  // NOTE: never exceed exit code 255 or it will be modulated by `256` and create problems
}

export = ExitCodes
