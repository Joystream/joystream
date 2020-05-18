import React, { ReactNode } from "react"

type TabProps = {
  label: string
  children: ReactNode
}

export default function Tab({
  label,
  children
}: TabProps) {

  // let styles = makeStyles(styleProps)

  return (
    <div>
      {children}
    </div>
  )
}
