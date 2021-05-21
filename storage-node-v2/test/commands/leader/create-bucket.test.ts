import {expect, test} from '@oclif/test'

describe('wg:leader:create-bucket', () => {
  test
  .stdout()
  .command(['wg:leader:create-bucket'])
  .it('runs hello', ctx => {
    expect(ctx.stdout).to.contain('hello world')
  })

  test
  .stdout()
  .command(['wg:leader:create-bucket', '--name', 'jeff'])
  .it('runs hello --name jeff', ctx => {
    expect(ctx.stdout).to.contain('hello jeff')
  })
})
