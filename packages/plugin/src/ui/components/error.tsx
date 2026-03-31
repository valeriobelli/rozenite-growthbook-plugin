import { useErrorBoundary } from 'react-error-boundary'

const getTechnicalErrorDetails = (error: unknown) => {
	if (error instanceof Error) {
		const details = [error.message, error.stack].filter(Boolean).join('\n\n')

		return {
			details,
			message: error.message || 'Unknown error',
		}
	}

	if (typeof error === 'string') {
		return {
			details: error,
			message: error,
		}
	}

	if (typeof error === 'object') {
		try {
			const serializedError = JSON.stringify(error, null, 2)

			return {
				details: serializedError,
				message: 'Unexpected error payload',
			}
		} catch {
			return {
				details: JSON.stringify(error, null, 2),
				message: 'Unexpected error payload',
			}
		}
	}

	return {
		details: JSON.stringify(error, null, 2),
		message: 'Unknown error',
	}
}

export const ErrorFallback = ({ error }: { error: unknown }) => {
	const { resetBoundary } = useErrorBoundary()
	const technicalError = getTechnicalErrorDetails(error)

	return (
		<div className="flex h-screen flex-col items-center justify-center gap-4 px-4 text-center text-red-400">
			<h1 className="text-2xl font-bold">An error occurred while receiving data from GrowthBook</h1>

			<p className="max-w-2xl text-sm text-panel-text-secondary">{technicalError.message}</p>

			<details className="w-full max-w-2xl rounded border border-panel-border bg-panel-surface text-left">
				<summary className="cursor-pointer px-4 py-3 text-sm font-medium text-panel-text-secondary hover:text-panel-text">
					Technical error
				</summary>

				<pre className="overflow-x-auto border-t border-panel-border px-4 py-3 text-xs text-panel-text-secondary">
					{technicalError.details}
				</pre>
			</details>

			<button className="rounded bg-red-500 px-4 py-2 text-white" onClick={resetBoundary}>
				Reload
			</button>
		</div>
	)
}
