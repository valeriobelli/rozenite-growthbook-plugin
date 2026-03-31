import type { ReactNode } from 'react'

type Props = {
	children: ReactNode
}

export const Loader = ({ children }: Props) => (
	<div className="flex h-screen items-center justify-center text-panel-text-secondary">{children}</div>
)
