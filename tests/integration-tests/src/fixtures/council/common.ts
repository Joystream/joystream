import { assert } from 'chai'
import { Api } from '../../Api'
import { QueryNodeApi } from '../../QueryNodeApi'

export async function assertCouncilMembersRuntimeQnMatch(api: Api, query: QueryNodeApi) {
  const runtimeCouncilMembers = await api.query.council.councilMembers()
  runtimeCouncilMembers.map(item => console.log(item.toString()))

  const tmp = await query.tryQueryWithTimeout(
    () => query.getCurrentCouncilMembers(),
    (qnElectedCouncil) => {
      console.log(qnElectedCouncil, qnElectedCouncil?.councilMembers)
      assert.sameMembers(
        (qnElectedCouncil?.councilMembers || []).map((item: any) => item.member.id.toString()),
        runtimeCouncilMembers.map((item: any) => item.membership_id.toString()),
      )
    }
  )
}
