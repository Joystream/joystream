import React from 'react'
import styled from '@emotion/styled'
import useResizeObserver from 'use-resize-observer'

const Container = styled.div<GridProps>`
  display: grid;
  gap: ${(props) => props.gap};
  grid-template-columns: repeat(${(props) => `auto-${props.repeat}`}, minmax(min(270px, 100%), 1fr));
`

type GridProps = {
  gap?: number | string
  repeat?: 'fit' | 'fill'
  className?: string
  onResize?: (sizes: number[]) => void
}
const Grid: React.FC<GridProps> = ({ children, className, repeat = 'fit', onResize, ...props }) => {
  const { ref: gridRef } = useResizeObserver<HTMLDivElement>({
    onResize: () => {
      if (onResize && gridRef.current) {
        const computedStyles = window.getComputedStyle(gridRef.current)
        const columnSizes = computedStyles.gridTemplateColumns.split(' ').map(parseFloat)
        onResize(columnSizes)
      }
    },
  })

  return (
    <Container {...props} repeat={repeat} className={className} ref={gridRef}>
      {children}
    </Container>
  )
}
export default Grid
