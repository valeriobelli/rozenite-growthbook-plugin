import CreatableSelect from 'react-select/creatable'

import { selectStyles } from './select-styles'
import type { SelectOption } from './select-styles'

export const StringArrayInput = ({ onChange, value }: { onChange: (value: string[]) => void; value: string[] }) => {
	const selectValue = value.map((v) => ({ label: v, value: v }))

	return (
		<CreatableSelect<SelectOption, true>
			isMulti
			styles={selectStyles}
			value={selectValue}
			onChange={(opts) => {
				onChange(Array.from(opts).map((o) => o.value))
			}}
		/>
	)
}
