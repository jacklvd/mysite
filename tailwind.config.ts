// dev-note: Tailwind v3 plugins/utils are CJS-only and untyped; require() is the supported path.
/* eslint-disable @typescript-eslint/no-require-imports */
import type { Config } from 'tailwindcss';
import type { PluginAPI } from 'tailwindcss/types/config';

const {
	default: flattenColorPalette,
} = require('tailwindcss/lib/util/flattenColorPalette');

const config: Config = {
	content: [
		'./pages/**/*.{js,ts,jsx,tsx,mdx}',
		'./components/**/*.{js,ts,jsx,tsx,mdx}',
		'./app/**/*.{js,ts,jsx,tsx,mdx}',
		'./lib/**/*.{js,ts,jsx,tsx,mdx}',
	],
	darkMode: ['class'],
	theme: {
		extend: {
			fontFamily: {
				// Whole site reads like a book: serif body + display serif headings.
				sans: ['var(--font-body)', 'Georgia', 'Cambria', 'serif'],
				serif: ['var(--font-display)', 'Georgia', 'serif'],
				// Flowing script for section titles (falls back to the display serif).
				title: ['var(--font-title)', 'var(--font-display)', 'cursive'],
				// Casual handwriting for guestbook notes.
				hand: ['var(--font-hand)', 'cursive'],
				// Typewriter for labels, dates and margin notes.
				type: ['var(--font-type)', 'ui-monospace', 'monospace'],
			},
			transitionTimingFunction: {
				// Springy "pop" easing used for the sparkle hover burst.
				'spring-pop': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
			},
			backgroundImage: {
				'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
				'gradient-conic':
					'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
			},
			colors: {
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				// Second sketchbook ink (primary is the blue one).
				'ink-red': 'hsl(var(--ink-red))',

				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))',
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))',
				},
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))',
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))',
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))',
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))',
				},
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				chart: {
					'1': 'hsl(var(--chart-1))',
					'2': 'hsl(var(--chart-2))',
					'3': 'hsl(var(--chart-3))',
					'4': 'hsl(var(--chart-4))',
					'5': 'hsl(var(--chart-5))',
				},
				text: {
					'dark-custom': '#000814',
					'semi-dark-custom': '#1b263b',
					'dark-blue-custom': '#003566',
					'yellow-orange': '#ffc300',
					'yellow-custom': '#ffd60a',
					'blue-grey-custom': '#415a77',
					'light-blue-custom': '#778da9',
					'white-custom': '#e0e1dd',
					'pallete-1': '#edede9',
					'pallete-2': '#d6ccc2',
					'pallete-3': '#f5ebe0',
					'pallete-4': '#e3d5ca',
					'pallete-5': '#d5bdaf',
				},
			},
			animation: {
				orbit: 'orbit calc(var(--duration)*1s) linear infinite',
			},
			keyframes: {
				orbit: {
					'0%': {
						transform:
							'rotate(calc(var(--angle) * 1deg)) translateY(calc(var(--radius) * 1px)) rotate(calc(var(--angle) * -1deg))',
					},
					'100%': {
						transform:
							'rotate(calc(var(--angle) * 1deg + 360deg)) translateY(calc(var(--radius) * 1px)) rotate(calc((var(--angle) * -1deg) - 360deg))',
					},
				},
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
			},
		},
	},
	plugins: [
		addVariablesForColors,
		require('tailwindcss-animate'),
		require('@tailwindcss/typography'),
	],
};

// This plugin adds each Tailwind color as a global CSS variable, e.g. var(--gray-200).
function addVariablesForColors({ addBase, theme }: PluginAPI) {
	const allColors = flattenColorPalette(theme('colors'));
	const newVars = Object.fromEntries(
		Object.entries(allColors).map(([key, val]) => [`--${key}`, val])
	) as Record<string, string>;

	addBase({
		':root': newVars,
	});
}

export default config;
