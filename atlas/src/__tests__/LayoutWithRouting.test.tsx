import React from 'react'
import { shallow } from 'enzyme'
import { LayoutWithRouting } from '../components'

describe('LayoutWithRouting component', () => {
  const component = shallow(<LayoutWithRouting />)

  it('Should render.', () => {
    expect(component).toBeDefined()
  })
})
