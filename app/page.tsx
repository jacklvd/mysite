'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { data } from '@/constants';
import { useEntranceOpen } from '@/context/entrance-context';
import { Writer } from '@/components/effects/typewriter';
import { Sticker } from '@/components/effects/sticker';
import { CoverDoodles } from '@/components/effects/cover-doodles';
import {
	WavyBorder,
	WavyButtonBorder,
	WavyDivider,
} from '@/components/effects/wavy-frame';

// WebGL needs the browser; load the 3D ink doodles client-side only.
const InkDoodles3D = dynamic(
	() => import('@/components/effects/ink-doodles-3d'),
	{
		ssr: false,
	}
);

// ── Entrance choreography ────────────────────────────────────────────────────
// Everything keys off `useEntranceOpen()` — the moment the preloader's book
// cover starts swinging open — so the hero reveals behind the moving cover.

const EASE = [0.25, 0.46, 0.45, 0.94];

const heroStagger = {
	hidden: {},
	show: { transition: { delayChildren: 0.15, staggerChildren: 0.13 } },
};

const heroItem = {
	hidden: { opacity: 0, y: 24, filter: 'blur(5px)' },
	show: {
		opacity: 1,
		y: 0,
		filter: 'blur(0px)',
		transition: { duration: 0.7, ease: EASE },
	},
};

// The frame wrapper only fades: a transform or filter on it would become the
// containing block for the absolutely-positioned WavyBorder and collapse it.
const frameItem = {
	hidden: { opacity: 0 },
	show: { opacity: 1, transition: { duration: 0.9, ease: EASE } },
};

const titleStagger = {
	hidden: {},
	show: { transition: { staggerChildren: 0.055 } },
};

const titleLetter = {
	hidden: { opacity: 0, y: 36, rotate: -4, filter: 'blur(6px)' },
	show: {
		opacity: 1,
		y: 0,
		rotate: 0,
		filter: 'blur(0px)',
		transition: { duration: 0.55, ease: EASE },
	},
};

// The divider "draws itself" left-to-right via a clip-path sweep.
const dividerDraw = {
	hidden: { opacity: 0, clipPath: 'inset(0 100% 0 0)' },
	show: {
		opacity: 1,
		clipPath: 'inset(0 0% 0 0)',
		transition: { duration: 0.7, ease: 'easeInOut' },
	},
};

const backdropFade = { duration: 1.1, delay: 1.3, ease: 'easeOut' };

const TITLE = 'Jack Vo';
const STICKER_BASE_DELAY = 1.05;
const STICKER_STEP = 0.14;

