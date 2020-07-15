import React from 'react'
import { shallow } from 'enzyme'
import Grid from '@/shared/components/Grid'
describe('Grid component', () => {
  it('Should render Grid correctly', () => {
    expect(
      shallow(
        <Grid>
          <div>Grid Elemen 1</div>
          <div>Grid Elemen 2</div>
          <div>Grid Elemen 3</div>
        </Grid>
      )
    ).toMatchSnapshot()
  })
})
