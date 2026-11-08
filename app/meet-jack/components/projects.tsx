'use client';
import { useState, useEffect } from 'react';
// MIGRATED to GitHub Discussions — Sanity source kept for reference, see /api/projects.
// import { client } from '@/client/client';
import { motion } from 'framer-motion';
import { GitBranch, ExternalLink } from 'lucide-react';
import { WavyButtonBorder, WavyDivider } from '@/components/effects/wavy-frame';
import { PageHeading } from '@/components/effects/page-heading';
import { projectImageUrl } from '@/lib/projects/image';
import Image from 'next/image';
import Link from 'next/link';

// Polaroids are pinned at slightly different angles; cycling a fixed list keeps
// the wall looking hand-placed without random values (stable across renders).
const TILTS = [-3, 2, -1.5, 2.5, -2, 1.5];

const pinVariants = {
	hidden: { y: 24, opacity: 0, rotate: 0 },
	visible: (tilt: number) => ({
		y: 0,
		opacity: 1,
		rotate: tilt,
		transition: { type: 'spring' as const, stiffness: 140, damping: 16 },
	}),
};

const wallVariants = {
	hidden: { opacity: 0 },
	visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const Project = () => {
	const [works, setWorks] = useState<Work[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		// Projects now come solely from GitHub Discussions (via our server route),
		// already sorted by `order`. The Sanity source is migrated and commented out.
		fetch('/api/projects')
			.then(r => r.json())
			.then(d => setWorks((d.projects ?? []) as Work[]))
			.catch(() => setWorks([]))
			.finally(() => setIsLoading(false));

		/* MIGRATED — previous dual-source merge (Sanity + GitHub):
    // Projects come from two sources: Sanity (public, fetched client-side) and
    // GitHub Discussions (via our server route). Merge them into one list.
    Promise.all([
      client
        .fetch('*[_type == "work"] | order(orderRank)')
        .catch(() => [] as Work[]),
      fetch('/api/projects')
        .then(r => r.json())
        .then(d => (d.projects ?? []) as Work[])
        .catch(() => [] as Work[]),
    ])
      .then(([sanityWorks, githubWorks]) => {
        // Sanity's first four stay featured (drives the bento layout); GitHub
        // projects opt in via their own `featured` flag.
        const sanity = sanityWorks.map((work: Work, index: number) => ({
          ...work,
          featured: index < 4,
        }));
        setWorks([...sanity, ...githubWorks]);
      })
      .finally(() => setIsLoading(false));
    */
	}, []);

	// Featured projects lead the wall and get a red "star" note in the margin.
	const ordered = [
		...works.filter(w => w.featured),
		...works.filter(w => !w.featured),
	];

	return (
		<section className="py-16 md:py-24" id="work">
			<PageHeading page="03" label="projects" title="Things I've built." />

			{isLoading ? (
				<div className="flex justify-center items-center h-48">
					<div className="w-5 h-5 border-t border-foreground rounded-full animate-spin" />
				</div>
			) : (
				<div className="space-y-16">
					<motion.div
						className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3"
						variants={wallVariants}
						initial="hidden"
						whileInView="visible"
						viewport={{ once: true, margin: '-60px' }}
					>
						{ordered.map((work, i) => (
							<Polaroid
								key={work._id}
								work={work}
								tilt={TILTS[i % TILTS.length]}
							/>
						))}
					</motion.div>

					{/* GitHub CTA */}
					<WavyDivider className="mb-4" />
					<div className="flex items-center justify-between">
						<p className="font-hand text-2xl text-muted-foreground">
							more scribbles on GitHub →
						</p>
						<a
							href="https://github.com/jacklvd"
							target="_blank"
							rel="noreferrer"
							className="group relative inline-flex items-center gap-2.5 px-5 py-3 font-type text-xs
                hover:translate-x-[3px] hover:translate-y-[3px]
                transition-all duration-100 tracking-[0.15em] uppercase"
						>
							<WavyButtonBorder />
							<GitBranch size={13} />
							View all
						</a>
					</div>
				</div>
			)}
		</section>
	);
};

// A taped polaroid: photo, handwritten caption, a short note and typed tech
// tags. Straightens and lifts on hover, like picking it up off the page.
function Polaroid({ work, tilt }: { work: Work; tilt: number }) {
	const href = work.slug ? `/work/${work.slug}` : work.source;
	return (
		<motion.article
			custom={tilt}
			variants={pinVariants}
			whileHover={{ rotate: 0, y: -6, scale: 1.02 }}
			className="group relative flex flex-col bg-card p-3 pb-5 shadow-[0_8px_20px_-6px_rgba(0,0,0,0.25)]"
			data-pet-ledge
		>
			{/* Washi tape */}
			<span
				aria-hidden
				className="absolute -top-2.5 left-1/2 z-10 h-5 w-20 -translate-x-1/2 -rotate-2 bg-[#e1d6bd]/75 shadow-sm"
			/>

			{work.featured && (
				<span className="absolute -right-3 -top-4 z-10 rotate-6 font-hand text-xl font-bold text-ink-red">
					★ fave
				</span>
			)}

			<Link href={href} className="block aspect-[4/3] overflow-hidden">
				<Image
					src={projectImageUrl(work.image)}
					alt={work.title}
					width={600}
					height={450}
					className="h-full w-full object-cover sepia-[.25] transition-all duration-500 group-hover:scale-105 group-hover:sepia-0"
					loading="lazy"
				/>
			</Link>

			<Link href={href}>
				<h3 className="mt-3 text-center font-hand text-3xl font-bold leading-tight text-primary">
					{work.title}
				</h3>
			</Link>
			<p className="mt-2 flex-1 px-1 text-sm leading-relaxed text-muted-foreground">
				{work.description.length > 120
					? work.description.slice(0, 120) + '…'
					: work.description}
			</p>

			{work.technologies?.length > 0 && (
				<p className="mt-3 px-1 font-type text-xs text-foreground/70">
					{work.technologies.slice(0, 4).join(' · ')}
				</p>
			)}

			<div className="mt-3 flex gap-4 px-1 font-type text-xs">
				<a
					href={work.source}
					target="_blank"
					rel="noreferrer"
					className="flex items-center gap-1.5 border-b border-dashed border-primary/50 text-muted-foreground transition-colors hover:text-foreground"
				>
					<GitBranch size={12} />
					source
				</a>
				{work.demo && (
					<a
						href={work.demo}
						target="_blank"
						rel="noreferrer"
						className="flex items-center gap-1.5 border-b border-dashed border-primary/50 text-muted-foreground transition-colors hover:text-foreground"
					>
						<ExternalLink size={12} />
						demo
					</a>
				)}
			</div>
		</motion.article>
	);
}

export default Project;
