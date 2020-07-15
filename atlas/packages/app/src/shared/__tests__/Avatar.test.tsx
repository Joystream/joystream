import React from 'react'
import { mount } from 'enzyme'
import Avatar from '@/shared/components/Avatar'
describe('Avatar component', () => {
  it('Should render avatar correctly', () => {
    expect(mount(<Avatar img="https://source.unsplash.com/WLUHO9A_xik/1600x900" />)).toMatchSnapshot()
  })
})
