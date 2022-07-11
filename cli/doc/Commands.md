# joystream-cli status (Joystream/community-repo#781)

https://github.com/Joystream/community-repo/issues/781

## Tx Support

| Tx                                        | CLI Command                           | Useful | Pioneer Support | SP / DP Support | Uses QN |
| ----------------------------------------- | ------------------------------------- | ------ | --------------- | --------------- | ------- |
| balances.Transfer                         | account:transferTokens                | X      | X               | -               | -       |
| content.addCuratorToGroup                 | content:addCuratorToGroup             | X      | -               | -               | -       |
| content.channelById                       | content:channel                       | X      | -               | -               | -       |
| content.channelById                       | content:channels                      | X      | -               | -               | -       |
| content.createChannel                     | content:createChannel                 | X      | -               |                 | X       |
| content.createChannelCategory             | content:createChannelCategory         | X      | -               |                 | -       |
| content.createCuratorGroup                | content:createCuratorGroup            | X      | -               |                 | -       |
| content.createVideo                       | content:createVideo                   | X      | -               |                 | X       |
| content.createVideoCategory               | content:createVideoCategory           | X      | -               |                 | -       |
| content.curatorGroupById                  | content:curatorGroup                  | X      | -               |                 | -       |
| content.curatorGroupById                  | content:curatorGroups                 | X      | -               |                 | -       |
| content.deleteChannel                     | content:deleteChannel                 | X      | -               |                 | X       |
| content.deleteChannelCategory             | content:deleteChannelCategory         | X      | -               |                 | -       |
| content.deleteVideo                       | content:deleteVideo                   | X      | -               |                 | X       |
| content.deleteVideoCategory               | content:deleteVideoCategory           | X      | -               |                 | -       |
| content.removeChannelAssets               | content:removeChannelAssets           | X      | -               |                 | -       |
| content.removeCuratorFromGroup            | content:removeCuratorFromGroup        | X      | -               |                 | -       |
| content.setCuratorGroupStatus             | content:setCuratorGroupStatus         | X      | -               |                 | -       |
| content.setFeaturedVideos                 | content:setFeaturedVideos             | X      | -               |                 | -       |
| content.updateChannel                     | content:updateChannel                 | X      | -               |                 | X       |
| content.updateChannelCategory             | content:updateChannelCategory         | X      | -               |                 | -       |
| content.updateChannelCensorshipStatus     | content:updateChannelCensorshipStatus | X      | -               |                 | -       |
| content.updateChannelModerators           | content:updateChannelModerators       | X      | -               |                 | -       |
| content.updateVideo                       | content:updateVideo                   | X      | -               |                 | X       |
| content.updateVideoCategory               | content:updateVideoCategory           | X      | -               |                 | -       |
| content.updateVideoCensorshipStatus       | content:updateVideoCensorshipStatus   | X      | -               |                 | -       |
| content.videoById                         | content:video                         | X      | -               |                 | -       |
| content.videoById                         | content:videos                        | X      | -               |                 | -       |
| forum.addPost                             | forum:addPost                         | X      | X               |                 | -       |
| query.forum.categoryById                  | forum:categories                      | X      | X               |                 | -       |
| query.forum.categoryById                  | forum:category                        | X      | X               |                 | -       |
| forum.createCategory                      | forum:createCategory                  | X      | X               |                 | -       |
| forum.createThread                        | forum:createThread                    | X      | X               |                 | -       |
| forum.deleteCategory                      | forum:deleteCategory                  | X      | X               |                 | -       |
| forum.moderatePost                        | forum:moderatePost                    | X      | -               |                 | -       |
| forum.moderateThread                      | forum:moderateThread                  | X      | -               |                 | -       |
| forum.moveThreadToCategory                | forum:moveThread                      | X      | -               |                 | -       |
| forum.posts                               | forum:posts                           | X      | X               |                 | -       |
| forum.setStickiedThreads                  | forum:setStickiedThreads              | X      | -               |                 | -       |
| forum.threadById.entries(categoryId)      | forum:threads                         | X      | X               |                 | -       |
| forum.updateCategoryArchivalStatus        | forum:updateCategoryArchivalStatus    | X      | -               |                 | -       |
| forum.updateCategoryMembershipOfModerator | forum:updateCategoryModeratorStatus   | X      | -               |                 | -       |
| members.addStakingAccountCandidate        | membership:addStakingAccount          | X      | X               |                 | -       |
| members.buyMembership                     | membership:buy                        | X      | X               |                 | -       |
| query.members.membershipById              | membership:details                    | X      | X               |                 | -       |
| members.updateProfile                     | membership:update                     | X      | X               |                 | -       |
| members.updateAccounts                    | membership:updateAccounts             | X      | X               |                 | -       |
| staking.validate                          | staking:validate                      | X      | X               | -               | -       |
| working-groups.application                | working-groups:application            | X      | X               |                 | -       |
| working-groups.apply                      | working-groups:apply                  | X      | X               |                 | -       |
| working-groups.cancelOpening              | working-groups:cancelOpening          | X      | X               |                 | -       |
| working-groups.createOpening              | working-groups:createOpening          | X      | X               |                 | -       |
| working-groups.decreaseWorkerStake        | working-groups:decreaseWorkerStake    | X      | X               |                 | -       |
| working-groups.evictWorker                | working-groups:evictWorker            | X      | X               |                 | -       |
| working-groups.fillOpening                | working-groups:fillOpening            | X      | -               |                 | -       |
| working-groups.increaseStake              | working-groups:increaseStake          | X      | X               |                 | -       |
| working-groups.leaveRole                  | working-groups:leaveRole              | X      | X               |                 | -       |
| working-groups.opening                    | working-groups:opening                | X      | X               |                 | X       |
| working-groups.openings                   | working-groups:openings               | X      | X               |                 | X       |
| working-groups.overview                   | working-groups:overview               | X      | X               |                 | -       |
| working-groups.removeUpcomingOpening      | working-groups:removeUpcomingOpening  | X      | -               |                 | X       |
| working-groups.setDefaultGroup            | working-groups:setDefaultGroup        | X      | -               |                 | -       |
| working-groups.slashWorker                | working-groups:slashWorker            | X      | -               |                 | -       |
| working-groups.updateGroupMetadata        | working-groups:updateGroupMetadata    | X      | -               |                 | -       |
| working-groups.updateRewardAccount        | working-groups:updateRewardAccount    | X      | X               |                 | -       |
| working-groups.updateRoleAccount          | working-groups:updateRoleAccount      | X      | X               |                 | -       |
| working-groups.updateRoleStorage          | working-groups:updateRoleStorage      | X      | -               |                 | -       |
| working-groups.updateWorkerReward         | working-groups:updateWorkerReward     | X      | -               |                 | -       |

