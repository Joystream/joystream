import theme from '../../theme'
import { makeStyles, StyleFn } from '../../utils'

export const SIDENAV_WIDTH = 56
export const EXPANDED_SIDENAV_WIDTH = 360

type SidenavStyleProps = {
  expanded: boolean
}

const nav: StyleFn = () => ({
  position: 'fixed',
  top: 0,
  left: 0,
  bottom: 0,
  zIndex: 100,

  overflow: 'hidden',

  padding: `${theme.spacing.xxl} ${theme.spacing.m}`,

  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',

  backgroundColor: theme.colors.blue[700],
  color: theme.colors.white,
})

const expandButton: StyleFn = () => ({
  padding: '7px',
  margin: '-4px',
})

const drawerOverlay: StyleFn<SidenavStyleProps> = (_, { expanded }) => ({
  position: 'fixed',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  zIndex: 99,

  display: expanded ? 'block' : 'none',

  backgroundColor: 'rgba(0, 0, 0, 0.5)',
})

const navItemsWrapper: StyleFn = () => ({
  marginTop: '90px',
})

const navItemContainer: StyleFn = () => ({
  ':not(:first-child)': {
    marginTop: theme.spacing.xxxl,
  },
  display: 'flex',
  flexDirection: 'column',
})

const navItem: StyleFn = () => ({
  display: 'flex',
  alignItems: 'center',
  '> span': {
    marginLeft: theme.spacing.xxl,
    fontWeight: 'bold',
    fontFamily: theme.typography.fonts.headers,
    fontSize: theme.typography.sizes.h5,
    lineHeight: 1,
  },
})

const navSubitemsWrapper: StyleFn = () => ({
  paddingLeft: `calc(${theme.typography.sizes.icon.xlarge} + ${theme.spacing.xxl})`,
  overflow: 'hidden',
  '> div': {
    display: 'flex',
    flexDirection: 'column',
  },
})

const navSubitem: StyleFn = () => ({
  fontSize: theme.typography.sizes.body2,
  fontFamily: theme.typography.fonts.base,
  marginTop: theme.spacing.xxl,
  ':first-child': {
    marginTop: theme.spacing.xl,
  },
})

export const useSidenavCSS = (props: SidenavStyleProps) => ({
  nav: makeStyles([nav])(props),
  expandButton: makeStyles([expandButton])(props),
  drawerOverlay: makeStyles([drawerOverlay])(props),
  navItemsWrapper: makeStyles([navItemsWrapper])(props),
})

export const useNavItemCSS = (props: SidenavStyleProps) => ({
  navItemContainer: makeStyles([navItemContainer])(props),
  navItem: makeStyles([navItem])(props),
  navSubitemsWrapper: makeStyles([navSubitemsWrapper])(props),
  navSubitem: makeStyles([navSubitem])(props),
})
