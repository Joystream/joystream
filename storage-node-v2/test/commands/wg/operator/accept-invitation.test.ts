import {expect, test} from '@oclif/test'

describe('wg:operator:accept-invitation', () => {
  test
  .stdout()
  .command(['wg:operator:accept-invitation'])
  .it('runs hello', ctx => {
    expect(ctx.stdout).to.contain('hello world')
  })

  test
  .stdout()
  .command(['wg:operator:accept-invitation', '--name', 'jeff'])
  .it('runs hello --name jeff', ctx => {
    expect(ctx.stdout).to.contain('hello jeff')
  })
})
