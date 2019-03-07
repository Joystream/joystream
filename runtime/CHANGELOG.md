### Version 4 - Bug Fixes - March 4th 2019 - `9941dd`
 - Allow illiquid accounts to pay transaction fees. Fixes unstaking and setting memo, by permitting extrinsics which do not require more than a transaction fee to be accepted into mempool.
 - Updated Cargo dependencies to use forked substrate repo `github.com/joystream/substrate`


 On-chain runtime upgrade performed with sudo `consensus::setCode()`

### Version 3 - Sparta - March 1st 2019 - `1ca4cc`
  - Basic substrate node - based on substrate `1ca4cc0a16a357782bb1028bb57376594ca232a0`
  - Block Authoring - only Aura (enabling GRANDPA in future release)
  - Council Elections
  - Council Runtime upgrade proposal
  - Simple PoS validator staking
  - Memo (account status message)

Used in genesis block for first testnet (Sparta)
