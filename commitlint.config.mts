import type { UserConfig } from '@commitlint/types'

const config: UserConfig = {
	extends: ['@commitlint/config-conventional'],
	rules: {
		'body-max-line-length': [0],
		'footer-max-line-length': [0],
		'header-max-length': [2, 'always', 100],
		'scope-empty': [2, 'always'],
		'type-enum': [2, 'always', ['feat', 'fix', 'docs', 'refactor', 'deps', 'test', 'ci', 'build', 'revert']],
	},
}

export default config
