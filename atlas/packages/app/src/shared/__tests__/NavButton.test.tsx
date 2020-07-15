import React from 'react'
import { mount } from 'enzyme'
import NavButton from '@/shared/components/NavButton'
describe('NavButton component', () => {
  it('Should render NavButton correctly', () => {
    expect(mount(<NavButton />)).toMatchSnapshot()
  })
})
