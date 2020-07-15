import React from 'react'
import { mount } from 'enzyme'
import App from '../App'

// JSDom does not implement ResizeObserver, so this test would always fail.
class ResizeObserver {
  observe() {
    // do nothing
  }

  unobserve() {
    // do nothing
  }
}
describe('App component', () => {
  it('Should render App correctly', () => {
    global.ResizeObserver = ResizeObserver
    expect(mount(<App />)).toBeDefined()
  })
})
