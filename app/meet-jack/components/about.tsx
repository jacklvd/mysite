/* eslint-disable react/no-unescaped-entities */
'use client';
import React, { useState, useRef } from 'react';
import {
	motion,
	useScroll,
	useTransform,
	useReducedMotion,
} from 'framer-motion';
import { FileText, ChevronDown, Sparkles, Star } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import {
	WavyBorder,
	WavyButtonBorder,
	WavyDivider,
} from '@/components/effects/wavy-frame';
import { inView, fadeUp } from '@/components/effects/reveal';
import { PaperPile } from '@/components/effects/paper-pile';

// Sparkles that pop around the photo on hover. Full class strings are kept
// literal so Tailwind's JIT picks them up (no runtime-built class names).
const sparkles = [
	{
		Icon: Sparkles,
		pos: '-top-3 -left-3',
		color: 'text-[#6fa89e]',
		hover: 'motion-safe:group-hover:-rotate-12',
		size: 26,
		delay: 0,
	},
	{
		Icon: Star,
		pos: 'top-7 -right-4',
		color: 'text-[#a07896]',
		hover: 'motion-safe:group-hover:rotate-12',
		size: 16,
		delay: 70,
	},
	{
		Icon: Sparkles,
		pos: '-bottom-3 right-8',
		color: 'text-[#c4685a]',
		hover: 'motion-safe:group-hover:rotate-6',
		size: 22,
		delay: 130,
	},
	{
		Icon: Star,
		pos: 'bottom-14 -left-4',
		color: 'text-foreground',
		hover: 'motion-safe:group-hover:-rotate-6',
		size: 13,
		delay: 190,
	},
	{
		Icon: Sparkles,
		pos: 'top-1/2 -right-5',
		color: 'text-[#6fa89e]',
		hover: 'motion-safe:group-hover:rotate-3',
		size: 15,
		delay: 250,
	},
] as const;

