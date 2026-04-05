import { useState } from 'react'

export const TextInput = ({
	initialValue,
	inputType = 'text',
	onBlurSave,
}: {
	initialValue: string
	inputType?: 'text' | 'number'
	onBlurSave: (value: string) => void
}) => {
	const [value, setValue] = useState(initialValue)

	return (
		<input
			className="w-full rounded border border-panel-border bg-panel-surface px-2 py-1.5 text-sm text-panel-text focus:outline-none focus:ring-1 focus:ring-panel-accent"
			type={inputType}
			value={value}
			onChange={(e) => {
				setValue(e.target.value)
			}}
			onBlur={() => {
				onBlurSave(value)
			}}
			spellCheck={false}
		/>
	)
}