## Needed commands

### Transactions

> Compare the transactions supported by the cli, to all the transaction for said module.
> Compare the modules with some transaction support to those without.

| Module | Command | Tx  | Useful For | Pioneer Support | SP/DP | Requires QN |
| ------ | ------- | --- | ---------- | --------------- | ----- | ----------- |
|        |         |     |            |                 |       |             |

### Non-Transactions

> are there any non-transaction commands that would be useful for some working group or users, that the cli doesn't support, and isn't available elsewhere.
> Ask the Leads for each group, and potentially some users that have a particular interest in one module
> Outline roughly what you/they would want, and how to get there.

| Module | Command | Tx  | Useful For | Pioneer Support | SP/DP | Requires QN |
| ------ | ------- | --- | ---------- | --------------- | ----- | ----------- |
|        |         |     |            |                 |       |             |

## Existing Commands

Lists of commands

- https://github.com/joystream/joystream/tree/incentives-tools/cli#commands
- https://github.com/bwhm/joystream/tree/incentives-tools/cli/src/commands/incentives
- https://github.com/Joystream/joystream/tree/master/storage-node#cli-commands
- https://github.com/Joystream/joystream/blob/master/distributor-node/docs/commands/index.md

| Module         | Command                       | Args                  | Tx                                        | Uses QN | Function Complete | Interactive | Functional | Queried Modules | Output Complete | Useful |
| -------------- | ----------------------------- | --------------------- | ----------------------------------------- | ------- | ----------------- | ----------- | ---------- | --------------- | --------------- | ------ |
|                | help                          | [COMMAND]             | -                                         | -       | X                 | -           | X          |                 | X               | X      |
|                | autocomplete                  | [SHELL]               | -                                         | -       | X                 | -           | X          |                 | X               | X      |
| account        | create                        |                       | -                                         | -       | X                 | X           | X          |                 | X               | X      |
| account        | export                        | [destPath]            | -                                         | -       | X                 | X           | X          |                 | X               | X      |
| account        | forget                        |                       | -                                         | -       | X                 | X           | X          |                 | X               | X      |
| account        | import                        |                       | -                                         | -       | X                 | X           | X          |                 | X               | X      |
| account        | info                          | [ADDRESS]             | -                                         | -       | X                 | X           | X          |                 | X               | X      |
| account        | list                          |                       | -                                         | -       | X                 | -           | X          |                 | X               | X      |
| account        | transferTokens                |                       | balances.Transfer                         | -       | X                 | X           | X          |                 | X               | X      |
| api            | getQueryNodeEndpoint          |                       | -                                         | -       | X                 | -           | X          |                 | X               | X      |
| api            | getUri                        |                       | -                                         | -       | X                 | X           | X          |                 | X               | X      |
| api            | inspect                       |                       | -                                         | -       | X                 | -           | X          |                 | X               | X      |
| api            | setQueryNodeEndpoint          | [ENDPOINT]            | -                                         | -       | X                 | X           | X          |                 | X               | X      |
| api            | setUri                        | [URI]                 | -                                         | -       | X                 | X           | X          |                 | X               | X      |
| content        | addCuratorToGroup             | [GROUPID] [CURATORID] | content.addCuratorToGroup                 | -       | X                 | -           | X          |                 | X               | X      |
| content        | channel                       | [CHANNELID]           | content.channelById                       | -       | X                 | -           | X          |                 | X               | X      |
| content        | channels                      |                       | content.channelById.entries               | -       | X                 | -           | X          |                 | X               | X      |
| content        | createChannel                 |                       | content.createChannel                     | -       | X                 | -           | X          |                 | X               | X      |
| content        | createChannelCategory         |                       | content.createChannelCategory             | -       | X                 | -           | X          |                 | X               | X      |
| content        | createCuratorGroup            |                       | content.createCuratorGroup                | -       | X                 | -           | X          |                 | X               | X      |
| content        | createVideo                   |                       | content.createVideo                       | -       | X                 | -           | X          |                 | X               | X      |
| content        | createVideoCategory           |                       | content.createVideoCategory               | -       | X                 | -           | X          |                 | X               | X      |
| content        | curatorGroup ID               |                       | content.curatorGroupById                  | -       | X                 | -           | X          |                 | X               | X      |
| content        | curatorGroups                 |                       | content.curatorGroupById.entries          | -       | X                 | -           | X          |                 | X               | X      |
| content        | deleteChannel                 |                       | content.deleteChannel                     | -       | X                 | -           | X          |                 | X               | X      |
| content        | deleteChannelCategory         | CHANNELCATEGORYID     | content.deleteChannelCategory             | -       | X                 | -           | X          |                 | X               | X      |
| content        | deleteVideo                   |                       | content.deleteVideo                       | -       | X                 | -           | X          |                 | X               | X      |
| content        | deleteVideoCategory           | VIDEOCATEGORYID       | content.deleteVideoCategory               | -       | X                 | -           | X          |                 | X               | X      |
| content        | removeChannelAssets           |                       | content.removeChannelAssets               | -       | X                 | -           | X          |                 | X               | X      |
| content        | removeCuratorFromGroup        | [GROUPID] [CURATORID] | content.removeCuratorFromGroup            | -       | X                 | -           | X          |                 | X               | X      |
| content        | reuploadAssets                |                       | -                                         | -       | X                 | -           | X          |                 | X               | X      |
| content        | setCuratorGroupStatus         | [ID] [STATUS]         | content.setCuratorGroupStatus             | -       | X                 | -           | X          |                 | X               | X      |
| content        | setFeaturedVideos             | FEATUREDVIDEOIDS      | content.setFeaturedVideos                 | -       | X                 | -           | X          |                 | X               | X      |
| content        | updateChannel                 | CHANNELID             | content.updateChannel                     | -       | X                 | -           | X          |                 | X               | X      |
| content        | updateChannelCategory         | CHANNELCATEGORYID     | content.updateChannelCategory             | -       | X                 | -           | X          |                 | X               | X      |
| content        | updateChannelCensorshipStatus | ID [STATUS]           | content.updateChannelCensorshipStatus     | -       | X                 | -           | X          |                 | X               | X      |
| content        | updateChannelModerators       |                       | content.updateChannelModerators           | -       | X                 | -           | X          |                 | X               | X      |
| content        | updateVideo VIDEOID           |                       | content.updateVideo                       | -       | X                 | -           | X          |                 | X               | X      |
| content        | updateVideoCategory           | VIDEOCATEGORYID       | content.updateVideoCategory               | -       | X                 | -           | X          |                 | X               | X      |
| content        | updateVideoCensorshipStatus   | ID [STATUS]           | content.updateVideoCensorshipStatus       | -       | X                 | X           | X          |                 | X               | X      |
| content        | video                         | VIDEOID               | content.videoById                         | -       | X                 | -           | X          |                 | X               | X      |
| content        | videos                        | [CHANNELID]           | content.videoById.entries                 | -       | X                 | -           | X          |                 | X               | X      |
| forum          | addPost                       |                       | forum.addPost                             | -       | X                 | -           | X          |                 | X               | X      |
| forum          | categories                    |                       | query.forum.categoryById                  | -       | X                 | -           | X          |                 | X               | X      |
| forum          | category                      |                       | query.forum.categoryById                  | -       | X                 | -           | X          |                 | X               | X      |
| forum          | createCategory                |                       | forum.createCategory                      | -       | X                 | -           | X          |                 | X               | X      |
| forum          | createThread                  |                       | forum.createThread                        | -       | X                 | -           | X          |                 | X               | X      |
| forum          | deleteCategory                |                       | forum.deleteCategory                      | -       | X                 | -           | X          |                 | X               | X      |
| forum          | moderatePost                  |                       | forum.moderatePost                        | -       | X                 | -           | X          |                 | X               | X      |
| forum          | moderateThread                |                       | forum.moderateThread                      | -       | X                 | -           | X          |                 | X               | X      |
| forum          | moveThread                    |                       | forum.moveThreadToCategory                | -       | X                 | -           | X          |                 | X               | X      |
| forum          | posts                         |                       | forum.posts                               | -       | X                 | -           | X          |                 | X               | X      |
| forum          | setStickiedThreads            |                       | forum.setStickiedThreads                  | -       | X                 | -           | X          |                 | X               | X      |
| forum          | threads                       |                       | forum.threadById.entries(categoryId)      | -       | X                 | -           | X          |                 | X               | X      |
| forum          | updateCategoryArchivalStatus  |                       | forum.updateCategoryArchivalStatus        | -       | X                 | -           | X          |                 | X               | X      |
| forum          | updateCategoryModeratorStatus |                       | forum.updateCategoryMembershipOfModerator | -       | X                 | -           | X          |                 | X               | X      |
| membership     | addStakingAccount             |                       | members.addStakingAccountCandidate        | -       | X                 | -           | X          |                 | X               | X      |
| membership     | buy                           |                       | members.buyMembership                     | -       | X                 | -           | X          |                 | X               | X      |
| membership     | details                       |                       | query.members.membershipById              | -       | X                 | -           | X          |                 | X               | X      |
| membership     | update                        |                       | members.updateProfile                     | -       | X                 | -           | X          |                 | X               | X      |
| membership     | updateAccounts                |                       | members.updateAccounts                    | -       | X                 | -           | X          |                 | X               | X      |
| staking        | validate                      |                       | staking.validate                          | -       | X                 | X           | X          |                 | X               | X      |
| working-groups | application                   | WGAPPLICATIONID       | working-groups.application                | -       | X                 | X           | X          |                 | X               | X      |
| working-groups | apply                         |                       | working-groups.apply                      | -       | X                 | X           | X          |                 | X               | X      |
| working-groups | cancelOpening                 | OPENINGID             | working-groups.cancelOpening              | -       | X                 | -           | X          |                 | X               | X      |
| working-groups | createOpening                 |                       | working-groups.createOpening              | -       | X                 | X           | X          |                 | X               | X      |
| working-groups | decreaseWorkerStake           | WORKERID AMOUNT       | working-groups.decreaseWorkerStake        | -       | X                 | -           | X          |                 | X               | X      |
| working-groups | evictWorker                   | WORKERID              | working-groups.evictWorker                | -       | X                 | -           | X          |                 | X               | X      |
| working-groups | fillOpening                   |                       | working-groups.fillOpening                | -       | X                 | -           | X          |                 | X               | X      |
| working-groups | increaseStake                 | AMOUNT                | working-groups.increaseStake              | -       | X                 | X           | X          |                 | X               | X      |
| working-groups | leaveRole                     |                       | working-groups.leaveRole                  | -       | X                 | X           | X          |                 | X               | X      |
| working-groups | opening                       |                       | working-groups.opening                    | -       | X                 | -           | X          |                 | X               | X      |
| working-groups | openings                      |                       | working-groups.openings                   | -       | X                 | -           | X          |                 | X               | X      |
| working-groups | overview                      |                       | working-groups.overview                   | -       | X                 | -           | X          |                 | X               | X      |
| working-groups | removeUpcomingOpening         |                       | working-groups.removeUpcomingOpening      | -       | X                 | X           | X          |                 | X               | X      |
| working-groups | setDefaultGroup               |                       | working-groups.setDefaultGroup            | -       | X                 | -           | X          |                 | X               | X      |
| working-groups | slashWorker                   | WORKERID AMOUNT       | working-groups.slashWorker                | -       | X                 | -           | X          |                 | X               | X      |
| working-groups | updateGroupMetadata           |                       | working-groups.updateGroupMetadata        | -       | X                 | -           | X          |                 | X               | X      |
| working-groups | updateRewardAccount           | [ADDRESS]             | working-groups.updateRewardAccount        | -       | X                 | X           | X          |                 | X               | X      |
| working-groups | updateRoleAccount             | [ADDRESS]             | working-groups.updateRoleAccount          | -       | X                 | X           | X          |                 | X               | X      |
| working-groups | updateRoleStorage             | STORAGE               | working-groups.updateRoleStorage          | -       | X                 | X           | X          |                 | X               | X      |
| working-groups | updateWorkerReward            | WORKERID NEWREWARD    | working-groups.updateWorkerReward         | -       | X                 | X           | X          |                 | X               | X      |
| incentives     | councilSpending               |                       | -                                         | -       | -                 | -           | -          | -               | -               | -      |
| incentives     | distributionStats             |                       | -                                         | -       | -                 | -           | -          | -               | -               | -      |
| incentives     | getBountyInfo                 |                       | -                                         | -       | -                 | -           | -          | -               | -               | -      |
| incentives     | getBountyInfoChain            |                       | -                                         | -       | -                 | -           | -          | -               | -               | -      |
| incentives     | getContentStats               |                       | -                                         | -       | -                 | -           | -          | -               | -               | -      |
| incentives     | getForumStats                 |                       | -                                         | -       | -                 | -           | -          | -               | -               | -      |
| incentives     | getOpenings                   |                       | -                                         | -       | -                 | -           | -          | -               | -               | -      |
| incentives     | getOpportunitiesScore         |                       | -                                         | -       | -                 | -           | -          | -               | -               | -      |
| incentives     | getWorkersStats               |                       | -                                         | -       | -                 | -           | -          | -               | -               | -      |
| incentives     | storageMaintenance            |                       | -                                         | -       | -                 | -           | -          | -               | -               | -      |
| incentives     | storageUploads                |                       | -                                         | -       | -                 | -           | -          | -               | -               | -      |
| incentives     | validatorRewards              |                       | -                                         | -       | -                 | -           | -          | -               | -               | -      |

