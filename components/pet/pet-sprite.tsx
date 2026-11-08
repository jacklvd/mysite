// Presentational ink-doodle creature — the "sleepy scholar" librarian: a squat
// mochi body with a red scarf, square glasses, and a wobbly book stack topped
// by a mug of tea. Pure SVG, no state of its own — the parent (SitePet /
// PetLoader) drives it via:
//   - `mode`   → sets a `.pet--{mode}` class that CSS keyframes hook into
//   - `blink`  → momentarily squashes the eyes
//   - `facing` → flips horizontally so it looks where it walks
//   - `hat`    → which hat to wear (a hat replaces the book stack)
// Cursor eye-tracking is done by the parent setting the CSS custom properties
// `--pet-eye-x` / `--pet-eye-y` on an ancestor; the pupils read them.
//
// Eyes are content closed arcs by default; CSS swaps in the open pupils on
// hover and while dragged / dizzy / hopping (see `.pet-eyes-closed` in
// globals.css).
//
// Colors come from the theme: the body is "paper" (--background) with a
// "currentColor" ink outline (the parent sets text color to --foreground), so
// it reads as a hand-drawn doodle in both light and dark mode. Books and scarf
// use the two sketchbook inks (--primary blue, --ink-red). The body outline
// borrows the global `wavy-frame-sm` displacement filter for a hand-inked wobble.

import { HatShape, type HatId } from './hats';

export type PetMode = 'idle' | 'walk' | 'drag' | 'hop' | 'dizzy' | 'sleep';

const paper = 'hsl(var(--background))';
const blue = 'hsl(var(--primary))';
const red = 'hsl(var(--ink-red))';

// Hats are drawn for a head top at y≈15; this body's head top sits at y≈22.
const HAT_DROP = 7;

export function PetSprite({
	mode = 'idle',
	blink = false,
	facing = 1,
	hat = 'none',
	wobble = true,
	className = '',
}: {
	mode?: PetMode;
	blink?: boolean;
	facing?: 1 | -1;
	hat?: HatId;
	wobble?: boolean;
	className?: string;
}) {
	const books = hat === 'none';

	return (
		<svg
			viewBox="0 0 48 60"
			className={`pet pet--${mode} ${blink ? 'pet--blink' : ''} ${className}`}
			style={{ transform: `scaleX(${facing})` }}
			aria-hidden
			focusable="false"
		>
			<g className="pet-bob">
				{/* Nub feet (behind the body) */}
				<g
					className="pet-legs"
					stroke="currentColor"
					strokeWidth={5}
					strokeLinecap="round"
				>
					<line className="pet-leg pet-leg-l" x1={18} y1={51} x2={18} y2={55} />
					<line className="pet-leg pet-leg-r" x1={30} y1={51} x2={30} y2={55} />
				</g>

				{/* Squat mochi body — wobbly hand-drawn outline */}
				<path
					className="pet-outline"
					d="M24 22 C 10 22 6 32 6 42 C 6 52 14 55 24 55 C 34 55 42 52 42 42 C 42 32 38 22 24 22 Z"
					fill={paper}
					stroke="currentColor"
					strokeWidth={2.4}
					strokeLinejoin="round"
					style={wobble ? { filter: 'url(#wavy-frame-sm)' } : undefined}
				/>

				{/* Scarf + dangling tail */}
				<g
					fill={red}
					stroke="currentColor"
					strokeWidth={1.2}
					strokeLinejoin="round"
				>
					<path d="M9 46 q15 6 30 0 l0 3 q-15 6 -30 0 Z" />
					<path d="M31 48 l2 6 l3 -1 l-1.5 -6" />
				</g>

				{/* Blush */}
				<g fill={red} opacity={0.3}>
					<ellipse cx={13} cy={42} rx={3} ry={1.8} />
					<ellipse cx={35} cy={42} rx={3} ry={1.8} />
				</g>

				{/* Face: closed "content" arcs, or open pupils when awake */}
				<path
					className="pet-eyes-closed"
					d="M15.5 38.5 q2.5 -3 5 0 M27.5 38.5 q2.5 -3 5 0"
					fill="none"
					stroke="currentColor"
					strokeWidth={1.6}
					strokeLinecap="round"
				/>
				<g className="pet-eyes">
					<g className="pet-pupils" fill="currentColor">
						<circle cx={18} cy={37.5} r={2.6} />
						<circle cx={30} cy={37.5} r={2.6} />
					</g>
				</g>
				<g fill="none" stroke="currentColor" strokeWidth={1.3}>
					<rect x={12.5} y={33} width={11} height={9} rx={2.6} />
					<rect x={24.5} y={33} width={11} height={9} rx={2.6} />
				</g>
				<path
					className="pet-mouth"
					d="M23 44 q1 1 2 0"
					fill="none"
					stroke="currentColor"
					strokeWidth={1.2}
					strokeLinecap="round"
				/>

				{/* Arms: raised to hold the stack, or resting stubs under a hat */}
				<g
					stroke="currentColor"
					strokeWidth={2.2}
					strokeLinecap="round"
					fill="none"
				>
					<path
						className="pet-arm pet-arm-l"
						d={books ? 'M8 38 q-3 -6 1 -12' : 'M7 40 q-3 2 -3 5'}
					/>
					<path
						className="pet-arm pet-arm-r"
						d={books ? 'M40 38 q3 -6 -1 -12' : 'M41 40 q3 2 3 5'}
					/>
				</g>

				{/* Book stack + mug of tea */}
				{books && (
					<g
						className="pet-stack"
						stroke="currentColor"
						strokeWidth={1.3}
						strokeLinejoin="round"
					>
						<rect x={10} y={17} width={28} height={6} rx={1.5} fill={blue} />
						<rect
							x={14}
							y={11.5}
							width={21}
							height={5.5}
							rx={1.5}
							fill={paper}
							transform="rotate(-5 24 14)"
						/>
						<rect
							x={20}
							y={4}
							width={7}
							height={7}
							rx={1.5}
							fill={paper}
							strokeWidth={1.2}
						/>
						<path d="M27 6 q2.5 0.5 0 3" fill="none" strokeWidth={1} />
						<path
							className="pet-steam"
							d="M22 2 q-1 -2 0 -4 M25 2 q1 -2 0 -4"
							fill="none"
							strokeWidth={0.9}
							strokeLinecap="round"
							opacity={0.6}
						/>
					</g>
				)}

				{/* Hat */}
				{!books && (
					<g className="pet-hat" transform={`translate(0 ${HAT_DROP})`}>
						<HatShape id={hat} />
					</g>
				)}
			</g>
		</svg>
	);
}
