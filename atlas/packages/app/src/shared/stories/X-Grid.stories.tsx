import React from 'react'
import { Grid } from '../components'

export default {
  title: 'Grid',
  component: Grid,
}

function Item() {
  return (
    <div>
      <img
        src="https://27pc93zx53q14ywwgt4yq513-wpengine.netdna-ssl.com/wp-content/uploads/2016/08/video-placeholder-brain-bites.png"
        style={{ width: '100%' }}
      />
      <p>Item title</p>
    </div>
  )
}

export const Default = () => (
  <Grid
    items={Array.from({ length: 12 }).map((_, idx) => (
      <Item key={idx} />
    ))}
  />
)

export const WithMinItemWidth300 = () => (
  <Grid
    minItemWidth="300"
    items={Array.from({ length: 12 }).map((_, idx) => (
      <Item key={idx} />
    ))}
  />
)

export const WithClassName = () => (
  <Grid
    className="customGrid"
    items={Array.from({ length: 12 }).map((_, idx) => (
      <Item key={idx} />
    ))}
  />
)
