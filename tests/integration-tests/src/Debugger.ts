import Debugger from 'debug'

// Global debugger
const debug = Debugger('integration-tests')

// Extend function bound to the global debugger
const extendDebug = debug.extend.bind(debug)

export { Debugger, debug, extendDebug }
