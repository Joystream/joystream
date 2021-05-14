import { WorkerId } from '@joystream/types/working-group'
import { StandardizedFixture } from '../../Fixture'

export abstract class WithForumLeadFixture extends StandardizedFixture {
  protected forumLeadId?: WorkerId

  protected async getForumLeadId(): Promise<WorkerId> {
    if (!this.forumLeadId) {
      const optForumLeadId = await this.api.query.forumWorkingGroup.currentLead()
      if (optForumLeadId.isNone) {
        throw new Error('Forum working group lead not set!')
      }

      this.forumLeadId = optForumLeadId.unwrap()
    }

    return this.forumLeadId
  }
}
