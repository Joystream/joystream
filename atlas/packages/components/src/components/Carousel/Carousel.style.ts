import { css } from "@emotion/core"
import { StyleFn, makeStyles } from "../../utils"

export type CarouselStyleProps = {
	navTopPosition?: string
}

const wrapper: StyleFn = () => ({
	position: "relative"
})
const container: StyleFn = () => ({
	display: "flex",
	overflow: "hidden",
	padding: "1rem"
})

const item: StyleFn = () => ({
	display: "inline-block"
})
const navLeft: StyleFn = (_, { navTopPosition = 69 }) => ({
	position: "absolute",
	left: 0,
	top: `${navTopPosition}px`
})

const navRight: StyleFn = (_, { navTopPosition = 69 }) => ({
	position: "absolute",
	right: 0,
	top: `${navTopPosition}px`
})

export const useCSS = (props: CarouselStyleProps) => ({
	wrapper: makeStyles([wrapper])(props),
	container: makeStyles([container])(props),
	item: makeStyles([item])(props),
	navLeft: makeStyles([navLeft])(props),
	navRight: makeStyles([navRight])(props)
})