export function About() {
	const [expanded, setExpanded] = useState(false);

	const portraitRef = useRef<HTMLDivElement>(null);
	const prefersReduced = useReducedMotion();
	const { scrollYProgress: portraitProgress } = useScroll({
		target: portraitRef,
		offset: ['start end', 'end start'],
	});
	const portraitY = useTransform(
		portraitProgress,
		[0, 1],
		prefersReduced ? [0, 0] : [16, -16]
	);

	return (
		<section className="py-16 md:py-24" id="about">
			<motion.p
				{...fadeUp(0)}
				className="text-[0.6rem] tracking-[0.4em] uppercase text-muted-foreground mb-3"
			>
				01 — About
			</motion.p>
			<motion.h2
				{...fadeUp(0.05)}
				className="font-title text-5xl md:text-6xl text-foreground mb-12 md:mb-16"
			>
				Hi, I'm Jack.
			</motion.h2>

			<div className="grid grid-cols-1 lg:grid-cols-5 gap-14 lg:gap-20">
				{/* Photo + Spotify */}
				{/* `relative` positions the sparkle overlay + portrait stack. (The
            useScroll container warning is fixed on <html> in globals.css.) */}
				<motion.div
					{...inView(0.1)}
					className="relative lg:col-span-2 flex flex-col gap-6"
				>
					<div ref={portraitRef} className="group relative aspect-[3/4] p-2">
						<WavyBorder className="rounded-[1.4rem] border border-foreground/30 shadow-[12px_12px_0_#e0e0e0] dark:shadow-[12px_12px_0_rgba(255,255,255,0.07)] transition-colors duration-300 group-hover:border-foreground/50" />
						<motion.div
							style={{ y: portraitY }}
							className="relative h-full w-full overflow-hidden rounded-[0.85rem] will-change-transform"
						>
							<Image
								src="/images/hero.jpeg"
								alt="Jack Vo"
								fill
								sizes="(min-width: 1024px) 40vw, 100vw"
								className="object-cover transition-all duration-500 ease-out
                  group-hover:saturate-[1.2] group-hover:brightness-[1.04]
                  motion-safe:group-hover:scale-[1.06] motion-safe:group-hover:-rotate-1"
							/>
						</motion.div>

						{/* Magic pop: sparkles burst out around the photo on hover */}
						<div
							aria-hidden
							className="pointer-events-none absolute inset-0 z-10"
						>
							{sparkles.map(({ Icon, pos, color, hover, size, delay }, i) => (
								<span
									key={i}
									style={{ transitionDelay: `${delay}ms` }}
									className={`absolute ${pos} ${color} ${hover} scale-0 opacity-0 transition-all duration-300 ease-spring-pop group-hover:scale-100 group-hover:opacity-100`}
								>
									<Icon
										size={size}
										strokeWidth={1.5}
										className="fill-current drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]"
									/>
								</span>
							))}
						</div>
					</div>
					<div>
						<p className="text-[0.6rem] tracking-[0.4em] uppercase text-muted-foreground mb-2">
							Currently listening
						</p>
						<div className="overflow-hidden rounded-xl">
							<iframe
								src="https://open.spotify.com/embed/track/7a86XRg84qjasly9f6bPSD?utm_source=generator&theme=0"
								width="100%"
								height="80"
								allowFullScreen
								allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
								loading="lazy"
								className="border-none block"
								style={{ border: 'none' }}
							/>
						</div>
					</div>
				</motion.div>

				{/* Bio */}
				<motion.div {...inView(0.15)} className="lg:col-span-3 flex flex-col">
					<div className="space-y-5 text-foreground/75 leading-relaxed text-[0.95rem]">
						<p>
							I'm Long, but go by Jack — a computer science student pursuing a
							B.S. and incoming M.S. in CS. I care most about solving real-world
							problems, advocating for sustainability, and building
							community-driven applications.
						</p>
						<p>
							At STEAM for Vietnam, I helped deliver computer science education
							to Vietnamese children. It taught me to stay open-minded —
							adapting to new environments, languages, and perspectives with
							equal curiosity.
						</p>

						{expanded && (
							<>
								<p>
									I thrive in environments that celebrate variety and culture.
									Working alongside people from all walks of life —
									understanding their needs and finding common ground — is
									something I genuinely enjoy.
								</p>
								<p>
									Outside of work: I keep my space compulsively clean, spent way
									too long reading Greek history, and have recently discovered
									that cooking for friends is an excellent stress reliever.
								</p>
							</>
						)}

						<button
							onClick={() => setExpanded(!expanded)}
							className="flex items-center gap-1.5 text-[0.65rem] tracking-[0.3em] uppercase text-muted-foreground hover:text-foreground transition-colors duration-200"
						>
							<ChevronDown
								size={12}
								className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
							/>
							{expanded ? 'Less' : 'More'}
						</button>
					</div>

					<WavyDivider className="mt-10 mb-8" />
					<div>
						<Link
							href="https://drive.google.com/file/d/1CdnQUi06RV0N5SsTCVBkHaKUuiUTG6BG/view?usp=sharing"
							className="group relative inline-flex items-center gap-2.5 px-5 py-3 text-xs font-medium
                hover:translate-x-[3px] hover:translate-y-[3px]
                transition-all duration-100 tracking-[0.2em] uppercase"
							target="_blank"
							rel="noopener noreferrer"
						>
							<WavyButtonBorder />
							<FileText className="h-3.5 w-3.5" />
							Download CV
						</Link>
					</div>

					{/* The bio column runs shorter than the portrait beside it, so the
              grid left a dead gap here. `mt-auto` pushes the pile into it —
              the scraps land on the bottom edge whatever height is going
              spare, and the two columns finish level. */}
					<div className="mt-auto pt-10">
						<p className="mb-2 text-[0.6rem] uppercase tracking-[0.4em] text-muted-foreground">
							Scrap pile — click to add, drag to move
						</p>
						<PaperPile className="h-40 md:h-56" />
					</div>
				</motion.div>
			</div>
		</section>
	);
}
