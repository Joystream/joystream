import { WorkerId } from '@joystream/types/primitives'
import { StandardizedFixture } from '../../Fixture'

export abstract class WithMembershipWorkersFixture extends StandardizedFixture {
  protected membershipLeadId?: WorkerId

  protected async getMembershipLeadId(): Promise<WorkerId> {
    if (!this.membershipLeadId) {
      const optMembershipLeadId = await this.api.query.membershipWorkingGroup.currentLead()
      if (optMembershipLeadId.isNone) {
        throw new Error('Membership working group lead not set!')
      }

      this.membershipLeadId = optMembershipLeadId.unwrap()
    }

    return this.membershipLeadId
  }

  protected async getSignersFromInput(input: { asWorker?: WorkerId }[]): Promise<string[]> {
    return Promise.all(
      input.map(async (r) => {
        const workerId = r.asWorker || (await this.getMembershipLeadId())
        return (await this.api.query.membershipWorkingGroup.workerById(workerId)).unwrap().roleAccountId.toString()
      })
    )
  }
}
