'use client';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { inView, fadeUp } from './reveal';

// Sketchbook section heading: a typed page number ("p. 03 · projects"), a
// handwritten title, and a red ink underline that draws itself left-to-right.
// `immediate` plays on mount instead of on scroll (for above-the-fold About).
export function PageHeading({
	page,
	label,
	title,
	immediate = false,
	children,
}: {
	page: string;
	label: string;
	title: ReactNode;
	immediate?: boolean;
	children?: ReactNode;
}) {
	const reveal = immediate ? fadeUp : inView;
	const draw = immediate
		? { initial: { pathLength: 0 }, animate: { pathLength: 1 } }
		: {
				initial: { pathLength: 0 },
				whileInView: { pathLength: 1 },
				viewport: { once: true, margin: '-60px' },
			};

	return (
		<header className="mb-12 md:mb-16">
			<motion.p
				{...reveal(0)}
				className="mb-2 font-type text-sm tracking-[0.12em] text-muted-foreground"
			>
				p. {page} · {label}
			</motion.p>
			<motion.h2
				{...reveal(0.05)}
				className="relative inline-block font-hand text-6xl font-bold leading-none text-primary md:text-7xl"
			>
				{title}
				<svg
					aria-hidden
					viewBox="0 0 200 14"
					preserveAspectRatio="none"
					className="absolute -bottom-3 left-0 h-3 w-full overflow-visible"
				>
					<motion.path
						d="M2 9 C 40 3, 80 13, 120 7 S 180 4, 198 10"
						fill="none"
						stroke="hsl(var(--ink-red))"
						strokeWidth={3}
						strokeLinecap="round"
						{...draw}
						transition={{ duration: 0.9, ease: 'easeInOut', delay: 0.35 }}
					/>
				</svg>
			</motion.h2>
			{children}
		</header>
	);
}
