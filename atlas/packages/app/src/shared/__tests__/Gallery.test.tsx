import React from 'react'
import { shallow } from 'enzyme'
import Gallery from '@/shared/components/Gallery'
describe('Gallery component', () => {
  it('Should render Gallery correctly', () => {
    expect(shallow(<Gallery title="Test gallery" />)).toMatchSnapshot()
  })
})
