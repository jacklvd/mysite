'use client';
import { useState, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useBookMode } from './book';

// Turns a sheet of paper away to reveal the section the first time it scrolls
// into view. Only the flap is transformed (perspective lives in its own
// transform, not on an ancestor), so fixed-position descendants like the
// guestbook's expanded note keep positioning against the viewport.
// Phones only: on md+ the sideways book pages turn for real (see .book-page).
export function PageTurn({ children }: { children: ReactNode }) {
	const bookMode = useBookMode();
	const reduced = useReducedMotion() || bookMode;
	const [turned, setTurned] = useState(false);

	return (
		<div className="relative">
			{children}
			{!reduced && !turned && (
				<motion.div
					aria-hidden
					className="pointer-events-none absolute inset-0 z-20 origin-left bg-background shadow-[8px_0_24px_-8px_rgba(0,0,0,0.25)]"
					style={{
						transformPerspective: 2200,
						backgroundImage:
							'linear-gradient(to left, rgba(0,0,0,0.07), transparent 35%), repeating-linear-gradient(transparent 0 31px, hsl(var(--primary) / 0.07) 31px 32px)',
					}}
					initial={{ rotateY: 0, opacity: 1 }}
					whileInView={{ rotateY: -115, opacity: 0 }}
					viewport={{ once: true, amount: 0.05 }}
					transition={{
						rotateY: { duration: 0.9, ease: [0.645, 0.045, 0.355, 1] },
						opacity: { duration: 0.25, delay: 0.65 },
					}}
					onAnimationComplete={() => setTurned(true)}
				/>
			)}
		</div>
	);
}
