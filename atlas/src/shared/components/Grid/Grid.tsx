import React from 'react'
import styled from '@emotion/styled'
import useResizeObserver from 'use-resize-observer'
import { useMediaQuery } from 'react-responsive'
import { spacing } from '../../theme'

const toPx = (n: number | string) => (typeof n === 'number' ? `${n}px` : n)

const LARGE_VIEWPORT_BREAKPOINT = toPx(2000)

type ContainerProps = {
  gap: number | string
  gridTemplateColumns: string
}

const Container = styled.div<ContainerProps>`
  display: grid;
  gap: ${(props) => toPx(props.gap)};
  grid-template-columns: ${(props) => props.gridTemplateColumns};
`

type GridProps = {
  gap?: number | string
  className?: string
  maxColumns?: number
  minWidth?: number | string
  repeat?: 'fit' | 'fill'
  onResize?: (sizes: number[]) => void
}

const Grid: React.FC<GridProps> = ({
  className,
  gap = spacing.xl,
  onResize,
  repeat = 'fit',
  maxColumns = 6,
  minWidth = 300,
  ...props
}) => {
  const { ref: gridRef } = useResizeObserver<HTMLDivElement>({
    onResize: () => {
      if (onResize && gridRef.current) {
        const computedStyles = window.getComputedStyle(gridRef.current)
        const columnSizes = computedStyles.gridTemplateColumns.split(' ').map(parseFloat)
        onResize(columnSizes)
      }
    },
  })
  const isLargeViewport = useMediaQuery({ query: `(min-width: ${LARGE_VIEWPORT_BREAKPOINT})` })

  const gridTemplateColumns = isLargeViewport
    ? `repeat(${maxColumns}, 1fr)`
    : `repeat(auto-${repeat}, minmax(min(${toPx(minWidth)}, 100%), 1fr))`

  return (
    <Container {...props} className={className} ref={gridRef} gap={gap} gridTemplateColumns={gridTemplateColumns} />
  )
}
export default Grid
