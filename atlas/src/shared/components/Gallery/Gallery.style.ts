import styled from '@emotion/styled'
import { spacing, typography } from '../../theme'

import { makeStyles, StyleFn } from '../../utils'

const container: StyleFn = () => ({
  display: 'flex',
  flexDirection: 'column',
})

export const Container = styled.section`
  display: flex;
  flex-direction: column;
`
export const HeadingContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: ${spacing.m};

  > h4 {
    font-size: ${typography.sizes.h5};
    margin: 0;
  }
  > button {
    font-size: ${typography.sizes.subtitle2};
    padding: 0;
  }
`
const headingContainer: StyleFn = () => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  marginBottom: spacing.m,
  '& > h4': {
    fontSize: '1.25rem',
    margin: 0,
  },
  '& > button': {
    fontSize: '0.875rem',
    padding: 0,
  },
})

export const useCSS = () => ({
  container: makeStyles([container])({}),
  headingContainer: makeStyles([headingContainer])({}),
})
