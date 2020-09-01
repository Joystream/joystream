import React from 'react'
import { mount } from 'enzyme'
import HamburgerButton from '@/shared/components/HamburgerButton'
describe('HamburgerButton component', () => {
  it('Should render Hamburger correctly', () => {
    expect(
      mount(
        <HamburgerButton
          active
          onClick={() => {
            console.log('HamburgerButton Clicked')
          }}
        />
      )
    ).toBeDefined()
  })
})
