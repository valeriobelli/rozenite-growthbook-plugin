import { TextInput } from './text-input'

interface NumberInputProps {
	initialValue: string
	onChange: (value: number) => void
}

export const NumberInput = ({ initialValue, onChange }: NumberInputProps) => (
	<TextInput
		initialValue={initialValue}
		inputType="number"
		onBlurSave={(v) => {
			onChange(v === '' ? 0 : Number.parseFloat(v))
		}}
	/>
)
