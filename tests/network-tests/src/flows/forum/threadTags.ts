import { FlowProps } from '../../Flow'
import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import {
  CreateThreadsFixture,
  ThreadParams,
  InitializeForumFixture,
  ThreadMetadataUpdate,
  UpdateThreadsMetadataFixture,
} from '../../fixtures/forum'
import { integrateMeta } from '@joystream/metadata-protobuf/utils'
import { IForumThreadMetadata } from '@joystream/metadata-protobuf'

export default async function threadTags({ api, query }: FlowProps): Promise<void> {
  const debug = extendDebug(`flow:threadTags`)
  debug('Started')
  api.enableDebugTxLogs()

  // Initialize forum
  const initializeForumFixture = new InitializeForumFixture(api, query, {
    numberOfForumMembers: 1,
    numberOfCategories: 1,
  })
  await new FixtureRunner(initializeForumFixture).runWithQueryNodeChecks()

  const [categoryId] = initializeForumFixture.getCreatedCategoryIds()
  const [memberId] = initializeForumFixture.getCreatedForumMemberIds()

  const originalMeta = { title: 'Test thread with tags', tags: ['tag1', 'tag2', 'tag3'] }
  const threadParams: ThreadParams = {
    categoryId,
    asMember: memberId,
    text: 'Test thread with tags',
    metadata: { value: originalMeta },
  }
  const createThreadsFixture = new CreateThreadsFixture(api, query, [threadParams])
  await new FixtureRunner(createThreadsFixture).runWithQueryNodeChecks()
  const [threadId] = createThreadsFixture.getCreatedThreadsIds()

  const updateMetas: IForumThreadMetadata[] = [
    { title: 'New title' },
    { tags: ['newTag1', 'tag2', 'tag3'] },
    { tags: [''] },
    { title: 'Final update title', tags: ['finalTag1', 'finalTag2', 'finalTag3'] },
  ]
  let previousPreUpdateValues = { ...originalMeta }
  const updates: ThreadMetadataUpdate[] = updateMetas.map((meta) => {
    const preUpdateValues = { ...previousPreUpdateValues }
    integrateMeta(preUpdateValues, meta, ['title', 'tags'])
    previousPreUpdateValues = { ...preUpdateValues }
    return {
      categoryId,
      threadId,
      newMetadata: { value: meta },
      preUpdateValues,
    }
  })
  const updateFixtures = updates.map((u) => new UpdateThreadsMetadataFixture(api, query, [u]))
  for (const fixutre of updateFixtures) {
    await new FixtureRunner(fixutre).runWithQueryNodeChecks()
  }

  debug('Done')
}
