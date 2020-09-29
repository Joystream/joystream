import React from 'react'
import { mount } from 'enzyme'
import RadioButton from '@/shared/components/RadioButton'
describe('RadioButton component', () => {
  it('Should render radio button correctly', () => {
    expect(mount(<RadioButton label="test Radio Button" />)).toBeDefined()
  })
})
