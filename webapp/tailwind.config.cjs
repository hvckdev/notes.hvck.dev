const colors = require('tailwindcss/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: 'class',
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				'background-dark': colors.zinc[900],
				callout: 'rgb(var(--callout-color))',
				'callout-bg': 'rgba(var(--callout-color), 0.1)'
			},
			keyframes: {
				'gradient-drift': {
					'0%': { backgroundPosition: '0% 50%' },
					'50%': { backgroundPosition: '100% 50%' },
					'100%': { backgroundPosition: '0% 50%' }
				}
			},
			animation: {
				'gradient-drift': 'gradient-drift 60s ease infinite'
			}
		}
	},
	plugins: [require('@tailwindcss/typography')]
};