## Api Requests

```
src/Api.ts:    const blockTime = await this._api.query.timestamp.now.at(await this.blockHash(height))
src/base/ApiCommandBase.ts:        name: 'Jsgenesis-hosted query node (https://query.joystream.org/graphql)',
src/base/ApiCommandBase.ts:        value: 'https://query.joystream.org/graphql',
src/base/ApiCommandBase.ts:    const blockTimestamp = (await api.query.timestamp.now.at(blockHash)).toNumber()
src/base/ApiCommandBase.ts:    const blockEvents = await api.query.system.events.at(blockHash)
src/base/ApiCommandBase.ts:        metadataCache[metadataKey] = await this.getOriginalApi().runtimeMetadata.toJSON()
src/base/ApiCommandBase.ts:                    const { name, docs } = this.getOriginalApi().registry.findMetaError(dispatchError.asModule)

# Accounts / Memberships
src/Api.ts:    const membership = await this._api.query.members.membershipById(memberId)
src/Api.ts:    return this._api.query.members.membershipById.multi(ids)
src/Api.ts:    const entries = await this.entriesByIds(this._api.query.members.membershipById)
src/Api.ts:      new BN((await this._api.query.balances.locks(account)).find((lock) => lock.id.eq(groupLockId))?.amount || 0)
src/Api.ts:    return this.entriesByIds<MemberId, Membership>(this._api.query.members.membershipById)
src/Api.ts:    const status = await this._api.query.members.stakingAccountIdMemberStatus(account)
src/Api.ts:    const existingMeber = await this._api.query.members.memberIdByHandleHash(handleHash) # typo
src/Api.ts:    const accountLocks = await this._api.query.balances.locks(account)

# Content
src/Api.ts:    return await this.entriesByIds(this._api.query.content.channelById)
src/Api.ts:    return await this.entriesByIds(this._api.query.content.videoById)
src/Api.ts:    return this.entriesByIds(this._api.query.content.curatorGroupById)
src/Api.ts:    const exists = !!(await this._api.query.content.channelById.size(channelId)).toNumber()
src/Api.ts:    const channel = await this._api.query.content.channelById(channelId)
src/Api.ts:    const video = await this._api.query.content.videoById(videoId)
src/Api.ts:    const exists = !!(await this._api.query.content.curatorGroupById.size(id)).toNumber()
src/Api.ts:    return exists ? await this._api.query.content.curatorGroupById(id) : null
src/Api.ts:    return (await this._api.query.content.nextCuratorGroupId()).toNumber()
src/Api.ts:    return this._api.query.storage.dataObjectsById.multi(ids.map((id) => [bagId, id]))
src/Api.ts:    return (await this.entriesByIds(this._api.query.content.channelCategoryById)).map(([id]) => id)
src/Api.ts:    return (await this.entriesByIds(this._api.query.content.videoCategoryById)).map(([id]) => id)
src/Api.ts:    return (await this._api.query.storage.dataObjectsById.entries(bagId)).map(([{ args: [, dataObjectId] }, value]) => [

# Forum
src/Api.ts:    const size = await this._api.query.forum.categoryById.size(categoryId)
src/Api.ts:    const size = await this._api.query.forum.threadById.size(categoryId, threadId)
src/Api.ts:    const size = await this._api.query.forum.postById.size(threadId, postId)
src/Api.ts:    let category = await this._api.query.forum.categoryById(categoryId)
src/Api.ts:      category = await this._api.query.forum.categoryById(parentCategoryId)
src/Api.ts:              const storageKeys = await this._api.query.forum.categoryByModerator.keys(id)
src/Api.ts:    const category = await this._api.query.forum.categoryById(categoryId)
src/Api.ts:    const thread = await this._api.query.forum.threadById(categoryId, threadId)
src/Api.ts:    const post = await this._api.query.forum.postById(threadId, postId)
src/Api.ts:    return this.entriesByIds(this._api.query.forum.categoryById)
src/Api.ts:    const entries = await this._api.query.forum.threadById.entries(categoryId)
src/Api.ts:    const entries = await this._api.query.forum.postById.entries(threadId)

# Staking
src/Api.ts:    return await this.entriesByAccountIds(this._api.query.staking.ledger)
src/Api.ts:    return await this._api.query.staking.ledger(account)
src/Api.ts:    return await this._api.query.staking.eraElectionStatus()

```

