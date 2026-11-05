'use client';
import { useEffect, useState } from 'react';

const sections = [
	{ id: 'about', label: 'About', index: '01' },
	{ id: 'experience', label: 'Experience', index: '02' },
	{ id: 'work', label: 'Projects', index: '03' },
	{ id: 'publications', label: 'Research', index: '04' },
	{ id: 'contact', label: 'Guestbook', index: '05' },
];

export function SectionNav() {
	const [active, setActive] = useState<string>('about');

	useEffect(() => {
		// Size-independent scrollspy: the active section is the last one whose top
		// has crossed a line near the top of the viewport. This keeps short sections
		// (e.g. Experience) reliably detectable instead of flickering past a thin band.
		let raf = 0;

		const update = () => {
			raf = 0;
			const line = window.innerHeight * 0.35;
			let current = sections[0].id;
			for (const s of sections) {
				const el = document.getElementById(s.id);
				if (el && el.getBoundingClientRect().top <= line) {
					current = s.id;
				}
			}
			setActive(current);
		};

		const onScroll = () => {
			if (!raf) raf = requestAnimationFrame(update);
		};

		update();
		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', onScroll);
		return () => {
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', onScroll);
			if (raf) cancelAnimationFrame(raf);
		};
	}, []);

	const handleClick = (id: string) => {
		document
			.getElementById(id)
			?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	};

	return (
		<nav
			aria-label="Section navigation"
			className="fixed left-6 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-4 lg:flex"
		>
			{sections.map(({ id, label, index }) => {
				const isActive = active === id;
				return (
					<button
						key={id}
						onClick={() => handleClick(id)}
						aria-current={isActive ? 'true' : undefined}
						className="group flex items-center gap-3 text-left"
					>
						<span
							className={`h-px transition-all duration-300 ${
								isActive
									? 'w-8 bg-foreground'
									: 'w-4 bg-foreground/25 group-hover:w-6 group-hover:bg-foreground/50'
							}`}
						/>
						<span
							className={`text-[0.7rem] tracking-[0.3em] uppercase transition-all duration-300 ${
								isActive
									? 'text-foreground opacity-100'
									: 'text-muted-foreground opacity-0 group-hover:opacity-100'
							}`}
						>
							<span className="text-muted-foreground/70 mr-2">{index}</span>
							{label}
						</span>
					</button>
				);
			})}
		</nav>
	);
}
