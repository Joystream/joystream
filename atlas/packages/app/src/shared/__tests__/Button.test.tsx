import React from 'react'
import { mount } from 'enzyme'
import Button from '@/shared/components/Button'

describe('Button component', () => {
  it('Should render button correctly', () => {
    expect(mount(<Button>Click me!</Button>)).toBeDefined()
  })

  it('Should render custom button correctly', () => {
    expect(mount(<Button size="small">Hello Atlas</Button>)).toBeDefined()
  })
})
