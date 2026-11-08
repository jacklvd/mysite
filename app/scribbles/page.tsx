import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeading } from '@/components/effects/page-heading';
import { Breakout } from '@/components/game/breakout';

// The hidden last page of the book — reached from the dog-eared corner at the
// bottom of the guestbook. Kept out of search so it stays a secret.
export const metadata: Metadata = {
	title: 'p. 06',
	robots: { index: false, follow: false },
};

export default function ScribblesPage() {
	return (
		<main className="mx-auto w-full max-w-3xl px-6 py-16 sm:px-10 md:py-24">
			<PageHeading
				page="06"
				label="margin scribbles"
				title="You found it."
				immediate
			>
				<p className="mt-6 max-w-md font-hand text-2xl text-muted-foreground">
					A secret page. Squash every bug before you run out of ink.
				</p>
			</PageHeading>

			<div className="relative bg-card p-3 shadow-[0_8px_20px_-6px_rgba(0,0,0,0.25)]">
				<span
					aria-hidden
					className="absolute -top-2.5 left-1/2 z-10 h-5 w-24 -translate-x-1/2 -rotate-2 bg-[#e1d6bd]/75 shadow-sm"
				/>
				<Breakout />
			</div>

			<p className="mt-4 font-type text-xs text-muted-foreground">
				mouse / touch or ← → to move · click or space to launch
			</p>

			<Link
				href="/meet-jack#contact"
				className="mt-10 inline-block border-b border-dashed border-primary/50 font-type text-sm text-muted-foreground transition-colors hover:text-foreground"
			>
				← back to the guestbook
			</Link>
		</main>
	);
}
