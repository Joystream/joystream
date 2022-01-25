import { Category, CategoryId, Post, PrivilegedActor, Thread } from '@joystream/types/forum'
import { WorkingGroups } from '../Types'
import { flags } from '@oclif/command'
import WorkingGroupCommandBase from './WorkingGroupCommandBase'
import chalk from 'chalk'
import ExitCodes from '../ExitCodes'
import { createType } from '@joystream/types'
import { AccountId, PostId, ThreadId } from '@joystream/types/common'
import { WorkerId } from '@joystream/types/working-group'

const FORUM_MODERATION_CONTEXT = ['Leader', 'Moderator'] as const

type ForumModerationContext = typeof FORUM_MODERATION_CONTEXT[number]

/**
 * Abstract base class for commands related to forum management
 */
export default abstract class ForumCommandBase extends WorkingGroupCommandBase {
  static flags = {
    ...WorkingGroupCommandBase.flags,
  }

  static forumModerationContextFlag = flags.enum({
    required: false,
    description: `Actor context to execute the command in (${FORUM_MODERATION_CONTEXT.join('/')})`,
    options: [...FORUM_MODERATION_CONTEXT],
  })

  async init(): Promise<void> {
    await super.init()
    this._group = WorkingGroups.Forum // override group for RolesCommandBase
  }

  async ensureCategoryExists(categoryId: CategoryId | number): Promise<void> {
    const categoryExists = await this.getApi().forumCategoryExists(categoryId)
    if (!categoryExists) {
      this.error(`Category ${chalk.magentaBright(categoryId)} does not exist!`, {
        exit: ExitCodes.InvalidInput,
      })
    }
  }

  async ensureCategoryMutable(categoryId: CategoryId | number): Promise<void> {
    const category = await this.getCategory(categoryId)
    const ancestors = await this.getApi().forumCategoryAncestors(categoryId)
    if (category.archived.isTrue || ancestors.some(([, category]) => category.archived.isTrue)) {
      this.error(`Category ${chalk.magentaBright(categoryId)} is not mutable (belongs to archived category tree)!`, {
        exit: ExitCodes.InvalidInput,
      })
    }
  }

  async ensureThreadExists(categoryId: CategoryId | number, threadId: ThreadId | number): Promise<void> {
    const threadExists = await this.getApi().forumThreadExists(categoryId, threadId)
    if (!threadExists) {
      this.error(
        `Thread ${chalk.magentaBright(threadId)} in category ${chalk.magentaBright(categoryId)} does not exist!`,
        {
          exit: ExitCodes.InvalidInput,
        }
      )
    }
  }

  async ensurePostExists(threadId: ThreadId | number, postId: PostId | number): Promise<void> {
    const postExists = await this.getApi().forumPostExists(threadId, postId)
    if (!postExists) {
      this.error(`Post ${chalk.magentaBright(postId)} in thread ${chalk.magentaBright(threadId)} does not exist!`, {
        exit: ExitCodes.InvalidInput,
      })
    }
  }

  async getThread(categoryId: CategoryId | number, threadId: ThreadId | number): Promise<Thread> {
    await this.ensureThreadExists(categoryId, threadId)
    const thread = await this.getApi().getForumThread(categoryId, threadId)
    return thread
  }

  async getCategory(categoryId: CategoryId | number): Promise<Category> {
    await this.ensureCategoryExists(categoryId)
    const category = await this.getApi().getForumCategory(categoryId)
    return category
  }

  async getPost(threadId: ThreadId | number, postId: PostId | number): Promise<Post> {
    await this.ensurePostExists(threadId, postId)
    const post = await this.getApi().getForumPost(threadId, postId)
    return post
  }

  async getIdsOfModeratorsWithAccessToCategories(categories: CategoryId[] | number[]): Promise<WorkerId[]> {
    const moderatorsByCategory = await Promise.all(categories.map((id) => this.getApi().forumCategoryModerators(id)))
    const categoriesCountByModeratorId = new Map<number, number>()
    for (const moderators of moderatorsByCategory) {
      for (const id of moderators) {
        categoriesCountByModeratorId.set(id.toNumber(), (categoriesCountByModeratorId.get(id.toNumber()) || 0) + 1)
      }
    }
    return Array.from(categoriesCountByModeratorId.entries())
      .filter(([, count]) => count === categories.length)
      .map(([id]) => createType<WorkerId, 'WorkerId'>('WorkerId', id))
  }

  async getForumModeratorContext(categories: CategoryId[] | number[]): Promise<[AccountId, PrivilegedActor]> {
    const moderators = await this.getIdsOfModeratorsWithAccessToCategories(categories)
    try {
      const worker = await this.getRequiredWorkerContext('Role', moderators)
      return [
        worker.roleAccount,
        createType<PrivilegedActor, 'PrivilegedActor'>('PrivilegedActor', { Moderator: worker.workerId }),
      ]
    } catch (e) {
      this.error(
        `Moderator access to categories: ${categories
          .map((id) => chalk.magentaBright(id.toString()))
          .join(', ')} is required!`,
        { exit: ExitCodes.AccessDenied }
      )
    }
  }

  async getForumLeadContext(): Promise<[AccountId, PrivilegedActor]> {
    const lead = await this.getRequiredLeadContext()
    return [lead.roleAccount, createType<PrivilegedActor, 'PrivilegedActor'>('PrivilegedActor', 'Lead')]
  }

  async getForumModerationContext(
    categories: CategoryId[] | number[],
    context?: ForumModerationContext
  ): Promise<[AccountId, PrivilegedActor]> {
    if (context === 'Leader') {
      return this.getForumLeadContext()
    }

    if (context === 'Moderator') {
      return this.getForumModeratorContext(categories)
    }

    // Context not explicitly set...

    try {
      const context = await this.getForumLeadContext()
      this.log('Derived context: Forum Working Group Leader')
      return context
    } catch (e) {
      // continue...
    }

    try {
      const context = await this.getForumModeratorContext(categories)
      this.log('Derived context: Moderator')
      return context
    } catch (e) {
      // continue...
    }

    this.error(
      `You need moderator permissions for forum categories: ${categories
        .map((id) => chalk.magentaBright(id.toString()))
        .join(', ')} in order to continue!`,
      { exit: ExitCodes.AccessDenied }
    )
  }
}
