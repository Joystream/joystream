import { makeStyles, StyleFn } from "../../utils"
import { typography, colors, breakpoints, spacing } from "../../theme"

export type HeaderStyleProps = {
	backgroundImg?: string
}

const container: StyleFn = (_, { backgroundImg }) => ({
	textAlign: "left",
	color: colors.white,
	lineHeight: 1.33,
	height: 584,
	backgroundImage: `linear-gradient(0deg, black 0%, rgba(0,0,0,0) 100%), url(${backgroundImg})`,
	backgroundSize: "cover",
	backgroundPosition: "center",
	display: "flex",
	flexDirection: "column"
})

const content: StyleFn = () => ({
	marginLeft: spacing.xxl
})

const title: StyleFn = () => ({
	lineHeight: 1.05,
	letterSpacing: "-0.01em",
	fontWeight: "bold"
})

const subtitle: StyleFn = () => ({
	marginTop: spacing.m
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
