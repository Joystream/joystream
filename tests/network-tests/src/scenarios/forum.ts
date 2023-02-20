import categories from '../flows/forum/categories'
import threads from '../flows/forum/threads'
import posts from '../flows/forum/posts'
import moderation from '../flows/forum/moderation'
import leadOpening from '../flows/working-groups/leadOpening'
import threadTags from '../flows/forum/threadTags'
import { scenario } from '../Scenario'

// eslint-disable-next-line @typescript-eslint/no-floating-promises
scenario('Forum', async ({ job }) => {
  const hireLead = job('hiring working group leads', leadOpening(true))
  job('forum categories', categories).requires(hireLead)
  job('forum threads', threads).requires(hireLead)
  job('forum thread tags', threadTags).requires(hireLead)
  job('forum posts', posts).requires(hireLead)
  job('forum moderation', moderation).requires(hireLead)
})