### Memberships

```
src/base/AccountsCommandBase.ts:          this.getOriginalApi().tx.members.addStakingAccountCandidate(memberId)
src/commands/membership/updateAccounts.ts:    const api = this.getOriginalApi()
src/commands/membership/update.ts:    const api = this.getOriginalApi()
src/commands/membership/buy.ts:    const api = this.getOriginalApi()
src/commands/membership/buy.ts:    const membershipPrice = await api.query.members.membershipPrice()
```

### Working Groups

```
src/commands/working-groups/updateGroupMetadata.ts:      this.getOriginalApi().tx[apiModuleByGroup[this.group]].setStatusText(
src/commands/working-groups/removeUpcomingOpening.ts:      this.getOriginalApi().tx[apiModuleByGroup[this.group]].setStatusText(
src/commands/working-groups/apply.ts:    const stakeLockId = this.getOriginalApi().consts[apiModuleByGroup[this.group]].stakingHandlerLockId
src/commands/working-groups/createOpening.ts:    const newStake = this.getOriginalApi().consts[apiModuleByGroup[this.group]].leaderOpeningStake.add(stake)
src/commands/working-groups/createOpening.ts:      this.getOriginalApi().tx[apiModuleByGroup[this.group]].addOpening(...this.createTxParams(inputParameters))
src/commands/working-groups/createOpening.ts:      this.getOriginalApi().tx[apiModuleByGroup[this.group]].setStatusText(
```

