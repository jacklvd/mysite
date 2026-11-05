'use client';
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, BookOpen } from 'lucide-react';
import Link from 'next/link';
import {
	WavyBorder,
	WavyButtonBorder,
	WavyDivider,
} from '@/components/effects/wavy-frame';
import { inView } from '@/components/effects/reveal';

interface Publication {
	title: string;
	authors: string;
	year: string;
	url: string;
	abstract?: string;
}

/* MIGRATED to GitHub Discussions — kept for reference, now fetched from /api/publications:
const publications: Publication[] = [
  {
    title: 'Real-time Speech Summarization for Medical Conversations',
    authors: 'Co-author — Jack Vo',
    year: '2024',
    url: 'https://arxiv.org/abs/2406.15888',
    abstract:
      'In doctor-patient conversations, identifying medically relevant information is crucial, posing the need for conversation summarization. We propose the first deployable real-time speech summarization system for real-world applications in industry, generating a local summary after every N speech utterances and a global summary at the end of a conversation.',
  },
  {
    title: 'Medical Spoken Named Entity Recognition',
    authors: 'Co-author — Jack Vo',
    year: '2024',
    url: 'https://arxiv.org/abs/2406.13337',
    abstract:
      'Spoken Named Entity Recognition (NER) aims to extract named entities from speech and categorize them into types like person, location, organization, etc. We present VietMed-NER — the first spoken NER dataset in the medical domain.',
  },
  {
    title: 'Sentiment Reasoning for Healthcare',
    authors: 'Co-author — Jack Vo',
    year: '2024',
    url: 'https://arxiv.org/abs/2407.21054',
    abstract:
      'Transparency in AI healthcare decision-making is crucial for building trust. Incorporating reasoning capabilities enables Large Language Models to understand emotions in context, handle nuanced language, and infer unstated sentiments.',
  },
];
*/

export const PublicationsSection = () => {
	const [publications, setPublications] = useState<Publication[]>([]);

	useEffect(() => {
		// Publications now come from GitHub Discussions (comments on the
		// Publications discussion).
		fetch('/api/publications')
			.then(r => r.json())
			.then((d: { publications?: Publication[] }) =>
				setPublications(d.publications ?? [])
			)
			.catch(() => setPublications([]));
	}, []);

	return (
		<section className="py-16 md:py-24" id="publications">
			<motion.p
				{...inView()}
				className="text-[0.7rem] tracking-[0.4em] uppercase text-muted-foreground mb-3"
			>
				04 — Research
			</motion.p>
			<motion.h2
				{...inView(0.05)}
				className="font-title text-5xl md:text-6xl text-foreground mb-12 md:mb-16"
			>
				Publications.
			</motion.h2>

			<div className="space-y-0">
				{publications.map((pub, index) => (
					<React.Fragment key={index}>
						<WavyDivider />
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true, margin: '-40px' }}
							transition={{
								duration: 0.6,
								ease: [0.25, 0.46, 0.45, 0.94],
								delay: index * 0.08,
							}}
							className="group py-8"
						>
							<div className="grid grid-cols-1 md:grid-cols-[3rem_1fr_auto] gap-4 md:gap-8 items-start">
								{/* Index */}
								<span className="text-[0.75rem] tracking-[0.3em] text-muted-foreground pt-1 hidden md:block">
									{String(index + 1).padStart(2, '0')}
								</span>

								{/* Content */}
								<div className="space-y-3">
									<div className="flex items-start gap-3 flex-wrap">
										<h3 className="font-serif text-lg md:text-xl text-foreground leading-snug group-hover:text-foreground/80 transition-colors">
											{pub.title}
										</h3>
										<span className="relative inline-block shrink-0 text-[0.7rem] tracking-[0.2em] uppercase px-2 py-0.5 text-muted-foreground mt-1">
											<WavyBorder
												filterId="wavy-frame-sm"
												className="border border-foreground/25"
											/>
											{pub.year}
										</span>
									</div>
									<p className="text-xs tracking-wide text-muted-foreground/70">
										{pub.authors}
									</p>
									<p className="text-sm text-foreground/60 leading-relaxed max-w-2xl">
										{pub.abstract}
									</p>
								</div>

								{/* Link */}
								<div className="flex md:justify-end pt-1">
									<Link
										href={pub.url}
										target="_blank"
										rel="noopener noreferrer"
										className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors tracking-wide"
									>
										Read paper
										<ExternalLink size={11} />
									</Link>
								</div>
							</div>
						</motion.div>
					</React.Fragment>
				))}
				<WavyDivider />
			</div>

			{/* Scholar CTA */}
			<WavyDivider className="mt-12 mb-8" />
			<div className="flex items-center justify-between">
				<p className="text-sm text-muted-foreground">
					Full publication history
				</p>
				<Link
					href="https://scholar.google.com/citations?user=Ls-8CAoAAAAJ&hl=en"
					target="_blank"
					rel="noopener noreferrer"
					className="group relative inline-flex items-center gap-2.5 px-5 py-3 text-xs font-medium
            hover:translate-x-[3px] hover:translate-y-[3px]
            transition-all duration-100 tracking-[0.2em] uppercase"
				>
					<WavyButtonBorder />
					<BookOpen size={13} />
					Google Scholar
				</Link>
			</div>
		</section>
	);
};
