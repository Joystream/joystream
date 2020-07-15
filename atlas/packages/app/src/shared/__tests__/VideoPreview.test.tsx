import React from 'react'
import { mount } from 'enzyme'
import VideoPreview from '@/shared/components/VideoPreview'
describe('VideoPreview component', () => {
  it('Should render Video Preview correctly', () => {
    expect(mount(<VideoPreview />)).toMatchSnapshot()
  })
})
