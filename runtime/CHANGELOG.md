### Version 12.2002.0 - Nara release
  - Updated runtime `spec_version` to `2002`
  - Update substrate version based on [v0.9.41](https://github.com/paritytech/substrate/tree/polkadot-v0.9.41) release. [#4705](https://github.com/Joystream/joystream/pull/4705)
  - Apply substrate pallet runtime migrations from `v0.9.24-1` to `v0.9.41`
  - Added `try-runtime` command support and runtime upgrade tests.
  - Updated benchmarks and re-generated weights
  - Fix [#4745](https://github.com/Joystream/joystream/issues/4745): `cargo-chef` build issue by renaming crate 'pallet-utility' to 'pallet-joystream-utility'
  - Added a new "warp-time" and "fast-block-production" cargo feature flags
  - Enabled creator tokens functionality
  - Added AMM to creator tokens pallet
  - Added feature to enable freezing creator tokens pallet functionality via new proposal
  - Changed some workging group max workers values
  - Changed council and election periods
  - Removed some privileges of content moderators such as deleting channels and videos

### Version 12.2001.0 - Ephesus release
  - Bug fix in update_channel_payouts implementation
    - proposal creator pays for upload of payload not arbitrary specified account
  - Enabled `UpdateChannelPayouts` proposal creation
  - Exposed content pallet `MinimumCashoutAllowedLimit` and `MaximumCashoutAllowedLimit` constants
  - `membership:MemberInvited` event payload contains initial balance - [#4643](https://github.com/Joystream/joystream/issues/4643)
  - Add support for payments with membership:member_remark()
  - Referendum: Add "Opt Out of Voting" feature [#2927](https://github.com/Joystream/joystream/issues/2927)
  - Removed `sudo` pallet - aka "Liberated" [#4478](https://github.com/Joystream/joystream/pull/4478)
  - Adjust constitutionality to max 2 for all proposals [#4655](https://github.com/Joystream/joystream/issues/4655#issuecomment-1443238442)
  - Tweak worker remarks - [#4644](https://github.com/Joystream/joystream/pull/4644)
  - [Full list](https://github.com/Joystream/joystream/issues/4563)

### Version 12.1001.0 - Mainnet Supervised
  - Unlocked all pallets transactions

### Version 12.1000.0 - Mainnet
  - Disabled channel payouts proposal
  - Renamed 'Gateway' working group to 'App' working group

### Version 11.3.0 - Carthage - new chain
  - Update to substrate v0.9.23
  - Introduce project-token pallet into runtime
  - Dropped blog pallet
  - Updated existing pallets, various enhancements and security fixes
  - Computed weights and enabled fees

### Version 10.8.0 - upgrade
Collection of runtime fixes for council elections:
  - Referendum bug fix 1 - fix referendum intermediate winners - [3797](https://github.com/Joystream/joystream/pull/3797)
  - Referendum bug fix 2 - prevent multiple vote reveals - [3801](https://github.com/Joystream/joystream/pull/3801)
  - Referendum bug fix 3 - fix inability to unlock vote stake - [3783](https://github.com/Joystream/joystream/pull/3783)
- Change some council parameters community-[768](https://github.com/Joystream/community-repo/issues/768)
  - Reduce council size to 3
  - Increase the IdlePeriod "Council Term" duration of the council

No types or query-node mappings are changed, and no application requires any updates.

### Version 10.7.0 - upgrade
- NFT channel proceeds bug fix [#3763](https://github.com/Joystream/joystream/pull/3763)
  - Fix logic in dispatch calls: `content::claim_channel_reward()`, `content::pick_open_auction_winner()`
- No runtime types changed

### Version 10.6.0 - Rhodes - upgrade
- Enable NFT functionality
- Types updated - types pacakge version v0.19.3
- Modified some runtime constants and initial [values](https://github.com/Joystream/joystream/pull/3678):
  - Changed NFT parameters `MaxStartingPrice` and `MaxBidStep`
  - Changed inflation curve, to reduce validator rewards
  - Changed grace period for proposal types Set council budget increment
  - Changed forum `MaxSubcategories` and `MaxCategories`

### Version 10.5.0 - Olympia - new chain
- New feature new Membership system
- New feature Improved Council and Election system
- New feature Bounties
- New NFT feature - Disabled to simplify next update
- Forum improvements
- New types package - version v0.18.3

### Version 9.14.0 - Giza - upgrade
- New storage and distribution runtime module
- Renaming of working groups and adding new working group for distributor role
- Enhancements to content directory module
  - can delete channels and videos
  - collaborators

### Version 9.9.0 - Sumer - upgrade
- Increase the max allowed working group mint capacity that can be set by council via proposals

### Version 9.7.0 - Sumer - runtime upgrade - May 27 2021
- Introduced new content pallet the new content directory
- Improved data_directory pallet
  - Any storage provider to handle uploads of new content
  - Integration with new content directory
  - Introduction of quota vouchers
  - Reset data directory
- Added new working group instance for Operations

### Version 9.3.0 - Antioch - new chain - April 7 2021
- Following chain failure due to a debug in older version of substrate (v2.0.0-rc4) updated to substrate v2.0.1
- Same runtime features as babylon

### Version 7.9.0 - Babylon - runtime upgrade - December 21 2020
- Introduction of new and improved content directory

### Version 7.4.0 - Alexandria - new chain - September 21 2020
- Update to substrate v2.0.0-rc4

### Version 6.21.0 - (Constantinople) runtime upgrade B (Nicaea) - July 29 2020

- Introduction of general Working Group runtime module
- Adds a new instance of the working group module - the Storage Working Group which
  replaces the old actors module for managing the Storge Provider enrollment process
- New governance proposals to support new working groups

### Version 6.15.0 - (Constantinople) runtime upgrade A - June 2020

- Updated runtime to sort out type name clashes between the proposal discussion module
  and forum module, in preparing to roll out proposal discussion system in pioneer.
- Increased ROLE_PARAMETERS_REWARD_MAX_VALUE to 100,000

### Version 6.13.0 - (Constantinople) runtime upgrade - May 20th 2020

- New proposal system that strengthens the governance structure of the platform
- Adjusted inflation curve to better reflect a new realistic economic system for the platform

### Version 6.8.0 (Rome release - new chain) - March 9th 2020

- New versioned and permissioned content mangement system that powers a new media experience.
- Content Working Group - introduces staked content curator roles to maintain quality of content and ensure that is meets the platform's terms of service.
- Update of core substrate to pre-release of version 2.0 - [c37bb08](https://github.com/paritytech/substrate/commit/c37bb08535c49a12320af7facfd555ce05cce2e8)

### Version 5.4.0 (Acropolis) - Athens testnet update 3 - June 22n 2019

- New Forum - v1.0.0
- Discovery Service to support new Storage Provider implementation.
- Removing all previously uploaded content

### Version 5.3.0 - Athens testnet update 2 - April 27th 2019

- Fix to configure an onchain primary storage provider liason to work around incomplete storage server implementation.

### Version 5.2.0 - Athens testnet update 1 - April 17th 2019

- Fix account locking for staked roles to allow storage providers to submit transaction
- Update substrate version to `6dfc3e8b057bb00322136251a0f10305fbb1ad8f` from v1 branch

### Version 5.1.0 - Athens testnet release - April 14th 2019

- Storage Role
- Update to substrate version at `89bbb7b6d0e076f0eda736b330f5f792aa2e2991`

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
