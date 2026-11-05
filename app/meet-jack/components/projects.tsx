'use client';
import { useState, useEffect } from 'react';
// MIGRATED to GitHub Discussions — Sanity source kept for reference, see /api/projects.
// import { client } from '@/client/client';
import { motion } from 'framer-motion';
import { GitBranch, ExternalLink } from 'lucide-react';
import BentoCard from '@/components/magicui/bento-card';
import {
	WavyCard,
	WavyButtonBorder,
	WavyDivider,
} from '@/components/effects/wavy-frame';
import { projectImageUrl } from '@/lib/projects/image';
import Image from 'next/image';
import Link from 'next/link';
import { inView } from '@/components/effects/reveal';

const itemVariants = {
	hidden: { y: 16, opacity: 0 },
	visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
};

const containerVariants = {
	hidden: { opacity: 0 },
	visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
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

	// Cap featured at 4 (the bento only renders four slots) so nothing is dropped.
	const featuredWorks = works.filter(w => w.featured).slice(0, 4);
	const featuredIds = new Set(featuredWorks.map(w => w._id));
	const regularWorks = works.filter(w => !featuredIds.has(w._id));

	return (
		<section className="py-16 md:py-24" id="work">
			<motion.p
				{...inView(0)}
				className="text-[0.7rem] tracking-[0.4em] uppercase text-muted-foreground mb-3"
			>
				03 — Projects
			</motion.p>
			<motion.h2
				{...inView(0.05)}
				className="font-title text-5xl md:text-6xl text-foreground mb-12 md:mb-16"
			>
				Things I&apos;ve built.
			</motion.h2>

			{isLoading ? (
				<div className="flex justify-center items-center h-48">
					<div className="w-5 h-5 border-t border-foreground rounded-full animate-spin" />
				</div>
			) : (
				<div className="space-y-16">
					{/* Bento grid — featured projects */}
					{featuredWorks.length > 0 && (
						<div>
							<motion.p
								{...inView(0.1)}
								className="text-[0.7rem] tracking-[0.3em] uppercase text-muted-foreground mb-6"
							>
								Featured
							</motion.p>
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[minmax(180px,auto)]">
								<motion.div
									className="lg:col-span-2 lg:row-span-2"
									variants={itemVariants}
								>
									<BentoCard work={featuredWorks[0]} size="large" />
								</motion.div>
								{featuredWorks[1] && (
									<motion.div className="lg:col-span-2" variants={itemVariants}>
										<BentoCard work={featuredWorks[1]} size="medium" />
									</motion.div>
								)}
								{featuredWorks[2] && (
									<motion.div variants={itemVariants}>
										<BentoCard work={featuredWorks[2]} size="small" />
									</motion.div>
								)}
								{featuredWorks[3] && (
									<motion.div variants={itemVariants}>
										<BentoCard work={featuredWorks[3]} size="small" />
									</motion.div>
								)}
							</div>
						</div>
					)}

					{/* Regular grid */}
					{regularWorks.length > 0 && (
						<div>
							<motion.p
								{...inView(0.1)}
								className="text-[0.7rem] tracking-[0.3em] uppercase text-muted-foreground mb-6"
							>
								More work
							</motion.p>
							<motion.div
								className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
								variants={containerVariants}
								initial="hidden"
								whileInView="visible"
								viewport={{ once: true, margin: '-60px' }}
							>
								{regularWorks.map(work => (
									<motion.div
										key={work._id}
										variants={itemVariants}
										className="h-full"
										data-pet-ledge
									>
										<WavyCard className="flex flex-col">
											{/* Image */}
											<Link
												href={work.slug ? `/work/${work.slug}` : work.source}
												className="aspect-video overflow-hidden block"
											>
												<Image
													src={projectImageUrl(work.image)}
													alt={work.title}
													width={600}
													height={338}
													className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
													loading="lazy"
												/>
											</Link>

											<div className="p-5 flex flex-col flex-1">
												<Link
													href={work.slug ? `/work/${work.slug}` : work.source}
												>
													<h3 className="font-medium text-foreground mb-2 leading-snug">
														{work.title}
													</h3>
												</Link>
												<p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1">
													{work.description.length > 120
														? work.description.slice(0, 120) + '…'
														: work.description}
												</p>

												{work.technologies && (
													<div className="flex flex-wrap gap-1.5 mb-4">
														{work.technologies
															.slice(0, 3)
															.map((tag: string) => (
																<span
																	key={tag}
																	className="px-2 py-0.5 text-[0.7rem] tracking-wider uppercase border border-foreground/15 text-muted-foreground"
																>
																	{tag}
																</span>
															))}
														{work.technologies.length > 3 && (
															<span className="px-2 py-0.5 text-[0.7rem] tracking-wider uppercase border border-foreground/15 text-muted-foreground">
																+{work.technologies.length - 3}
															</span>
														)}
													</div>
												)}

												<div className="flex gap-3 pt-4 border-t border-foreground/10">
													<a
														href={work.source}
														target="_blank"
														rel="noreferrer"
														className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
													>
														<GitBranch size={13} />
														Source
													</a>
													{work.demo && (
														<a
															href={work.demo}
															target="_blank"
															rel="noreferrer"
															className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
														>
															<ExternalLink size={13} />
															Demo
														</a>
													)}
												</div>
											</div>
										</WavyCard>
									</motion.div>
								))}
							</motion.div>
						</div>
					)}

					{/* GitHub CTA */}
					<WavyDivider className="mb-4" />
					<div className="flex items-center justify-between">
						<p className="text-sm text-muted-foreground">More on GitHub</p>
						<a
							href="https://github.com/jacklvd"
							target="_blank"
							rel="noreferrer"
							className="group relative inline-flex items-center gap-2.5 px-5 py-3 text-xs font-medium
                hover:translate-x-[3px] hover:translate-y-[3px]
                transition-all duration-100 tracking-[0.2em] uppercase"
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

export default Project;