export default function Home() {
	const open = useEntranceOpen();
	const [writerOn, setWriterOn] = useState(false);
	const socials = Object.entries(data.social);
	const cascade = (i: number) => STICKER_BASE_DELAY + i * STICKER_STEP;

	return (
		<div className="relative isolate min-h-screen overflow-hidden">
			{/* 3D ink doodles (paper plane, book, pencil) — desktop only */}
			<motion.div
				className="absolute inset-0 hidden md:block"
				initial={{ opacity: 0 }}
				animate={{ opacity: open ? 0.7 : 0 }}
				transition={backdropFade}
			>
				<InkDoodles3D />
			</motion.div>

			{/* Hand-drawn ink flourishes (moon, constellation, sparkles) */}
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: open ? 1 : 0 }}
				transition={backdropFade}
			>
				<CoverDoodles />
			</motion.div>

			{/* Draggable paper scraps — cascade in after the title; hidden on mobile */}
			{open && (
				<div className="hidden md:block">
					<Sticker
						label="hello"
						top="14%"
						left="32%"
						width={172}
						rotate={-4}
						enterDelay={cascade(0)}
					>
						<div className="flex flex-col items-center justify-center gap-1 px-5 py-5">
							<span className="font-title text-4xl leading-none text-stone-800">
								Jack Vo
							</span>
							<span className="mt-1 font-hand text-base text-stone-500">
								est. {new Date().getFullYear()}
							</span>
						</div>
					</Sticker>

					<Sticker
						label="now"
						top="58%"
						left="21%"
						width={196}
						rotate={3}
						enterDelay={cascade(1)}
					>
						<div className="flex flex-col gap-2 px-4 py-3">
							{[
								{ dot: 'bg-[#6fa89e]', text: 'Building cool things' },
								{ dot: 'bg-[#c4685a]', text: 'Drinking too much coffee' },
								{ dot: 'bg-[#a07896]', text: 'Looking for Pho' },
							].map(({ dot, text }) => (
								<div key={text} className="flex items-center gap-2">
									<span
										className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`}
									/>
									<span className="font-hand text-lg leading-tight text-stone-700">
										{text}
									</span>
								</div>
							))}
						</div>
					</Sticker>

					<Sticker
						label="xin chào"
						top="12%"
						right="22%"
						width={170}
						rotate={4}
						enterDelay={cascade(2)}
					>
						<div className="flex flex-col items-center justify-center gap-1.5 px-4 py-4">
							<span className="font-title text-3xl text-stone-800">
								Xin Chào
							</span>
							<span className="text-center font-hand text-base leading-snug text-stone-500">
								Vietnamese · /sɪn tʃaʊ/
							</span>
							<span className="font-hand text-base italic text-stone-400">
								&ldquo;hello&rdquo;
							</span>
						</div>
					</Sticker>

					<Sticker
						label="my stack"
						top="42%"
						right="18%"
						width={184}
						rotate={-3}
						enterDelay={cascade(3)}
					>
						<div className="flex flex-col gap-1 px-4 py-3">
							{[
								{ label: 'Next.js', color: 'text-stone-800' },
								{ label: 'TypeScript', color: 'text-[#3d7d72]' },
								{ label: 'React', color: 'text-[#8a5f7d]' },
								{ label: 'Python', color: 'text-[#b1503f]' },
								{ label: 'Tailwind', color: 'text-stone-500' },
							].map(({ label, color }) => (
								<div key={label} className="flex items-center gap-2">
									<span className="text-stone-400">✦</span>
									<span className={`font-hand text-lg leading-tight ${color}`}>
										{label}
									</span>
								</div>
							))}
						</div>
					</Sticker>

					<Sticker
						label="always hungry"
						bottom="13%"
						right="28%"
						width={168}
						rotate={5}
						enterDelay={cascade(4)}
					>
						<div className="flex flex-col items-center justify-center gap-2 px-4 py-4">
							<span className="text-3xl leading-none">🍜</span>
							<div className="flex flex-col items-center gap-0.5">
								<span className="font-hand text-sm uppercase tracking-[0.15em] text-stone-500">
									current mood
								</span>
								<span className="font-title text-2xl text-stone-800">
									always hungry
								</span>
							</div>
						</div>
					</Sticker>
				</div>
			)}

			{/* Hero — the book's title page, revealed as the cover opens */}
			<main className="pointer-events-none relative z-10 flex min-h-screen flex-col items-center justify-center px-6 pb-28">
				<motion.div
					variants={heroStagger}
					initial="hidden"
					animate={open ? 'show' : 'hidden'}
					className="group relative px-8 py-10 sm:px-16 sm:py-14"
				>
					{/* Ornamental wavy cover frame — inks itself in first */}
					<motion.div variants={frameItem}>
						<WavyBorder className="rounded-[2rem] border border-foreground/25" />
					</motion.div>

					<div className="relative flex flex-col items-center gap-5 text-center">
						<motion.p
							variants={heroItem}
							className="font-hand text-2xl text-muted-foreground"
						>
							Xin Chào, I&apos;m
						</motion.p>

						<motion.h1
							variants={titleStagger}
							data-pet-ledge
							className="font-title text-[clamp(4rem,14vw,10rem)] leading-[0.85] text-foreground"
						>
							<span className="sr-only">{TITLE}</span>
							<span aria-hidden className="flex justify-center">
								{TITLE.split('').map((ch, i) => (
									<motion.span
										key={i}
										variants={titleLetter}
										className="inline-block whitespace-pre"
									>
										{ch}
									</motion.span>
								))}
							</span>
						</motion.h1>

						<motion.div
							variants={dividerDraw}
							className="w-44 text-foreground/30"
						>
							<WavyDivider />
						</motion.div>

						{/* Typewriter mounts only once its slot is revealed, so the first
                line is typed in view instead of arriving pre-typed */}
						<motion.div
							variants={heroItem}
							onAnimationComplete={def => def === 'show' && setWriterOn(true)}
							className="min-h-[2.25rem] sm:min-h-[3rem]"
						>
							{writerOn && <Writer />}
						</motion.div>

						<motion.div
							variants={heroItem}
							className="pointer-events-auto mt-3"
						>
							<Link
								href="/meet-jack"
								className="group/btn relative inline-flex items-center gap-2.5 px-7 py-3 font-hand text-xl text-foreground
                  transition-transform duration-100 hover:translate-x-[2px] hover:translate-y-[2px]"
							>
								<WavyButtonBorder />
								<span className="relative flex items-center gap-2">
									Open the book
									<ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover/btn:translate-x-1" />
								</span>
							</Link>
						</motion.div>

						<motion.div
							variants={heroItem}
							className="pointer-events-auto mt-4 flex items-center gap-7"
						>
							{socials.map(([name, social]) => {
								const isEmail = social.url.startsWith('mailto:');
								return (
									<Link
										key={name}
										href={social.url}
										{...(!isEmail && {
											target: '_blank',
											rel: 'noopener noreferrer',
										})}
										className="text-muted-foreground transition-colors duration-300 hover:text-foreground"
										aria-label={name}
									>
										<social.icon className="size-[18px]" />
									</Link>
								);
							})}
						</motion.div>
					</div>
				</motion.div>
			</main>
		</div>
	);
}
