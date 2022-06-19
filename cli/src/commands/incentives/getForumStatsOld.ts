
import { AllForumCategoriesFieldsFragment, AllForumPostsFieldsFragment, AllForumThreadsFieldsFragment } from 'src/graphql/generated/queries'
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
    const allForumPosts = await this.getQNApi().allForumPosts()
    const allForumCategories = await this.getQNApi().allForumCategories()
    const allForumThreads = await this.getQNApi().allForumThreads()
    const categories:string[] = []
    const threadInCat: [number,number][] = []


    let newThreads = 0
    let newPosts = 0
    const deletedPosts:AllForumPostsFieldsFragment[] = []
    const moderatedPosts:AllForumPostsFieldsFragment[] = []

    const newCats:AllForumCategoriesFieldsFragment[] = []
    const delCats:AllForumCategoriesFieldsFragment[] = []

    const threadCreated:AllForumThreadsFieldsFragment[] = []
    const threadDeleted:AllForumThreadsFieldsFragment[] = []
    const threadModerated:AllForumThreadsFieldsFragment[] = []


    for (let thread of allForumThreads) {
      if (thread.category) {
        const catIndex = categories.indexOf(thread.category.title)
        if (catIndex == -1) {
          categories.push(thread.category.title)
          threadInCat.push([1,0])
        } else {
          threadInCat[catIndex][0] += 1
        }
      } else {
        console.log("thread undefined",thread)
      }
      if (thread.createdInEvent.inBlock > startBlock && thread.createdInEvent.inBlock < endBlock) {
        threadCreated.push(thread)
        if (thread.category) {
          const catIndex = categories.indexOf(thread.category.title)
          if (catIndex == -1) {
            categories.push(thread.category.title)
            threadInCat.push([1,0])
          } else {
            threadInCat[catIndex][1] += 1
          }
        } else {
          console.log("thread undefined",thread)
        }
      }
      if (thread.status.__typename == "ThreadStatusLocked" || thread.status.__typename == "ThreadStatusRemoved") {
        if (thread.status.threadDeletedEvent && thread.status.threadDeletedEvent.inBlock > startBlock && thread.status.threadDeletedEvent.inBlock < endBlock) {
          threadDeleted.push(thread)
        }
      } else if (thread.status.__typename == "ThreadStatusModerated") {
        if (thread.status.threadModeratedEvent && thread.status.threadModeratedEvent.inBlock > startBlock && thread.status.threadModeratedEvent.inBlock < endBlock) {
          threadModerated.push(thread)
        }
      }
    }



    for (let post of allForumPosts) {
      if (post.forumthreadinitialPost?.length ) {
        newThreads += 1
      }
      if (post.postaddedeventpost?.length ) {
        post.postaddedeventpost.forEach((a) => {
          if (a.inBlock > startBlock && a.inBlock < endBlock) {
            newPosts += 1
          }
        })
      }
      if (post.deletedInEvent) {
        if (post.deletedInEvent.inBlock > startBlock && post.deletedInEvent.inBlock < endBlock) {
          deletedPosts.push(post)
        }
      }
      if (post.postmoderatedeventpost) {
        post.postmoderatedeventpost.forEach((a) => {
          if (a.inBlock > startBlock && a.inBlock < endBlock) {
            moderatedPosts.push(post)
          }
        })
      }
    }

    for (let cat of allForumCategories) {
      if (cat.createdInEvent.inBlock > startBlock && cat.createdInEvent.inBlock < endBlock) {
        newCats.push(cat)
      }
      if (cat.categorydeletedeventcategory) {
        cat.categorydeletedeventcategory.forEach((a) => {
          if (a.inBlock > startBlock && a.inBlock < endBlock) {
            delCats.push(cat)
          }
        })
      }
    }

    for (let i=0; i<categories.length; i++) {
      console.log(categories[i], threadInCat[i])
    }

    console.log(`deletedPosts`,deletedPosts.length,JSON.stringify(deletedPosts, null, 4))
    console.log(`moderatedPosts`,moderatedPosts.length,JSON.stringify(moderatedPosts, null, 4))
    console.log(`newCats`,newCats.length,JSON.stringify(newCats, null, 4))
    console.log(`delCats`,delCats.length,JSON.stringify(delCats, null, 4))

    console.log(`threadCreated`,threadCreated.length,JSON.stringify(threadCreated, null, 4))
    console.log(`threadDeleted`,threadDeleted.length,JSON.stringify(threadDeleted, null, 4))
    console.log(`threadModerated`,threadModerated.length,JSON.stringify(threadModerated, null, 4))
    console.log("newThreads,newPosts",newThreads,newPosts)
  }
}
