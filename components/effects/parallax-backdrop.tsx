'use client';

import { useEffect, useState, type RefObject } from 'react';
import {
	motion,
	useScroll,
	useTransform,
	useReducedMotion,
	type MotionValue,
} from 'framer-motion';

// Faint hand-drawn ink doodles arranged into three depth bands that drift at
// different speeds as the page scrolls, behind the meet-jack content. CSS 3D
// perspective gives each band a real "distance" (scale + blur + opacity falloff)
// while framer-motion drives the subtle scroll drift. Every mark is drawn in
// currentColor so it stays theme-adaptive — ink on paper in light, chalk among
// the stars in dark — in both modes identically. Purely decorative.

function Sparkle({ className = '' }: { className?: string }) {
	return (
		<svg viewBox="-8 -8 16 16" className={className} aria-hidden>
			<path
				d="M0 -7 Q1 -1 7 0 Q1 1 0 7 Q-1 1 -7 0 Q-1 -1 0 -7 Z"
				fill="currentColor"
			/>
		</svg>
	);
}

// Line doodles take an optional `draw` (0→1) that sets how much of the stroke
// is inked, so they draw themselves as the page scrolls.
function Swirl({
	className = '',
	draw,
}: {
	className?: string;
	draw?: MotionValue<number>;
}) {
	return (
		<svg
			viewBox="0 0 60 40"
			className={className}
			fill="none"
			stroke="currentColor"
			strokeWidth={1}
			strokeLinecap="round"
			aria-hidden
		>
			<motion.path
				d="M2 30 Q14 6 28 20 Q40 32 52 12"
				style={{ pathLength: draw }}
			/>
		</svg>
	);
}

function Moon({
	className = '',
	draw,
}: {
	className?: string;
	draw?: MotionValue<number>;
}) {
	return (
		<svg
			viewBox="0 0 40 40"
			className={className}
			fill="none"
			stroke="currentColor"
			strokeWidth={1.4}
			aria-hidden
		>
			<motion.path
				d="M27 5a16 16 0 1 0 7 23A13 13 0 0 1 27 5Z"
				style={{ pathLength: draw }}
			/>
		</svg>
	);
}

function Constellation({
	className = '',
	draw,
}: {
	className?: string;
	draw?: MotionValue<number>;
}) {
	return (
		<svg
			viewBox="0 0 160 110"
			className={className}
			fill="none"
			stroke="currentColor"
			aria-hidden
		>
			<motion.path
				style={{ pathLength: draw }}
				d="M12 84 Q30 70 48 66 Q67 74 86 78 Q103 56 120 40 Q135 52 150 58"
				strokeWidth={1}
				strokeLinecap="round"
			/>
			{[
				[12, 84],
				[48, 66],
				[86, 78],
				[120, 40],
				[150, 58],
			].map(([cx, cy]) => (
				<circle
					key={`${cx}-${cy}`}
					cx={cx}
					cy={cy}
					r={1.8}
					fill="currentColor"
					stroke="none"
				/>
			))}
		</svg>
	);
}

// Static CSS depth lives on the outer div; framer-motion y-drift lives on the
// inner motion.div. Keeping them on separate nodes prevents the two transforms
// from overwriting each other (both write `transform`).
function Band({
	drift,
	depthClass,
	children,
}: {
	drift: MotionValue<number>;
	depthClass: string;
	children: React.ReactNode;
}) {
	return (
		<div className={`absolute inset-0 ${depthClass}`}>
			<motion.div
				className="absolute inset-0 will-change-transform"
				style={{ y: drift }}
			>
				{children}
			</motion.div>
		</div>
	);
}

