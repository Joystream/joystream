import React from 'react'
import { shallow } from 'enzyme'
import Carousel from '@/shared/components/Carousel'
describe('Carousel component', () => {
  it('Should render Carousel correctly', () => {
    expect(
      shallow(
        <Carousel>
          <div>Carousel child 1</div>
          <div>Carousel child 1</div>
          <div>Carousel child 1</div>
        </Carousel>
      )
    ).toBeDefined()
  })
})
