import { memo, useEffect } from 'react'

const ScrollToTop = ({ children, location }) => {
  useEffect(() => window.scrollTo(0, 0), [location.pathname])
  return children
}

export default memo(ScrollToTop)