### Forum

```
src/commands/forum/addPost.ts:    const api = await this.getOriginalApi()
src/commands/forum/deleteCategory.ts:    const api = await this.getOriginalApi()
src/commands/forum/setStickiedThreads.ts:    const api = await this.getOriginalApi()
src/commands/forum/moveThread.ts:    const api = await this.getOriginalApi()
src/commands/forum/updateCategoryModeratorStatus.ts:    const api = await this.getOriginalApi()
src/commands/forum/createThread.ts:    const api = await this.getOriginalApi()
src/commands/forum/updateCategoryArchivalStatus.ts:    const api = await this.getOriginalApi()
src/commands/forum/moderatePost.ts:    const api = await this.getOriginalApi()
src/commands/forum/createCategory.ts:    const api = await this.getOriginalApi()
```

### Incentives

```
src/commands/incentives/councilSpending.ts:      const membershipPrice = (await this.getOriginalApi().query.members.membershipPrice.at(invitationBlockHash)).toNumber()
src/commands/incentives/councilSpending.ts:    const allMembers = await this.getOriginalApi().query.members.membershipById.entriesAt(endBlockHash)
src/commands/incentives/validatorRewards.ts:    const allMembers = await this.getOriginalApi().query.members.membershipById.entries()
src/commands/incentives/storageMaintenance.ts:    const startObjects = (await this.getOriginalApi().query.storage.nextDataObjectId.at(startHash)).toNumber()
src/commands/incentives/storageMaintenance.ts:    const endObjects = (await this.getOriginalApi().query.storage.nextDataObjectId.at(endHash)).toNumber()
src/commands/incentives/storageMaintenance.ts:      const bag = await this.getOriginalApi().query.storage.bags.at(endHash,{ Dynamic: { Channel: channelId }})
src/commands/incentives/getWorkersStats.ts:          const acc = (await this.getOriginalApi().query.members.membershipById(a.workersPaidInPeriod[n])).root_account.toString()
src/base/IncentivesCommandBase.ts:    const activeEraStart = (await this.getOriginalApi().query.staking.activeEra.at(startBlockHash)).unwrap().index.toNumber()
src/base/IncentivesCommandBase.ts:    const activeEraEnd = (await this.getOriginalApi().query.staking.activeEra.at(endBlockHash)).unwrap().index.toNumber()
src/base/IncentivesCommandBase.ts:    const activeWorkersAt = await this.getOriginalApi().query.storage.storageBucketById.entriesAt(hash)
src/base/IncentivesCommandBase.ts:    const getBlock = await this.getOriginalApi().rpc.chain.getBlock(hashOf)
src/base/IncentivesCommandBase.ts:    const budget = await this.getOriginalApi().query.council.budget.at(hash)
src/base/IncentivesCommandBase.ts:    const policy = await this.getOriginalApi().query.storage.dynamicBagCreationPolicies.at(hash,bagType)
src/base/IncentivesCommandBase.ts:    const eraRewardPoints = await this.getOriginalApi().query.staking.erasRewardPoints.at(blockHash,eraIndex)
src/base/IncentivesCommandBase.ts:    const eraTotalReward  = (await this.getOriginalApi().query.staking.erasValidatorReward.at(blockHash,eraIndex)).unwrap().toNumber()
src/base/IncentivesCommandBase.ts:    const eraTotalStake  = (await this.getOriginalApi().query.staking.erasTotalStake.at(blockHash,eraIndex)).toNumber()
src/base/IncentivesCommandBase.ts:      const pref = (await this.getOriginalApi().query.staking.erasValidatorPrefs.at(blockHash,eraIndex,validatorStashes[i])).commission.toNumber()/10**9
src/base/IncentivesCommandBase.ts:      const stakers = await this.getOriginalApi().query.staking.erasStakers.at(blockHash,eraIndex,validatorStashes[i])
src/base/IncentivesCommandBase.ts:      const validatorSlashInEra = await this.getOriginalApi().query.staking.validatorSlashInEra.at(blockHash,eraIndex,val.stash)
src/base/IncentivesCommandBase.ts:      const nominatorSlashInEra = await this.getOriginalApi().query.staking.nominatorSlashInEra.entriesAt(blockHash,eraIndex)
src/base/IncentivesCommandBase.ts:      validatorControllers.push((await this.getOriginalApi().query.staking.bonded.at(blockHash,stash)).toString())
src/base/IncentivesCommandBase.ts:        const bountyWorkersAt = await this.getOriginalApi().query.operationsWorkingGroupBeta.workerById.entriesAt(createdAtBlockHash)
src/base/IncentivesCommandBase.ts:        const bountyWorkersAt = await this.getOriginalApi().query.operationsWorkingGroupBeta.workerById.entriesAt(createdAtBlockHash)
src/base/IncentivesCommandBase.ts:          const bountyWorkersAt = await this.getOriginalApi().query.operationsWorkingGroupBeta.workerById.entriesAt(createdAtBlockHash)
src/base/UploadCommandBase.ts:      this.maxFileSize = await this.getOriginalApi().consts.storage.maxDataObjectSize
src/base/UploadCommandBase.ts:    const feePerMB = await this.getOriginalApi().query.storage.dataObjectPerMegabyteFee()
src/base/UploadCommandBase.ts:    const { dataObjectDeletionPrize } = this.getOriginalApi().consts.storage
```

