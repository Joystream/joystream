import React from "react"
import { Tag } from "./../src"
import { colors } from "./../src/theme"
import { faCheck } from "@fortawesome/free-solid-svg-icons"

export default {
  title: "Tag",
  component: Tag,
}

export const Default = () => <Tag icon={faCheck} text="Verified" color={colors.other.success} />

export const NoIcon = () => <Tag text="Verified" color={colors.other.success} />

export const NoText = () => <Tag icon={faCheck} color={colors.other.success} />
