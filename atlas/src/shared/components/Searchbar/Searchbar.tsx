import React, { useState } from 'react'
import { CancelButton, Container, Input, StyledIcon } from './Searchbar.style'

type SearchbarProps = {
  value: string
  onCancel?: () => void
  showCancelButton?: boolean
  controlled?: boolean
} & React.DetailedHTMLProps<React.HTMLAttributes<HTMLInputElement>, HTMLInputElement>
const Searchbar: React.FC<SearchbarProps> = ({
  placeholder,
  onChange,
  onFocus,
  onCancel,
  showCancelButton = false,
  controlled = false,
  value: externalValue,
  onBlur,
  onSubmit,
  className,
  ...htmlProps
}) => {
  const [value, setValue] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(e)
    }
    if (!controlled) {
      setValue(e.currentTarget.value)
    }
  }
  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    }
    if (!controlled) {
      setValue('')
    }
  }

  return (
    <Container className={className}>
      <StyledIcon name="search" />
      <Input
        value={controlled ? externalValue : value}
        placeholder={placeholder}
        type="search"
        onChange={handleChange}
        onFocus={onFocus}
        onFocusCapture={onFocus}
        onBlur={onBlur}
        onSubmit={onSubmit}
        data-hj-allow
        {...htmlProps}
      />
      {showCancelButton && <CancelButton onClick={handleCancel} variant="tertiary" icon="times" size="smaller" />}
    </Container>
  )
}
export default Searchbar