## QN Requests

### Content / Storage

```
src/commands/content/deleteChannel.ts:    const dataObjects = await this.getQNApi().dataObjectsByBagId(`dynamic:channel:${channelId}`)
src/commands/content/updateVideo.ts:      const currentAssets = await this.getQNApi().dataObjectsByVideoId(videoId.toString())
src/commands/content/updateChannel.ts:      const currentAssets = await this.getQNApi().dataObjectsByChannelId(channelId.toString())
src/commands/content/deleteVideo.ts:    const dataObjects = await this.getQNApi().dataObjectsByVideoId(videoId.toString())
src/base/UploadCommandBase.ts:      const nodesInfo = _.shuffle(await this.getQNApi().storageNodesInfoByBagId(bagId))
```

### Openings

```
src/commands/working-groups/removeUpcomingOpening.ts:      const upcomingOpening = await this.getQNApi().upcomingWorkingGroupOpeningById(id)
src/commands/working-groups/removeUpcomingOpening.ts:        removed = !(await this.getQNApi().upcomingWorkingGroupOpeningById(id))
src/commands/working-groups/opening.ts:      const upcomingOpening = await this.getQNApi().upcomingWorkingGroupOpeningById(id)
src/commands/working-groups/openings.ts:      const upcomingOpenings = await this.getQNApi().upcomingWorkingGroupOpeningsByGroup(this.group)
src/commands/working-groups/createOpening.ts:        createdUpcomingOpening = await this.getQNApi().upcomingWorkingGroupOpeningByEvent(blockNumber, indexInBlock)
```

