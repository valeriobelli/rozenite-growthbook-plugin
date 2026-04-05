interface BooleanInputProps {
	checked: boolean
	onChange: (value: boolean) => void
}

export const BooleanInput = ({ checked, onChange }: BooleanInputProps) => (
	<input
		type="checkbox"
		className="h-4 w-4 cursor-pointer accent-panel-accent"
		checked={checked}
		onChange={(e) => {
			onChange(e.target.checked)
		}}
	/>
)
