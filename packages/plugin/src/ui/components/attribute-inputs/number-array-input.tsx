import CreatableSelect from 'react-select/creatable'

import type { SelectOption } from './select-styles'
import { selectStyles } from './select-styles'

interface NumberArrayInputProps {
	value: number[]
	onChange: (value: number[]) => void
}

export const NumberArrayInput = ({ onChange, value }: NumberArrayInputProps) => {
	const selectValue = value.map((v) => ({ label: v.toString(), value: v.toString() }))

	return (
		<CreatableSelect<SelectOption, true>
			isMulti
			styles={selectStyles}
			value={selectValue}
			onChange={(opts) => {
				onChange(
					Array.from(opts)
						.map((o) => Number.parseFloat(o.value))
						.filter((n) => !Number.isNaN(n))
				)
			}}
		/>
	)
}