### Incentives

#### Bounties

```
src/base/IncentivesCommandBase.ts:    const bountiesPaid = await this.getQNApi().oracleJudgmentSubmittedEventsBetweenBlocks(startBlock,endBlock)
src/base/IncentivesCommandBase.ts:    const bountiesCreated = await this.getQNApi().bountiesCreatedBetweenBlocks(startBlock,endBlock)
src/base/IncentivesCommandBase.ts:    const allBounties = await this.getQNApi().allBounties()
```

#### Council Spending

```
src/commands/incentives/councilSpending.ts:    const budgetRefillEventsBetweenBlocks = await this.getQNApi().budgetRefillEventsBetweenBlocks(startBlock,endBlock)
src/commands/incentives/councilSpending.ts:    const getBudgetEventsInRange = await this.getQNApi().budgetUpdatedEventsBetweenBlocks(startBlock,endBlock)
src/commands/incentives/councilSpending.ts:    const discretionarySpending = await this.getQNApi().allBudgetSpendingEvents()
src/commands/incentives/councilSpending.ts:    const rewardPaidEventsBetweenBlocks = await this.getQNApi().rewardPaidEventsBetweenBlocks(startBlock,endBlock)
src/commands/incentives/councilSpending.ts:    const councilMembersAtBlock = await this.getQNApi().councilMembersAtBlock(endBlock)
src/commands/incentives/councilSpending.ts:    const membersInvited = await this.getQNApi().memberInvitedEventsBetweenBlocks(startBlock,endBlock)
```

#### Proposals

```
src/base/IncentivesCommandBase.ts:    const proposalExecutedEventsBetweenBlocks = await this.getQNApi().proposalExecutedEventsBetweenBlocks(startBlock,endBlock)
```

#### Forum

```
src/commands/incentives/getForumStats.ts:    const postAddedEventsBetweenBlocks = await this.getQNApi().postAddedEventsBetweenBlocks(startBlock,endBlock)
src/commands/incentives/getForumStats.ts:    const postDeletedEventsBetweenBlocks = await this.getQNApi().postDeletedEventsBetweenBlocks(startBlock,endBlock)
src/commands/incentives/getForumStats.ts:    const postModeratedEventsBetweenBlocks = await this.getQNApi().postModeratedEventsBetweenBlocks(startBlock,endBlock)
src/commands/incentives/getForumStats.ts:    const postReactedEventsBetweenBlocks = await this.getQNApi().postReactedEventsBetweenBlocks(startBlock,endBlock)
src/commands/incentives/getForumStats.ts:    const threadCreatedEventsBetweenBlocks = await this.getQNApi().threadCreatedEventsBetweenBlocks(startBlock,endBlock)
src/commands/incentives/getForumStats.ts:    const threadDeletedEventsBetweenBlocks = await this.getQNApi().threadDeletedEventsBetweenBlocks(startBlock,endBlock)
src/commands/incentives/getForumStats.ts:    const threadModeratedEventsBetweenBlocks = await this.getQNApi().threadModeratedEventsBetweenBlocks(startBlock,endBlock)
src/commands/incentives/getForumStats.ts:    const threadMetadataUpdatedEventsBetweenBlocks = await this.getQNApi().threadMetadataUpdatedEventsBetweenBlocks(startBlock,endBlock)
src/commands/incentives/getForumStats.ts:    const threadMovedEventsBetweenBlocks = await this.getQNApi().threadMovedEventsBetweenBlocks(startBlock,endBlock)
src/commands/incentives/getForumStats.ts:    const allForumCategories = await this.getQNApi().allForumCategories()
src/commands/incentives/getForumStatsOld.ts:    const allForumPosts = await this.getQNApi().allForumPosts()
src/commands/incentives/getForumStatsOld.ts:    const allForumCategories = await this.getQNApi().allForumCategories()
src/commands/incentives/getForumStatsOld.ts:    const allForumThreads = await this.getQNApi().allForumThreads()
```

