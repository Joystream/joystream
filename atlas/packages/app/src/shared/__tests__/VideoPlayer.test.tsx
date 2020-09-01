import React from 'react'
import { mount } from 'enzyme'
import VideoPlayer from '@/shared/components/VideoPlayer'
describe('VideoPlayer component', () => {
  it('Should render Video Player correctly', () => {
    expect(mount(<VideoPlayer src="" />)).toBeDefined()
  })
})
