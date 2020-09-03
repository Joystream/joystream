import React from 'react'
import { mount } from 'enzyme'
import TextField from '@/shared/components/TextField'
describe('TextField component', () => {
  it('Should render Text Field correctly', () => {
    expect(mount(<TextField label="Test TextField" />)).toBeDefined()
  })
})
