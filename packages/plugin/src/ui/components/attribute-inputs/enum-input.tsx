import CreatableSelect from 'react-select/creatable'

import type { SelectOption } from './select-styles'
import { selectStyles } from './select-styles'

interface EnumInputProps {
	value: string
	onChange: (value: string) => void
	options: string[]
}

export const EnumInput = ({ onChange, options, value }: EnumInputProps) => {
	const selectOptions: SelectOption[] = options.map((o) => ({ label: o, value: o }))

	return (
		<CreatableSelect<SelectOption>
			styles={selectStyles}
			options={selectOptions}
			value={{ label: value, value }}
			onChange={(opt) => {
				onChange(opt ? opt.value : '')
			}}
		/>
	)
}
