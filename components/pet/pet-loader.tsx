'use client';

// Pet-themed preloader that ends as a book cover: the ink-doodle creature draws
// a wavy ink line across blank paper while a counter ticks to 100 and
// handwritten storybook captions cycle underneath. It hops once mid-walk,
// celebrates at 100, sprints off the right edge of the screen, then the whole
// screen — counter and all — turns open like a front cover hinged at the left
// edge, revealing the page behind. `onOpen` fires the moment the cover starts
// moving so the hero can choreograph its reveal underneath. Stays mounted and
// renders nothing once fully open.

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PetSprite } from './pet-sprite';
import { HAT_STORAGE_KEY, type HatId, HAT_IDS } from './hats';
import { WavyDivider } from '@/components/effects/wavy-frame';

interface PetLoaderProps {
	onOpen: () => void;
}

const COVER_EASE = [0.645, 0.045, 0.355, 1];

const CAPTIONS = [
	'inking the pages…',
	'sewing the spine…',
	'waking the pet…',
	'dusting the cover…',
];

// walk → (midhop) → walk → celebrate → sprint → open
type Stage = 'walk' | 'midhop' | 'celebrate' | 'sprint' | 'open';

export default function PetLoader({ onOpen }: PetLoaderProps) {
	const [count, setCount] = useState(0);
	const [caption, setCaption] = useState(0);
	const [stage, setStage] = useState<Stage>('walk');
	// Read once on mount rather than from an effect: an effect would render the
	// default hat first and then swap it, and cascading renders are exactly what
	// react-hooks/set-state-in-effect flags. Safe to touch localStorage here
	// because the parent only mounts PetLoader once it's client-side, so this
	// never runs during SSR.
	const [hat] = useState<HatId>(() => {
		try {
			const saved = localStorage.getItem(HAT_STORAGE_KEY) as HatId | null;
			return saved && HAT_IDS.includes(saved) ? saved : 'none';
		} catch {
			return 'none';
		}
	});
	const rafRef = useRef<number | null>(null);
	const hopped = useRef(false);

	// Parent passes an inline arrow, so hold it in a ref: the open effect should
	// fire on the stage transition, not on every re-render of the parent.
	const onOpenRef = useRef(onOpen);
	useEffect(() => {
		onOpenRef.current = onOpen;
	});

	// The cover starts turning as we enter 'open'; tell the hero to reveal.
	useEffect(() => {
		if (stage === 'open') onOpenRef.current();
	}, [stage]);

	useEffect(() => {
		const duration = 2200;
		const startTime = performance.now();
		const tick = (nowTs: number) => {
			const t = Math.min((nowTs - startTime) / duration, 1);
			const eased = 1 - Math.pow(1 - t, 4);
			const c = Math.round(eased * 100);
			setCount(c);
			setCaption(
				Math.min(Math.floor(t * CAPTIONS.length), CAPTIONS.length - 1)
			);
			// One playful hop partway along the line
			if (!hopped.current && c >= 75) {
				hopped.current = true;
				setStage(s => (s === 'walk' ? 'midhop' : s));
			}
			if (t < 1) rafRef.current = requestAnimationFrame(tick);
			else setStage(s => (s === 'open' ? s : 'celebrate'));
		};
		rafRef.current = requestAnimationFrame(tick);
		return () => {
			if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
		};
	}, []);

	const petAnim =
		stage === 'midhop'
			? { y: [0, -9, 0] }
			: stage === 'celebrate'
				? { y: [0, -14, 0, -8, 0] }
				: stage === 'sprint'
					? { x: '110vw' }
					: undefined;

	const petTransition =
		stage === 'midhop'
			? { duration: 0.4, ease: 'easeOut' as const }
			: stage === 'celebrate'
				? { duration: 0.6, ease: 'easeOut' as const }
				: { duration: 0.8, ease: 'easeIn' as const };

	return (
		<AnimatePresence>
			{stage !== 'open' && (
				<motion.div
					key="pet-loader"
					className="fixed inset-0 z-[9999] select-none"
					style={{ perspective: 1400 }}
				>
					{/* The whole screen is the book's front cover: hinged at the left
              edge, it turns toward the reader with its content still on it.
              backface-visibility makes it vanish naturally past edge-on. */}
					<motion.div
						className="absolute inset-0 flex origin-left flex-col items-center justify-center gap-10 bg-background"
						style={{ backfaceVisibility: 'hidden' }}
						exit={{
							rotateY: -105,
							transition: { duration: 1.0, ease: COVER_EASE },
						}}
					>
						{/* Binding shadow — appears at the hinge as the cover lifts */}
						<motion.span
							aria-hidden
							className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-foreground/15 to-transparent"
							initial={{ opacity: 0 }}
							exit={{ opacity: 1, transition: { duration: 0.4 } }}
						/>
						<span className="font-title tabular-nums text-7xl leading-none text-foreground sm:text-8xl">
							{String(count).padStart(3, '0')}
						</span>

						{/* Walk track — the pet draws the wavy ink line behind it */}
						<div className="w-64 sm:w-80">
							<div className="relative h-3 w-full">
								<div
									className="absolute inset-y-0 left-0 overflow-hidden"
									style={{
										width: `${count}%`,
										transition: 'width 0.05s linear',
									}}
								>
									<div className="w-64 sm:w-80">
										<WavyDivider className="!text-foreground/60" />
									</div>
								</div>
								<motion.div
									className="absolute text-foreground"
									style={{
										left: `calc(${count}% - 24px)`,
										bottom: 'calc(100% - 6px)', // seat the feet on the ink line
										transition: 'left 0.05s linear',
									}}
									animate={petAnim}
									transition={petTransition}
									onAnimationComplete={() => {
										// Functional update so a stale closure can't rewind the stage.
										// Must stay pure — React may run updaters during render, so
										// onOpen() fires from an effect once we reach 'open' instead.
										setStage(s => {
											if (s === 'midhop') return 'walk';
											if (s === 'celebrate') return 'sprint';
											if (s === 'sprint') return 'open';
											return s;
										});
									}}
								>
									<PetSprite
										mode={
											stage === 'midhop' || stage === 'celebrate'
												? 'hop'
												: 'walk'
										}
										facing={1}
										hat={hat}
										className="h-14 w-14"
									/>
								</motion.div>
							</div>
							<span className="mt-3 block text-right font-hand text-base text-muted-foreground">
								{CAPTIONS[caption]}
							</span>
						</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
