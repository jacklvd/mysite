'use client';
import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
// MIGRATED to GitHub Discussions — Sanity source kept for reference, see /api/experience.
import { ExternalLink } from 'lucide-react';
import {
	motion,
	useMotionValueEvent,
	useScroll,
	useSpring,
	useTransform,
	useReducedMotion,
} from 'framer-motion';
import { inView } from '@/components/effects/reveal';
import { railSpan, type RailSpan } from '@/lib/experience/rail';

interface Experience {
	_id: string;
	id: number;
	position: string;
	company: string;
	date: string;
	url: string;
	description: string[];
}

// One role on the rail. The dot fills in as the entry crosses the middle of the
// viewport, so the reader's eye and the rail's progress line agree on "here".
function Role({
	exp,
	last,
	active,
}: {
	exp: Experience;
	last: boolean;
	active: boolean;
}) {
	// `active` comes from the rail, not from this block's own intersection: a
	// role is 260-420px tall, so it overlaps the viewport's middle long before
	// its dot gets there. Reading the fill's progress instead keeps the lit dot
	// and the line's head at the same place by construction.
	return (
		<div className={last ? '' : 'pb-14 md:pb-20'}>
			{/* Rail dot, centred on the track and aligned with the position heading */}
			<span
				aria-hidden
				data-rail-dot
				className={`absolute left-0 h-[7px] w-[7px] -translate-x-[3px] translate-y-[0.55rem] rounded-full border transition-colors duration-500 ${
					active
						? 'border-foreground bg-foreground'
						: 'border-foreground/30 bg-background'
				}`}
			/>

			<h3 className="text-xl font-medium text-foreground">{exp.position}</h3>
			<a
				href={exp.url}
				target="_blank"
				rel="noopener noreferrer"
				className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
			>
				{exp.company}
				<ExternalLink size={11} />
			</a>
			<p className="mt-2 text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground/60">
				{exp.date}
			</p>

			<ul className="mt-6 space-y-3">
				{exp.description.map((item, i) => (
					<motion.li
						key={`${exp._id}-${i}`}
						initial={{ opacity: 0, x: -8 }}
						whileInView={{ opacity: 1, x: 0 }}
						viewport={{ once: true, margin: '-40px' }}
						transition={{ delay: i * 0.07, duration: 0.3 }}
						className="flex items-start gap-3 text-sm leading-relaxed text-foreground/70"
					>
						<span className="mt-[0.4rem] h-1 w-1 shrink-0 rounded-full bg-foreground/30" />
						{item}
					</motion.li>
				))}
			</ul>
		</div>
	);
}

// The rail lives in its own component so `railRef` is attached on this
// component's FIRST render. `useScroll` measures its target in a layout effect;
// if the ref is still null then — which is what an early `isLoading` return
// causes — it warns "the provided ref is not yet hydrated" and goes on
// scrubbing against a target it never measured. Mounting this only once the
// data is in hand is what makes the measurement reliable.
function Timeline({ experiences }: { experiences: Experience[] }) {
	const reduced = useReducedMotion();
	const railRef = useRef<HTMLDivElement>(null);

	// 0 = rail's top edge at the viewport centre, 1 = rail's bottom edge at the
	// centre. That mapping is linear in scroll distance, so a dot at fraction f
	// of the rail's height is at the centre at exactly progress f — which is what
	// lets the pixel offsets below divide straight through into a progress range.
	const { scrollYProgress } = useScroll({
		target: railRef,
		offset: ['start center', 'end center'],
	});

	// Measured, not assumed: the offsets shift with heading wraps and bullet
	// counts, and the rail's own bottom edge is a long scroll past the last dot.
	const [span, setSpan] = useState<RailSpan>({
		top: 0,
		height: 0,
		from: 0,
		to: 1,
		stops: [],
	});

	useLayoutEffect(() => {
		const rail = railRef.current;
		if (!rail) return;

		const measure = () => {
			const dots = rail.querySelectorAll<HTMLElement>('[data-rail-dot]');
			const railTop = rail.getBoundingClientRect().top;
			const centres = Array.from(dots, d => {
				const r = d.getBoundingClientRect();
				return r.top - railTop + r.height / 2;
			});
			setSpan(railSpan(centres, rail.offsetHeight));
		};

		measure();
		const ro = new ResizeObserver(measure);
		ro.observe(rail);
		return () => ro.disconnect();
	}, [experiences]);

	// Re-mapped so the line is full exactly when the last dot reaches the centre.
	const scrubbed = useTransform(scrollYProgress, [span.from, span.to], [0, 1]);
	const fill = useSpring(scrubbed, {
		stiffness: 120,
		damping: 30,
		restDelta: 0.001,
	});

	// How many dots the line's head has passed. Driven by `fill` — the same
	// motion value the track renders — so a dot lights at the moment the line
	// arrives, spring lag included.
	const [reached, setReached] = useState(0);
	useMotionValueEvent(fill, 'change', v => {
		setReached(span.stops.filter(stop => v >= stop).length);
	});

	return (
		<div ref={railRef} className="relative pl-7 md:pl-10">
			{/* Unfilled track — spans the first dot to the last dot */}
			<span
				aria-hidden
				style={{ top: span.top, height: span.height }}
				className="absolute left-0 w-px bg-foreground/10"
			/>
			{/* Filled portion, scrubbed by scroll position */}
			<motion.span
				aria-hidden
				style={{
					top: span.top,
					height: span.height,
					scaleY: reduced ? 1 : fill,
				}}
				className="absolute left-0 w-px origin-top bg-foreground/45"
			/>

			{experiences.map((exp, i) => (
				<Role
					key={exp._id}
					exp={exp}
					last={i === experiences.length - 1}
					active={reduced || i < reached}
				/>
			))}
		</div>
	);
}

const ExperienceSection: React.FC = () => {
	const [experiences, setExperiences] = useState<Experience[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(true);

	useEffect(() => {
		// Experience now comes from GitHub Discussions (comments on the Experience
		// discussion), already sorted by `id` server-side.
		fetch('/api/experience')
			.then(r => r.json())
			.then((d: { experiences?: Experience[] }) => {
				setExperiences(d.experiences ?? []);
			})
			.catch(error => console.error('Failed to fetch experiences:', error))
			.finally(() => setIsLoading(false));
	}, []);

	return (
		<section className="py-16 md:py-24" id="experience">
			<motion.p
				{...inView(0)}
				className="mb-3 text-[0.6rem] uppercase tracking-[0.4em] text-muted-foreground"
			>
				02 — Experience
			</motion.p>
			<motion.h2
				{...inView(0.05)}
				className="mb-12 font-title text-5xl text-foreground md:mb-16 md:text-6xl"
			>
				Where I&apos;ve worked.
			</motion.h2>

			{isLoading ? (
				<div className="flex min-h-[200px] items-center justify-center">
					<div className="h-5 w-5 animate-spin rounded-full border-t border-foreground" />
				</div>
			) : (
				<Timeline experiences={experiences} />
			)}
		</section>
	);
};

export default ExperienceSection;
