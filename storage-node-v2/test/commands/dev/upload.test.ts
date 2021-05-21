import {expect, test} from '@oclif/test'

describe('dev:upload', () => {
  test
  .stdout()
  .command(['dev:upload'])
  .it('runs hello', ctx => {
    expect(ctx.stdout).to.contain('hello world')
  })

  test
  .stdout()
  .command(['dev:upload', '--name', 'jeff'])
  .it('runs hello --name jeff', ctx => {
    expect(ctx.stdout).to.contain('hello jeff')
  })
})
