/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';
import { data } from '@/constants';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Dock, DockIcon } from '@/components/magicui/dock';
import { WavyBorder } from '@/components/effects/wavy-frame';
import { buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/utils/cn';
import { usePathname } from 'next/navigation';

export const NavBar = () => {
	const pathname = usePathname();

	// Animation variants
	const navVariants = {
		hidden: { opacity: 0, y: 20 },
		visible: {
			opacity: 1,
			y: 0,
			transition: {
				duration: 0.5,
				ease: 'easeOut',
				staggerChildren: 0.1,
			},
		},
	};

	const itemVariants = {
		hidden: { opacity: 0, y: 10 },
		visible: {
			opacity: 1,
			y: 0,
			transition: {
				duration: 0.3,
			},
		},
	};

	return (
		<motion.div
			className="pointer-events-none fixed inset-x-0 bottom-0 z-30 mx-auto mb-6 flex origin-bottom h-full max-h-14"
			initial="hidden"
			animate="visible"
			variants={navVariants}
		>
			<div className="fixed bottom-0 inset-x-0 h-16 w-full bg-background to-transparent backdrop-blur-lg [-webkit-mask-image:linear-gradient(to_top,black,transparent)] dark:bg-background"></div>
			<Dock
				data-pet-ledge
				data-pet-wall
				direction="bottom"
				iconMagnification={80}
				iconDistance={150}
				className="z-50 pointer-events-auto relative mx-auto flex min-h-full h-full items-end px-1 border-0 bg-card [box-shadow:0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)] transform-gpu dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset] rounded-2xl bottom-5"
			>
				{/* Hand-drawn wavy outline for the dock (matches the magic-book theme). */}
				<WavyBorder
					filterId="wavy-frame-sm"
					className="rounded-2xl border border-border dark:border-white/10"
				/>
				{data.navbar.map(item => (
					<DockIcon key={item.href} title={item.title} variants={itemVariants}>
						<Link
							href={item.href}
							className={cn(
								buttonVariants({ variant: 'ghost', size: 'icon' }),
								'size-10 relative rounded-full transition-colors duration-200 hover:bg-foreground/10 hover:text-foreground',
								pathname === item.href
									? 'text-foreground'
									: 'text-foreground/40'
							)}
						>
							<item.icon className="size-5" />
							{pathname === item.href && (
								<span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-foreground" />
							)}
						</Link>
					</DockIcon>
				))}
				<Separator orientation="vertical" className="h-full" />
				{Object.entries(data.social)
					.filter(([_, social]) => social.navbar)
					.map(([name, social]) => (
						<DockIcon key={name} title={name} variants={itemVariants}>
							<Link
								href={social.url}
								className={cn(
									buttonVariants({ variant: 'ghost', size: 'icon' }),
									'size-10 rounded-full text-foreground/40 transition-colors duration-200 hover:bg-foreground/10 hover:text-foreground'
								)}
								target="_blank"
								rel="noopener noreferrer"
							>
								<social.icon className="size-5" />
							</Link>
						</DockIcon>
					))}
			</Dock>
		</motion.div>
	);
};
