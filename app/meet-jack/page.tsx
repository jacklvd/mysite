// app/meet-jack/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { About } from './components/about';
import ExperienceSection from './components/experience';
import Footer from '../../components/layout/footer';
import Project from './components/projects';
import { PublicationsSection } from './components/publications';
import { Guestbook } from './components/contact';
import { SectionNav } from './components/section-nav';
import { ParallaxBackdrop } from '@/components/effects/parallax-backdrop';
import { PageTurn } from '@/components/effects/page-turn';
import { WavyBorder } from '@/components/effects/wavy-frame';
import { ChevronUp } from 'lucide-react';
import { useLoading } from '@/context/loading-context';
import SkeletonLoading from '@/components/loading/skeletonloading';
import { ErrorBoundary } from '@/components/error-boundary';

export default function Portfolio() {
	const [showScrollTop, setShowScrollTop] = useState(false);
	const { isLoading } = useLoading();
	const [isMounted, setIsMounted] = useState(false);
	const [isMobile, setIsMobile] = useState(false);

	// Set isMounted to true on mount and check screen width
	useEffect(() => {
		// Intentional mount guard: the component renders null on the server / first
		// paint (see `if (!isMounted)` below) to avoid a hydration mismatch, so this
		// one-time flip is by design rather than an avoidable cascading render.
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setIsMounted(true);

		// Check if screen width is 375px or less
		const checkMobile = () => {
			setIsMobile(window.innerWidth <= 375);
		};

		// Initial check
		checkMobile();

		// Add resize listener to update when window is resized
		window.addEventListener('resize', checkMobile);

		// Cleanup
		return () => window.removeEventListener('resize', checkMobile);
	}, []);

	// Check scroll position to show/hide scroll-to-top button
	useEffect(() => {
		if (!isMounted) return;

		try {
			const handleScroll = () => {
				if (window.scrollY > 500 && !isMobile) {
					setShowScrollTop(true);
				} else {
					setShowScrollTop(false);
				}
			};

			window.addEventListener('scroll', handleScroll);
			return () => window.removeEventListener('scroll', handleScroll);
		} catch (error) {
			console.error('Scroll event error:', error);
		}
	}, [isMounted, isMobile]);

	// Honor an incoming hash (e.g. /meet-jack#work from "Back to projects").
	// The page renders behind a loading gate and the sections above #work fetch
	// async, so the browser's native hash scroll fires before the target exists or
	// settles. Re-align each frame until the target's position holds steady.
	useEffect(() => {
		if (!isMounted || isLoading) return;
		const id = window.location.hash.slice(1);
		if (!id) return;

		let raf = 0;
		let lastTop = NaN;
		let stableFrames = 0;
		let frames = 0;
		const align = () => {
			const el = document.getElementById(id);
			if (el) {
				// Measure BEFORE scrolling: this reads where the target sits under the
				// current layout, so frame-to-frame drift (async content settling above)
				// resets the counter. `behavior: 'auto'` overrides the global smooth
				// scroll so the align is instant and the stability check is deterministic.
				const top = el.getBoundingClientRect().top;
				el.scrollIntoView({ block: 'start', behavior: 'auto' });
				stableFrames = Math.abs(top - lastTop) < 1 ? stableFrames + 1 : 0;
				lastTop = top;
			}
			// Stop once settled (5 steady frames) or after ~2s, so a missing/stale hash
			// target or an ever-animating section can't spin the rAF loop forever.
			if (stableFrames < 5 && frames++ < 120)
				raf = requestAnimationFrame(align);
		};
		raf = requestAnimationFrame(align);
		return () => cancelAnimationFrame(raf);
	}, [isMounted, isLoading]);

	const scrollToTop = () => {
		try {
			window.scrollTo({
				top: 0,
				behavior: 'smooth',
			});
		} catch (error) {
			console.error('Scroll to top error:', error);
		}
	};

	// Prevent initial hydration mismatch
	if (!isMounted) {
		return null;
	}

	// Show loading skeleton if still loading
	if (isLoading) {
		return <SkeletonLoading />;
	}

	return (
		<ErrorBoundary>
			<div className="min-h-screen flex flex-col">
				<ParallaxBackdrop />
				<SectionNav />
				{/* Main content */}
				<main className="flex-1">
					<div className="w-full max-w-6xl mx-auto px-6 sm:px-10 md:px-16">
						<About />
						<PageTurn>
							<ExperienceSection />
						</PageTurn>
						<PageTurn>
							<Project />
						</PageTurn>
						<PageTurn>
							<PublicationsSection />
						</PageTurn>
						<PageTurn>
							<Guestbook />
						</PageTurn>
					</div>
				</main>

				<Footer />

				{/* Retro scroll to top button - hidden on mobile */}
				{showScrollTop && (
					<button
						onClick={scrollToTop}
						className="group fixed bottom-6 right-6 z-50 hidden sm:flex items-center justify-center w-9 h-9 bg-background transition-colors"
						aria-label="Scroll to top"
					>
						<WavyBorder
							filterId="wavy-frame-sm"
							className="border border-foreground/25 transition-colors duration-300 group-hover:border-foreground/50"
						/>
						<ChevronUp size={14} className="relative text-foreground/60" />
					</button>
				)}
			</div>
		</ErrorBoundary>
	);
}
