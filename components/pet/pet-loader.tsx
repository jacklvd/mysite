'use client';

// Preloader as a closed sketchbook: a cloth cover with a paper label, the
// title writing itself in while the sleepy scholar naps on the label. The pet
// wakes with a hop, the elastic band snaps off, and the whole screen turns open
// like a front cover hinged at the left edge, revealing the page behind.
// `onOpen` fires the moment the cover starts moving so the hero can
// choreograph its reveal underneath. Stays mounted and renders nothing once
// fully open.

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PetSprite } from './pet-sprite';
import { HAT_STORAGE_KEY, type HatId, HAT_IDS } from './hats';
import { WavyBorder } from '@/components/effects/wavy-frame';

interface PetLoaderProps {
	onOpen: () => void;
}

const COVER_EASE = [0.645, 0.045, 0.355, 1];

// nap → wake → unstrap → open (ms from mount)
type Stage = 'nap' | 'wake' | 'unstrap' | 'open';
const TIMELINE: [Stage, number][] = [
	['wake', 1500],
	['unstrap', 2050],
	['open', 2500],
];

// The cover is a physical object, so it keeps its colors in both themes. The
// label re-points the theme vars so the pet draws as ink on cream paper.
const CLOTH = 'hsl(229 42% 24%)';
const LABEL_VARS = {
	'--background': '40 45% 94%',
	'--foreground': '228 30% 16%',
	'--ink-red': '10 69% 51%',
	'--muted-foreground': '228 12% 40%',
} as CSSProperties;

export default function PetLoader({ onOpen }: PetLoaderProps) {
	const [stage, setStage] = useState<Stage>('nap');
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
		const timers = TIMELINE.map(([s, at]) => setTimeout(() => setStage(s), at));
		return () => timers.forEach(clearTimeout);
	}, []);

	const awake = stage !== 'nap';

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
						className="absolute inset-0 flex origin-left items-center justify-center overflow-hidden"
						style={{
							backfaceVisibility: 'hidden',
							backgroundColor: CLOTH,
							// woven cloth
							backgroundImage:
								'repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0 2px, transparent 2px 5px), repeating-linear-gradient(-45deg, rgba(0,0,0,0.08) 0 2px, transparent 2px 5px)',
						}}
						exit={{
							rotateY: -105,
							transition: { duration: 1.0, ease: COVER_EASE },
						}}
					>
						{/* Spine: a darker band at the hinge, plus a shadow as it lifts */}
						<span
							aria-hidden
							className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-black/35 to-transparent"
						/>
						<motion.span
							aria-hidden
							className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-black/30 to-transparent"
							initial={{ opacity: 0 }}
							exit={{ opacity: 1, transition: { duration: 0.4 } }}
						/>

						{/* Paper label */}
						<div
							className="relative -rotate-[1.5deg] bg-background px-6 pb-6 pt-7 text-foreground shadow-[0_10px_30px_-8px_rgba(0,0,0,0.5)] sm:px-12"
							style={LABEL_VARS}
						>
							<WavyBorder
								filterId="wavy-frame-sm"
								className="border border-foreground/30"
							/>
							<p className="font-type text-[0.7rem] uppercase tracking-[0.25em] text-muted-foreground">
								sketchbook · vol. 26
							</p>
							<div className="relative">
								<motion.p
									className="mt-2 border-b border-foreground/20 pb-1 pr-16 font-title text-4xl leading-tight sm:text-6xl"
									initial={{ clipPath: 'inset(0 100% 0 0)' }}
									animate={{ clipPath: 'inset(0 0% 0 0)' }}
									transition={{ duration: 1.1, delay: 0.2, ease: 'easeInOut' }}
								>
									Jack&rsquo;s notes
								</motion.p>
								{/* The pet naps on the writing line, then wakes with a hop */}
								<div className="absolute -bottom-px right-0">
									<motion.div
										animate={awake ? { y: [0, -14, 0] } : { y: 0 }}
										transition={{ duration: 0.45, ease: 'easeOut' }}
									>
										<PetSprite
											mode={awake ? 'hop' : 'sleep'}
											facing={-1}
											hat={hat}
											className="h-[70px] w-14" // 4:5, matches the 48×60 viewBox
										/>
									</motion.div>
									{!awake &&
										[0, 1, 2].map(i => (
											<motion.span
												key={i}
												aria-hidden
												className="absolute -top-2 right-0 font-hand text-muted-foreground"
												style={{ fontSize: 14 + i * 4 }}
												initial={{ opacity: 0, x: 0, y: 0 }}
												animate={{ opacity: [0, 1, 0], x: 10, y: -26 }}
												transition={{
													duration: 1.5,
													delay: i * 0.5,
													repeat: Infinity,
													ease: 'easeOut',
												}}
											>
												z
											</motion.span>
										))}
								</div>
							</div>
							<p className="mt-3 font-hand text-lg text-muted-foreground">
								property of jack · if found, please read
							</p>
						</div>

						{/* Elastic band — snaps off before the cover opens */}
						<motion.span
							aria-hidden
							className="absolute inset-y-0 right-8 w-4 shadow-[0_0_8px_rgba(0,0,0,0.4)] sm:right-[12%]"
							style={{ backgroundColor: 'hsl(10 60% 45%)' }}
							animate={
								stage === 'unstrap'
									? { x: '40vw', rotate: 10, opacity: 0 }
									: undefined
							}
							transition={{ duration: 0.4, ease: 'easeIn' }}
						/>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