// `book` is the horizontal page scroller on /meet-jack: progress follows
// whichever axis is actually scrolling (pages sideways on md+, window on phones).
export function ParallaxBackdrop({
	book,
}: {
	book?: RefObject<HTMLElement | null>;
}) {
	const prefersReduced = useReducedMotion();
	const [isSmall, setIsSmall] = useState(false);
	const { scrollYProgress: windowY } = useScroll();
	// Passive effect: the book's ref is on a later sibling, attached after our
	// layout effects would run (and useScroll silently falls back to window).
	const { scrollXProgress: bookX } = useScroll({
		container: book,
		layoutEffect: false,
	});
	const scrollYProgress = useTransform<number, number>(
		[windowY, bookX],
		([y, x]) => Math.max(y, x)
	);

	// Scale drift down on small screens (cheap + smooth on phones). SSR-safe:
	// defaults to false on the server, corrected on mount. It's an aria-hidden
	// decorative layer, so any first-paint difference is invisible.
	useEffect(() => {
		const mq = window.matchMedia('(max-width: 640px)');
		const update = () => setIsSmall(mq.matches);
		update();
		mq.addEventListener('change', update);
		return () => mq.removeEventListener('change', update);
	}, []);

	const factor = prefersReduced ? 0 : isSmall ? 0.35 : 1;

	// Subtle drift over the full page scroll (0 -> 1). Far moves least, near most.
	const farDrift = useTransform(scrollYProgress, [0, 1], [0, -40 * factor]);
	const midDrift = useTransform(scrollYProgress, [0, 1], [0, -85 * factor]);
	const nearDrift = useTransform(scrollYProgress, [0, 1], [0, -140 * factor]);

	// Ink-in progress for the line doodles, staggered over the first half of the
	// page. Reduced motion shows them fully drawn.
	const inkFrom = prefersReduced ? 1 : 0.15;
	const drawEarly = useTransform(scrollYProgress, [0, 0.2], [inkFrom, 1]);
	const drawMid = useTransform(scrollYProgress, [0.1, 0.4], [inkFrom, 1]);
	const drawLate = useTransform(scrollYProgress, [0.25, 0.6], [inkFrom, 1]);

	return (
		<div
			aria-hidden
			className="pointer-events-none fixed inset-0 z-0 overflow-hidden text-foreground"
			style={{ perspective: '1000px' }}
		>
			{/* Far band — deepest, faintest, softest, pushed back + scaled to compensate */}
			<Band
				drift={farDrift}
				depthClass="opacity-[0.2] blur-[1px] [transform:translateZ(-300px)_scale(1.3)]"
			>
				{/* The one mode-aware element: a faint ink-wash blob. currentColor would
            read as dark-on-dark, so it uses an explicit light tint in dark mode. */}
				<div className="absolute left-[12%] top-[24%] h-72 w-72 rounded-full bg-foreground/[0.07] blur-3xl dark:bg-white/[0.08]" />
				<Constellation
					className="absolute right-[10%] top-[12%] h-24 w-36"
					draw={drawMid}
				/>
				<Sparkle className="absolute left-[24%] top-[64%] h-3 w-3" />
				<Sparkle className="absolute right-[28%] top-[88%] h-4 w-4" />
			</Band>

			{/* Mid band */}
			<Band
				drift={midDrift}
				depthClass="opacity-[0.28] [transform:translateZ(-150px)_scale(1.15)]"
			>
				<Moon
					className="absolute left-[8%] top-[8%] h-12 w-12"
					draw={drawEarly}
				/>
				<Swirl
					className="absolute right-[14%] top-[40%] h-10 w-16"
					draw={drawMid}
				/>
				<Sparkle className="absolute left-[40%] top-[30%] h-4 w-4" />
				<Sparkle className="absolute left-[18%] top-[104%] h-3 w-3" />
				<Sparkle className="absolute right-[8%] top-[72%] h-5 w-5" />
			</Band>

			{/* Near band — closest, sharpest, drifts most */}
			<Band drift={nearDrift} depthClass="opacity-[0.38]">
				<Sparkle className="absolute left-[30%] top-[16%] h-4 w-4" />
				<Sparkle className="absolute right-[20%] top-[54%] h-5 w-5" />
				<Swirl
					className="absolute left-[6%] top-[80%] h-8 w-14"
					draw={drawLate}
				/>
				<Sparkle className="absolute right-[34%] top-[110%] h-3 w-3" />
			</Band>
		</div>
	);
}
