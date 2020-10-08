import React, { useState } from 'react'
import { Input, CancelButton, Container } from './Searchbar.style'

type SearchbarProps = {
  value: string
  onCancel?: () => void
  controlled?: boolean
} & React.DetailedHTMLProps<React.HTMLAttributes<HTMLInputElement>, HTMLInputElement>
const Searchbar: React.FC<SearchbarProps> = ({
  placeholder,
  onChange,
  onFocus,
  onCancel,
  controlled = false,
  value: externalValue,
  onBlur,
  onSubmit,
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

  const hasValue = value !== '' || externalValue !== ''
  return (
    <Container>
      <Input
        value={controlled ? externalValue : value}
        placeholder={placeholder}
        type="search"
        onChange={handleChange}
        onFocus={onFocus}
        onFocusCapture={onFocus}
        onBlur={onBlur}
        onSubmit={onSubmit}
        {...htmlProps}
      />
      {hasValue && <CancelButton onClick={handleCancel} variant="tertiary" icon="times" size="smaller" />}
    </Container>
  )
}
export default Searchbar
