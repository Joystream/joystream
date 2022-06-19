
import { AllForumCategoriesFieldsFragment, PostModeratedEventsBetweenBlocksFieldsFragment, ThreadModeratedEventsBetweenBlocksFieldsFragment, ThreadMovedEventsBetweenBlocksFieldsFragment } from 'src/graphql/generated/queries'
import IncentivesCommandBase from '../../base/IncentivesCommandBase'
//import chalk from 'chalk'


export default class GetForumInfo extends IncentivesCommandBase {
  static description = 'Gets stats'
  static args = [
    {
      name: 'startBlockInput',
      required: true
    },
    {
      name: 'endBlockInput',
      required: true,
    },
  ]

  static flags = {
    ...IncentivesCommandBase.flags,
  }

  async run(): Promise<void> {
    let { startBlockInput,endBlockInput } = this.parse(GetForumInfo).args

    const startBlock = parseInt(startBlockInput)
    const endBlock = parseInt(endBlockInput)
    //const startBlockHash = await this.getBlockHash(startBlock)
    //const endBlockHash = await this.getBlockHash(endBlock)
    const postAddedEventsBetweenBlocks = await this.getQNApi().postAddedEventsBetweenBlocks(startBlock,endBlock)
    const postDeletedEventsBetweenBlocks = await this.getQNApi().postDeletedEventsBetweenBlocks(startBlock,endBlock)
    const postModeratedEventsBetweenBlocks = await this.getQNApi().postModeratedEventsBetweenBlocks(startBlock,endBlock)
    const postReactedEventsBetweenBlocks = await this.getQNApi().postReactedEventsBetweenBlocks(startBlock,endBlock)
    
    const threadCreatedEventsBetweenBlocks = await this.getQNApi().threadCreatedEventsBetweenBlocks(startBlock,endBlock)
    const threadDeletedEventsBetweenBlocks = await this.getQNApi().threadDeletedEventsBetweenBlocks(startBlock,endBlock)
    const threadModeratedEventsBetweenBlocks = await this.getQNApi().threadModeratedEventsBetweenBlocks(startBlock,endBlock)
    const threadMetadataUpdatedEventsBetweenBlocks = await this.getQNApi().threadMetadataUpdatedEventsBetweenBlocks(startBlock,endBlock)
    const threadMovedEventsBetweenBlocks = await this.getQNApi().threadMovedEventsBetweenBlocks(startBlock,endBlock)
    

    const allForumCategories = await this.getQNApi().allForumCategories()
    allForumCategories.sort((a,b) => a.createdInEvent.inBlock - b.createdInEvent.inBlock)

    const categoryStats:[number,string,number,number][] = []
    const categoryIds:number[] = []


    for (let category of allForumCategories) {
      categoryStats.push([parseInt(category.id),category.title,0,0])
      categoryIds.push(parseInt(category.id))
    }


    const newCats:AllForumCategoriesFieldsFragment[] = []
    const delCats:AllForumCategoriesFieldsFragment[] = []

    const deletedThreads:number[] = []
    const movedThreads:ThreadMovedEventsBetweenBlocksFieldsFragment[] = []
    const moderatedThreads:ThreadModeratedEventsBetweenBlocksFieldsFragment[] = []
    const metadataUpdatedThreads:number[] = []
    
    
    const deletedPosts:number[] = []
    const moderatedPosts:PostModeratedEventsBetweenBlocksFieldsFragment[] = []

    let notVisibleThreads = 0
    this.log(`${threadCreatedEventsBetweenBlocks.length} threads were created during the term.`)
    for (let a of threadCreatedEventsBetweenBlocks) {
      const categoryId = parseInt(a.thread.categoryId)
      const indexOfCategory = categoryIds.indexOf(categoryId)
      categoryStats[indexOfCategory][3] ++
      if (a.thread.isVisible == false) {
        notVisibleThreads ++
      }
    }
    this.log(`...of which:`)
    this.log(`  - ${notVisibleThreads} threads are not visible.`)

    this.log(`${threadDeletedEventsBetweenBlocks.length} threads were deleted (by the creator) during the term.`)
    for (let a of threadDeletedEventsBetweenBlocks) {
      deletedThreads.push(parseInt(a.threadId))
    }

    this.log(`${threadMovedEventsBetweenBlocks.length} threads were moved during the term:`)
    for (let a of threadMovedEventsBetweenBlocks) {
      movedThreads.push(a)
      this.log(`  - At block: #${a.inBlock}, thread with ID ${parseInt(a.threadId)} moved by Forum Worker Id: ${parseInt(a.actorId)}`)
      this.log(`    - From category ID ${parseInt(a.oldCategoryId)}, to ${parseInt(a.newCategoryId)}`)
    }


    this.log(`${threadModeratedEventsBetweenBlocks.length} threads were moderated during the term:`)
    for (let a of threadModeratedEventsBetweenBlocks) {
      moderatedThreads.push(a)
      this.log(`  - At block: #${a.inBlock}, thread with ID ${parseInt(a.threadId)} moderated by Forum Worker Id: ${parseInt(a.actorId)}`)
      this.log(`    - Rationale ${a.rationale}`)
    }

    for (let a of threadMetadataUpdatedEventsBetweenBlocks) {
      metadataUpdatedThreads.push(parseInt(a.threadId))
    }

    let editablePosts = 0
    let notVisiblePosts = 0
    let editsToPosts = 0
    this.log(`${postAddedEventsBetweenBlocks.length} posts were added during the term.`)
    for (let a of postAddedEventsBetweenBlocks) {
      const categoryId = parseInt(a.post.thread.categoryId)
      const indexOfCategory = categoryIds.indexOf(categoryId)
      categoryStats[indexOfCategory][2] ++
      if (a.isEditable == true) {
        editablePosts ++
      }
      if (a.post.isVisible == false) {
        notVisiblePosts ++
      }
      editsToPosts += a.post.edits.length
    }
    this.log(`...of which:`)
    this.log(`  - ${editablePosts} posts were editable.`)
    this.log(`  - ${notVisiblePosts} posts are not visible.`)
    this.log(`  - ${editsToPosts} edits were made to these posts.`)

    this.log(`${postModeratedEventsBetweenBlocks.length} posts were moderated during the term:`)
    for (let a of postModeratedEventsBetweenBlocks) {
      moderatedPosts.push(a)
      this.log(`  - At block: #${a.inBlock}, thread with ID ${parseInt(a.postId)} moderated by Forum Worker Id: ${parseInt(a.actorId)}`)
      this.log(`    - Rationale ${a.rationale}`)
    }

    
    for (let a of postDeletedEventsBetweenBlocks) {
      a.posts.forEach((post) => {
        deletedPosts.push(parseInt(post.id))
      });
    }
    this.log(`${deletedPosts.length} posts were deleted (by the poster) during the term:`)

    this.log(`${postReactedEventsBetweenBlocks.length} reactions were posted during the term:`)
    
    this.log(`New categories made during the term:`)
    for (let a of allForumCategories) {
      if (a.createdInEvent.inBlock > startBlock && a.createdInEvent.inBlock < endBlock) {
        newCats.push(a)
        this.log(`  - At block: #${a.createdInEvent}, category ${parseInt(a.title)} with ID ${parseInt(a.id)}`) //was made by Forum Worker Id: ${parseInt(a.)}
      }
    }
    this.log(` -> ${newCats.length} new categories made during the term:`)

    this.log(`Categories were deleted during the term:`)
    
    allForumCategories.sort((a,b) => a.createdInEvent.inBlock - b.createdInEvent.inBlock)
    for (let a of allForumCategories) {
      if (a.categorydeletedeventcategory) {
        a.categorydeletedeventcategory.forEach((del) => {
          if (del.inBlock > startBlock && del.inBlock < endBlock) {
            delCats.push(a)
            this.log(`  - At block: #${a.createdInEvent.inBlock}, category ${parseInt(a.title)} with ID ${parseInt(a.id)}`) //was made by Forum Worker Id: ${parseInt(a.)}
          }
        })
      }
    }
    this.log(` -> ${delCats.length} categories deleted during the term:`)

    for (let a of categoryStats) {
      this.log(`For category "${a[1]}" with ID ${a[0]}:`)
      this.log(`  - ${a[2]} threads, and ${a[3]} posts were made during the term`)
    }
  }
}