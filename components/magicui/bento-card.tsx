import Link from 'next/link';
import { GitBranch, ExternalLink } from 'lucide-react';
import { WavyCard } from '@/components/effects/wavy-frame';
import { projectImageUrl } from '@/lib/projects/image';

const BentoCard = ({
	work,
	size,
}: {
	work: Work;
	size: 'small' | 'medium' | 'large';
}) => {
	const maxLen = size === 'large' ? 160 : size === 'medium' ? 110 : 75;
	const desc =
		work.description.length > maxLen
			? work.description.slice(0, maxLen) + '…'
			: work.description;

	const tagLimit = size === 'small' ? 2 : 3;
	const extra = work.technologies ? work.technologies.length - tagLimit : 0;
	const href = work.slug ? `/work/${work.slug}` : work.source;

	const links = (
		<div className="flex items-center gap-4">
			<a
				href={work.source}
				target="_blank"
				rel="noreferrer"
				className="flex items-center gap-1.5 text-xs tracking-wide hover:opacity-70 transition-opacity"
			>
				<GitBranch size={12} />
				Source
			</a>
			{work.demo && (
				<a
					href={work.demo}
					target="_blank"
					rel="noreferrer"
					className="flex items-center gap-1.5 text-xs tracking-wide hover:opacity-70 transition-opacity"
				>
					<ExternalLink size={12} />
					Demo
				</a>
			)}
		</div>
	);

	const tags = (light = false) =>
		work.technologies ? (
			<div className="flex flex-wrap gap-1.5">
				{work.technologies.slice(0, tagLimit).map((tag: string) => (
					<span
						key={tag}
						className={`px-2 py-0.5 text-[0.7rem] tracking-wider uppercase border ${
							light
								? 'border-white/30 text-white/70'
								: 'border-foreground/15 text-muted-foreground'
						}`}
					>
						{tag}
					</span>
				))}
				{extra > 0 && (
					<span
						className={`px-2 py-0.5 text-[0.7rem] tracking-wider uppercase border ${
							light
								? 'border-white/30 text-white/70'
								: 'border-foreground/15 text-muted-foreground'
						}`}
					>
						+{extra}
					</span>
				)}
			</div>
		) : null;

	/* ── Large card: full-bleed image + gradient overlay ── */
	if (size === 'large') {
		return (
			<WavyCard>
				<Link href={href} className="absolute inset-0 block">
					<img
						src={projectImageUrl(work.image, 900)}
						alt={work.title}
						className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 scale-100 group-hover:scale-105 transition-all duration-700"
						loading="lazy"
					/>
					<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
				</Link>

				<div className="absolute bottom-0 left-0 right-0 p-5 text-white space-y-3">
					<Link href={href}>
						<h3 className="font-serif text-xl leading-snug">{work.title}</h3>
					</Link>
					<p className="text-sm text-white/70 leading-relaxed">{desc}</p>
					{tags(true)}
					<div className="pt-1 text-white/80">{links}</div>
				</div>
			</WavyCard>
		);
	}

	/* ── Medium card: image left, content right ── */
	if (size === 'medium') {
		return (
			<WavyCard className="flex">
				<Link href={href} className="w-2/5 shrink-0 overflow-hidden block">
					<img
						src={projectImageUrl(work.image, 600)}
						alt={work.title}
						className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
						loading="lazy"
					/>
				</Link>
				<div className="flex flex-col justify-between p-5 flex-1">
					<div className="space-y-2">
						<Link href={href}>
							<h3 className="font-serif text-lg leading-snug text-foreground">
								{work.title}
							</h3>
						</Link>
						<p className="text-sm text-muted-foreground leading-relaxed">
							{desc}
						</p>
					</div>
					<div className="space-y-3 mt-4">
						{tags()}
						{links}
					</div>
				</div>
			</WavyCard>
		);
	}

	/* ── Small card: image top, content below ── */
	return (
		<WavyCard className="flex flex-col">
			<Link href={href} className="aspect-video overflow-hidden block">
				<img
					src={projectImageUrl(work.image, 500)}
					alt={work.title}
					className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
					loading="lazy"
				/>
			</Link>
			<div className="flex flex-col flex-1 p-4 space-y-3">
				<Link href={href}>
					<h3 className="font-serif text-base leading-snug text-foreground">
						{work.title}
					</h3>
				</Link>
				<p className="text-xs text-muted-foreground leading-relaxed flex-1">
					{desc}
				</p>
				{tags()}
				{links}
			</div>
		</WavyCard>
	);
};

export default BentoCard;
