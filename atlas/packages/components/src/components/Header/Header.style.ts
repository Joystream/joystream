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
	flexDirection: "column",
	justifyContent: "flex-end"
})

const content: StyleFn = () => ({
	marginLeft: spacing.xxl,
	marginBottom: 85,
	maxWidth: "39.25rem"
})

const title: StyleFn = () => ({
	lineHeight: 1.05,
	letterSpacing: "-0.01em",
	fontWeight: "bold",
	margin: 0
})

const subtitle: StyleFn = () => ({
	maxWidth: "34rem",
	marginTop: spacing.m
})

export const useCSS = (props: HeaderStyleProps) => ({
	container: makeStyles([container])(props),
	content: makeStyles([content])(props),
	title: makeStyles([title])(props),
	subtitle: makeStyles([subtitle])(props)
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
