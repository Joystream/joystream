import { makeStyles, StyleFn } from "../../utils"
import { typography, colors, breakpoints, spacing } from "../../theme"

export type HeaderStyleProps = {
	backgroundImg?: string
}

const container: StyleFn = () => ({
	textAlign: "left",
	color: colors.white,
	display: "flex",
	lineHeight: 1.33,
	padding: `0 144px`,
	"& > *": {
		flexBasis: `50%`
	}
})

const content: StyleFn = () => ({
	marginLeft: spacing.xxl,
	marginBottom: 85,
	maxWidth: breakpoints.medium,
	overflowWrap: ""
})

const title: StyleFn = () => ({
	lineHeight: 1.05,
	letterSpacing: "-0.01em",
	fontWeight: "bold"
})

const subtitle: StyleFn = () => ({
	marginTop: `1rem`,
	maxWidth: `32rem`
})

const imgContainer: StyleFn = (_, { backgroundImg }) => ({
	backgroundImage: `url(${backgroundImg})`,
	backgroundRepeat: "repeat-y",
	backgroundPosition: "bottom",
	width: "100%",
	maxWidth: breakpoints.large
})

const img: StyleFn = () => ({
	width: `100%`,
	minWidth: 500,
	maxWidth: 800
})

export const useCSS = (props: HeaderStyleProps) => ({
	container: makeStyles([container])(props),
	content: makeStyles([content])(props),
	title: makeStyles([title])(props),
	subtitle: makeStyles([subtitle])(props),
	imgContainer: makeStyles([imgContainer])(props),
	img: makeStyles([img])(props)
})
// export let makeStyles = ({
//   background = ""
// }: HeaderStyleProps) => {
//   return css`
//     background-color: ${colors.black};
//     text-align: left;
//     cursor: default;
//     color: ${colors.white};
//     font-family: ${typography.fonts.base};
//     height: 600px;
//     display: flex;
//     align-content: center;
//     align-items: center;
//     background-image: url(${background});
//     background-repeat: no-repeat;
//     background-position: center right;
//     background-size: contain;

//     div#content {
//       margin: 0 100px;
//     }
//   `
// }
