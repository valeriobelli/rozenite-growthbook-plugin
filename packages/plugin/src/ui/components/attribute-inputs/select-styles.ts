import type { StylesConfig } from 'react-select'

export type SelectOption = { label: string; value: string }

export const selectStyles: StylesConfig<SelectOption> = {
	clearIndicator: (base) => ({
		...base,
		color: 'var(--panel-text-secondary)',
		padding: '4px',
	}),
	control: (base, state) => ({
		...base,
		'&:hover': { borderColor: 'var(--panel-accent)' },
		backgroundColor: 'var(--panel-surface)',
		borderColor: state.isFocused ? 'var(--panel-accent)' : 'var(--panel-border)',
		boxShadow: 'none',
		minHeight: '34px',
	}),
	dropdownIndicator: (base) => ({
		...base,
		color: 'var(--panel-text-secondary)',
		padding: '4px',
	}),
	indicatorSeparator: (base) => ({
		...base,
		backgroundColor: 'var(--panel-border)',
	}),
	input: (base) => ({
		...base,
		color: 'var(--panel-text)',
		fontSize: '13px',
	}),
	menu: (base) => ({
		...base,
		backgroundColor: 'var(--panel-surface)',
		border: '1px solid var(--panel-border)',
	}),
	multiValue: (base) => ({
		...base,
		backgroundColor: 'var(--panel-border)',
	}),
	multiValueLabel: (base) => ({
		...base,
		color: 'var(--panel-text)',
		fontSize: '12px',
	}),
	multiValueRemove: (base) => ({
		...base,
		'&:hover': { backgroundColor: 'transparent', color: 'var(--panel-text)' },
		color: 'var(--panel-text-secondary)',
	}),
	option: (base, state) => ({
		...base,
		backgroundColor: state.isFocused ? 'var(--panel-border)' : 'transparent',
		color: 'var(--panel-text)',
		cursor: 'pointer',
		fontSize: '13px',
	}),
	placeholder: (base) => ({
		...base,
		color: 'var(--panel-text-secondary)',
		fontSize: '13px',
	}),
	singleValue: (base) => ({
		...base,
		color: 'var(--panel-text)',
		fontSize: '13px',
	}),
}
