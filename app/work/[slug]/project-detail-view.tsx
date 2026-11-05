import Image from 'next/image';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, ExternalLink, GitBranch } from 'lucide-react';
import type { GithubProject } from '@/lib/projects';
import {
	WavyButtonBorder,
	WavyCard,
	WavyDivider,
} from '@/components/effects/wavy-frame';
import Footer from '@/components/layout/footer';

interface ProjectDetailViewProps {
	project: GithubProject;
	body: string;
}

const buttonClass =
	'group relative inline-flex items-center gap-2 px-5 py-2.5 font-hand text-lg text-foreground transition-transform duration-100 hover:translate-x-[2px] hover:translate-y-[2px]';

export function ProjectDetailView({ project, body }: ProjectDetailViewProps) {
	return (
		<div className="flex min-h-screen flex-col">
			<main className="mx-auto w-full max-w-6xl flex-1 px-6 py-16 sm:px-10 md:px-16 md:py-24">
				<Link
					href="/meet-jack#work"
					className="mb-8 inline-flex items-center gap-1.5 font-hand text-lg text-muted-foreground transition-colors hover:text-foreground"
				>
					<ArrowLeft size={16} />
					Back to projects
				</Link>

				{project.image && (
					<WavyCard className="mb-8">
						<div className="relative aspect-video w-full">
							<Image
								src={project.image}
								alt={project.title}
								fill
								sizes="(min-width: 1152px) 1024px, 100vw"
								className="object-cover"
							/>
						</div>
					</WavyCard>
				)}

				<h1 className="mb-4 font-title text-5xl text-foreground md:text-6xl">
					{project.title}
				</h1>

				{project.technologies.length > 0 && (
					<div className="mb-6 flex flex-wrap gap-1.5">
						{project.technologies.map(tag => (
							<span
								key={tag}
								className="border border-foreground/15 px-2 py-0.5 text-[0.7rem] uppercase tracking-wider text-muted-foreground"
							>
								{tag}
							</span>
						))}
					</div>
				)}

				<div className="mb-10 flex flex-wrap gap-3">
					<a
						href={project.source}
						target="_blank"
						rel="noreferrer"
						className={buttonClass}
					>
						<WavyButtonBorder />
						<GitBranch size={14} />
						Source
					</a>
					{project.demo && (
						<a
							href={project.demo}
							target="_blank"
							rel="noreferrer"
							className={buttonClass}
						>
							<WavyButtonBorder />
							<ExternalLink size={14} />
							Demo
						</a>
					)}
				</div>

				<WavyDivider className="mb-10 text-foreground/20" />

				{body ? (
					<div
						className="prose prose-neutral max-w-none dark:prose-invert
              prose-headings:font-title prose-headings:text-foreground
              prose-p:text-muted-foreground prose-li:text-muted-foreground
              prose-a:text-foreground prose-a:underline
              prose-strong:text-foreground prose-code:font-mono"
					>
						<ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
					</div>
				) : (
					<p className="font-hand text-lg text-muted-foreground">
						{project.description}
					</p>
				)}
			</main>

			<Footer />
		</div>
	);
}
