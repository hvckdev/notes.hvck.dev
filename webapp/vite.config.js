import { sveltekit } from '@sveltejs/kit/vite';
import { searchForWorkspaceRoot } from 'vite';
import { defineConfig } from 'vitest/config';

const config = defineConfig({
	plugins: [sveltekit()],
	optimizeDeps: {
		include: ['highlight.js', 'highlight.js/lib/core']
	},
	test: {
		globals: true,
		environment: 'happy-dom',
		setupFiles: ['setupTest.js']
	},
	server: {
		fs: {
			// Allow serving CHANGELOG.md file
			allow: [searchForWorkspaceRoot(process.cwd()), '/CHANGELOG.md']
		}
	}
});

export default config;