#### Content

```
src/commands/incentives/getContentStatsOld.ts:    const allVideos = await this.getQNApi().allVideos()
src/commands/incentives/getContentStatsOld.ts:    const allChannels = await this.getQNApi().allChannels()
src/commands/incentives/getContentStats.ts:    const nftBoughtEventsBetweenBlocks = await this.getQNApi().nftBoughtEventsBetweenBlocks(startBlock,endBlock)
src/commands/incentives/getContentStats.ts:    const nftIssuedEventsBetweenBlocks = await this.getQNApi().nftIssuedEventsBetweenBlocks(startBlock,endBlock)
src/commands/incentives/getContentStats.ts:    const allVideos = await this.getQNApi().allVideos()
src/commands/incentives/getContentStats.ts:    const allChannels = await this.getQNApi().allChannels()
```

#### Storage

```
src/commands/incentives/storageUploads.ts:    const uploadsInRange = await this.getQNApi().failedUploadsBetweenTimestamps(`"${startDateTime}"`,`"${endDateTime}"`)
src/commands/incentives/storageMaintenance.ts:    const storageBucketsData = await this.getQNApi().storageBucketsData()
src/commands/incentives/storageMaintenance.ts:    const newChannels = await this.getQNApi().channelsCreatedBetweenBlocks(startBlock,endBlock)
src/commands/incentives/storageMaintenanceOld.ts:    const storageBucketsData = await this.getQNApi().storageBucketsData()
src/commands/incentives/storageMaintenanceOld.ts:    const newChannels = await this.getQNApi().channelsCreatedBetweenBlocks(startBlock,endBlock)
src/commands/incentives/storageMaintenanceOld.ts:    const storageData = await this.getQNApi().storageBagStorageReplication()
src/commands/incentives/storageMaintenanceOld.ts:    const storageNodeBuckets = await this.getQNApi().storageBucketsData()
```

#### Distribution

```
src/commands/incentives/distributionStats.ts:    const distributionBucketsData = await this.getQNApi().distributionBucketsData()
src/commands/incentives/distributionStats.ts:    const distributionBucketFamilyData = await this.getQNApi().distributionBucketFamilyData()
```

#### Openings

```
src/commands/incentives/getOpenings.ts:    const allOpenings = await this.getQNApi().allWorkingGroupOpenings()
```

#### Workers

```
src/commands/incentives/getWorkersStats.ts:    const rewardPaidEventsBetweenBlocks = await this.getQNApi().rewardPaidEventsBetweenBlocks(startBlock,endBlock)
src/base/IncentivesCommandBase.ts:    const workerHistory = await this.getQNApi().workerHistory()
```

#### Members

```
src/base/IncentivesCommandBase.ts: const recipientRootIsMember = await this.getQNApi().membersByRootAccounts([recipient.account])
src/base/IncentivesCommandBase.ts: const recipientControllerIsMember = await this.getQNApi().membersByControllerAccounts([recipient.account])
```

```
➜ joystream git:(master) ✗ joystream-cli account --help
› Warning: @joystream/cli update available from 0.5.1 to 0.8.0.
Accounts management - create, import or switch currently used account

USAGE
$ joystream-cli account:COMMAND

COMMANDS
account:choose Choose default account to use in the CLI
account:create Create new account
account:current Display information about currently choosen default account
account:export Export account(s) to given location
account:forget Forget (remove) account from the list of available accounts
account:import Import account using JSON backup file
account:transferTokens Transfer tokens from currently choosen account
```

# Errors:

1. When command `staking:validate` used twice in a row with same controller account the dev-chain looks broken and prints this error:
   Could not reproduce more than once.

```
Jul 10 17:40:20.834  INFO 💤 Idle (0 peers), best: #986 (0xb095…1564), finalized #984 (0x91b6…dd6c), ⬇ 0 ⬆ 0
Jul 10 17:40:24.002  INFO 🙌 Starting consensus session on top of parent 0xb095d57940e8bb0d414b5642f38ca5f275b74e8b4da4d39368fc68bddba01564
Jul 10 17:40:24.003  INFO 💸 new validator set of size 1 has been elected via ElectionCompute::OnChain for era 2
Jul 10 17:40:24.004  INFO 🎁 Prepared block for proposing at 987 [hash: 0x1451aa4c8c2bcc1d61df4b0b99e2b73f17b7f452ab22eca6b92a8439ae85ab54; parent_hash: 0xb095…1564; extrinsics (2): [0x072d…ab00, 0xf36c…a6d9]]
Jul 10 17:40:24.008  INFO 🔖 Pre-sealed block for proposal at 987. Hash now 0x8eb4b23defcdd941d9213636367d2d59d9309063e8043476945128f94007e3c1, previously 0x1451aa4c8c2bcc1d61df4b0b99e2b73f17b7f452ab22eca6b92a8439ae85ab54.
Jul 10 17:40:24.008  WARN Error with block built on 0xb095d57940e8bb0d414b5642f38ca5f275b74e8b4da4d39368fc68bddba01564: ClientImport("Unexpected epoch change")
```
