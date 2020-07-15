import * as React from 'react'
export default 'SvgrURL'
const SvgrMock = React.forwardRef((props, ref) => <span ref={ref} {...props} />)
SvgrMock.displayName = 'SvgrMock'
export const ReactComponent = SvgrMock
