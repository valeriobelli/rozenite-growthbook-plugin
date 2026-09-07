import type { StylesConfig } from 'react-select'

export type SelectOption = { label: string; value: string }

export const selectStyles: StylesConfig<SelectOption> = {
	clearIndicator: (base) => ({
		...base,
		color: 'var(--color-panel-text-secondary)',
		padding: '4px',
	}),
	control: (base, state) => ({
		...base,
		'&:hover': { borderColor: 'var(--color-panel-accent)' },
		backgroundColor: 'var(--color-panel-surface)',
		borderColor: state.isFocused ? 'var(--color-panel-accent)' : 'var(--color-panel-border)',
		boxShadow: 'none',
		minHeight: '34px',
	}),
	dropdownIndicator: (base) => ({
		...base,
		color: 'var(--color-panel-text-secondary)',
		padding: '4px',
	}),
	indicatorSeparator: (base) => ({
		...base,
		backgroundColor: 'var(--color-panel-border)',
	}),
	input: (base) => ({
		...base,
		color: 'var(--color-panel-text)',
		fontSize: '13px',
	}),
	menu: (base) => ({
		...base,
		backgroundColor: 'var(--color-panel-surface)',
		border: '1px solid var(--color-panel-border)',
	}),
	multiValue: (base) => ({
		...base,
		backgroundColor: 'var(--color-panel-border)',
	}),
	multiValueLabel: (base) => ({
		...base,
		color: 'var(--color-panel-text)',
		fontSize: '12px',
	}),
	multiValueRemove: (base) => ({
		...base,
		'&:hover': { backgroundColor: 'transparent', color: 'var(--color-panel-text)' },
		color: 'var(--color-panel-text-secondary)',
	}),
	option: (base, state) => ({
		...base,
		backgroundColor: state.isFocused ? 'var(--color-panel-border)' : 'transparent',
		color: 'var(--color-panel-text)',
		cursor: 'pointer',
		fontSize: '13px',
	}),
	placeholder: (base) => ({
		...base,
		color: 'var(--color-panel-text-secondary)',
		fontSize: '13px',
	}),
	singleValue: (base) => ({
		...base,
		color: 'var(--color-panel-text)',
		fontSize: '13px',
	}),
}
