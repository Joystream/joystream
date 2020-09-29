import { makeStyles, StyleFn } from '../../utils'
import { colors, spacing, typography } from './../../theme'

export type TextFieldStyleProps = {
  disabled?: boolean
  focus?: boolean
  error?: boolean
  isActive?: boolean
}

const FIELD_WIDTH = '250px'
const wrapper: StyleFn = () => ({
  display: 'block',
  maxWidth: FIELD_WIDTH,
  fontFamily: typography.fonts.base,
})

const container: StyleFn = (_, { disabled }) => ({
  position: 'relative',
  width: '100%',
  height: '48px',
  display: 'inline-flex',
  cursor: disabled ? 'not-allowed' : 'default',
})

const border: StyleFn = () => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  borderWidth: '1px',
  borderStyle: 'solid',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'left',
})
const borderColor: StyleFn = (styles, { disabled, error, isActive, focus }) => {
  const borderColor = disabled
    ? colors.gray[200]
    : error
    ? colors.error
    : focus
    ? colors.blue[500]
    : isActive
    ? colors.gray[200]
    : colors.gray[400]

  return {
    ...styles,
    borderColor,
  }
}
const label: StyleFn = (_, { error }) => ({
  color: error ? colors.error : colors.gray[400],
  padding: `0 ${spacing.s}`,
  backgroundColor: colors.black,
  fontSize: typography.sizes.body2,
  transition: `all 0.1s linear`,
})
const input: StyleFn = () => ({
  display: 'none',
  width: '100%',
  margin: `0 ${spacing.s}`,
  background: 'none',
  border: 'none',
  outline: 'none',
  color: colors.white,
  fontSize: typography.sizes.body2,
  padding: `5px 0`,
})
const helper: StyleFn = (_, { error }) => ({
  color: error ? colors.error : colors.gray[400],
})

export const useCSS = ({ disabled = false, focus = false, error = false, isActive = false }: TextFieldStyleProps) => {
  const props = { disabled, focus, error, isActive }
  return {
    wrapper: makeStyles([wrapper])(props),
    container: makeStyles([container])(props),
    border: makeStyles([border, borderColor])(props),
    label: makeStyles([label])(props),
    input: makeStyles([input])(props),
    helper: makeStyles([helper])(props),
  }
}
