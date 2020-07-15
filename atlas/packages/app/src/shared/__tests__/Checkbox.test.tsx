import React from 'react'
import { mount } from 'enzyme'
import Checkbox from '@/shared/components/Checkbox'

describe('Checkbox component', () => {
  it('Should render checkbox correctly', () => {
    expect(mount(<Checkbox label="Test checkbox" icon="check" error />)).toMatchSnapshot()
  })
})
