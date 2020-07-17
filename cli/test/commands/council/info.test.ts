import { expect, test } from '@oclif/test'

describe('info', () => {
  test
    .stdout()
    .command(['council:info'])
    .exit(0)
    .it('displays "Council" string', (ctx) => {
      expect(ctx.stdout).to.contain('Council')
    })
})
