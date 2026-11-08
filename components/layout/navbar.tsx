'use client';
import { data } from '@/constants';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { ComponentType } from 'react';
import { WavyBorder } from '@/components/effects/wavy-frame';
import { cn } from '@/utils/cn';
import { usePathname } from 'next/navigation';

// The site nav as a strip of paper taped to the bottom of the page: inked
// icons, a handwritten label on hover, and a red pen circle around the page
// you're on. The strip is also a ledge the pet can perch on and a wall it
// won't walk through (data-pet-*).

const stripVariants = {
	hidden: { opacity: 0, y: 24, rotate: -1 },
	visible: {
		opacity: 1,
		y: 0,
		rotate: -1,
		transition: { duration: 0.5, ease: 'easeOut', staggerChildren: 0.06 },
	},
};

const itemVariants = {
	hidden: { opacity: 0, y: 8 },
	visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const tape =
	'pointer-events-none absolute -top-2.5 z-10 h-5 w-10 bg-[#e1d6bd]/75 shadow-sm dark:bg-[#e1d6bd]/40';

function NavItem({
	href,
	label,
	icon: Icon,
	active = false,
	external = false,
}: {
	href: string;
	label: string;
	icon: ComponentType<{ className?: string }>;
	active?: boolean;
	external?: boolean;
}) {
	return (
		<motion.li variants={itemVariants} className="relative">
			<Link
				href={href}
				aria-label={label}
				aria-current={active ? 'page' : undefined}
				{...(external && { target: '_blank', rel: 'noopener noreferrer' })}
				className={cn(
					'group relative flex size-10 items-center justify-center outline-none transition-colors',
					active ? 'text-primary' : 'text-foreground/55 hover:text-primary'
				)}
			>
				<Icon className="size-5 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:-rotate-6 group-focus-visible:-rotate-6" />
				{active && (
					// Pen circle, drawn in when you land on the page
					<motion.svg
						aria-hidden
						viewBox="0 0 44 40"
						className="pointer-events-none absolute -inset-1 text-ink-red"
						fill="none"
						stroke="currentColor"
						strokeWidth={1.6}
						strokeLinecap="round"
					>
						<motion.path
							d="M30 5 C 18 1 5 8 5 20 C 5 32 16 37 26 35 C 36 33 41 24 39 15 C 37 8 30 4 22 5"
							initial={{ pathLength: 0 }}
							animate={{ pathLength: 1 }}
							transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
						/>
					</motion.svg>
				)}
				<span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap font-hand text-lg leading-none text-primary opacity-0 transition-all duration-200 group-hover:-top-9 group-hover:opacity-100 group-focus-visible:-top-9 group-focus-visible:opacity-100">
					{label}
				</span>
			</Link>
		</motion.li>
	);
}

export const NavBar = () => {
	const pathname = usePathname();
	const socials = Object.entries(data.social).filter(([, s]) => s.navbar);

	return (
		<div className="pointer-events-none fixed inset-x-0 bottom-0 z-30">
			<div className="absolute inset-x-0 bottom-0 h-16 bg-background backdrop-blur-lg [-webkit-mask-image:linear-gradient(to_top,black,transparent)]" />
			<motion.nav
				aria-label="Site"
				data-pet-ledge
				data-pet-wall
				initial="hidden"
				animate="visible"
				variants={stripVariants}
				className="pointer-events-auto relative mx-auto mb-6 w-max bg-card px-3 py-1.5 shadow-[0_6px_16px_-6px_rgba(0,0,0,0.25)]"
			>
				<span aria-hidden className={cn(tape, '-left-3 -rotate-[24deg]')} />
				<span aria-hidden className={cn(tape, '-right-3 rotate-[20deg]')} />
				<WavyBorder
					filterId="wavy-frame-sm"
					className="border border-foreground/20"
				/>
				<ul className="relative flex items-center gap-1">
					{data.navbar.map(item => (
						<NavItem
							key={item.href}
							href={item.href}
							label={item.title}
							icon={item.icon}
							active={pathname === item.href}
						/>
					))}
					<li
						aria-hidden
						className="mx-1.5 h-6 border-l border-dashed border-foreground/30"
					/>
					{socials.map(([name, social]) => (
						<NavItem
							key={name}
							href={social.url}
							label={name}
							icon={social.icon}
							external
						/>
					))}
				</ul>
			</motion.nav>
		</div>
	);
};
