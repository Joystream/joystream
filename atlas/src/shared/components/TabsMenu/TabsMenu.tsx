import React, { useState } from 'react'
import { TabsGroup, Tab } from './TabMenu.styles'

type TabsMenuProps = {
  tabs: string[]
  initialIndex?: number
  onSelectTab: (idx: number) => void
}
const TabsMenu: React.FC<TabsMenuProps> = ({ tabs, onSelectTab, initialIndex = -1 }) => {
  const [selected, setSelected] = useState(initialIndex)

  return (
    <TabsGroup>
      {tabs.map((tab, idx) => (
        <Tab
          onClick={(e) => {
            onSelectTab(idx)
            setSelected(idx)
          }}
          key={`${tab}-${idx}`}
          selected={selected === idx}
        >
          <span>{tab}</span>
        </Tab>
      ))}
    </TabsGroup>
  )
}
export default TabsMenu
