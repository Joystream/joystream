module.exports = {
  networks: {
    // We currently use Ganache as development network
    development: {
      host: '127.0.0.1',
      port: 8545,
      network_id: 5777,
      gas: 10000000,
    },
  },
  compilers: {
    solc: {
      version: '^0.6.0',
      settings: {
        // Optimalized for deployment (temporarly)
        optimizer: {
          enabled: true,
          runs: 1,
        },
      },
      evmVersion: 'istanbul'
    },
  },
  mocha: {
    timeout: 60000,
  },
}
