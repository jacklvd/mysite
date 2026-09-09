import { defineConfig, configDefaults } from 'vitest/config';
import path from 'path';

export default defineConfig({
	resolve: {
		alias: {
			'@': path.resolve(__dirname, '.'),
		},
	},
	test: {
		environment: 'node',
		// Collect tests wherever they live. This used to be scoped to lib/** and
		// scripts/**, which meant a test written next to the component it covered
		// was silently never run — it reported nothing rather than failing, so the
		// gap only showed up by counting files in the summary.
		//
		// The environment is still `node`. A test that needs a DOM will fail
		// loudly on `document is not defined`; add jsdom and switch the
		// environment for that file when the first one turns up.
		include: ['**/*.test.{ts,tsx}'],
		exclude: [...configDefaults.exclude, '.next/**'],
	},
});
