import React, { ReactNode } from 'react'

type TabProps = {
  label: string
  children: ReactNode
}

// FIXME: This looks incomplete
export default function Tab({ children }: TabProps) {
  // let styles = makeStyles(styleProps)

  return <div>{children}</div>
}
