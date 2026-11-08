// app/meet-jack/page.tsx
'use client';
import { useState, useEffect, useRef } from 'react';
import { About } from './components/about';
import ExperienceSection from './components/experience';
import Footer from '../../components/layout/footer';
import Project from './components/projects';
import { PublicationsSection } from './components/publications';
import { Guestbook } from './components/contact';
import { SectionNav } from './components/section-nav';
import { ParallaxBackdrop } from '@/components/effects/parallax-backdrop';
import { PageTurn } from '@/components/effects/page-turn';
import { BookPage, PageCorner, useBook } from '@/components/effects/book';
import { useLoading } from '@/context/loading-context';
import SkeletonLoading from '@/components/loading/skeletonloading';
import { ErrorBoundary } from '@/components/error-boundary';

export default function Portfolio() {
	const { isLoading } = useLoading();
	const [isMounted, setIsMounted] = useState(false);
	const bookRef = useRef<HTMLElement>(null);

	useEffect(() => {
		// Intentional mount guard: the component renders null on the server / first
		// paint (see `if (!isMounted)` below) to avoid a hydration mismatch, so this
		// one-time flip is by design rather than an avoidable cascading render.
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setIsMounted(true);
	}, []);

	const book = useBook(bookRef, isMounted && !isLoading);

	// Honor an incoming hash (e.g. /meet-jack#work from "Back to projects").
	// The page renders behind a loading gate and the sections above #work fetch
	// async, so the browser's native hash scroll fires before the target exists or
	// settles. Re-align each frame until the target's position holds steady.
	// scrollIntoView scrolls every ancestor, so this also turns the book to the
	// right page in horizontal mode.
	useEffect(() => {
		if (!isMounted || isLoading) return;
		const id = window.location.hash.slice(1);
		if (!id) return;

		let raf = 0;
		let lastPos = NaN;
		let stableFrames = 0;
		let frames = 0;
		const align = () => {
			const el = document.getElementById(id);
			if (el) {
				// Measure BEFORE scrolling: this reads where the target sits under the
				// current layout, so frame-to-frame drift (async content settling above)
				// resets the counter. `behavior: 'auto'` overrides the global smooth
				// scroll so the align is instant and the stability check is deterministic.
				const r = el.getBoundingClientRect();
				const pos = r.top + r.left;
				el.scrollIntoView({
					block: 'start',
					inline: 'start',
					behavior: 'auto',
				});
				stableFrames = Math.abs(pos - lastPos) < 1 ? stableFrames + 1 : 0;
				lastPos = pos;
			}
			// Stop once settled (5 steady frames) or after ~2s, so a missing/stale hash
			// target or an ever-animating section can't spin the rAF loop forever.
			if (stableFrames < 5 && frames++ < 120)
				raf = requestAnimationFrame(align);
		};
		raf = requestAnimationFrame(align);
		return () => cancelAnimationFrame(raf);
	}, [isMounted, isLoading]);

	// Prevent initial hydration mismatch
	if (!isMounted) {
		return null;
	}

	// Show loading skeleton if still loading
	if (isLoading) {
		return <SkeletonLoading />;
	}

	const sheet = 'mx-auto w-full max-w-6xl px-6 sm:px-10 md:px-16 md:pb-28';

	return (
		<ErrorBoundary>
			<div className="flex min-h-screen flex-col md:h-[100dvh] md:min-h-0">
				<ParallaxBackdrop book={bookRef} />
				<SectionNav />
				{/* The book: horizontal pages on md+, one long page on phones */}
				<main
					ref={bookRef}
					className="flex-1 md:flex md:overflow-x-auto md:overflow-y-hidden md:overscroll-x-contain md:snap-x md:snap-mandatory md:[scrollbar-width:none]"
				>
					<BookPage>
						<div className={sheet}>
							<About />
						</div>
					</BookPage>
					<BookPage>
						<PageTurn>
							<div className={sheet}>
								<ExperienceSection />
							</div>
						</PageTurn>
					</BookPage>
					<BookPage>
						<PageTurn>
							<div className={sheet}>
								<Project />
							</div>
						</PageTurn>
					</BookPage>
					<BookPage>
						<PageTurn>
							<div className={sheet}>
								<PublicationsSection />
							</div>
						</PageTurn>
					</BookPage>
					<BookPage>
						<PageTurn>
							<div className={sheet}>
								<Guestbook />
								<Footer />
							</div>
						</PageTurn>
					</BookPage>
				</main>
				<PageCorner {...book} />
			</div>
		</ErrorBoundary>
	);
}
