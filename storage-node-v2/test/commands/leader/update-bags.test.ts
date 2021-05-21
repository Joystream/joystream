import {expect, test} from '@oclif/test'

describe('leader:update-bags', () => {
  test
  .stdout()
  .command(['leader:update-bags'])
  .it('runs hello', ctx => {
    expect(ctx.stdout).to.contain('hello world')
  })

  test
  .stdout()
  .command(['leader:update-bags', '--name', 'jeff'])
  .it('runs hello --name jeff', ctx => {
    expect(ctx.stdout).to.contain('hello jeff')
  })
})
